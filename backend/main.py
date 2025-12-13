from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime
import asyncio
import logging

from app.services.scraper_service import get_weekly_offers, force_refresh_offers, run_full_scrape
from app.services.ai_chef import generate_recipes

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def scheduled_scrape():
    """Job scheduled pentru scraping zilnic"""
    logger.info(f"[{datetime.now()}] 🔄 Starting scheduled daily scrape...")
    try:
        offers = await run_full_scrape()
        logger.info(f"[{datetime.now()}] ✅ Daily scrape completed: {len(offers)} offers")
    except Exception as e:
        logger.error(f"[{datetime.now()}] ❌ Daily scrape failed: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager - pornește scheduler-ul la startup"""
    logger.info("🚀 Starting Chef Anti-Inflație API...")
    
    scheduler.add_job(
        scheduled_scrape,
        CronTrigger(hour=6, minute=0),
        id="daily_scrape",
        name="Daily Offers Scrape",
        replace_existing=True
    )
    
    scheduler.add_job(
        scheduled_scrape,
        CronTrigger(hour=12, minute=0),
        id="noon_scrape",
        name="Noon Offers Scrape",
        replace_existing=True
    )
    
    scheduler.start()
    logger.info("📅 Scheduler started - scraping at 6:00 AM and 12:00 PM daily")
    
    asyncio.create_task(scheduled_scrape())
    
    yield
    
    scheduler.shutdown()
    logger.info("👋 Scheduler stopped")


app = FastAPI(
    title="Chef Anti-Inflație API",
    version="2.0.0",
    description="API pentru găsirea ofertelor din supermarketuri românești și generarea de rețete economice",
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
        "message": "Chef Anti-Inflație API",
        "status": "running",
        "version": "2.0.0",
        "endpoints": {
            "offers": "/api/offers",
            "recipes": "/api/recipes",
            "dashboard": "/api/dashboard",
            "refresh": "/api/refresh",
            "health": "/api/health"
        }
    }


@app.get("/api/offers")
async def get_offers():
    offers = get_weekly_offers()
    return {"offers": offers, "total": len(offers)}


@app.get("/api/recipes")
async def get_recipes():
    offers = get_weekly_offers()
    recipes = generate_recipes(offers)
    return {"recipes": recipes}


@app.get("/api/dashboard")
async def get_dashboard():
    offers = get_weekly_offers()
    recipes = generate_recipes(offers)
    
    total_potential_savings = sum(
        offer["old_price"] - offer["new_price"] for offer in offers
    )
    
    stores = {}
    for offer in offers:
        store = offer["store"]
        if store not in stores:
            stores[store] = {"count": 0, "savings": 0}
        stores[store]["count"] += 1
        stores[store]["savings"] += offer["old_price"] - offer["new_price"]
    
    categories = {}
    for offer in offers:
        cat = offer.get("category", "Altele")
        if cat not in categories:
            categories[cat] = 0
        categories[cat] += 1
    
    return {
        "offers": offers,
        "recipes": recipes,
        "stats": {
            "total_offers": len(offers),
            "total_recipes": len(recipes),
            "total_potential_savings": round(total_potential_savings, 2),
            "stores": list(set(offer["store"] for offer in offers)),
            "stores_breakdown": stores,
            "categories": categories
        }
    }


@app.post("/api/refresh")
async def refresh_offers(background_tasks: BackgroundTasks):
    """Force refresh offers from all sources"""
    background_tasks.add_task(force_refresh_offers)
    return {"message": "Refresh started in background", "status": "processing"}


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "scheduler_running": scheduler.running
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
