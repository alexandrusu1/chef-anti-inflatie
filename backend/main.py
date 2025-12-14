from fastapi import FastAPI, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime, timedelta
from typing import Optional, List
from pydantic import BaseModel
import asyncio
import logging
import json
import os

from app.services.scraper_service import get_weekly_offers, force_refresh_offers, run_full_scrape
from app.services.ai_chef import generate_recipes_ai, generate_recipes_for_products, get_top_discount_recipes, get_cheapest_recipes

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

CACHE_FILE = "data/recipe_cache.json"
recipe_cache = {
    "top_recipes": [],
    "cheapest_recipes": [],
    "last_updated": None
}

def load_cache():
    global recipe_cache
    try:
        if os.path.exists(CACHE_FILE):
            with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                recipe_cache = json.load(f)
                logger.info(f"📦 Cache loaded: {len(recipe_cache.get('top_recipes', []))} top, {len(recipe_cache.get('cheapest_recipes', []))} cheap")
    except Exception as e:
        logger.error(f"Cache load error: {e}")

def save_cache():
    try:
        os.makedirs(os.path.dirname(CACHE_FILE), exist_ok=True)
        with open(CACHE_FILE, 'w', encoding='utf-8') as f:
            json.dump(recipe_cache, f, ensure_ascii=False, indent=2)
        logger.info("💾 Cache saved")
    except Exception as e:
        logger.error(f"Cache save error: {e}")

def is_cache_valid():
    if not recipe_cache.get("last_updated"):
        return False
    last = datetime.fromisoformat(recipe_cache["last_updated"])
    return datetime.now() - last < timedelta(hours=24)


class GenerateRequest(BaseModel):
    product_ids: List[str]
    max_budget: Optional[float] = None


scheduler = AsyncIOScheduler()


async def scheduled_scrape():
    logger.info(f"[{datetime.now()}] 🔄 Starting scheduled scrape...")
    try:
        offers = await run_full_scrape()
        logger.info(f"[{datetime.now()}] ✅ Scrape done: {len(offers)} offers")
        await regenerate_daily_recipes()
    except Exception as e:
        logger.error(f"[{datetime.now()}] ❌ Scrape failed: {e}")


async def regenerate_daily_recipes():
    logger.info("🍳 Regenerating daily recipes...")
    try:
        offers = get_weekly_offers()
        if not offers:
            logger.warning("No offers available for recipe generation")
            return
        
        recipe_cache["top_recipes"] = get_top_discount_recipes(offers)
        recipe_cache["cheapest_recipes"] = get_cheapest_recipes(offers)
        recipe_cache["last_updated"] = datetime.now().isoformat()
        save_cache()
        
        logger.info(f"✅ Recipes regenerated: {len(recipe_cache['top_recipes'])} top, {len(recipe_cache['cheapest_recipes'])} cheap")
    except Exception as e:
        logger.error(f"Recipe generation error: {e}")


async def hourly_recipe_refresh():
    logger.info("⏰ Hourly recipe check...")
    if not is_cache_valid():
        await regenerate_daily_recipes()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Starting Chef Anti-Inflație API v4.0...")
    load_cache()
    
    scheduler.add_job(scheduled_scrape, CronTrigger(hour=6, minute=0), id="morning_scrape", replace_existing=True)
    scheduler.add_job(scheduled_scrape, CronTrigger(hour=12, minute=0), id="noon_scrape", replace_existing=True)
    scheduler.add_job(scheduled_scrape, CronTrigger(hour=18, minute=0), id="evening_scrape", replace_existing=True)
    scheduler.add_job(hourly_recipe_refresh, CronTrigger(minute=30), id="hourly_refresh", replace_existing=True)
    
    scheduler.start()
    logger.info("📅 Scheduler: scrape at 6:00, 12:00, 18:00 + hourly recipe check")
    
    asyncio.create_task(scheduled_scrape())
    
    yield
    
    scheduler.shutdown()
    save_cache()
    logger.info("👋 Shutdown complete")


