import type { Ingredient, Recipe, PriceEntry, RecipeIngredient } from './types';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}

// Ingredients
export function getIngredients(): Promise<Ingredient[]> {
  return request('/ingredients');
}

export function createIngredient(ingredient: Ingredient): Promise<Ingredient> {
  return request('/ingredients', { method: 'POST', body: JSON.stringify(ingredient) });
}

export function updateIngredient(ingredient: Ingredient): Promise<Ingredient> {
  return request(`/ingredients/${ingredient.id}`, { method: 'PUT', body: JSON.stringify(ingredient) });
}

export function deleteIngredient(id: string): Promise<void> {
  return request(`/ingredients/${id}`, { method: 'DELETE' });
}

export function addPrice(ingredientId: string, entry: PriceEntry): Promise<Ingredient> {
  return request(`/ingredients/${ingredientId}/prices`, { method: 'POST', body: JSON.stringify(entry) });
}

export function deletePrice(ingredientId: string, priceId: string): Promise<Ingredient> {
  return request(`/ingredients/${ingredientId}/prices/${priceId}`, { method: 'DELETE' });
}

// Recipes
export function getRecipes(): Promise<Recipe[]> {
  return request('/recipes');
}

export function createRecipe(recipe: Recipe): Promise<Recipe> {
  return request('/recipes', { method: 'POST', body: JSON.stringify(recipe) });
}

export function updateRecipe(recipe: Recipe): Promise<Recipe> {
  return request(`/recipes/${recipe.id}`, { method: 'PUT', body: JSON.stringify(recipe) });
}

export function deleteRecipe(id: string): Promise<void> {
  return request(`/recipes/${id}`, { method: 'DELETE' });
}

// Pure helpers (no server needed)
export function getCurrentPrice(ingredient: Ingredient): number | null {
  if (!ingredient.priceHistory.length) return null;
  const sorted = [...ingredient.priceHistory].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  return sorted[0].price;
}

export function calcRecipeCost(
  recipeIngredients: RecipeIngredient[],
  ingredients: Ingredient[]
): number {
  return recipeIngredients.reduce((total, ri) => {
    const ing = ingredients.find((i) => i.id === ri.ingredientId);
    if (!ing) return total;
    const price = getCurrentPrice(ing);
    if (price == null) return total;
    return total + price * ri.amount;
  }, 0);
}
