'use client'

import { useState, useEffect, useMemo } from 'react'

interface Ingredient {
  name: string
  quantity: string
  price: number
  from_offer: boolean
}

interface Offer {
  id: string
  name: string
  old_price: number
  new_price: number
  discount_percentage: number
  store: string
  category: string
  image_url: string
}

interface Recipe {
  id: number
  name: string
  description: string
  prep_time: string
  cook_time?: string
  servings: number
  estimated_cost: number
  cost_per_serving?: number
  difficulty?: string
  ingredients: Ingredient[] | string[]
  instructions: string[]
  image_url: string
  nutrition: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber?: number
  }
  tags?: string[]
  tips?: string
  generated_at?: string
}

interface DashboardData {
  offers: Offer[]
  top_recipes: Recipe[]
  cheapest_recipes: Recipe[]
  stats: {
    total_offers: number
    total_potential_savings: number
    categories: Record<string, number>
    recipes_updated?: string
  }
}

const RECIPE_IMAGES = [
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600',
  'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600',
  'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=600',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600',
  'https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?w=600',
  'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=600',
]

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [customRecipes, setCustomRecipes] = useState<Recipe[]>([])
  const [generating, setGenerating] = useState(false)
  const [activeView, setActiveView] = useState<'home' | 'select' | 'results'>('home')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/api/dashboard`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare la încărcare')
    } finally {
      setLoading(false)
    }
  }

  const generateRecipes = async () => {
    if (selectedProducts.length === 0) return
    
    try {
      setGenerating(true)
      const response = await fetch(`${API_URL}/api/recipes/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_ids: selectedProducts })
      })
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const result = await response.json()
      setCustomRecipes(result.recipes || [])
      setActiveView('results')
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setGenerating(false)
    }
  }

  const toggleProduct = (id: string) => {
    setSelectedProducts(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const selectedTotal = useMemo(() => {
    if (!data?.offers) return { count: 0, total: 0, savings: 0 }
    const selected = data.offers.filter(o => selectedProducts.includes(o.id))
    return {
      count: selected.length,
      total: selected.reduce((sum, o) => sum + o.new_price, 0),
      savings: selected.reduce((sum, o) => sum + (o.old_price - o.new_price), 0)
    }
  }, [data?.offers, selectedProducts])

  const filteredOffers = useMemo(() => {
    if (!data?.offers) return []
    if (categoryFilter === 'all') return data.offers
    return data.offers.filter(o => o.category === categoryFilter)
  }, [data?.offers, categoryFilter])

  const categories = useMemo(() => {
    if (!data?.stats.categories) return []
    return Object.entries(data.stats.categories).sort((a, b) => b[1] - a[1])
  }, [data?.stats.categories])

  const formatIngredient = (ing: Ingredient | string): string => {
    if (typeof ing === 'string') return ing
    return `${ing.name} - ${ing.quantity}`
  }

  const getRecipeImage = (recipe: Recipe, index: number) => {
    return RECIPE_IMAGES[index % RECIPE_IMAGES.length]
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-slate-600 font-medium">Se încarcă ofertele...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Nu s-au putut încărca datele</h2>
          <p className="text-slate-500 mb-6">{error}</p>
          <button 
            onClick={fetchDashboard} 
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
          >
            Încearcă din nou
          </button>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Chef Anti-Inflație</h1>
                <p className="text-sm text-slate-500">Rețete inteligente din oferte reale</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">{data?.stats.total_offers || 0}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Oferte active</p>
              </div>
              <div className="w-px h-10 bg-slate-200"></div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">{data?.stats.total_potential_savings?.toFixed(0) || 0} lei</p>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Economii posibile</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveView('home')}
              className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                activeView === 'home' 
                  ? 'border-emerald-600 text-emerald-600' 
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Acasă
            </button>
            <button
              onClick={() => setActiveView('select')}
              className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                activeView === 'select' 
                  ? 'border-emerald-600 text-emerald-600' 
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Selectează produse
              {selectedProducts.length > 0 && (
                <span className="bg-emerald-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {selectedProducts.length}
                </span>
              )}
            </button>
            {customRecipes.length > 0 && (
              <button
                onClick={() => setActiveView('results')}
                className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                  activeView === 'results' 
                    ? 'border-emerald-600 text-emerald-600' 
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Rețetele tale ({customRecipes.length})
              </button>
            )}
          </div>
        </div>
      </nav>

      {activeView === 'home' && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <section className="mb-12">
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
              
              <div className="relative z-10 max-w-2xl">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Gătește mai ieftin cu produsele la ofertă
                </h2>
                <p className="text-lg text-emerald-100 mb-6 leading-relaxed">
                  Aplicația noastră analizează în timp real ofertele din supermarketuri și generează 
                  automat rețete delicioase folosind ingredientele cu cele mai mari reduceri. 
                  Economisești bani fără să renunți la calitate.
                </p>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-6">
                  <p className="text-sm text-emerald-100">
                    <span className="font-semibold text-white">Acum disponibil:</span> Lidl România
                  </p>
                  <p className="text-sm text-emerald-200">
                    <span className="font-semibold text-emerald-100">În curând:</span> Kaufland, Carrefour, Mega Image, Penny
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => setActiveView('select')}
                    className="px-8 py-4 bg-white text-emerald-700 rounded-xl font-semibold hover:bg-emerald-50 transition-colors shadow-lg"
                  >
                    Începe să selectezi produse
                  </button>
                  <a 
                    href="#recipes" 
                    className="px-8 py-4 bg-emerald-500/30 text-white rounded-xl font-semibold hover:bg-emerald-500/40 transition-colors text-center"
                  >
                    Vezi rețetele zilei
                  </a>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h3 className="text-xl font-semibold text-slate-800 mb-6 text-center">Cum funcționează</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-emerald-600 font-bold text-lg">1</span>
                </div>
                <h4 className="font-semibold text-slate-800 mb-2">Verificăm ofertele</h4>
                <p className="text-slate-600 text-sm">Scanăm automat prețurile din Lidl și identificăm produsele cu cele mai mari reduceri.</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-emerald-600 font-bold text-lg">2</span>
                </div>
                <h4 className="font-semibold text-slate-800 mb-2">Selectezi produsele</h4>
                <p className="text-slate-600 text-sm">Alegi ce produse vrei să cumperi și vezi în timp real cât cheltuiești și cât economisești.</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-emerald-600 font-bold text-lg">3</span>
                </div>
                <h4 className="font-semibold text-slate-800 mb-2">Primești rețete</h4>
                <p className="text-slate-600 text-sm">Inteligența artificială generează rețete personalizate folosind exact produsele selectate.</p>
              </div>
            </div>
          </section>

          <section id="recipes" className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-slate-800">Rețete cu reduceri mari</h3>
                <p className="text-slate-500 text-sm">Generate din produsele cu cel mai mare discount</p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {data?.top_recipes?.map((recipe, index) => (
                <RecipeCard 
                  key={recipe.id} 
                  recipe={recipe} 
                  imageUrl={getRecipeImage(recipe, index)}
                  onClick={() => setSelectedRecipe(recipe)} 
                />
              ))}
              {(!data?.top_recipes || data.top_recipes.length === 0) && (
                <div className="col-span-3 text-center py-12 text-slate-500">
                  Se generează rețetele...
                </div>
              )}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-slate-800">Cele mai economice rețete</h3>
                <p className="text-slate-500 text-sm">Mâncare bună la prețuri minime</p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {data?.cheapest_recipes?.map((recipe, index) => (
                <RecipeCard 
                  key={recipe.id} 
                  recipe={recipe} 
                  imageUrl={getRecipeImage(recipe, index + 5)}
                  onClick={() => setSelectedRecipe(recipe)} 
                />
              ))}
              {(!data?.cheapest_recipes || data.cheapest_recipes.length === 0) && (
                <div className="col-span-3 text-center py-12 text-slate-500">
                  Se generează rețetele...
                </div>
              )}
            </div>
          </section>

          {data?.stats.recipes_updated && (
            <p className="text-center text-slate-400 text-sm mt-8">
              Actualizat: {new Date(data.stats.recipes_updated).toLocaleString('ro-RO')}
            </p>
          )}
        </div>
      )}

      {activeView === 'select' && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">Selectează produsele</h2>
                <p className="text-slate-500">Apasă pe produsele pe care vrei să le adaugi în coș</p>
              </div>
              
              <div className="flex items-center gap-6 bg-slate-50 rounded-xl p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-800">{selectedTotal.count}</p>
                  <p className="text-xs text-slate-500">Produse</p>
                </div>
                <div className="w-px h-10 bg-slate-200"></div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-600">{selectedTotal.total.toFixed(2)} lei</p>
                  <p className="text-xs text-slate-500">Total de plată</p>
                </div>
                <div className="w-px h-10 bg-slate-200"></div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-500">{selectedTotal.savings.toFixed(2)} lei</p>
                  <p className="text-xs text-slate-500">Economisești</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                categoryFilter === 'all'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Toate ({data?.offers.length || 0})
            </button>
            {categories.map(([cat, count]) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                  categoryFilter === cat
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat} ({count})
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredOffers.map(offer => (
              <div
                key={offer.id}
                onClick={() => toggleProduct(offer.id)}
                className={`bg-white rounded-xl overflow-hidden cursor-pointer transition-all border-2 ${
                  selectedProducts.includes(offer.id)
                    ? 'border-emerald-500 shadow-lg shadow-emerald-100'
                    : 'border-transparent hover:shadow-md'
                }`}
              >
                <div className="relative h-32 bg-slate-100">
                  <img 
                    src={offer.image_url} 
                    alt={offer.name} 
                    className="w-full h-full object-cover" 
                    onError={e => { e.currentTarget.style.display = 'none' }} 
                  />
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-0.5 rounded-md text-xs font-semibold">
                    -{offer.discount_percentage}%
                  </div>
                  {selectedProducts.includes(offer.id) && (
                    <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                      <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs text-slate-400 mb-1">{offer.category}</p>
                  <h3 className="font-medium text-slate-800 text-sm line-clamp-2 h-10">{offer.name}</h3>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-lg font-bold text-emerald-600">{offer.new_price.toFixed(2)} lei</span>
                    <span className="text-xs text-slate-400 line-through">{offer.old_price.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedProducts.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
              <button
                onClick={generateRecipes}
                disabled={generating}
                className="px-8 py-4 bg-emerald-600 text-white rounded-xl font-semibold shadow-xl shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center gap-3"
              >
                {generating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Se generează rețetele...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generează rețete • {selectedTotal.total.toFixed(2)} lei
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {activeView === 'results' && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Rețetele tale personalizate</h2>
            <p className="text-slate-500">Generate special din cele {selectedProducts.length} produse selectate</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {customRecipes.map((recipe, index) => (
              <RecipeCard 
                key={recipe.id} 
                recipe={recipe} 
                imageUrl={getRecipeImage(recipe, index + 3)}
                onClick={() => setSelectedRecipe(recipe)} 
              />
            ))}
          </div>

          <div className="text-center mt-8">
            <button
              onClick={() => { setSelectedProducts([]); setCustomRecipes([]); setActiveView('select') }}
              className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
            >
              Selectează alte produse
            </button>
          </div>
        </div>
      )}

      {selectedRecipe && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedRecipe(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="relative h-56 bg-slate-200">
              <img 
                src={RECIPE_IMAGES[selectedRecipe.id % RECIPE_IMAGES.length]} 
                alt={selectedRecipe.name} 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <button 
                onClick={() => setSelectedRecipe(null)} 
                className="absolute top-4 right-4 w-10 h-10 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h2 className="text-2xl font-bold mb-1">{selectedRecipe.name}</h2>
                <p className="text-white/80 text-sm">{selectedRecipe.description}</p>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-4 gap-3 mb-6">
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-emerald-600">{selectedRecipe.estimated_cost?.toFixed(0) || 0}</p>
                  <p className="text-xs text-slate-500">lei</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-orange-600">{selectedRecipe.nutrition?.calories || 0}</p>
                  <p className="text-xs text-slate-500">kcal</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-blue-600">{selectedRecipe.nutrition?.protein || 0}g</p>
                  <p className="text-xs text-slate-500">proteine</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-purple-600">{selectedRecipe.servings}</p>
                  <p className="text-xs text-slate-500">porții</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-slate-800 mb-3">Ingrediente</h3>
                <div className="space-y-2">
                  {selectedRecipe.ingredients?.map((ing, i) => (
                    <div 
                      key={i} 
                      className={`p-3 rounded-lg flex items-center justify-between ${
                        typeof ing !== 'string' && ing.from_offer 
                          ? 'bg-emerald-50 border border-emerald-200' 
                          : 'bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {typeof ing !== 'string' && ing.from_offer && (
                          <span className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                        )}
                        <span className="text-slate-700">{formatIngredient(ing)}</span>
                      </div>
                      {typeof ing !== 'string' && ing.price > 0 && (
                        <span className="text-emerald-600 font-medium">{ing.price.toFixed(2)} lei</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-slate-800 mb-3">Mod de preparare</h3>
                <ol className="space-y-3">
                  {selectedRecipe.instructions?.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                        {i + 1}
                      </span>
                      <p className="text-slate-600 pt-0.5">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>

              {selectedRecipe.tips && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <h4 className="font-medium text-amber-800 mb-1">Sfat util</h4>
                  <p className="text-amber-700 text-sm">{selectedRecipe.tips}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <footer className="bg-slate-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h3 className="text-lg font-semibold mb-2">Chef Anti-Inflație</h3>
          <p className="text-slate-400 text-sm">
            Rețete generate automat din ofertele reale din supermarketuri
          </p>
          <p className="text-slate-500 text-xs mt-4">
            Prețuri actualizate zilnic • Momentan: Lidl România • În curând: Kaufland, Carrefour, Mega Image
          </p>
        </div>
      </footer>
    </main>
  )
}

function RecipeCard({ recipe, imageUrl, onClick }: { recipe: Recipe; imageUrl: string; onClick: () => void }) {
  return (
    <div 
      onClick={onClick} 
      className="bg-white rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-lg border border-slate-100 group"
    >
      <div className="relative h-44 bg-slate-200 overflow-hidden">
        <img 
          src={imageUrl} 
          alt={recipe.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <h3 className="font-semibold text-lg leading-tight">{recipe.name}</h3>
        </div>
      </div>
      <div className="p-4">
        <p className="text-slate-500 text-sm mb-4 line-clamp-2">{recipe.description}</p>
        
        <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {recipe.prep_time}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {recipe.servings} porții
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
            </svg>
            {recipe.nutrition?.calories} kcal
          </span>
        </div>
        
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div>
            <span className="text-2xl font-bold text-emerald-600">{recipe.estimated_cost?.toFixed(0) || 0} lei</span>
            {recipe.cost_per_serving && (
              <span className="text-slate-400 text-sm ml-2">({recipe.cost_per_serving.toFixed(2)}/porție)</span>
            )}
          </div>
          <span className="text-emerald-600 font-medium text-sm">Vezi rețeta →</span>
        </div>
      </div>
    </div>
  )
}
