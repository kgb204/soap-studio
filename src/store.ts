import type { Ingredient, Recipe, BatchLog } from './types';

const KEYS = {
  ingredients: 'soap_ingredients',
  recipes: 'soap_recipes',
  batches: 'soap_batches',
};

function load<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// Ingredients
export function getIngredients(): Ingredient[] {
  return load<Ingredient>(KEYS.ingredients);
}

export function saveIngredients(ingredients: Ingredient[]): void {
  save(KEYS.ingredients, ingredients);
}

export function upsertIngredient(ingredient: Ingredient): void {
  const all = getIngredients();
  const idx = all.findIndex((i) => i.id === ingredient.id);
  if (idx >= 0) all[idx] = ingredient;
  else all.push(ingredient);
  saveIngredients(all);
}

export function deleteIngredient(id: string): void {
  saveIngredients(getIngredients().filter((i) => i.id !== id));
}

// Recipes
export function getRecipes(): Recipe[] {
  return load<Recipe>(KEYS.recipes);
}

export function saveRecipes(recipes: Recipe[]): void {
  save(KEYS.recipes, recipes);
}

export function upsertRecipe(recipe: Recipe): void {
  const all = getRecipes();
  const idx = all.findIndex((r) => r.id === recipe.id);
  if (idx >= 0) all[idx] = recipe;
  else all.push(recipe);
  saveRecipes(all);
}

export function deleteRecipe(id: string): void {
  saveRecipes(getRecipes().filter((r) => r.id !== id));
}

// Batches
export function getBatches(): BatchLog[] {
  return load<BatchLog>(KEYS.batches);
}

export function upsertBatch(batch: BatchLog): void {
  const all = getBatches();
  const idx = all.findIndex((b) => b.id === batch.id);
  if (idx >= 0) all[idx] = batch;
  else all.push(batch);
  save(KEYS.batches, all);
}

export function deleteBatch(id: string): void {
  save(KEYS.batches, getBatches().filter((b) => b.id !== id));
}

// Helpers
export function getCurrentPrice(ingredient: Ingredient): number | null {
  if (!ingredient.priceHistory.length) return null;
  const sorted = [...ingredient.priceHistory].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  return sorted[0].price;
}

export function calcRecipeCost(
  recipe: Recipe,
  ingredients: Ingredient[]
): number {
  return recipe.ingredients.reduce((total, ri) => {
    const ing = ingredients.find((i) => i.id === ri.ingredientId);
    if (!ing) return total;
    const price = getCurrentPrice(ing);
    if (price == null) return total;
    return total + price * ri.amount;
  }, 0);
}
