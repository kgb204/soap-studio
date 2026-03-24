import { useState, useEffect } from 'react';
import { Plus, ChevronDown, ChevronUp, Trash2, Edit2, TrendingUp, AlertTriangle } from 'lucide-react';
import type { Ingredient, IngredientCategory, Unit, PriceEntry } from '../types';
import { getIngredients, createIngredient, updateIngredient, deleteIngredient, addPrice, deletePrice, getCurrentPrice } from '../api';
import { nanoid } from '../utils';

const CATEGORIES: IngredientCategory[] = ['oil', 'butter', 'lye', 'liquid', 'fragrance', 'colorant', 'additive', 'packaging', 'other'];
const UNITS: Unit[] = ['oz', 'lb', 'g', 'kg', 'ml', 'L', 'each'];

const CATEGORY_COLORS: Record<IngredientCategory, string> = {
  oil: 'bg-amber-100 text-amber-800',
  butter: 'bg-yellow-100 text-yellow-800',
  lye: 'bg-red-100 text-red-800',
  liquid: 'bg-blue-100 text-blue-800',
  fragrance: 'bg-purple-100 text-purple-800',
  colorant: 'bg-pink-100 text-pink-800',
  additive: 'bg-green-100 text-green-800',
  packaging: 'bg-gray-100 text-gray-800',
  other: 'bg-slate-100 text-slate-800',
};

const emptyForm = (): Omit<Ingredient, 'id' | 'priceHistory' | 'createdAt'> => ({
  name: '',
  category: 'oil',
  unit: 'oz',
  currentStock: 0,
  lowStockThreshold: 16,
  notes: '',
});

