import { useEffect, useState } from 'react';
import { AlertTriangle, Package, BookOpen, DollarSign, TrendingUp } from 'lucide-react';
import { getIngredients, getRecipes, getCurrentPrice, calcRecipeCost } from '../store';
import type { Ingredient, Recipe } from '../types';
import { formatCurrency } from '../utils';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    setIngredients(getIngredients());
    setRecipes(getRecipes());
  }, []);

  const lowStock = ingredients.filter((i) => i.currentStock > 0 && i.currentStock <= i.lowStockThreshold);
  const outOfStock = ingredients.filter((i) => i.currentStock === 0);
  const totalIngredients = ingredients.length;
  const totalRecipes = recipes.length;

  // Inventory value estimate
  const inventoryValue = ingredients.reduce((total, ing) => {
    const price = getCurrentPrice(ing);
    if (price == null) return total;
    return total + price * ing.currentStock;
  }, 0);

  // Most recent price changes
  const priceChanges = ingredients
    .filter((i) => i.priceHistory.length >= 2)
    .map((i) => {
      const sorted = [...i.priceHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const diff = sorted[0].price - sorted[1].price;
      const pct = (diff / sorted[1].price) * 100;
      return { ing: i, current: sorted[0].price, prev: sorted[1].price, diff, pct, date: sorted[0].date };
    })
    .sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct))
    .slice(0, 5);

  // Recipe costs
  const recipeCosts = recipes
    .map((r) => ({ recipe: r, cost: calcRecipeCost(r, ingredients) }))
    .filter((rc) => rc.cost > 0)
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 5);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-[#3d2b1f]">Dashboard</h2>
        <p className="text-sm text-gray-500">Overview of your soap studio</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<Package className="w-5 h-5 text-[#d4956a]" />} label="Ingredients" value={totalIngredients.toString()} sub={`${outOfStock.length} out of stock`} />
        <StatCard icon={<BookOpen className="w-5 h-5 text-[#d4956a]" />} label="Recipes" value={totalRecipes.toString()} sub="saved" />
        <StatCard icon={<DollarSign className="w-5 h-5 text-[#d4956a]" />} label="Inventory Value" value={formatCurrency(inventoryValue)} sub="at current prices" />
        <StatCard icon={<AlertTriangle className="w-5 h-5 text-amber-500" />} label="Alerts" value={(lowStock.length + outOfStock.length).toString()} sub={`${outOfStock.length} out · ${lowStock.length} low`} warn={lowStock.length + outOfStock.length > 0} />
      </div>

      {/* Alerts */}
      {(outOfStock.length > 0 || lowStock.length > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="font-semibold text-amber-800 text-sm">Stock Alerts</h3>
          </div>
          {outOfStock.length > 0 && (
            <div className="mb-2">
              <p className="text-xs font-medium text-red-700 mb-1">Out of stock:</p>
              <div className="flex flex-wrap gap-1">
                {outOfStock.map((i) => <span key={i.id} className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{i.name}</span>)}
              </div>
            </div>
          )}
          {lowStock.length > 0 && (
            <div>
              <p className="text-xs font-medium text-amber-700 mb-1">Low stock:</p>
              <div className="flex flex-wrap gap-1">
                {lowStock.map((i) => <span key={i.id} className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{i.name} ({i.currentStock} {i.unit})</span>)}
              </div>
            </div>
          )}
          <Link to="/ingredients" className="mt-3 inline-block text-xs text-amber-700 underline font-medium">Manage inventory →</Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Price changes */}
        <div className="bg-white rounded-xl border border-[#e8d5c4] p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-[#3d2b1f] text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[#d4956a]" /> Recent Price Changes</h3>
            <Link to="/ingredients" className="text-xs text-[#5c3d2e] hover:underline">View all →</Link>
          </div>
          {priceChanges.length === 0 ? (
            <p className="text-sm text-gray-400">Add price history to ingredients to see changes here.</p>
          ) : (
            <div className="space-y-2">
              {priceChanges.map(({ ing, current, diff, pct, date }) => (
                <div key={ing.id} className="flex items-center gap-2 text-sm">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-gray-700">{ing.name}</span>
                    <span className="text-gray-400 text-xs ml-2">{new Date(date).toLocaleDateString()}</span>
                  </div>
                  <span className="text-[#3d2b1f] font-medium">${current.toFixed(3)}/{ing.unit}</span>
                  <span className={`text-xs font-semibold ${diff > 0 ? 'text-red-500' : 'text-green-600'}`}>
                    {diff > 0 ? '+' : ''}{pct.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recipe costs */}
        <div className="bg-white rounded-xl border border-[#e8d5c4] p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-[#3d2b1f] text-sm flex items-center gap-2"><BookOpen className="w-4 h-4 text-[#d4956a]" /> Recipe Costs</h3>
            <Link to="/recipes" className="text-xs text-[#5c3d2e] hover:underline">View all →</Link>
          </div>
          {recipeCosts.length === 0 ? (
            <p className="text-sm text-gray-400">{recipes.length === 0 ? 'No recipes yet.' : 'Add ingredient prices to calculate recipe costs.'}</p>
          ) : (
            <div className="space-y-2">
              {recipeCosts.map(({ recipe, cost }) => {
                const costPerBar = recipe.barsPerBatch && recipe.barsPerBatch > 0 ? cost / recipe.barsPerBatch : null;
                return (
                  <div key={recipe.id} className="flex items-center gap-2 text-sm">
                    <span className="flex-1 font-medium text-gray-700 truncate">{recipe.name}</span>
                    <span className="text-[#3d2b1f] font-medium">{formatCurrency(cost)}</span>
                    {costPerBar != null && <span className="text-gray-500 text-xs">{formatCurrency(costPerBar)}/bar</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Getting started */}
      {totalIngredients === 0 && totalRecipes === 0 && (
        <div className="bg-white rounded-xl border border-[#e8d5c4] p-6 text-center shadow-sm">
          <div className="text-4xl mb-3">🧼</div>
          <h3 className="font-bold text-[#3d2b1f] mb-1">Welcome to Soap Studio!</h3>
          <p className="text-sm text-gray-500 mb-4">Start by adding your ingredients and their prices, then build recipes and calculate costs.</p>
          <div className="flex gap-3 justify-center">
            <Link to="/ingredients" className="bg-[#3d2b1f] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#5c3d2e]">Add Ingredients</Link>
            <Link to="/recipes" className="border border-[#e8d5c4] text-[#5c3d2e] px-4 py-2 rounded-lg text-sm hover:bg-[#f8f5f2]">Create Recipe</Link>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub, warn }: { icon: React.ReactNode; label: string; value: string; sub: string; warn?: boolean }) {
  return (
    <div className={`bg-white rounded-xl border p-4 shadow-sm ${warn ? 'border-amber-200' : 'border-[#e8d5c4]'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold text-[#3d2b1f]">{value}</div>
      <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
    </div>
  );
}
