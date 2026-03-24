import { useState, useEffect } from 'react';
import { Calculator as CalcIcon, Plus, Trash2 } from 'lucide-react';
import type { Ingredient, Unit } from '../types';
import { getIngredients, getRecipes, getCurrentPrice } from '../store';
import type { Recipe } from '../types';
import { formatCurrency } from '../utils';
import { nanoid } from '../utils';

const UNITS: Unit[] = ['oz', 'lb', 'g', 'kg', 'ml', 'L', 'each'];

interface CalcLine {
  id: string;
  ingredientId: string;
  amount: number;
  unit: Unit;
}

export default function Calculator() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [lines, setLines] = useState<CalcLine[]>([{ id: nanoid(), ingredientId: '', amount: 0, unit: 'oz' }]);
  const [selectedRecipeId, setSelectedRecipeId] = useState('');
  const [barsCount, setBarsCount] = useState<number>(0);
  const [markup, setMarkup] = useState<number>(0);
  const [laborCost, setLaborCost] = useState<number>(0);
  const [overheadCost, setOverheadCost] = useState<number>(0);

  useEffect(() => {
    setIngredients(getIngredients());
    setRecipes(getRecipes());
  }, []);

  const loadFromRecipe = (recipeId: string) => {
    setSelectedRecipeId(recipeId);
    if (!recipeId) return;
    const recipe = recipes.find((r) => r.id === recipeId);
    if (!recipe) return;
    setLines(recipe.ingredients.map((ri) => ({ id: nanoid(), ingredientId: ri.ingredientId, amount: ri.amount, unit: ri.unit })));
    setBarsCount(recipe.barsPerBatch ?? 0);
  };

  const addLine = () => setLines((l) => [...l, { id: nanoid(), ingredientId: '', amount: 0, unit: 'oz' }]);
  const removeLine = (id: string) => setLines((l) => l.filter((line) => line.id !== id));
  const updateLine = (id: string, patch: Partial<CalcLine>) => setLines((l) => l.map((line) => line.id === id ? { ...line, ...patch } : line));

  const ingredientCost = lines.reduce((total, line) => {
    const ing = ingredients.find((i) => i.id === line.ingredientId);
    if (!ing) return total;
    const price = getCurrentPrice(ing);
    if (price == null) return total;
    return total + price * line.amount;
  }, 0);

  const totalCost = ingredientCost + laborCost + overheadCost;
  const markupMultiplier = 1 + markup / 100;
  const sellingPrice = totalCost * markupMultiplier;
  const costPerBar = barsCount > 0 ? totalCost / barsCount : null;
  const pricePerBar = barsCount > 0 ? sellingPrice / barsCount : null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-[#3d2b1f]">Cost Calculator</h2>
        <p className="text-sm text-gray-500">Calculate batch cost and suggested selling prices</p>
      </div>

      {/* Load from recipe */}
      <div className="bg-white rounded-xl border border-[#e8d5c4] p-4 shadow-sm">
        <label className="block text-xs font-semibold text-gray-600 mb-1">Load from Recipe (optional)</label>
        <div className="flex gap-2">
          <select
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d4956a]"
            value={selectedRecipeId}
            onChange={(e) => loadFromRecipe(e.target.value)}
          >
            <option value="">-- Select a recipe --</option>
            {recipes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <button
            onClick={() => { setLines([{ id: nanoid(), ingredientId: '', amount: 0, unit: 'oz' }]); setSelectedRecipeId(''); setBarsCount(0); }}
            className="border border-gray-200 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Ingredients */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#e8d5c4] p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#3d2b1f] text-sm">Ingredients</h3>
            <button onClick={addLine} className="text-xs text-[#5c3d2e] hover:text-[#3d2b1f] font-medium flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
          </div>

          <div className="space-y-2">
            {lines.map((line) => {
              const ing = ingredients.find((i) => i.id === line.ingredientId);
              const price = ing ? getCurrentPrice(ing) : null;
              const lineCost = price != null ? price * line.amount : null;
              return (
                <div key={line.id} className="flex gap-2 items-center">
                  <select
                    className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-[#d4956a]"
                    value={line.ingredientId}
                    onChange={(e) => updateLine(line.id, { ingredientId: e.target.value })}
                  >
                    <option value="">-- Select --</option>
                    {ingredients.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                  </select>
                  <input
                    type="number" min="0" step="0.01"
                    className="w-24 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-[#d4956a]"
                    value={line.amount || ''}
                    onChange={(e) => updateLine(line.id, { amount: parseFloat(e.target.value) || 0 })}
                    placeholder="Amt"
                  />
                  <select
                    className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-[#d4956a]"
                    value={line.unit}
                    onChange={(e) => updateLine(line.id, { unit: e.target.value as Unit })}
                  >
                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <div className="w-20 text-right text-sm font-medium text-[#5c3d2e]">
                    {lineCost != null ? formatCurrency(lineCost) : price == null && line.ingredientId ? <span className="text-xs text-gray-400">no price</span> : ''}
                  </div>
                  <button onClick={() => removeLine(line.id)} className="text-gray-300 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              );
            })}
          </div>

          <div className="border-t border-gray-100 pt-2 flex justify-between text-sm">
            <span className="text-gray-600">Ingredient cost</span>
            <span className="font-semibold text-[#3d2b1f]">{formatCurrency(ingredientCost)}</span>
          </div>

          {/* Extra costs */}
          <div className="border-t border-gray-100 pt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Labor cost ($)</label>
              <input type="number" min="0" step="0.01" className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-[#d4956a]" value={laborCost || ''} onChange={(e) => setLaborCost(parseFloat(e.target.value) || 0)} placeholder="0.00" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Overhead/packaging ($)</label>
              <input type="number" min="0" step="0.01" className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-[#d4956a]" value={overheadCost || ''} onChange={(e) => setOverheadCost(parseFloat(e.target.value) || 0)} placeholder="0.00" />
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-3">
          <div className="bg-[#3d2b1f] text-white rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <CalcIcon className="w-4 h-4 text-[#d4956a]" />
              <h3 className="font-semibold text-sm">Batch Summary</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#c4a882]">Ingredients</span>
                <span>{formatCurrency(ingredientCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c4a882]">Labor</span>
                <span>{formatCurrency(laborCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c4a882]">Overhead</span>
                <span>{formatCurrency(overheadCost)}</span>
              </div>
              <div className="flex justify-between border-t border-[#5c3d2e] pt-2 font-bold">
                <span>Total Cost</span>
                <span className="text-[#d4956a] text-base">{formatCurrency(totalCost)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#e8d5c4] p-4 shadow-sm space-y-3">
            <h3 className="font-semibold text-[#3d2b1f] text-sm">Pricing</h3>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Number of bars</label>
              <input type="number" min="0" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d4956a]" value={barsCount || ''} onChange={(e) => setBarsCount(parseInt(e.target.value) || 0)} placeholder="e.g. 12" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Markup %</label>
              <input type="number" min="0" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d4956a]" value={markup || ''} onChange={(e) => setMarkup(parseFloat(e.target.value) || 0)} placeholder="e.g. 200" />
            </div>

            {(costPerBar != null || pricePerBar != null) && (
              <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
                {costPerBar != null && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cost per bar</span>
                    <span className="font-semibold text-[#3d2b1f]">{formatCurrency(costPerBar)}</span>
                  </div>
                )}
                {markup > 0 && pricePerBar != null && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Suggested price</span>
                    <span className="font-bold text-green-700 text-base">{formatCurrency(pricePerBar)}</span>
                  </div>
                )}
                {markup > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Batch revenue</span>
                    <span className="font-semibold text-green-700">{formatCurrency(sellingPrice)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
