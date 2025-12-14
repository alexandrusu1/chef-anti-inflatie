import os
import json
import hashlib
from datetime import datetime
from typing import List, Dict, Optional
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")

def get_ai_client():
    if GROQ_API_KEY:
        from openai import OpenAI
        return OpenAI(base_url="https://api.groq.com/openai/v1", api_key=GROQ_API_KEY), "llama-3.3-70b-versatile"
    elif GITHUB_TOKEN and GITHUB_TOKEN != "your_github_token_here":
        from openai import OpenAI
        return OpenAI(base_url="https://models.inference.ai.azure.com", api_key=GITHUB_TOKEN), "gpt-4o-mini"
    return None, None

def generate_recipes_ai(products: List[Dict], recipe_type: str = "general", max_budget: Optional[float] = None) -> List[Dict]:
    client, model = get_ai_client()
    if not client:
        return generate_smart_local_recipes(products, recipe_type, max_budget)
    
    # Grupăm produsele pe categorii pentru AI
    product_list = "\n".join([f"- {p['name']}: {p['new_price']:.2f} lei (-{p.get('discount_percentage', 0)}%)" for p in products[:25]])
    
    type_instructions = {
        "top": "Creează 3 rețete GUSTOASE și REALISTE folosind produsele cu discount mare.",
        "cheapest": "Creează 3 rețete ECONOMICE dar delicioase, cu cost total mic.",
        "selected": "Creează 3 rețete folosind produsele selectate care SE POTRIVESC împreună.",
        "general": "Creează 3 rețete variate: un fel principal, o supă/ciorbă, și o gustare/salată."
    }
    
    budget_note = f"\nBUGET MAXIM per rețetă: {max_budget} lei!" if max_budget else ""
    
    prompt = f"""Ești CHEF profesionist cu experiență în bucătăria românească și internațională.

PRODUSE LA REDUCERE (Lidl România):
{product_list}

SARCINĂ: {type_instructions.get(recipe_type, type_instructions["general"])}{budget_note}

⚠️ REGULI OBLIGATORII:
1. SENS CULINAR: Ingredientele trebuie să se potrivească! 
   - CORECT: carne+legume, pește+lămâie, fructe+zahăr, paste+sos
   - GREȘIT: fructe+carne, pește+mere, slănină+ciocolată, legume+gem
   
2. REȚETE REALE pe care oamenii le gătesc:
   - DA: ciorbă de legume, piept de pui la cuptor, paste carbonara, salată grecească, tocăniță, pilaf, clătite, prăjitură
   - NU: combinații absurde, rețete inventate, amestecuri ciudate

3. FRUCTELE merg doar în: deserturi, smoothie-uri, salate de fructe, prăjituri, compoturi
   - NU pune mere/pere/portocale în mâncăruri sărate!

4. LEGUMELE (țelină, morcov, ceapă) merg în: ciorbe, tocănițe, supe, garnituri
   - NU le combina cu fructe sau dulciuri!

5. Folosește MINIM 2 produse din ofertă per rețetă, dar DOAR dacă se potrivesc!
   - Dacă nu se potrivesc, folosește 1 produs + ingrediente de bază

INGREDIENTE SUPLIMENTARE (prețuri estimate):
- Bază: ulei 3 lei, sare/piper 1 leu, ceapă 1.5 lei, usturoi 2 lei
- Lactate: smântână 5 lei, ouă 8 lei, brânză 6 lei, lapte 4 lei
- Carbohidrați: paste 4 lei, orez 4 lei, cartofi 3 lei/kg, pâine 3 lei
- Carne: piept pui 20 lei/kg, carne tocată 25 lei/kg

Răspunde STRICT cu JSON (fără markdown):
{{"recipes": [
  {{
    "name": "Nume Rețetă Atrăgător",
    "description": "Descriere apetisantă în max 60 caractere",
    "ingredients": [
      {{"name": "Produs", "quantity": "cantitate", "price": pret, "from_offer": true/false}}
    ],
    "instructions": ["Pas 1...", "Pas 2...", "Pas 3...", "Pas 4...", "Pas 5..."],
    "prep_time": "X min",
    "cook_time": "Y min", 
    "servings": 4,
    "estimated_cost": suma_totala,
    "cost_per_serving": cost_per_portie,
    "difficulty": "ușor/mediu/avansat",
    "nutrition": {{"calories": X, "protein": X, "carbs": X, "fat": X, "fiber": X}},
    "tags": ["categorie"],
    "tips": "Sfat practic"
  }}
]}}"""

    try:
        response = client.chat.completions.create(
            model=model, 
            messages=[
                {"role": "system", "content": "Ești un bucătar profesionist român. Creezi DOAR rețete realiste, gustoase, care au sens culinar. Nu combini ingrediente incompatibile. Răspunzi DOAR cu JSON valid, fără markdown sau explicații."}, 
                {"role": "user", "content": prompt}
            ], 
            temperature=0.7, 
            max_tokens=4000
        )
        content = response.choices[0].message.content.strip()
        if "```" in content:
            content = content.split("```")[1].replace("json", "").strip()
        data = json.loads(content)
        recipes = data.get("recipes", [])
        for i, r in enumerate(recipes):
            r["id"] = i + 1
            r["image_url"] = get_recipe_image(r.get("name", ""))
            r["generated_at"] = datetime.now().isoformat()
        print(f"AI: {len(recipes)} retete generate ({model})")
        return recipes
    except Exception as e:
        print(f"AI Error: {e}")
        return generate_smart_local_recipes(products, recipe_type, max_budget)

