import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import type { Recipe, RecipeIngredient, Unit, Ingredient } from '../types';
import { getRecipes, createRecipe, updateRecipe, deleteRecipe, getIngredients, getCurrentPrice, calcRecipeCost } from '../api';
import { nanoid, formatCurrency } from '../utils';

const UNITS: Unit[] = ['oz', 'lb', 'g', 'kg', 'ml', 'L', 'each'];

const emptyRecipe = (): Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'> => ({
  name: '',
  description: '',
  batchSize: 0,
  batchUnit: 'oz',
  barsPerBatch: undefined,
  ingredients: [],
  instructions: '',
  notes: '',
});

export default function Recipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyRecipe());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const refresh = () => Promise.all([getRecipes(), getIngredients()]).then(([r, i]) => { setRecipes(r); setIngredients(i); });
  useEffect(() => { refresh(); }, []);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const now = new Date().toISOString();
    if (editingId) {
      const existing = recipes.find((r) => r.id === editingId)!;
      await updateRecipe({ ...existing, ...form, updatedAt: now });
    } else {
      await createRecipe({ ...form, id: nanoid(), createdAt: now, updatedAt: now });
    }
    setForm(emptyRecipe());
    setShowForm(false);
    setEditingId(null);
    refresh();
  };

  const handleEdit = (recipe: Recipe) => {
    setForm({
      name: recipe.name,
      description: recipe.description ?? '',
      batchSize: recipe.batchSize,
      batchUnit: recipe.batchUnit,
      barsPerBatch: recipe.barsPerBatch,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions ?? '',
      notes: recipe.notes ?? '',
    });
    setEditingId(recipe.id);
    setShowForm(true);
    setExpandedId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this recipe?')) return;
    await deleteRecipe(id);
    refresh();
  };

  const addIngredientLine = () => {
    setForm((f) => ({ ...f, ingredients: [...f.ingredients, { ingredientId: '', amount: 0, unit: 'oz' }] }));
  };

  const updateIngredientLine = (idx: number, patch: Partial<RecipeIngredient>) => {
    setForm((f) => {
      const updated = [...f.ingredients];
      updated[idx] = { ...updated[idx], ...patch };
      return { ...f, ingredients: updated };
    });
  };

  const removeIngredientLine = (idx: number) => {
    setForm((f) => ({ ...f, ingredients: f.ingredients.filter((_, i) => i !== idx) }));
  };

  const filtered = recipes.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#3d2b1f]">Recipes</h2>
          <p className="text-sm text-gray-500">{recipes.length} saved recipes</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyRecipe()); }}
          className="flex items-center gap-2 bg-[#3d2b1f] text-white px-4 py-2 rounded-lg hover:bg-[#5c3d2e] transition-colors"
        >
          <Plus className="w-4 h-4" /> New Recipe
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-[#e8d5c4] p-5 shadow-sm">
          <h3 className="font-semibold text-[#3d2b1f] mb-4">{editingId ? 'Edit Recipe' : 'New Recipe'}</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Recipe Name *</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d4956a]" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Lavender Oatmeal Bar" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Batch Size</label>
              <input type="number" min="0" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d4956a]" value={form.batchSize} onChange={(e) => setForm({ ...form, batchSize: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Batch Unit</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d4956a]" value={form.batchUnit} onChange={(e) => setForm({ ...form, batchUnit: e.target.value as Unit })}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Bars per Batch</label>
              <input type="number" min="0" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d4956a]" value={form.barsPerBatch ?? ''} onChange={(e) => setForm({ ...form, barsPerBatch: e.target.value ? parseInt(e.target.value) : undefined })} placeholder="Optional" />
            </div>
            <div className="col-span-2 sm:col-span-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d4956a]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-600">Ingredients</label>
              <button onClick={addIngredientLine} className="text-xs text-[#5c3d2e] hover:text-[#3d2b1f] font-medium flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
            </div>
            {form.ingredients.length === 0 && <p className="text-xs text-gray-400 italic">No ingredients added yet.</p>}
            <div className="space-y-2">
              {form.ingredients.map((ri, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <select className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-[#d4956a]" value={ri.ingredientId} onChange={(e) => updateIngredientLine(idx, { ingredientId: e.target.value })}>
                    <option value="">-- Select ingredient --</option>
                    {ingredients.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                  </select>
                  <input type="number" min="0" step="0.01" className="w-24 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-[#d4956a]" value={ri.amount} onChange={(e) => updateIngredientLine(idx, { amount: parseFloat(e.target.value) || 0 })} placeholder="Amount" />
                  <select className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-[#d4956a]" value={ri.unit} onChange={(e) => updateIngredientLine(idx, { unit: e.target.value as Unit })}>
                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <button onClick={() => removeIngredientLine(idx)} className="text-gray-300 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Instructions</label>
            <textarea rows={4} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d4956a] resize-none" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} placeholder="Step-by-step instructions..." />
          </div>
          <div className="mt-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d4956a]" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" />
          </div>

          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} className="bg-[#3d2b1f] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#5c3d2e]">Save Recipe</button>
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      <input className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#d4956a] w-56" placeholder="Search recipes..." value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-[#e8d5c4] p-8 text-center text-gray-400">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            {recipes.length === 0 ? 'No recipes yet. Create your first recipe!' : 'No recipes match your search.'}
          </div>
        )}
        {filtered.map((recipe) => {
          const cost = calcRecipeCost(recipe.ingredients, ingredients);
          const costPerBar = recipe.barsPerBatch && recipe.barsPerBatch > 0 ? cost / recipe.barsPerBatch : null;
          const isExpanded = expandedId === recipe.id;

          return (
            <div key={recipe.id} className="bg-white rounded-xl border border-[#e8d5c4] shadow-sm">
              <div className="flex items-center gap-3 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[#3d2b1f]">{recipe.name}</span>
                    {recipe.batchSize > 0 && <span className="text-xs text-gray-500">{recipe.batchSize} {recipe.batchUnit} batch</span>}
                    {recipe.barsPerBatch && <span className="text-xs text-gray-500">· {recipe.barsPerBatch} bars</span>}
                  </div>
                  <div className="flex gap-4 mt-1 text-sm text-gray-500 flex-wrap">
                    <span>{recipe.ingredients.length} ingredient{recipe.ingredients.length !== 1 ? 's' : ''}</span>
                    {cost > 0 && <span>Batch cost: <span className="font-medium text-[#3d2b1f]">{formatCurrency(cost)}</span></span>}
                    {costPerBar != null && <span>Per bar: <span className="font-medium text-[#3d2b1f]">{formatCurrency(costPerBar)}</span></span>}
                    {recipe.description && <span className="text-gray-400 italic truncate max-w-xs">{recipe.description}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleEdit(recipe)} className="p-1.5 rounded-lg text-gray-400 hover:text-[#3d2b1f] hover:bg-gray-50"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(recipe.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                  <button onClick={() => setExpandedId(isExpanded ? null : recipe.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-[#f0e4d8] px-4 pb-4 pt-3 space-y-3">
                  {recipe.ingredients.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-2">Ingredients</p>
                      <div className="space-y-1">
                        {recipe.ingredients.map((ri, idx) => {
                          const ing = ingredients.find((i) => i.id === ri.ingredientId);
                          const price = ing ? getCurrentPrice(ing) : null;
                          const lineCost = price != null ? price * ri.amount : null;
                          return (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <span className="w-4 text-gray-300 text-xs">{idx + 1}.</span>
                              <span className="flex-1 font-medium text-gray-700">{ing?.name ?? <span className="text-red-400">Unknown</span>}</span>
                              <span className="text-gray-500">{ri.amount} {ri.unit}</span>
                              {lineCost != null && <span className="text-[#5c3d2e] font-medium w-20 text-right">{formatCurrency(lineCost)}</span>}
                            </div>
                          );
                        })}
                        {cost > 0 && (
                          <div className="flex items-center gap-2 text-sm border-t border-gray-100 pt-1 mt-1">
                            <span className="flex-1 font-semibold text-gray-700">Total</span>
                            <span className="text-[#3d2b1f] font-bold w-20 text-right">{formatCurrency(cost)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {recipe.instructions && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1">Instructions</p>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{recipe.instructions}</p>
                    </div>
                  )}
                  {recipe.notes && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1">Notes</p>
                      <p className="text-sm text-gray-500 italic">{recipe.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
