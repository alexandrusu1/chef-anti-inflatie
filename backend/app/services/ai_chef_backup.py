import os
import json
import asyncio
from typing import List, Dict
from dotenv import load_dotenv

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

genai = None
if GOOGLE_API_KEY:
    try:
        import google.generativeai as genai_module
        genai_module.configure(api_key=GOOGLE_API_KEY)
        genai = genai_module
    except Exception as e:
        print(f"Eroare la configurarea Gemini: {e}")


class AIChef:
    def __init__(self):
        self.model = None
        if genai:
            try:
                self.model = genai.GenerativeModel(
                    model_name="gemini-1.5-flash",
                    generation_config={
                        "temperature": 0.7,
                        "top_p": 0.95,
                        "top_k": 40,
                        "max_output_tokens": 4096,
                        "response_mime_type": "application/json",
                    }
                )
            except Exception as e:
                print(f"Eroare la inițializarea modelului: {e}")
    
    def _build_prompt(self, products: List[Dict]) -> str:
        ingredients_list = []
        for p in products:
            discount = p.get('discount_percentage', 0)
            ingredients_list.append(
                f"- {p['name']}: {p['new_price']} RON (reducere {discount}%, preț vechi: {p['old_price']} RON)"
            )
        
        ingredients_text = "\n".join(ingredients_list)
        
        return f"""Ești un bucătar român experimentat care ajută familiile să economisească bani în perioadă de inflație.

INGREDIENTE DISPONIBILE LA REDUCERE:
{ingredients_text}

SARCINA TA:
Creează exact 3 rețete delicioase, tradiționale românești sau populare, folosind cât mai multe ingrediente din lista de mai sus.

REGULI:
1. Folosește NUMAI ingrediente din lista de mai sus sau ingrediente de bază foarte ieftine (sare, piper, apă, făină)
2. Calculează costul TOTAL real al rețetei folosind prețurile NOI (reduse)
3. Calculează economia estimată = diferența dintre costul cu prețuri vechi și costul cu prețuri noi
4. Fiecare rețetă trebuie să fie practică, pentru 4 porții
5. Timpii de preparare să fie realiști
6. Pașii să fie clari și detaliați

IMPORTANT: Returnează STRICT în format JSON, fără text adițional.

SCHEMA JSON:
[
  {{
    "titlu": "Numele rețetei",
    "timp": "ex: 45 minute",
    "portii": 4,
    "cost_total": 45.50,
    "cost_fara_reducere": 62.00,
    "economie_estimata": "Economisești 16.50 RON",
    "ingrediente": ["500g ceafă de porc - 22.99 RON", "1kg cartofi - 9.99 RON"],
    "pasi": ["Pasul 1: Descriere...", "Pasul 2: Descriere..."],
    "dificultate": "Ușor/Mediu/Avansat",
    "sfat_economie": "Un sfat practic pentru economisire"
  }}
]

Generează cele 3 rețete:"""
    
    async def generate_recipes(self, products: List[Dict]) -> List[Dict]:
        return self._get_mock_recipes()
        
            
            validated_recipes = []
            for recipe in recipes:
                validated_recipe = {
                    "titlu": recipe.get("titlu", "Rețetă fără titlu"),
                    "timp": recipe.get("timp", "30 minute"),
                    "portii": recipe.get("portii", 4),
                    "cost_total": float(recipe.get("cost_total", 0)),
                    "cost_fara_reducere": float(recipe.get("cost_fara_reducere", 0)),
                    "economie_estimata": recipe.get("economie_estimata", "Economisești 0 RON"),
                    "ingrediente": recipe.get("ingrediente", []),
                    "pasi": recipe.get("pasi", []),
                    "dificultate": recipe.get("dificultate", "Mediu"),
                    "sfat_economie": recipe.get("sfat_economie", "")
                }
                validated_recipes.append(validated_recipe)
            
            return validated_recipes
            
        except Exception:
            return self._get_mock_recipes()
    
    def _get_mock_recipes(self) -> List[Dict]:
        return [
            {
                "titlu": "Tocăniță de porc cu cartofi",
                "timp": "50 minute",
                "portii": 4,
                "cost_total": 42.46,
                "cost_fara_reducere": 61.96,
                "economie_estimata": "Economisești 19.50 RON",
                "ingrediente": [
                    "500g ceafă de porc - 11.50 RON",
                    "1kg cartofi albi - 9.99 RON",
                    "500g roșii - 4.00 RON",
                    "200g ceapă - 0.70 RON",
                    "100g ardei gras - 1.20 RON",
                    "2 căței usturoi - 0.55 RON",
                    "2 linguri bulion - 2.00 RON",
                    "200ml smântână - 4.29 RON",
                    "Ulei, sare, piper, boia - 8.23 RON"
                ],
                "pasi": [
                    "Tăiați ceafa de porc în cuburi de 3cm și condimentați cu sare și piper.",
                    "Încălziți uleiul într-o cratiță și rumeniți carnea pe toate părțile, apoi scoateți-o.",
                    "În aceeași cratiță, căliți ceapa tăiată mărunt până devine translucidă.",
                    "Adăugați ardeiul tăiat cubulețe și usturoiul zdrobit, gătiți 2 minute.",
                    "Puneți roșiile tocate și bulionul, amestecați bine.",
                    "Readuceți carnea în cratiță, adăugați 200ml apă și lăsați la fiert 25 minute.",
                    "Adăugați cartofii tăiați cuburi și gătiți încă 20 minute până se înmoaie.",
                    "La final, încorporați smântâna și potriviți de sare. Serviți cald!"
                ],
                "dificultate": "Mediu",
                "sfat_economie": "Cartofii și ceapa sunt baza multor rețete economice. Cumpărați-le la reducere și depozitați-le corect!"
            },
            {
                "titlu": "Paste cu pui și legume",
                "timp": "35 minute",
                "portii": 4,
                "cost_total": 38.95,
                "cost_fara_reducere": 54.94,
                "economie_estimata": "Economisești 15.99 RON",
                "ingrediente": [
                    "400g piept de pui - 15.99 RON",
                    "500g paste penne - 4.99 RON",
                    "300g roșii - 2.40 RON",
                    "200g ardei gras - 2.40 RON",
                    "100g ceapă - 0.35 RON",
                    "100g cașcaval ras - 4.00 RON",
                    "2 linguri ulei măsline - 3.00 RON",
                    "Sare, piper, oregano - 2.82 RON",
                    "2 căței usturoi - 0.55 RON",
                    "50ml smântână - 1.07 RON",
                    "Pătrunjel proaspăt - 1.38 RON"
                ],
                "pasi": [
                    "Puneți apa la fiert pentru paste cu sare.",
                    "Tăiați pieptul de pui în fâșii subțiri și condimentați.",
                    "Într-o tigaie mare, încălziți uleiul și rumeniți puiul 5-6 minute.",
                    "Scoateți puiul și în aceeași tigaie căliți ceapa și ardeiul 3 minute.",
                    "Adăugați roșiile tăiate, usturoiul și condimentele. Gătiți 5 minute.",
                    "Fierbeți pastele conform instrucțiunilor, apoi scurgeți-le.",
                    "Combinați pastele cu sosul, adăugați puiul și smântâna.",
                    "Presărați cașcavalul ras și pătrunjelul. Serviți imediat!"
                ],
                "dificultate": "Ușor",
                "sfat_economie": "Pieptul de pui la reducere poate fi porționat și congelat pentru utilizare ulterioară!"
            },
            {
                "titlu": "Mâncare de fasole cu cârnați",
                "timp": "40 minute",
                "portii": 4,
                "cost_total": 28.45,
                "cost_fara_reducere": 42.45,
                "economie_estimata": "Economisești 14.00 RON",
                "ingrediente": [
                    "2 conserve fasole albă (800g) - 6.98 RON",
                    "300g cârnați proaspeți - 5.10 RON",
                    "200g ceapă - 0.70 RON",
                    "3 linguri bulion - 3.00 RON",
                    "200g roșii - 1.60 RON",
                    "2 căței usturoi - 0.55 RON",
                    "1 frunză dafin - 0.30 RON",
                    "Ulei, sare, piper, boia dulce - 5.22 RON",
                    "Cimbru uscat - 1.00 RON",
                    "Pătrunjel - 1.00 RON",
                    "1 ardei gras - 1.20 RON",
                    "Pâine pentru servit - 1.80 RON"
                ],
                "pasi": [
                    "Tăiați cârnații în rondele de 1cm și rumeniți-i în puțin ulei.",
                    "Scoateți cârnații și în aceeași grăsime căliți ceapa tocată mărunt.",
                    "Adăugați ardeiul tăiat cuburi și usturoiul zdrobit.",
                    "Puneți roșiile tocate, bulionul și 100ml apă. Amestecați bine.",
                    "Adăugați fasolea scursă, frunza de dafin și condimentele.",
                    "Lăsați să fiarbă la foc mic 15 minute, amestecând ocazional.",
                    "Adăugați cârnații rumeniți și mai gătiți 5 minute.",
                    "Presărați pătrunjel și serviți cu pâine proaspătă!"
                ],
                "dificultate": "Ușor",
                "sfat_economie": "Fasolea la conservă este o sursă excelentă și ieftină de proteine!"
            }
        ]


ai_chef = AIChef()


async def generate_recipes(products: List[Dict]) -> List[Dict]:
    return await ai_chef.generate_recipes(products)
