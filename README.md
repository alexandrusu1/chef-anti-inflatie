# Chef Anti-Inflație 🍳💰

**Aplicație românească pentru găsirea celor mai bune oferte din supermarketuri și generarea de rețete economice folosind AI.**

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🌟 Funcționalități

- **📦 Scraping automat** - Colectează zilnic oferte de la Lidl, Kaufland și Profi
- **🤖 Rețete AI** - Generează rețete economice folosind GitHub Models API (GPT-4o-mini)
- **💰 Calcul economii** - Arată cât poți economisi cu fiecare ofertă
- **📅 Scheduler integrat** - Actualizează automat ofertele la 6:00 și 12:00 zilnic
- **🔗 Link-uri directe** - Accesează ofertele direct pe site-urile magazinelor

## 🚀 Quick Start

### Opțiunea 1: Dezvoltare locală

```bash
# Clonează repo-ul
git clone https://github.com/your-username/chef-anti-inflatie.git
cd chef-anti-inflatie

# Configurează variabilele de mediu
cp backend/.env.example backend/.env
# Editează backend/.env și adaugă GITHUB_TOKEN

# Pornește backend-ul
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Într-un alt terminal, pornește frontend-ul
cd frontend
npm install
npm run dev
```

Accesează aplicația la: http://localhost:3000

### Opțiunea 2: Docker

```bash
# Copiază și configurează variabilele de mediu
cp backend/.env.example .env
# Editează .env și adaugă GITHUB_TOKEN

# Pornește cu Docker Compose
docker-compose up -d

# Cu nginx reverse proxy (opțional)
docker-compose --profile with-proxy up -d
```

### Opțiunea 3: Script de setup

```bash
chmod +x setup.sh
./setup.sh
```

## 📁 Structura Proiectului

```
IOferta/
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── requirements.txt        # Python dependencies
│   ├── Dockerfile
│   └── app/
│       └── services/
│           ├── scraper_service.py  # Web scraping
│           └── ai_chef.py          # AI recipe generation
├── frontend/
│   ├── app/
│   │   ├── page.tsx           # Main UI
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── nginx.conf
├── setup.sh
└── README.md
```

## 🔧 Configurare

### Variabile de mediu (backend/.env)

```env
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
```

Pentru a obține un GitHub Token:
1. Mergi la https://github.com/settings/tokens
2. Generează un token nou cu permisiuni de bază
3. Copiază token-ul în fișierul .env

## 📡 API Endpoints

| Endpoint | Metodă | Descriere |
|----------|--------|-----------|
| `/` | GET | Status API |
| `/api/offers` | GET | Lista ofertelor |
| `/api/recipes` | GET | Rețete generate de AI |
| `/api/dashboard` | GET | Date complete (oferte + rețete + statistici) |
| `/api/refresh` | POST | Forțează actualizarea ofertelor |
| `/api/health` | GET | Health check |

## 🏪 Magazine suportate

- **Lidl România** - https://www.lidl.ro
- **Kaufland România** - https://www.kaufland.ro
- **Profi** - https://www.profi.ro

## 🔄 Scheduler

Aplicația actualizează automat ofertele:
- **06:00** - Scraping dimineața
- **12:00** - Actualizare la prânz

## 🛠️ Dezvoltare

### Backend

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

Documentația API: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm run dev
```

## 📦 Deployment în producție

### Cu systemd (Linux)

```bash
# Instalează serviciile
sudo ./setup.sh --systemd

# Pornește serviciile
sudo systemctl start chef-backend
sudo systemctl start chef-frontend

# Verifică status
sudo systemctl status chef-backend
sudo systemctl status chef-frontend
```

### Cu Docker

```bash
# Construiește și pornește
docker-compose up -d --build

# Vezi log-uri
docker-compose logs -f

# Oprește
docker-compose down
```

## 🤝 Contribuții

Contribuțiile sunt binevenite! Te rugăm să:

1. Fork-uiești repo-ul
2. Creezi un branch pentru feature (`git checkout -b feature/AmazingFeature`)
3. Commit-uiești schimbările (`git commit -m 'Add some AmazingFeature'`)
4. Push pe branch (`git push origin feature/AmazingFeature`)
5. Deschizi un Pull Request

## 📄 Licență

Acest proiect este licențiat sub MIT License - vezi fișierul [LICENSE](LICENSE) pentru detalii.

## 🙏 Mulțumiri

- [FastAPI](https://fastapi.tiangolo.com/) - Framework backend
- [Next.js](https://nextjs.org/) - Framework frontend
- [GitHub Models](https://github.com/marketplace/models) - AI API
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Lucide Icons](https://lucide.dev/) - Iconițe

---

**Chef Anti-Inflație** - Mâncăm bine, cheltuim puțin! 🍳💰
