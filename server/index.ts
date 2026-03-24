import express from 'express';
import cors from 'cors';
import ingredientRoutes from './routes/ingredients.js';
import recipeRoutes from './routes/recipes.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/ingredients', ingredientRoutes);
app.use('/api/recipes', recipeRoutes);

app.listen(PORT, () => {
  console.log(`Soap Studio API running on http://localhost:${PORT}`);
});
