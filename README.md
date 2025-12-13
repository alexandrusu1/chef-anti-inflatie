# Chef Anti-Inflație

Find supermarket deals and generate budget recipes with AI.

## Quick Start

**Local Development:**
```bash
git clone https://github.com/alexandrusu1/chef-anti-inflatie.git
cd chef-anti-inflatie

# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Visit: http://localhost:3000

**With Docker:**
```bash
docker-compose up
```

## Tech Stack

- **Backend:** FastAPI + Python 3.13 + SQLite
- **Frontend:** Next.js + React + TypeScript + Tailwind CSS
- **Infrastructure:** Docker + Docker Compose

## Features

- Auto scraping from supermarkets (Lidl, Kaufland, Profi)
- AI recipe generation using GitHub Models
- Savings calculation
- Scheduled updates (6 AM & 12 PM daily)

## API Endpoints

- `GET /` - Health check
- `GET /api/offers` - Get all offers
- `GET /api/recipes` - Generate recipes from offers
- `GET /api/dashboard` - Full dashboard data
- `POST /api/refresh` - Trigger manual scrape

API Docs: http://localhost:8000/docs

## Environment Setup

Create `backend/.env`:
```
GITHUB_TOKEN=your_token_here
```

## License

MIT
