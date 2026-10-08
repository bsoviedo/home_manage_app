import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, PieChart, ShoppingBasket, Receipt } from 'lucide-react';

export default function MobileBottomNav() {
  const navItems = [
    { to: '/', label: 'Inicio', icon: LayoutDashboard },
    { to: '/calendar', label: 'Calendario', icon: Calendar },
    { to: '/analytics', label: 'Gráficas', icon: PieChart },
    { to: '/pantry', label: 'Despensa', icon: ShoppingBasket },
    { to: '/history', label: 'Historial', icon: Receipt },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-[#131b2e]/90 glass border-t border-slate-200 dark:border-slate-800 px-6 py-2 flex items-center justify-between">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center space-y-1 font-medium text-[11px] transition ${
                isActive ? 'text-emerald-500 font-bold' : 'text-slate-400'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
