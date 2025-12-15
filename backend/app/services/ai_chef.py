import os
import json
from datetime import datetime
from typing import List, Dict, Optional
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")


def get_ai_client():
    if GROQ_API_KEY:
        from openai import OpenAI
        return OpenAI(base_url="https://api.groq.com/openai/v1", api_key=GROQ_API_KEY), "llama-3.3-70b-versatile"
    return None, None


def generate_recipes_ai(products: List[Dict], recipe_type: str = "general", max_budget: Optional[float] = None) -> List[Dict]:
    client, model = get_ai_client()
    if not client:
        return generate_fallback_recipes(products, recipe_type)
    
    product_list = "\n".join([
        f"- {p['name']}: {p['new_price']:.2f} lei (-{p.get('discount_percentage', 0)}%)" 
        for p in products[:20]
    ])
    
    instructions = {
        "top": "Creează 3 rețete folosind produsele cu discount mare. Rețete tradiționale românești sau internaționale populare.",
        "cheapest": "Creează 3 rețete foarte economice. Focus pe cost minim, porții generoase.",
        "selected": "Creează 3 rețete care combină logic produsele selectate.",
        "general": "Creează 3 rețete variate și apetisante."
    }
    
    budget_note = f"\nBuget maxim per rețetă: {max_budget} lei." if max_budget else ""
    
    prompt = f"""Ești bucătar profesionist român.

PRODUSE DISPONIBILE LA OFERTĂ:
{product_list}

CERINȚĂ: {instructions.get(recipe_type, instructions["general"])}{budget_note}

REGULI:
- Combină ingredientele logic (carne+legume, paste+sos, fructe doar în deserturi)
- Nu pune fructe în mâncăruri sărate
- Folosește minimum 2 produse din ofertă per rețetă
- Prețuri ingrediente extra: ulei 3 lei, sare 1 leu, ceapă 2 lei, usturoi 2 lei, smântână 5 lei, ouă 8 lei, orez 4 lei, paste 4 lei

Răspunde DOAR cu JSON valid:
{{"recipes": [
  {{
    "name": "Nume Rețetă",
    "description": "Descriere scurtă și apetisantă",
    "ingredients": [
      {{"name": "Produs", "quantity": "cantitate", "price": pret, "from_offer": true/false}}
    ],
    "instructions": ["Pas 1", "Pas 2", "Pas 3", "Pas 4", "Pas 5"],
    "prep_time": "X min",
    "cook_time": "Y min", 
    "servings": 4,
    "estimated_cost": suma,
    "cost_per_serving": cost_portie,
    "difficulty": "ușor/mediu/avansat",
    "nutrition": {{"calories": X, "protein": X, "carbs": X, "fat": X}},
    "tags": ["categorie"],
    "tips": "Sfat practic"
  }}
]}}"""

    try:
        response = client.chat.completions.create(
            model=model, 
            messages=[
                {"role": "system", "content": "Ești bucătar profesionist. Răspunzi DOAR cu JSON valid, fără markdown."}, 
                {"role": "user", "content": prompt}
            ], 
            temperature=0.7, 
            max_tokens=3500
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
        
        return recipes
        
    except Exception as e:
        print(f"AI Error: {e}")
        return generate_fallback_recipes(products, recipe_type)


def generate_fallback_recipes(products: List[Dict], recipe_type: str = "general") -> List[Dict]:
    if not products:
        return []
    
    recipes = []
    now = datetime.now().isoformat()
    
    meat_products = [p for p in products if any(w in p['name'].lower() for w in ['pui', 'porc', 'vita', 'carne', 'sunca', 'salam', 'carnati'])]
    veggie_products = [p for p in products if any(w in p['name'].lower() for w in ['rosii', 'cartofi', 'ceapa', 'morcov', 'ardei', 'varza', 'legume'])]
    dairy_products = [p for p in products if any(w in p['name'].lower() for w in ['lapte', 'iaurt', 'smantana', 'branza', 'cascaval', 'unt'])]
    
    if meat_products:
        p = meat_products[0]
        cost = p["new_price"] + 8
        recipes.append({
            "name": f"{p['name'].split()[0]} la tigaie cu legume",
            "description": "Rețetă rapidă și gustoasă pentru toată familia",
            "ingredients": [
                {"name": p["name"], "quantity": "500g", "price": p["new_price"], "from_offer": True},
                {"name": "Ceapă", "quantity": "2 bucăți", "price": 2, "from_offer": False},
                {"name": "Ardei gras", "quantity": "2 bucăți", "price": 3, "from_offer": False},
                {"name": "Ulei", "quantity": "3 linguri", "price": 2, "from_offer": False},
                {"name": "Condimente", "quantity": "după gust", "price": 1, "from_offer": False}
            ],
            "instructions": [
                "Taie carnea în cuburi potrivite",
                "Încinge uleiul într-o tigaie mare",
                "Prăjește carnea până se rumenește",
                "Adaugă legumele tăiate și călește 10 minute",
                "Condimentează și servește fierbinte"
            ],
            "prep_time": "15 min",
            "cook_time": "25 min",
            "servings": 4,
            "estimated_cost": round(cost, 2),
            "cost_per_serving": round(cost/4, 2),
            "difficulty": "ușor",
            "nutrition": {"calories": 380, "protein": 28, "carbs": 12, "fat": 22},
            "tags": ["carne", "rapid"],
            "tips": "Se poate servi cu orez sau cartofi",
            "image_url": get_recipe_image(p["name"]),
            "id": 1,
            "generated_at": now
        })
    
    if veggie_products or len(products) > 3:
        items = veggie_products[:3] if veggie_products else products[:3]
        cost = sum(x["new_price"] for x in items) + 6
        recipes.append({
            "name": "Tocăniță de legume de sezon",
            "description": "Mâncare sănătoasă și hrănitoare din legume proaspete",
            "ingredients": [
                {"name": x["name"], "quantity": "300g", "price": x["new_price"], "from_offer": True} 
                for x in items
            ] + [
                {"name": "Bulion", "quantity": "2 linguri", "price": 3, "from_offer": False},
                {"name": "Usturoi", "quantity": "3 căței", "price": 2, "from_offer": False},
                {"name": "Ulei", "quantity": "2 linguri", "price": 1, "from_offer": False}
            ],
            "instructions": [
                "Spală și taie toate legumele",
                "Călește ceapa și usturoiul în ulei",
                "Adaugă legumele treptat, de la cele mai tari",
                "Toarnă bulionul diluat și lasă să fiarbă",
                "Condimentează și servește cu pâine"
            ],
            "prep_time": "20 min",
            "cook_time": "30 min",
            "servings": 4,
            "estimated_cost": round(cost, 2),
            "cost_per_serving": round(cost/4, 2),
            "difficulty": "ușor",
            "nutrition": {"calories": 220, "protein": 6, "carbs": 35, "fat": 8},
            "tags": ["vegetarian", "sănătos"],
            "tips": "Adaugă smântână pentru extra cremozitate",
            "image_url": get_recipe_image("legume"),
            "id": 2,
            "generated_at": now
        })
    
    if dairy_products or len(products) > 5:
        items = dairy_products[:2] if dairy_products else products[3:5]
        cost = sum(x["new_price"] for x in items) + 10
        recipes.append({
            "name": "Clătite pufoase cu sos cremos",
            "description": "Desert clasic adorat de toată lumea",
            "ingredients": [
                {"name": x["name"], "quantity": "250g", "price": x["new_price"], "from_offer": True} 
                for x in items
            ] + [
                {"name": "Făină", "quantity": "200g", "price": 3, "from_offer": False},
                {"name": "Ouă", "quantity": "3 bucăți", "price": 5, "from_offer": False},
                {"name": "Zahăr", "quantity": "50g", "price": 2, "from_offer": False}
            ],
            "instructions": [
                "Amestecă făina cu ouăle și laptele",
                "Bate compoziția până devine omogenă",
                "Coace clătitele într-o tigaie unsă",
                "Prepară sosul din produsele lactate",
                "Servește clătitele cu sosul deasupra"
            ],
            "prep_time": "10 min",
            "cook_time": "20 min",
            "servings": 4,
            "estimated_cost": round(cost, 2),
            "cost_per_serving": round(cost/4, 2),
            "difficulty": "ușor",
            "nutrition": {"calories": 320, "protein": 10, "carbs": 45, "fat": 12},
            "tags": ["desert", "clasic"],
            "tips": "Se pot umple cu gem sau nutella",
            "image_url": get_recipe_image("clatite"),
            "id": 3,
            "generated_at": now
        })
    
    if not recipes:
        p = products[0]
        cost = p["new_price"] + 5
        recipes.append({
            "name": f"Preparat rapid cu {p['name'].split()[0]}",
            "description": "Rețetă simplă și gustoasă",
            "ingredients": [
                {"name": p["name"], "quantity": "400g", "price": p["new_price"], "from_offer": True},
                {"name": "Condimente", "quantity": "după gust", "price": 2, "from_offer": False},
                {"name": "Ulei", "quantity": "2 linguri", "price": 3, "from_offer": False}
            ],
            "instructions": [
                "Pregătește ingredientul principal",
                "Încălzește tigaia cu ulei",
                "Gătește până la consistența dorită",
                "Condimentează după gust",
                "Servește cald"
            ],
            "prep_time": "10 min",
            "cook_time": "15 min",
            "servings": 2,
            "estimated_cost": round(cost, 2),
            "cost_per_serving": round(cost/2, 2),
            "difficulty": "foarte ușor",
            "nutrition": {"calories": 250, "protein": 15, "carbs": 20, "fat": 10},
            "tags": ["rapid", "simplu"],
            "tips": "Adaptează condimentele după preferințe",
            "image_url": get_recipe_image(p["name"]),
            "id": 1,
            "generated_at": now
        })
    
    return recipes[:3]


def get_recipe_image(name: str) -> str:
    n = name.lower()
    
    images = {
        "pui": "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400",
        "piept": "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400",
        "porc": "https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400",
        "ceafa": "https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400",
        "vita": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400",
        "peste": "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400",
        "somon": "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400",
        "paste": "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400",
        "spaghete": "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400",
        "orez": "https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=400",
        "pilaf": "https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=400",
        "legume": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400",
        "tocan": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400",
        "salata": "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400",
        "clatite": "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400",
        "desert": "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400",
        "supa": "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400",
        "ciorba": "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400"
    }
    
    for key, url in images.items():
        if key in n:
            return url
    
    return "https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=400"


def generate_recipes_for_products(products: List[Dict], selected_ids: List[str]) -> List[Dict]:
    selected = [p for p in products if p.get("id") in selected_ids]
    return generate_recipes_ai(selected if selected else products[:5], "selected")


def get_top_discount_recipes(products: List[Dict]) -> List[Dict]:
    top = sorted(products, key=lambda x: x.get("discount_percentage", 0), reverse=True)[:10]
    return generate_recipes_ai(top, "top")


def get_cheapest_recipes(products: List[Dict]) -> List[Dict]:
    cheap = sorted(products, key=lambda x: x.get("new_price", 0))[:12]
    return generate_recipes_ai(cheap, "cheapest", max_budget=25)
