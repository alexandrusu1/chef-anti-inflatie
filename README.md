# Chef Anti-Inflație

Aplicație web care te ajută să gătești mai ieftin folosind produsele la ofertă din supermarketuri.

## Ce face?

- Scanează automat ofertele reale din Lidl România
- Generează rețete personalizate folosind inteligență artificială
- Calculează costul fiecărei rețete și economiile posibile
- Te ajută să planifici mesele în funcție de buget

## Cum funcționează?

1. **Verificăm ofertele** - Aplicația colectează zilnic prețurile reduse din magazine
2. **Selectezi produsele** - Alegi ce vrei să cumperi și vezi instant cât economisești
3. **Primești rețete** - AI-ul generează rețete delicioase din exact produsele selectate

## Magazine disponibile

- Lidl România (activ)
- Kaufland, Carrefour, Mega Image, Penny (în curând)

---

Gătește inteligent, economisește mult!
- `POST /api/refresh` - Trigger manual scrape

API Docs: http://localhost:8000/docs

## Environment Setup

Create `backend/.env`:
```
GITHUB_TOKEN=your_token_here
```

## License

MIT