def generate_smart_local_recipes(products: List[Dict], recipe_type: str = "general", max_budget: Optional[float] = None) -> List[Dict]:
    if not products:
        return []
    
    # Sortăm produsele pentru a le folosi în rețete
    recipes = []
    now = datetime.now().isoformat()
    
    # Rețeta 1: Din primele 3 produse
    p1 = products[:3]
    cost1 = sum(x["new_price"] for x in p1) + 5
    recipes.append({
        "name": f"Preparare cu {p1[0]['name'].split()[0]}",
        "description": f"Rețetă rapidă folosind {p1[0]['name'][:30]}",
        "ingredients": [{"name": x["name"], "quantity": "300g", "price": x["new_price"], "from_offer": True} for x in p1] + [
            {"name": "Ulei", "quantity": "2 linguri", "price": 2, "from_offer": False},
            {"name": "Sare, piper", "quantity": "după gust", "price": 1, "from_offer": False},
            {"name": "Usturoi", "quantity": "2 căței", "price": 2, "from_offer": False}
        ],
        "instructions": [
            f"Pregătește {p1[0]['name']} - spală și taie",
            "Încinge uleiul într-o tigaie mare",
            "Adaugă ingredientele și călește 5 minute",
            "Condimentează după gust cu sare și piper",
            "Servește cald, ornat cu pătrunjel"
        ],
        "prep_time": "15 min", "cook_time": "20 min", "servings": 4,
        "estimated_cost": round(cost1, 2), "cost_per_serving": round(cost1/4, 2),
        "difficulty": "ușor",
        "nutrition": {"calories": 350, "protein": 20, "carbs": 25, "fat": 15, "fiber": 5},
        "tags": ["rapid", "economic"], "tips": "Poți adăuga smântână pentru mai multă cremozitate",
        "image_url": get_recipe_image(p1[0]["name"]), "id": 1, "generated_at": now
    })
    
    # Rețeta 2: Din produsele 4-6
    if len(products) > 3:
        p2 = products[3:6] if len(products) > 5 else products[3:]
        cost2 = sum(x["new_price"] for x in p2) + 6
        recipes.append({
            "name": f"Gustare din {p2[0]['name'].split()[0]}" if p2 else "Gustare economică",
            "description": f"Combinație savuroasă cu produse la ofertă",
            "ingredients": [{"name": x["name"], "quantity": "250g", "price": x["new_price"], "from_offer": True} for x in p2] + [
                {"name": "Ceapă", "quantity": "1 bucată", "price": 1.5, "from_offer": False},
                {"name": "Roșii", "quantity": "2 bucăți", "price": 2.5, "from_offer": False},
                {"name": "Condimente", "quantity": "după gust", "price": 2, "from_offer": False}
            ],
            "instructions": [
                "Spală și pregătește toate ingredientele",
                "Taie ceapa și roșiile mărunt",
                "Combină ingredientele într-un vas mare",
                "Amestecă bine și lasă 5 minute la marinat",
                "Servește la temperatura camerei sau rece"
            ],
            "prep_time": "10 min", "cook_time": "15 min", "servings": 3,
            "estimated_cost": round(cost2, 2), "cost_per_serving": round(cost2/3, 2),
            "difficulty": "foarte ușor",
            "nutrition": {"calories": 280, "protein": 15, "carbs": 30, "fat": 10, "fiber": 6},
            "tags": ["vegetarian", "rapid"], "tips": "Perfect pentru un prânz ușor",
            "image_url": get_recipe_image(p2[0]["name"] if p2 else "legume"), "id": 2, "generated_at": now
        })
    
    # Rețeta 3: Din produsele 7-10
    if len(products) > 6:
        p3 = products[6:10] if len(products) > 9 else products[6:]
        cost3 = sum(x["new_price"] for x in p3) + 4
        recipes.append({
            "name": f"Mâncare de {p3[0]['name'].split()[0]}" if p3 else "Rețetă surpriză",
            "description": "Rețetă tradițională cu twist modern",
            "ingredients": [{"name": x["name"], "quantity": "200g", "price": x["new_price"], "from_offer": True} for x in p3] + [
                {"name": "Făină", "quantity": "2 linguri", "price": 1, "from_offer": False},
                {"name": "Unt", "quantity": "30g", "price": 2, "from_offer": False},
                {"name": "Verdeață", "quantity": "1 legătură", "price": 1, "from_offer": False}
            ],
            "instructions": [
                "Pregătește un roux din făină și unt",
                "Adaugă ingredientele principale treptat",
                "Amestecă continuu pentru a nu se lipi",
                "Lasă la fiert înăbușit 15-20 minute",
                "Presară verdeață proaspătă la servire"
            ],
            "prep_time": "10 min", "cook_time": "25 min", "servings": 4,
            "estimated_cost": round(cost3, 2), "cost_per_serving": round(cost3/4, 2),
            "difficulty": "mediu",
            "nutrition": {"calories": 320, "protein": 18, "carbs": 35, "fat": 12, "fiber": 4},
            "tags": ["traditional", "satios"], "tips": "Se poate servi cu pâine proaspătă",
            "image_url": get_recipe_image(p3[0]["name"] if p3 else "mancare"), "id": 3, "generated_at": now
        })
    
    print(f"Local: Generated {len(recipes)} recipes from {len(products)} products")
    return recipes[:3]

def get_recipe_image(name: str) -> str:
    n = name.lower()
    if any(x in n for x in ["pui", "piept"]): return "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400"
    if any(x in n for x in ["porc", "ceafa"]): return "https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400"
    if any(x in n for x in ["peste", "somon"]): return "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400"
    if any(x in n for x in ["paste", "spaghete"]): return "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400"
    if any(x in n for x in ["orez", "pilaf"]): return "https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=400"
    if any(x in n for x in ["legume", "tocan"]): return "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400"
    return "https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=400"

def generate_recipes_for_products(products: List[Dict], selected_ids: List[str]) -> List[Dict]:
    selected = [p for p in products if p.get("id") in selected_ids]
    return generate_recipes_ai(selected if selected else products[:5], "selected")

def get_top_discount_recipes(products: List[Dict]) -> List[Dict]:
    top = sorted(products, key=lambda x: x.get("discount_percentage", 0), reverse=True)[:10]
    return generate_recipes_ai(top, "top")

def get_cheapest_recipes(products: List[Dict]) -> List[Dict]:
    cheap = sorted(products, key=lambda x: x.get("new_price", 0))[:15]
    return generate_recipes_ai(cheap, "cheapest", max_budget=25)
