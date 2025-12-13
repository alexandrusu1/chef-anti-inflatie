import os
import json
from typing import List, Dict
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
GITHUB_MODELS_ENDPOINT = "https://models.inference.ai.azure.com"


def generate_recipes(products: List[Dict]) -> List[Dict]:
    if not GITHUB_TOKEN:
        print("GITHUB_TOKEN nu este setat, returnez rețete generate local")
        return generate_local_recipes(products)
    
    try:
        client = OpenAI(
            base_url=GITHUB_MODELS_ENDPOINT,
            api_key=GITHUB_TOKEN,
        )
        
        product_list = "\n".join([f"- {p['name']} ({p['new_price']} lei, reducere {p.get('discount_percentage', 0)}%)" for p in products[:15]])
        
        prompt = f"""Ești un chef român expert în bucătăria economică. Generează 3 rețete delicioase, nutritive și ieftine folosind DOAR aceste produse la ofertă:

{product_list}

Pentru fiecare rețetă returnează un JSON valid cu structura:
{{
  "recipes": [
    {{
      "name": "Numele rețetei",
      "description": "Descriere scurtă (maxim 100 caractere)",
      "ingredients": ["ingredient 1 cu cantitate", "ingredient 2 cu cantitate"],
      "instructions": ["Pasul 1", "Pasul 2", "Pasul 3"],
      "prep_time": "20 min",
      "servings": 4,
      "estimated_cost": 25.50,
      "nutrition": {{"calories": 450, "protein": "25g", "carbs": "35g", "fat": "15g"}}
    }}
  ]
}}

Returnează DOAR JSON-ul valid, fără explicații sau markdown."""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Ești un chef român care creează rețete economice și nutritive. Răspunzi doar în JSON valid."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=2000
        )
        
        content = response.choices[0].message.content.strip()
        
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        
        data = json.loads(content)
        recipes = data.get("recipes", data if isinstance(data, list) else [])
        
        for i, recipe in enumerate(recipes):
            recipe["id"] = i + 1
            recipe["image_url"] = get_recipe_image(recipe.get("name", ""))
            if "nutrition" not in recipe:
                recipe["nutrition"] = {"calories": 400, "protein": "20g", "carbs": "40g", "fat": "12g"}
        
        return recipes
        
    except Exception as e:
        print(f"Eroare GitHub Models API: {e}")
        return generate_local_recipes(products)


def get_recipe_image(name: str) -> str:
    name_lower = name.lower()
    if any(w in name_lower for w in ['pui', 'chicken']):
        return "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400"
    if any(w in name_lower for w in ['porc', 'pork']):
        return "https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400"
    if any(w in name_lower for w in ['paste', 'pasta', 'spaghete']):
        return "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400"
    if any(w in name_lower for w in ['ciorba', 'supa', 'soup']):
        return "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400"
    if any(w in name_lower for w in ['salata', 'salad']):
        return "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400"
    if any(w in name_lower for w in ['cartofi', 'potato']):
        return "https://images.unsplash.com/photo-1518977676601-b53f82bbe903?w=400"
    if any(w in name_lower for w in ['orez', 'rice', 'pilaf']):
        return "https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=400"
    return "https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=400"