export default function Ingredients() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [priceForm, setPriceForm] = useState({ price: '', supplier: '', notes: '', date: new Date().toISOString().slice(0, 10) });
  const [addingPriceFor, setAddingPriceFor] = useState<string | null>(null);
  const [filter, setFilter] = useState<IngredientCategory | 'all'>('all');
  const [search, setSearch] = useState('');

  const refresh = () => getIngredients().then(setIngredients);
  useEffect(() => { refresh(); }, []);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    if (editingId) {
      const existing = ingredients.find((i) => i.id === editingId)!;
      await updateIngredient({ ...existing, ...form });
    } else {
      await createIngredient({ ...form, id: nanoid(), priceHistory: [], createdAt: new Date().toISOString() });
    }
    setForm(emptyForm());
    setShowForm(false);
    setEditingId(null);
    refresh();
  };

  const handleEdit = (ing: Ingredient) => {
    setForm({ name: ing.name, category: ing.category, unit: ing.unit, currentStock: ing.currentStock, lowStockThreshold: ing.lowStockThreshold, notes: ing.notes ?? '' });
    setEditingId(ing.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this ingredient?')) return;
    await deleteIngredient(id);
    refresh();
  };

  const handleAddPrice = async (ingId: string) => {
    const price = parseFloat(priceForm.price);
    if (isNaN(price) || price <= 0) return;
    const entry: PriceEntry = { id: nanoid(), date: priceForm.date, price, supplier: priceForm.supplier, notes: priceForm.notes };
    await addPrice(ingId, entry);
    setPriceForm({ price: '', supplier: '', notes: '', date: new Date().toISOString().slice(0, 10) });
    setAddingPriceFor(null);
    refresh();
  };

  const handleDeletePrice = async (ingId: string, priceId: string) => {
    await deletePrice(ingId, priceId);
    refresh();
  };

  const filtered = ingredients
    .filter((i) => filter === 'all' || i.category === filter)
    .filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));

  const lowStock = ingredients.filter((i) => i.currentStock > 0 && i.currentStock <= i.lowStockThreshold);
  const outOfStock = ingredients.filter((i) => i.currentStock === 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#3d2b1f]">Ingredients</h2>
          <p className="text-sm text-gray-500">{ingredients.length} total · {outOfStock.length} out of stock · {lowStock.length} low</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm()); }}
          className="flex items-center gap-2 bg-[#3d2b1f] text-white px-4 py-2 rounded-lg hover:bg-[#5c3d2e] transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Ingredient
        </button>
      </div>

      {(lowStock.length > 0 || outOfStock.length > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm text-amber-800">
            {outOfStock.length > 0 && <span className="font-medium">Out of stock: {outOfStock.map((i) => i.name).join(', ')}. </span>}
            {lowStock.length > 0 && <span>Low stock: {lowStock.map((i) => i.name).join(', ')}.</span>}
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl border border-[#e8d5c4] p-5 shadow-sm">
          <h3 className="font-semibold text-[#3d2b1f] mb-4">{editingId ? 'Edit Ingredient' : 'New Ingredient'}</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d4956a]" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Coconut Oil" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d4956a]" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as IngredientCategory })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d4956a]" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value as Unit })}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Current Stock</label>
              <input type="number" min="0" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d4956a]" value={form.currentStock} onChange={(e) => setForm({ ...form, currentStock: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Low Stock Alert At</label>
              <input type="number" min="0" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d4956a]" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="col-span-2 sm:col-span-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d4956a]" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} className="bg-[#3d2b1f] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#5c3d2e]">Save</button>
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <input className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#d4956a] w-48" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === 'all' ? 'bg-[#3d2b1f] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>All</button>
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setFilter(c)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === c ? 'bg-[#3d2b1f] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-[#e8d5c4] p-8 text-center text-gray-400">
            {ingredients.length === 0 ? 'Add your first ingredient to get started.' : 'No ingredients match your filter.'}
          </div>
        )}
        {filtered.map((ing) => {
          const currentPrice = getCurrentPrice(ing);
          const isLow = ing.currentStock > 0 && ing.currentStock <= ing.lowStockThreshold;
          const isOut = ing.currentStock === 0;
          const isExpanded = expandedId === ing.id;
          const sortedHistory = [...ing.priceHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          return (
            <div key={ing.id} className="bg-white rounded-xl border border-[#e8d5c4] shadow-sm">
              <div className="flex items-center gap-3 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[#3d2b1f]">{ing.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[ing.category]}`}>{ing.category}</span>
                    {isOut && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Out of stock</span>}
                    {isLow && !isOut && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Low stock</span>}
                  </div>
                  <div className="flex gap-4 mt-1 text-sm text-gray-500 flex-wrap">
                    <span>Stock: <span className={`font-medium ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-gray-700'}`}>{ing.currentStock} {ing.unit}</span></span>
                    <span>Price: <span className="font-medium text-gray-700">{currentPrice != null ? `$${currentPrice.toFixed(3)}/${ing.unit}` : '—'}</span></span>
                    {sortedHistory.length > 1 && (() => {
                      const diff = currentPrice! - sortedHistory[1].price;
                      return diff !== 0 ? (
                        <span className={`flex items-center gap-0.5 font-medium ${diff > 0 ? 'text-red-500' : 'text-green-600'}`}>
                          <TrendingUp className="w-3 h-3" />{diff > 0 ? '+' : ''}{diff.toFixed(3)} vs prev
                        </span>
                      ) : null;
                    })()}
                    {ing.notes && <span className="text-gray-400 italic truncate max-w-xs">{ing.notes}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setAddingPriceFor(addingPriceFor === ing.id ? null : ing.id); setExpandedId(ing.id); }} className="text-xs px-2 py-1 rounded-lg bg-[#f8f5f2] border border-[#e8d5c4] text-[#5c3d2e] hover:bg-[#e8d5c4]">+ Price</button>
                  <button onClick={() => handleEdit(ing)} className="p-1.5 rounded-lg text-gray-400 hover:text-[#3d2b1f] hover:bg-gray-50"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(ing.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                  <button onClick={() => setExpandedId(isExpanded ? null : ing.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-[#f0e4d8] px-4 pb-4">
                  {addingPriceFor === ing.id && (
                    <div className="mt-3 bg-[#f8f5f2] rounded-lg p-3">
                      <p className="text-xs font-semibold text-gray-600 mb-2">Record New Price</p>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <div>
                          <label className="text-xs text-gray-500">Date</label>
                          <input type="date" className="w-full border border-gray-200 rounded px-2 py-1 text-sm" value={priceForm.date} onChange={(e) => setPriceForm({ ...priceForm, date: e.target.value })} />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Price per {ing.unit} ($)</label>
                          <input type="number" step="0.001" min="0" className="w-full border border-gray-200 rounded px-2 py-1 text-sm" value={priceForm.price} onChange={(e) => setPriceForm({ ...priceForm, price: e.target.value })} placeholder="0.00" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Supplier</label>
                          <input className="w-full border border-gray-200 rounded px-2 py-1 text-sm" value={priceForm.supplier} onChange={(e) => setPriceForm({ ...priceForm, supplier: e.target.value })} placeholder="Optional" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Notes</label>
                          <input className="w-full border border-gray-200 rounded px-2 py-1 text-sm" value={priceForm.notes} onChange={(e) => setPriceForm({ ...priceForm, notes: e.target.value })} placeholder="Optional" />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => handleAddPrice(ing.id)} className="bg-[#3d2b1f] text-white px-3 py-1 rounded text-xs hover:bg-[#5c3d2e]">Save Price</button>
                        <button onClick={() => setAddingPriceFor(null)} className="border border-gray-200 px-3 py-1 rounded text-xs text-gray-600 hover:bg-gray-50">Cancel</button>
                      </div>
                    </div>
                  )}
                  {sortedHistory.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-gray-600 mb-2">Price History</p>
                      <div className="space-y-1">
                        {sortedHistory.map((p, idx) => (
                          <div key={p.id} className="flex items-center gap-3 text-sm">
                            <span className="text-gray-400 text-xs w-24 shrink-0">{new Date(p.date).toLocaleDateString()}</span>
                            <span className="font-semibold text-[#3d2b1f]">${p.price.toFixed(3)}/{ing.unit}</span>
                            {idx === 0 && <span className="text-xs bg-green-100 text-green-700 px-1.5 rounded">current</span>}
                            {p.supplier && <span className="text-gray-500 text-xs">{p.supplier}</span>}
                            {p.notes && <span className="text-gray-400 text-xs italic">{p.notes}</span>}
                            <button onClick={() => handleDeletePrice(ing.id, p.id)} className="ml-auto text-gray-300 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {sortedHistory.length === 0 && !addingPriceFor && (
                    <p className="text-xs text-gray-400 mt-3">No price entries yet. Click "+ Price" to add one.</p>
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
