import { Router } from 'express';
import db from '../db.js';

const router = Router();

function getIngredientWithPrices(id: string) {
  const ing = db.prepare('SELECT * FROM ingredients WHERE id = ?').get(id) as any;
  if (!ing) return null;
  const prices = db.prepare('SELECT * FROM price_history WHERE ingredient_id = ? ORDER BY date DESC').all(id) as any[];
  return toIngredient(ing, prices);
}

function toIngredient(row: any, prices: any[]) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    unit: row.unit,
    currentStock: row.current_stock,
    lowStockThreshold: row.low_stock_threshold,
    notes: row.notes ?? '',
    createdAt: row.created_at,
    priceHistory: prices.map((p) => ({
      id: p.id,
      date: p.date,
      price: p.price,
      supplier: p.supplier ?? '',
      notes: p.notes ?? '',
    })),
  };
}

// GET all ingredients
router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM ingredients ORDER BY name').all() as any[];
  const ingredients = rows.map((row) => {
    const prices = db.prepare('SELECT * FROM price_history WHERE ingredient_id = ? ORDER BY date DESC').all(row.id) as any[];
    return toIngredient(row, prices);
  });
  res.json(ingredients);
});

// POST create ingredient
router.post('/', (req, res) => {
  const { id, name, category, unit, currentStock, lowStockThreshold, notes, createdAt } = req.body;
  db.prepare(`
    INSERT INTO ingredients (id, name, category, unit, current_stock, low_stock_threshold, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, category, unit, currentStock ?? 0, lowStockThreshold ?? 0, notes ?? '', createdAt);
  res.json(getIngredientWithPrices(id));
});

// PUT update ingredient
router.put('/:id', (req, res) => {
  const { name, category, unit, currentStock, lowStockThreshold, notes } = req.body;
  db.prepare(`
    UPDATE ingredients SET name=?, category=?, unit=?, current_stock=?, low_stock_threshold=?, notes=? WHERE id=?
  `).run(name, category, unit, currentStock ?? 0, lowStockThreshold ?? 0, notes ?? '', req.params.id);
  res.json(getIngredientWithPrices(req.params.id));
});

// DELETE ingredient
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM ingredients WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// POST add price entry
router.post('/:id/prices', (req, res) => {
  const { id, date, price, supplier, notes } = req.body;
  db.prepare(`
    INSERT INTO price_history (id, ingredient_id, date, price, supplier, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, req.params.id, date, price, supplier ?? '', notes ?? '');
  res.json(getIngredientWithPrices(req.params.id));
});

// DELETE price entry
router.delete('/:id/prices/:priceId', (req, res) => {
  db.prepare('DELETE FROM price_history WHERE id = ? AND ingredient_id = ?').run(req.params.priceId, req.params.id);
  res.json(getIngredientWithPrices(req.params.id));
});

export default router;
