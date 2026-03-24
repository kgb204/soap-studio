import { NavLink, Outlet } from 'react-router-dom';
import { FlaskConical, Package, BookOpen, Calculator, BarChart3 } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: BarChart3, end: true },
  { to: '/ingredients', label: 'Ingredients', icon: Package, end: false },
  { to: '/recipes', label: 'Recipes', icon: BookOpen, end: false },
  { to: '/calculator', label: 'Cost Calc', icon: Calculator, end: false },
];

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8f5f2]">
      {/* Header */}
      <header className="bg-[#3d2b1f] text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <FlaskConical className="w-7 h-7 text-[#d4956a]" />
          <h1 className="text-xl font-semibold tracking-wide">Soap Studio</h1>
          <span className="text-[#a07b5e] text-sm ml-1">Inventory & Cost Tracker</span>
        </div>
      </header>

      {/* Nav */}
      <nav className="bg-[#5c3d2e] shadow">
        <div className="max-w-6xl mx-auto px-4 flex gap-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-white border-b-2 border-[#d4956a] bg-[#6b4c3b]'
                    : 'text-[#c4a882] hover:text-white hover:bg-[#6b4c3b]'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