def generate_local_recipes(products: List[Dict]) -> List[Dict]:
    product_names = [p["name"].lower() for p in products]
    recipes = []
    
    if any("pui" in n or "piept" in n for n in product_names):
        recipes.append({
            "id": 1,
            "name": "Piept de pui la cuptor cu legume",
            "description": "Piept de pui suculent cu garnitură de legume la cuptor",
            "ingredients": ["500g piept de pui", "300g cartofi", "200g morcovi", "1 ceapă", "ulei, sare, piper, boia"],
            "instructions": [
                "Preîncălzește cuptorul la 200°C",
                "Taie puiul în bucăți și asezonează cu sare, piper și boia",
                "Curăță și taie legumele cuburi",
                "Pune totul într-o tavă cu ulei",
                "Coace 40-45 minute până se rumenește"
            ],
            "prep_time": "50 min",
            "servings": 4,
            "estimated_cost": sum(p["new_price"] for p in products[:4]) if products else 30,
            "image_url": "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400",
            "nutrition": {"calories": 380, "protein": "35g", "carbs": "25g", "fat": "12g"}
        })
    
    if any("porc" in n or "ceafa" in n for n in product_names):
        recipes.append({
            "id": 2,
            "name": "Ceafă de porc cu sos de roșii",
            "description": "Ceafă fragedă în sos aromat de roșii cu usturoi",
            "ingredients": ["600g ceafă de porc", "400g roșii/bulion", "4 căței usturoi", "ceapă, ardei", "condimente"],
            "instructions": [
                "Prăjește ceafa în ulei încins pe ambele părți",
                "Scoate carnea și călește ceapa și ardeiul",
                "Adaugă usturoiul și roșiile/bulionul",
                "Pune carnea înapoi și lasă la foc mic 30 min",
                "Servește cu mămăliguță sau piure"
            ],
            "prep_time": "45 min",
            "servings": 4,
            "estimated_cost": sum(p["new_price"] for p in products[:4]) if products else 35,
            "image_url": "https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400",
            "nutrition": {"calories": 450, "protein": "38g", "carbs": "15g", "fat": "28g"}
        })
    
    if any("paste" in n or "orez" in n for n in product_names):
        recipes.append({
            "id": 3,
            "name": "Paste cu sos de roșii și legume",
            "description": "Paste rapide cu sos de roșii proaspete și legume de sezon",
            "ingredients": ["400g paste", "500g roșii", "2 ardei", "ceapă, usturoi", "parmezan, busuioc"],
            "instructions": [
                "Fierbe pastele conform instrucțiunilor",
                "Călește ceapa și ardeiul tăiat cuburi",
                "Adaugă roșiile tocate și usturoiul",
                "Lasă sosul să se reducă 15 minute",
                "Amestecă cu pastele și presară parmezan"
            ],
            "prep_time": "25 min",
            "servings": 4,
            "estimated_cost": sum(p["new_price"] for p in products[:3]) if products else 20,
            "image_url": "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400",
            "nutrition": {"calories": 420, "protein": "14g", "carbs": "72g", "fat": "8g"}
        })
    
    if len(recipes) < 3:
        recipes.append({
            "id": len(recipes) + 1,
            "name": "Ciorbă de legume cu smântână",
            "description": "Ciorbă tradițională românească, hrănitoare și economică",
            "ingredients": ["2 cartofi", "2 morcovi", "1 ceapă", "1 ardei", "200ml smântână", "leuștean, bors"],
            "instructions": [
                "Curăță și taie legumele cuburi mici",
                "Pune la fiert în 2L apă cu sare",
                "După 20 min adaugă borșul",
                "La final pune smântâna și leușteanul",
                "Servește caldă cu ardei iute"
            ],
            "prep_time": "35 min",
            "servings": 6,
            "estimated_cost": 18,
            "image_url": "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400",
            "nutrition": {"calories": 180, "protein": "5g", "carbs": "22g", "fat": "8g"}
        })
    
    if len(recipes) < 3:
        recipes.append({
            "id": len(recipes) + 1,
            "name": "Cartofi țărănești cu ouă",
            "description": "Mâncare simplă și consistentă, perfectă pentru cină",
            "ingredients": ["1kg cartofi", "4 ouă", "200g cașcaval", "ceapă verde", "smântână"],
            "instructions": [
                "Fierbe cartofii în coajă, apoi curăță-i",
                "Taie-i cuburi și prăjește-i în tigaie",
                "Bate ouăle cu smântâna și condimente",
                "Toarnă peste cartofi și amestecă",
                "Presară cașcaval ras și servește"
            ],
            "prep_time": "40 min",
            "servings": 4,
            "estimated_cost": 22,
            "image_url": "https://images.unsplash.com/photo-1518977676601-b53f82bbe903?w=400",
            "nutrition": {"calories": 380, "protein": "18g", "carbs": "42g", "fat": "16g"}
        })
    
    return recipes[:3]
