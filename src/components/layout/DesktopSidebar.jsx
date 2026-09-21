import React from 'react';
import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { LayoutDashboard, PieChart, ShoppingBasket, Receipt, Sun, Moon, LogOut, Download } from 'lucide-react';
import { toggleTheme } from '../../store/themeSlice';
import { logout } from '../../store/authSlice';
import { usePwaInstall } from '../../hooks/usePwaInstall';

export default function DesktopSidebar() {
  const dispatch = useDispatch();
  const themeMode = useSelector((state) => state.theme.mode);
  const { isInstallable, triggerInstall } = usePwaInstall();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/analytics', label: 'Gráficas & Analítica', icon: PieChart },
    { to: '/pantry', label: 'Mi Despensa (FIFO)', icon: ShoppingBasket },
    { to: '/history', label: 'Historial Completo', icon: Receipt },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-[#131b2e] border-r border-slate-200 dark:border-[#1f293d] p-5 justify-between sticky top-0 h-screen transition-colors">
      <div>
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 font-bold text-xl">
            💰
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight">Finanzas & Despensa</h1>
            <span className="text-[10px] text-emerald-500 font-semibold tracking-wider uppercase">React + Vite Pro</span>
          </div>
        </div>

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2.5">
        {isInstallable && (
          <button
            onClick={triggerInstall}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/20 transition animate-pulse"
          >
            <Download className="w-4 h-4" />
            <span>Instalar Aplicación</span>
          </button>
        )}
        <button
          onClick={() => dispatch(toggleTheme())}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-[#1a233a] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition"
        >
          <span className="flex items-center space-x-2">
            {themeMode === 'dark' ? <Moon className="w-4 h-4 text-purple-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            <span>Tema</span>
          </span>
          <span className="text-[11px] text-slate-400 uppercase font-bold">
            {themeMode === 'dark' ? 'Oscuro' : 'Claro'}
          </span>
        </button>

        <button
          onClick={() => dispatch(logout())}
          className="w-full flex items-center space-x-2 px-4 py-2 text-xs text-rose-500 hover:bg-rose-500/10 rounded-xl transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Bloquear App</span>
        </button>
      </div>
    </aside>
  );
}
