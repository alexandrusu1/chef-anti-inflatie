'use client'

import { useState, useEffect } from 'react'

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
  valid_until: string
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
    protein: number | string
    carbs: number | string
    fat: number | string
    fiber?: number | string
  }
  tags?: string[]
  tips?: string
}

interface DashboardData {
  offers: Offer[]
  recipes: Recipe[]
  stats: {
    total_offers: number
    total_recipes: number
    total_potential_savings: number
    stores: string[]
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [budget, setBudget] = useState<number>(50)
  const [mealType, setMealType] = useState<string>('')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [generatingRecipes, setGeneratingRecipes] = useState(false)
  const [customRecipes, setCustomRecipes] = useState<Recipe[]>([])
  const [activeTab, setActiveTab] = useState<'offers' | 'recipes' | 'planner'>('offers')

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
      setError(err instanceof Error ? err.message : 'Eroare')
    } finally {
      setLoading(false)
    }
  }

  const generateCustomRecipes = async () => {
    try {
      setGeneratingRecipes(true)
      const params = new URLSearchParams()
      if (budget) params.append('budget', budget.toString())
      if (mealType) params.append('meal', mealType)
      
      const response = await fetch(`${API_URL}/api/suggest?${params}`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const result = await response.json()
      setCustomRecipes(result.recipes || [])
      setActiveTab('recipes')
    } catch (err) {
      console.error('Error generating recipes:', err)
    } finally {
      setGeneratingRecipes(false)
    }
  }

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const formatIngredient = (ing: Ingredient | string): string => {
    if (typeof ing === 'string') return ing
    return `${ing.name} - ${ing.quantity}${ing.from_offer ? ' ✓' : ''}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">👨‍🍳</div>
          <p className="text-xl text-gray-600 font-medium">Se încarcă ofertele...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md">
          <div className="text-6xl mb-4">😔</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops!</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={fetchDashboard}
            className="px-8 py-3 bg-green-600 text-white rounded-full hover:bg-green-700"
          >
            🔄 Încearcă din nou
          </button>
        </div>
      </div>
    )
  }

  const displayedRecipes = customRecipes.length > 0 ? customRecipes : data?.recipes || []

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white py-8 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="text-5xl">👨‍🍳</span>
            <h1 className="text-4xl md:text-5xl font-bold">Chef Anti-Inflație</h1>
          </div>
          <p className="text-center text-green-100 text-lg mb-6">
            Rețete inteligente bazate pe ofertele din supermarketuri
          </p>
          
          {data?.stats && (
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                <p className="text-3xl font-bold">{data.stats.total_offers}</p>
                <p className="text-sm text-green-100">Oferte reale</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                <p className="text-3xl font-bold">{data.stats.total_potential_savings.toFixed(0)}</p>
                <p className="text-sm text-green-100">RON economii</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                <p className="text-3xl font-bold">{displayedRecipes.length}</p>
                <p className="text-sm text-green-100">Rețete AI</p>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-2 justify-center mb-6">
          <button
            onClick={() => setActiveTab('offers')}
            className={`px-6 py-3 rounded-full font-semibold transition-all ${
              activeTab === 'offers' 
                ? 'bg-green-600 text-white shadow-lg' 
                : 'bg-white text-gray-600 hover:bg-green-50'
            }`}
          >
            🛒 Oferte ({data?.stats.total_offers || 0})
          </button>
          <button
            onClick={() => setActiveTab('recipes')}
            className={`px-6 py-3 rounded-full font-semibold transition-all ${
              activeTab === 'recipes' 
                ? 'bg-green-600 text-white shadow-lg' 
                : 'bg-white text-gray-600 hover:bg-green-50'
            }`}
          >
            ✨ Rețete ({displayedRecipes.length})
          </button>
          <button
            onClick={() => setActiveTab('planner')}
            className={`px-6 py-3 rounded-full font-semibold transition-all ${
              activeTab === 'planner' 
                ? 'bg-green-600 text-white shadow-lg' 
                : 'bg-white text-gray-600 hover:bg-green-50'
            }`}
          >
            📋 Planifică Masa
          </button>
        </div>
      </div>

      {activeTab === 'planner' && (
        <section className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">🎯 Generează Rețete Personalizate</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  💰 Buget maxim (RON)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="10"
                    max="200"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                  />
                  <span className="text-2xl font-bold text-green-600 min-w-[80px]">{budget} RON</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  🍽️ Tip masă
                </label>
                <select
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value)}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
                >
                  <option value="">Orice masă</option>
                  <option value="mic-dejun">🌅 Mic dejun</option>
                  <option value="pranz">☀️ Prânz</option>
                  <option value="cina">🌙 Cină</option>
                  <option value="gustare">🍎 Gustare</option>
                </select>
              </div>
            </div>

            <button
              onClick={generateCustomRecipes}
              disabled={generatingRecipes}
              className="mt-6 w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 shadow-lg"
            >
              {generatingRecipes ? '⏳ Se generează...' : '✨ Generează Rețete cu AI'}
            </button>
          </div>
        </section>
      )}

      {activeTab === 'offers' && (
        <section className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-800">🛒 Oferte Reale Lidl</h2>
            <p className="text-gray-600">Prețuri actualizate automat</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {data?.offers.map((offer, index) => (
              <div 
                key={offer.id || index} 
                className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all border-2 cursor-pointer ${
                  selectedProducts.includes(offer.id) 
                    ? 'border-green-500 ring-2 ring-green-200' 
                    : 'border-transparent'
                }`}
                onClick={() => offer.id && toggleProductSelection(offer.id)}
              >
                <div className="relative h-32 bg-gray-100 rounded-t-xl overflow-hidden">
                  <img 
                    src={offer.image_url} 
                    alt={offer.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                    -{offer.discount_percentage}%
                  </div>
                  {selectedProducts.includes(offer.id) && (
                    <div className="absolute top-2 left-2 bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center">✓</div>
                  )}
                </div>
                
                <div className="p-3">
                  <p className="text-xs text-green-600 font-semibold">{offer.store}</p>
                  <h3 className="font-bold text-gray-800 text-sm mt-1 line-clamp-2 h-10">{offer.name}</h3>
                  
                  <div className="flex items-end gap-2 mt-2">
                    <span className="text-xl font-bold text-green-600">{offer.new_price.toFixed(2)}</span>
                    <span className="text-xs text-gray-400 line-through">{offer.old_price.toFixed(2)}</span>
                  </div>
                  
                  <p className="text-xs text-green-600 mt-1">💰 -{(offer.old_price - offer.new_price).toFixed(2)} RON</p>
                </div>
              </div>
            ))}
          </div>

          {selectedProducts.length > 0 && (
            <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40">
              <button
                onClick={() => { setActiveTab('planner'); generateCustomRecipes() }}
                className="px-8 py-4 bg-green-600 text-white rounded-full font-bold shadow-lg hover:bg-green-700"
              >
                🍳 Generează rețete din {selectedProducts.length} produse
              </button>
            </div>
          )}
        </section>
      )}

      {activeTab === 'recipes' && (
        <section className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-800">✨ Meniu Anti-Inflație</h2>
            <p className="text-gray-600">Rețete generate de AI pe baza ofertelor reale</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedRecipes.map((recipe) => (
              <div key={recipe.id} className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden group">
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={recipe.image_url} 
                    alt={recipe.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="text-xl font-bold">{recipe.name}</h3>
                    <p className="text-sm text-white/80 line-clamp-1">{recipe.description}</p>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex gap-2 mb-4 flex-wrap">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">⏱️ {recipe.prep_time}</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">👥 {recipe.servings} porții</span>
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">🔥 {recipe.nutrition?.calories} kcal</span>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs text-gray-500">Cost total</p>
                        <p className="text-2xl font-bold text-green-600">{recipe.estimated_cost?.toFixed(2) || '0'} RON</p>
                      </div>
                      {recipe.cost_per_serving && (
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Per porție</p>
                          <p className="text-lg font-bold text-green-600">{recipe.cost_per_serving.toFixed(2)} RON</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={() => setSelectedRecipe(recipe)}
                    className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 font-semibold shadow"
                  >
                    Vezi rețeta completă →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {selectedRecipe && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setSelectedRecipe(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-56 overflow-hidden rounded-t-2xl">
              <img 
                src={selectedRecipe.image_url} 
                alt={selectedRecipe.name}
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <button 
                onClick={() => setSelectedRecipe(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30"
              >✕</button>
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <h2 className="text-3xl font-bold mb-2">{selectedRecipe.name}</h2>
                <p className="text-white/80">{selectedRecipe.description}</p>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-4 gap-3 mb-6">
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{selectedRecipe.estimated_cost?.toFixed(0) || 0}</p>
                  <p className="text-xs text-gray-600">RON</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-orange-600">{selectedRecipe.nutrition?.calories}</p>
                  <p className="text-xs text-gray-600">kcal</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{selectedRecipe.nutrition?.protein}g</p>
                  <p className="text-xs text-gray-600">Proteine</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-purple-600">{selectedRecipe.servings}</p>
                  <p className="text-xs text-gray-600">Porții</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-bold text-lg text-gray-800 mb-3">🥗 Ingrediente</h3>
                <div className="space-y-2">
                  {selectedRecipe.ingredients?.map((ing, i) => (
                    <div key={i} className={`p-3 rounded-xl flex items-center gap-3 ${
                      typeof ing !== 'string' && ing.from_offer ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                    }`}>
                      <span>{typeof ing !== 'string' && ing.from_offer ? '✅' : '○'}</span>
                      <span className="flex-1 text-gray-700">{formatIngredient(ing)}</span>
                      {typeof ing !== 'string' && ing.price > 0 && (
                        <span className="text-green-600 font-semibold">{ing.price.toFixed(2)} RON</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-bold text-lg text-gray-800 mb-3">👨‍🍳 Mod de preparare</h3>
                <ol className="space-y-4">
                  {selectedRecipe.instructions?.map((step, i) => (
                    <li key={i} className="flex gap-4">
                      <span className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">{i + 1}</span>
                      <p className="text-gray-700 pt-1">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>

              {selectedRecipe.tips && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <h4 className="font-bold text-amber-800 mb-1">💡 Sfat</h4>
                  <p className="text-amber-700">{selectedRecipe.tips}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-2xl font-bold mb-2">👨‍🍳 Chef Anti-Inflație 🇷🇴</p>
          <p className="text-gray-400">Gătește inteligent, economisește mult!</p>
        </div>
      </footer>
    </main>
  )
}
