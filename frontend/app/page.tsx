'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'

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
  }
  tags?: string[]
  tips?: string
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

const IMAGES = [
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600',
  'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600',
  'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=600',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600',
]

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [customRecipes, setCustomRecipes] = useState<Recipe[]>([])
  const [generating, setGenerating] = useState(false)
  const [view, setView] = useState<'home' | 'products' | 'results'>('home')
  const [category, setCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API}/api/dashboard`)
      if (!res.ok) throw new Error(`Eroare ${res.status}`)
      setData(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Eroare necunoscută')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const generateRecipes = async () => {
    if (selectedProducts.size === 0) return
    
    setGenerating(true)
    try {
      const res = await fetch(`${API}/api/recipes/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_ids: Array.from(selectedProducts) })
      })
      if (!res.ok) throw new Error()
      const result = await res.json()
      setCustomRecipes(result.recipes || [])
      setView('results')
    } catch {
      alert('Eroare la generarea rețetelor')
    } finally {
      setGenerating(false)
    }
  }

  const toggleProduct = (id: string) => {
    setSelectedProducts(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const clearSelection = () => {
    setSelectedProducts(new Set())
    setCustomRecipes([])
    setView('products')
  }

  const totals = useMemo(() => {
    if (!data?.offers) return { count: 0, price: 0, savings: 0 }
    const items = data.offers.filter(o => selectedProducts.has(o.id))
    return {
      count: items.length,
      price: items.reduce((s, o) => s + o.new_price, 0),
      savings: items.reduce((s, o) => s + (o.old_price - o.new_price), 0)
    }
  }, [data?.offers, selectedProducts])

  const filteredOffers = useMemo(() => {
    if (!data?.offers) return []
    let items = data.offers
    if (category !== 'all') items = items.filter(o => o.category === category)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      items = items.filter(o => o.name.toLowerCase().includes(q))
    }
    return items
  }, [data?.offers, category, searchQuery])

  const categories = useMemo(() => {
    if (!data?.stats.categories) return []
    return Object.entries(data.stats.categories).sort((a, b) => b[1] - a[1])
  }, [data?.stats.categories])

  const getImage = (index: number) => IMAGES[index % IMAGES.length]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Se încarcă ofertele...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-2">Eroare la încărcare</h2>
          <p className="text-slate-500 mb-4">{error}</p>
          <button onClick={fetchData} className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
            Încearcă din nou
          </button>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">Chef Anti-Inflație</h1>
                <p className="text-xs text-slate-500 hidden sm:block">Rețete din oferte reale</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <div className="hidden md:flex items-center gap-4">
                <div className="text-right">
                  <p className="font-bold text-emerald-600">{data?.stats.total_offers}</p>
                  <p className="text-xs text-slate-500">oferte</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-600">{data?.stats.total_potential_savings?.toFixed(0)} lei</p>
                  <p className="text-xs text-slate-500">economii</p>
                </div>
              </div>
            </div>
          </div>
          
          <nav className="flex gap-1 mt-3 -mb-3">
            {[
              { id: 'home', label: 'Acasă' },
              { id: 'products', label: 'Produse', badge: selectedProducts.size },
              ...(customRecipes.length ? [{ id: 'results', label: 'Rețete', badge: customRecipes.length }] : [])
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setView(tab.id as typeof view)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  view === tab.id
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
                {tab.badge ? (
                  <span className="bg-emerald-600 text-white text-xs px-1.5 py-0.5 rounded-full">{tab.badge}</span>
                ) : null}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {view === 'home' && (
        <div className="max-w-6xl mx-auto px-4 py-6">
          <section className="mb-8">
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 md:p-10 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10 max-w-xl">
                <h2 className="text-2xl md:text-3xl font-bold mb-3">Gătește mai ieftin cu produsele la ofertă</h2>
                <p className="text-emerald-100 mb-6">
                  Selectează produse din supermarket și primești instant rețete personalizate generate de AI.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setView('products')}
                    className="px-6 py-3 bg-white text-emerald-700 rounded-lg font-semibold hover:bg-emerald-50 transition-colors"
                  >
                    Selectează produse
                  </button>
                  <a href="#recipes" className="px-6 py-3 bg-white/20 rounded-lg font-semibold hover:bg-white/30 transition-colors">
                    Vezi rețetele zilei
                  </a>
                </div>
              </div>
            </div>
          </section>

          <section className="grid md:grid-cols-3 gap-4 mb-10">
            {[
              { step: '1', title: 'Verificăm ofertele', desc: 'Scanăm automat prețurile din Lidl' },
              { step: '2', title: 'Selectezi produsele', desc: 'Vezi cât economisești în timp real' },
              { step: '3', title: 'Primești rețete', desc: 'AI generează rețete personalizate' }
            ].map(item => (
              <div key={item.step} className="bg-white rounded-xl p-5 border border-slate-100">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-emerald-600 font-bold">{item.step}</span>
                </div>
                <h4 className="font-semibold text-slate-800 mb-1">{item.title}</h4>
                <p className="text-slate-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </section>

          <section id="recipes" className="mb-10">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Rețete cu reduceri mari</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data?.top_recipes?.map((r, i) => (
                <RecipeCard key={r.id} recipe={r} image={getImage(i)} onClick={() => setSelectedRecipe(r)} />
              ))}
              {!data?.top_recipes?.length && (
                <p className="col-span-3 text-center py-8 text-slate-400">Se generează rețetele...</p>
              )}
            </div>
          </section>

          <section className="mb-10">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Cele mai economice</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data?.cheapest_recipes?.map((r, i) => (
                <RecipeCard key={r.id} recipe={r} image={getImage(i + 4)} onClick={() => setSelectedRecipe(r)} />
              ))}
            </div>
          </section>

          {data?.stats.recipes_updated && (
            <p className="text-center text-slate-400 text-xs">
              Actualizat: {new Date(data.stats.recipes_updated).toLocaleString('ro-RO')}
            </p>
          )}
        </div>
      )}

      {view === 'products' && (
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold text-slate-800">Selectează produsele</h2>
                <p className="text-slate-500 text-sm">Apasă pe produse pentru a le adăuga</p>
              </div>
              
              <div className="flex items-center gap-4 bg-slate-50 rounded-lg px-4 py-2">
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-800">{totals.count}</p>
                  <p className="text-xs text-slate-500">produse</p>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div className="text-center">
                  <p className="text-lg font-bold text-emerald-600">{totals.price.toFixed(2)} lei</p>
                  <p className="text-xs text-slate-500">total</p>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div className="text-center">
                  <p className="text-lg font-bold text-orange-500">{totals.savings.toFixed(2)} lei</p>
                  <p className="text-xs text-slate-500">economii</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Caută produse..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 max-w-xs px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
            <button
              onClick={() => setCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${
                category === 'all' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              Toate ({data?.offers.length})
            </button>
            {categories.map(([cat, count]) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${
                  category === cat ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                {cat} ({count})
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredOffers.map(offer => (
              <div
                key={offer.id}
                onClick={() => toggleProduct(offer.id)}
                className={`bg-white rounded-lg overflow-hidden cursor-pointer transition-all border-2 ${
                  selectedProducts.has(offer.id)
                    ? 'border-emerald-500 shadow-md'
                    : 'border-transparent hover:shadow-sm'
                }`}
              >
                <div className="relative h-28 bg-slate-100">
                  <img src={offer.image_url} alt="" className="w-full h-full object-cover" onError={e => e.currentTarget.style.opacity = '0'} />
                  <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded">
                    -{offer.discount_percentage}%
                  </span>
                  {selectedProducts.has(offer.id) && (
                    <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                      <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-xs text-slate-400">{offer.category}</p>
                  <h3 className="text-sm font-medium text-slate-800 line-clamp-2 h-10">{offer.name}</h3>
                  <div className="flex items-baseline gap-1.5 mt-1.5">
                    <span className="text-base font-bold text-emerald-600">{offer.new_price.toFixed(2)}</span>
                    <span className="text-xs text-slate-400 line-through">{offer.old_price.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedProducts.size > 0 && (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
              <button
                onClick={generateRecipes}
                disabled={generating}
                className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold shadow-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
              >
                {generating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Se generează...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generează rețete ({totals.count} produse)
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {view === 'results' && (
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-slate-800 mb-1">Rețetele tale</h2>
            <p className="text-slate-500">Generate din {selectedProducts.size} produse selectate</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {customRecipes.map((r, i) => (
              <RecipeCard key={r.id} recipe={r} image={getImage(i + 2)} onClick={() => setSelectedRecipe(r)} />
            ))}
          </div>

          <div className="text-center mt-6">
            <button onClick={clearSelection} className="px-5 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">
              Selectează alte produse
            </button>
          </div>
        </div>
      )}

      {selectedRecipe && (
        <RecipeModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
      )}

      <footer className="bg-slate-900 text-white py-6 mt-10">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h3 className="font-semibold mb-1">Chef Anti-Inflație</h3>
          <p className="text-slate-400 text-sm">Rețete generate automat din ofertele din supermarketuri</p>
          <p className="text-slate-500 text-xs mt-3">Lidl România | Kaufland, Carrefour, Mega Image - în curând</p>
        </div>
      </footer>
    </main>
  )
}

function RecipeCard({ recipe, image, onClick }: { recipe: Recipe; image: string; onClick: () => void }) {
  return (
    <div onClick={onClick} className="bg-white rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow border border-slate-100">
      <div className="relative h-40 bg-slate-200">
        <img src={image} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <h3 className="font-semibold leading-tight">{recipe.name}</h3>
        </div>
      </div>
      <div className="p-4">
        <p className="text-slate-500 text-sm mb-3 line-clamp-2">{recipe.description}</p>
        <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
          <span>{recipe.prep_time}</span>
          <span>{recipe.servings} porții</span>
          <span>{recipe.nutrition?.calories} kcal</span>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <span className="text-xl font-bold text-emerald-600">{recipe.estimated_cost?.toFixed(0)} lei</span>
          <span className="text-emerald-600 text-sm font-medium">Vezi rețeta →</span>
        </div>
      </div>
    </div>
  )
}

function RecipeModal({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) {
  const formatIngredient = (ing: Ingredient | string) => {
    if (typeof ing === 'string') return ing
    return `${ing.name} - ${ing.quantity}`
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="relative h-48 bg-slate-200">
          <img src={recipe.image_url || IMAGES[recipe.id % IMAGES.length]} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <h2 className="text-xl font-bold">{recipe.name}</h2>
            <p className="text-white/80 text-sm">{recipe.description}</p>
          </div>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-4 gap-2 mb-5">
            <div className="bg-emerald-50 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-emerald-600">{recipe.estimated_cost?.toFixed(0)}</p>
              <p className="text-xs text-slate-500">lei</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-orange-600">{recipe.nutrition?.calories}</p>
              <p className="text-xs text-slate-500">kcal</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-blue-600">{recipe.nutrition?.protein}g</p>
              <p className="text-xs text-slate-500">proteine</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-purple-600">{recipe.servings}</p>
              <p className="text-xs text-slate-500">porții</p>
            </div>
          </div>

          <div className="mb-5">
            <h3 className="font-semibold text-slate-800 mb-2">Ingrediente</h3>
            <div className="space-y-1.5">
              {recipe.ingredients?.map((ing, i) => (
                <div key={i} className={`p-2.5 rounded-lg flex items-center justify-between ${
                  typeof ing !== 'string' && ing.from_offer ? 'bg-emerald-50' : 'bg-slate-50'
                }`}>
                  <div className="flex items-center gap-2">
                    {typeof ing !== 'string' && ing.from_offer && (
                      <span className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                    <span className="text-sm text-slate-700">{formatIngredient(ing)}</span>
                  </div>
                  {typeof ing !== 'string' && ing.price > 0 && (
                    <span className="text-sm text-emerald-600 font-medium">{ing.price.toFixed(2)} lei</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <h3 className="font-semibold text-slate-800 mb-2">Preparare</h3>
            <ol className="space-y-2">
              {recipe.instructions?.map((step, i) => (
                <li key={i} className="flex gap-2.5 text-sm">
                  <span className="w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-slate-600">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          {recipe.tips && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <h4 className="font-medium text-amber-800 text-sm mb-0.5">Sfat</h4>
              <p className="text-amber-700 text-sm">{recipe.tips}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
