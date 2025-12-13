'use client'

import { useState, useEffect } from 'react'

interface Offer {
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
  servings: number
  estimated_cost: number
  ingredients: string[]
  instructions: string[]
  image_url: string
  nutrition: {
    calories: number
    protein: string
    carbs: string
    fat: string
  }
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http:

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-xl text-gray-600">Se încarcă ofertele...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Eroare!</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchDashboard}
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Încearcă din nou
          </button>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      <header className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl font-bold mb-2 text-center">👨‍🍳 Chef Anti-Inflație</h1>
          <p className="text-center text-green-100 text-lg">
            Gătește inteligent cu oferte de la supermarketuri
          </p>
          
          {data?.stats && (
            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
                <p className="text-3xl font-bold">{data.stats.total_offers}</p>
                <p className="text-sm text-green-100">Oferte active</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
                <p className="text-3xl font-bold">{data.stats.total_potential_savings} RON</p>
                <p className="text-sm text-green-100">Economii posibile</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
                <p className="text-3xl font-bold">{data.stats.total_recipes}</p>
                <p className="text-sm text-green-100">Rețete generate</p>
              </div>
            </div>
          )}
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-4xl font-bold text-gray-800 mb-2">🛒 Ofertele Săptămânii</h2>
        <p className="text-gray-600 mb-8">Produse la prețuri reduse din magazinele tale preferate</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {data?.offers.map((offer, index) => (
            <div 
              key={index} 
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
            >
              <div className="relative h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
                <img 
                  src={offer.image_url} 
                  alt={offer.name}
                  className="w-full h-full object-cover"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
                <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">
                  -{offer.discount_percentage}%
                </div>
              </div>
              
              <div className="p-4">
                <p className="text-xs text-gray-500 font-medium">{offer.store}</p>
                <h3 className="font-bold text-gray-800 text-sm mt-1 line-clamp-2">
                  {offer.name}
                </h3>
                <p className="text-xs text-gray-500 mt-1">{offer.category}</p>
                
                <div className="flex items-end gap-2 mt-3">
                  <span className="text-2xl font-bold text-green-600">
                    {offer.new_price.toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-400 line-through">
                    {offer.old_price.toFixed(2)}
                  </span>
                </div>
                
                <p className="text-xs text-green-600 font-semibold mt-2">
                  💰 Economisești {(offer.old_price - offer.new_price).toFixed(2)} RON
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-green-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-gray-800 mb-2">✨ Meniu Anti-Inflație</h2>
          <p className="text-gray-600 mb-8">Rețete generate de AI bazate pe ingredientele la reducere</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data?.recipes.map((recipe) => (
              <div 
                key={recipe.id} 
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 overflow-hidden"
              >
                <div className="bg-green-500 text-white p-4">
                  <h3 className="text-lg font-bold">{recipe.name}</h3>
                  <p className="text-sm text-green-100 mt-1">{recipe.description}</p>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span>⏱️ {recipe.prep_time}</span>
                    <span>👥 {recipe.servings} porții</span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="bg-green-50 rounded p-3 mb-4">
                    <p className="text-sm text-gray-600">Cost estimat</p>
                    <p className="text-2xl font-bold text-green-600">{recipe.estimated_cost?.toFixed(2) || '0'} RON</p>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-bold text-gray-800 text-sm mb-2">Ingrediente:</h4>
                    <ul className="text-sm space-y-1">
                      {recipe.ingredients?.slice(0, 4).map((ing, i) => (
                        <li key={i} className="text-gray-600">• {ing}</li>
                      ))}
                      {recipe.ingredients?.length > 4 && (
                        <li className="text-gray-500 font-semibold">+{recipe.ingredients.length - 4} mai mult</li>
                      )}
                    </ul>
                  </div>

                  <button 
                    onClick={() => setSelectedRecipe(recipe)}
                    className="w-full py-2 bg-green-500 text-white rounded hover:bg-green-600 font-semibold text-sm"
                  >
                    Vezi rețeta completă
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {selectedRecipe && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedRecipe(null)}
        >
          <div 
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-green-500 text-white p-6 sticky top-0">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">{selectedRecipe.name}</h2>
                  <p className="text-sm text-green-100 mt-1">{selectedRecipe.description}</p>
                </div>
                <button 
                  onClick={() => setSelectedRecipe(null)}
                  className="text-2xl hover:opacity-80"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-green-50 rounded p-4 mb-6">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Cost estimat</p>
                    <p className="text-2xl font-bold text-green-600">{selectedRecipe.estimated_cost?.toFixed(2) || '0'} RON</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">🔥 {selectedRecipe.nutrition?.calories} kcal</p>
                    <p className="text-sm">💪 {selectedRecipe.nutrition?.protein}</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-bold text-lg text-gray-800 mb-3">Ingrediente</h3>
                <ul className="space-y-2">
                  {selectedRecipe.ingredients?.map((ing, i) => (
                    <li key={i} className="text-gray-700 bg-gray-50 p-2 rounded">
                      ✓ {ing}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-lg text-gray-800 mb-3">Mod de preparare</h3>
                <ol className="space-y-3">
                  {selectedRecipe.instructions?.map((pas, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {i + 1}
                      </span>
                      <p className="text-gray-700">{pas}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-gray-800 text-white py-6 px-4 text-center">
        <p className="font-semibold">👨‍🍳 Chef Anti-Inflație 🇷🇴</p>
        <p className="text-gray-400 text-sm mt-1">Gătește inteligent, economisește mult!</p>
      </footer>
    </main>
  )
}
