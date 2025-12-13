#!/bin/bash

# Setup script pentru Chef Anti-Inflație

echo "🚀 Inițializare Chef Anti-Inflație..."

# Backend setup
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend setup
cd ../frontend
npm install

echo "✓ Setup complet!"
echo ""
echo "Pentru a porni aplicația:"
echo "1. Backend: cd backend && source venv/bin/activate && python main.py"
echo "2. Frontend: cd frontend && npm run dev"
echo ""
echo "Frontend: http://localhost:3000"
echo "API Docs: http://localhost:8000/docs"
