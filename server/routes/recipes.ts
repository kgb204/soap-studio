import { Router } from 'express';
import db from '../db.js';

const router = Router();

function getRecipeWithIngredients(id: string) {
  const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(id) as any;
  if (!recipe) return null;
  const ings = db.prepare('SELECT * FROM recipe_ingredients WHERE recipe_id = ? ORDER BY sort_order').all(id) as any[];
  return toRecipe(recipe, ings);
}

function toRecipe(row: any, ings: any[]) {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    batchSize: row.batch_size,
    batchUnit: row.batch_unit,
    barsPerBatch: row.bars_per_batch ?? undefined,
    instructions: row.instructions ?? '',
    notes: row.notes ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ingredients: ings.map((i) => ({
      ingredientId: i.ingredient_id,
      amount: i.amount,
      unit: i.unit,
    })),
  };
}

// GET all recipes
router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM recipes ORDER BY name').all() as any[];
  const recipes = rows.map((row) => {
    const ings = db.prepare('SELECT * FROM recipe_ingredients WHERE recipe_id = ? ORDER BY sort_order').all(row.id) as any[];
    return toRecipe(row, ings);
  });
  res.json(recipes);
});

// POST create recipe
router.post('/', (req, res) => {
  const { id, name, description, batchSize, batchUnit, barsPerBatch, instructions, notes, createdAt, updatedAt, ingredients } = req.body;
  const insert = db.transaction(() => {
    db.prepare(`
      INSERT INTO recipes (id, name, description, batch_size, batch_unit, bars_per_batch, instructions, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, description ?? '', batchSize ?? 0, batchUnit, barsPerBatch ?? null, instructions ?? '', notes ?? '', createdAt, updatedAt);

    (ingredients ?? []).forEach((ri: any, idx: number) => {
      db.prepare(`
        INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit, sort_order)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(`${id}_${idx}`, id, ri.ingredientId, ri.amount, ri.unit, idx);
    });
  });
  insert();
  res.json(getRecipeWithIngredients(id));
});

// PUT update recipe
router.put('/:id', (req, res) => {
  const { name, description, batchSize, batchUnit, barsPerBatch, instructions, notes, updatedAt, ingredients } = req.body;
  const update = db.transaction(() => {
    db.prepare(`
      UPDATE recipes SET name=?, description=?, batch_size=?, batch_unit=?, bars_per_batch=?, instructions=?, notes=?, updated_at=? WHERE id=?
    `).run(name, description ?? '', batchSize ?? 0, batchUnit, barsPerBatch ?? null, instructions ?? '', notes ?? '', updatedAt, req.params.id);

    db.prepare('DELETE FROM recipe_ingredients WHERE recipe_id = ?').run(req.params.id);
    (ingredients ?? []).forEach((ri: any, idx: number) => {
      db.prepare(`
        INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit, sort_order)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(`${req.params.id}_${idx}`, req.params.id, ri.ingredientId, ri.amount, ri.unit, idx);
    });
  });
  update();
  res.json(getRecipeWithIngredients(req.params.id));
});

// DELETE recipe
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM recipes WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