app = FastAPI(
    title="Chef Anti-Inflație API",
    version="4.0.0",
    description="100% AI-powered recipes from real supermarket offers",
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
        "app": "👨‍🍳 Chef Anti-Inflație",
        "version": "4.0.0",
        "status": "running",
        "features": [
            "🛒 Real Lidl offers (auto-updated)",
            "🤖 100% AI-generated recipes",
            "💰 Budget optimization",
            "📊 Top discount & cheapest recipes",
            "🔄 Hourly refresh"
        ],
        "cache_valid": is_cache_valid(),
        "last_update": recipe_cache.get("last_updated")
    }


@app.get("/api/offers")
async def get_offers():
    offers = get_weekly_offers()
    return {
        "offers": offers,
        "total": len(offers),
        "message": "Selectează produse pentru a genera rețete personalizate!"
    }


@app.get("/api/recipes/top")
async def get_top_recipes():
    """Top 3 rețete cu cele mai mari reduceri - regenerate zilnic"""
    if not recipe_cache.get("top_recipes") or not is_cache_valid():
        await regenerate_daily_recipes()
    return {
        "recipes": recipe_cache.get("top_recipes", []),
        "type": "top_discount",
        "description": "🔥 Rețete cu produsele la cel mai mare discount",
        "generated_at": recipe_cache.get("last_updated")
    }


@app.post("/api/recipes/refresh")
async def force_refresh_recipes():
    """Forțează regenerarea rețetelor"""
    await regenerate_daily_recipes()
    return {
        "message": "Rețete regenerate!",
        "top": len(recipe_cache.get("top_recipes", [])),
        "cheap": len(recipe_cache.get("cheapest_recipes", [])),
        "generated_at": recipe_cache.get("last_updated")
    }


@app.get("/api/recipes/cheapest")
async def get_cheap_recipes():
    """Top 3 cele mai ieftine rețete - regenerate zilnic"""
    if not recipe_cache.get("cheapest_recipes") or not is_cache_valid():
        await regenerate_daily_recipes()
    return {
        "recipes": recipe_cache.get("cheapest_recipes", []),
        "type": "budget_friendly",
        "description": "💰 Cele mai economice rețete posibile",
        "generated_at": recipe_cache.get("last_updated")
    }


@app.post("/api/recipes/generate")
async def generate_custom_recipes(request: GenerateRequest):
    """Generează rețete pentru produsele selectate de utilizator"""
    offers = get_weekly_offers()
    
    if not request.product_ids:
        return {"error": "Selectează cel puțin un produs!", "recipes": []}
    
    recipes = generate_recipes_for_products(offers, request.product_ids)
    
    selected = [o for o in offers if o.get("id") in request.product_ids]
    total_value = sum(p["new_price"] for p in selected)
    total_savings = sum(p["old_price"] - p["new_price"] for p in selected)
    
    return {
        "recipes": recipes,
        "selected_products": selected,
        "summary": {
            "products_count": len(selected),
            "total_value": round(total_value, 2),
            "total_savings": round(total_savings, 2)
        }
    }


@app.get("/api/dashboard")
async def get_dashboard():
    """Dashboard principal - oferte + rețete pre-generate"""
    offers = get_weekly_offers()
    
    if not recipe_cache.get("top_recipes") or not is_cache_valid():
        await regenerate_daily_recipes()
    
    total_savings = sum(o["old_price"] - o["new_price"] for o in offers)
    
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
            "total_potential_savings": round(total_savings, 2),
            "categories": categories,
            "recipes_updated": recipe_cache.get("last_updated")
        },
        "cta": "👆 Selectează produse pentru rețete personalizate!"
    }


@app.post("/api/refresh")
async def refresh_all(background_tasks: BackgroundTasks):
    """Force refresh oferte + rețete"""
    background_tasks.add_task(scheduled_scrape)
    return {"message": "🔄 Refresh started", "status": "processing"}


@app.get("/api/health")
async def health():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "cache_valid": is_cache_valid(),
        "scheduler": scheduler.running
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
