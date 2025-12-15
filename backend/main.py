from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime, timedelta
from typing import Optional, List
from pydantic import BaseModel
import asyncio
import json
import os

from app.services.scraper_service import get_weekly_offers, run_full_scrape
from app.services.ai_chef import generate_recipes_for_products, get_top_discount_recipes, get_cheapest_recipes

CACHE_FILE = "data/recipe_cache.json"

recipe_cache = {
    "top_recipes": [],
    "cheapest_recipes": [],
    "last_updated": None
}


def load_cache():
    global recipe_cache
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, 'r', encoding='utf-8') as f:
            recipe_cache = json.load(f)


def save_cache():
    os.makedirs(os.path.dirname(CACHE_FILE), exist_ok=True)
    with open(CACHE_FILE, 'w', encoding='utf-8') as f:
        json.dump(recipe_cache, f, ensure_ascii=False, indent=2)


def is_cache_valid():
    if not recipe_cache.get("last_updated"):
        return False
    last = datetime.fromisoformat(recipe_cache["last_updated"])
    return datetime.now() - last < timedelta(hours=12)


class GenerateRequest(BaseModel):
    product_ids: List[str]
    max_budget: Optional[float] = None


scheduler = AsyncIOScheduler()


async def scheduled_scrape():
    await run_full_scrape()
    await regenerate_daily_recipes()


async def regenerate_daily_recipes():
    offers = get_weekly_offers()
    if not offers:
        return
    
    recipe_cache["top_recipes"] = get_top_discount_recipes(offers)
    recipe_cache["cheapest_recipes"] = get_cheapest_recipes(offers)
    recipe_cache["last_updated"] = datetime.now().isoformat()
    save_cache()


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_cache()
    
    scheduler.add_job(scheduled_scrape, CronTrigger(hour=6, minute=0), id="morning", replace_existing=True)
    scheduler.add_job(scheduled_scrape, CronTrigger(hour=12, minute=0), id="noon", replace_existing=True)
    scheduler.add_job(scheduled_scrape, CronTrigger(hour=18, minute=0), id="evening", replace_existing=True)
    
    scheduler.start()
    asyncio.create_task(scheduled_scrape())
    
    yield
    
    scheduler.shutdown()
    save_cache()


app = FastAPI(
    title="Chef Anti-Inflație API",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "app": "Chef Anti-Inflație",
        "version": "2.0.0",
        "status": "running",
        "cache_valid": is_cache_valid(),
        "last_update": recipe_cache.get("last_updated")
    }


@app.get("/api/offers")
async def get_offers():
    offers = get_weekly_offers()
    return {"offers": offers, "total": len(offers)}


@app.get("/api/recipes/top")
async def get_top_recipes():
    if not recipe_cache.get("top_recipes") or not is_cache_valid():
        await regenerate_daily_recipes()
    return {
        "recipes": recipe_cache.get("top_recipes", []),
        "generated_at": recipe_cache.get("last_updated")
    }


@app.get("/api/recipes/cheapest")
async def get_cheap_recipes():
    if not recipe_cache.get("cheapest_recipes") or not is_cache_valid():
        await regenerate_daily_recipes()
    return {
        "recipes": recipe_cache.get("cheapest_recipes", []),
        "generated_at": recipe_cache.get("last_updated")
    }


@app.post("/api/recipes/generate")
async def generate_custom_recipes(request: GenerateRequest):
    offers = get_weekly_offers()
    
    if not request.product_ids:
        return {"error": "Selectează cel puțin un produs", "recipes": []}
    
    recipes = generate_recipes_for_products(offers, request.product_ids)
    selected = [o for o in offers if o.get("id") in request.product_ids]
    
    return {
        "recipes": recipes,
        "selected_products": selected,
        "summary": {
            "products_count": len(selected),
            "total_value": round(sum(p["new_price"] for p in selected), 2),
            "total_savings": round(sum(p["old_price"] - p["new_price"] for p in selected), 2)
        }
    }


@app.post("/api/recipes/refresh")
async def force_refresh():
    await regenerate_daily_recipes()
    return {
        "success": True,
        "top": len(recipe_cache.get("top_recipes", [])),
        "cheap": len(recipe_cache.get("cheapest_recipes", [])),
        "generated_at": recipe_cache.get("last_updated")
    }


@app.get("/api/dashboard")
async def get_dashboard():
    offers = get_weekly_offers()
    
    if not recipe_cache.get("top_recipes") or not is_cache_valid():
        await regenerate_daily_recipes()
    
    categories = {}
    for o in offers:
        cat = o.get("category", "Altele")
        categories[cat] = categories.get(cat, 0) + 1
    
    return {
        "offers": offers,
        "top_recipes": recipe_cache.get("top_recipes", []),
        "cheapest_recipes": recipe_cache.get("cheapest_recipes", []),
        "stats": {
            "total_offers": len(offers),
            "total_potential_savings": round(sum(o["old_price"] - o["new_price"] for o in offers), 2),
            "categories": categories,
            "recipes_updated": recipe_cache.get("last_updated")
        }
    }


@app.post("/api/refresh")
async def refresh_all(background_tasks: BackgroundTasks):
    background_tasks.add_task(scheduled_scrape)
    return {"message": "Refresh started"}


@app.get("/api/health")
async def health():
    offers = get_weekly_offers()
    return {
        "status": "healthy",
        "offers_count": len(offers),
        "cache_valid": is_cache_valid(),
        "timestamp": datetime.now().isoformat()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
