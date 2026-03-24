import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Ingredients from './pages/Ingredients';
import Recipes from './pages/Recipes';
import Calculator from './pages/Calculator';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/ingredients" element={<Ingredients />} />
          <Route path="/recipes" element={<Recipes />} />
          <Route path="/calculator" element={<Calculator />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
