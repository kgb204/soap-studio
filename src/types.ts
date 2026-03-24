export type IngredientCategory =
  | 'oil'
  | 'butter'
  | 'lye'
  | 'liquid'
  | 'fragrance'
  | 'colorant'
  | 'additive'
  | 'packaging'
  | 'other';

export type Unit = 'oz' | 'lb' | 'g' | 'kg' | 'ml' | 'L' | 'each';

export interface PriceEntry {
  id: string;
  date: string; // ISO date string
  price: number; // price per unit
  supplier?: string;
  notes?: string;
}

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  unit: Unit;
  currentStock: number;
  lowStockThreshold: number;
  priceHistory: PriceEntry[];
  notes?: string;
  createdAt: string;
}

export interface RecipeIngredient {
  ingredientId: string;
  amount: number;
  unit: Unit;
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  batchSize: number;
  batchUnit: Unit;
  barsPerBatch?: number;
  ingredients: RecipeIngredient[];
  instructions?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BatchLog {
  id: string;
  recipeId: string;
  dateProduced: string;
  batchesProduced: number;
  notes?: string;
  totalCost: number;
}
