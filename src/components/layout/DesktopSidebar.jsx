import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  LayoutDashboard,
  PieChart,
  ShoppingBasket,
  Receipt,
  Sun,
  Moon,
  LogOut,
  Download,
  ChevronLeft,
  ChevronRight,
  Wallet
} from 'lucide-react';
import { toggleTheme } from '../../store/themeSlice';
import { logout } from '../../store/authSlice';
import { openFundsModal } from '../../store/uiSlice';
import { usePwaInstall } from '../../hooks/usePwaInstall';

export default function DesktopSidebar() {
  const dispatch = useDispatch();
  const themeMode = useSelector((state) => state.theme.mode);
  const { isInstallable, triggerInstall } = usePwaInstall();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
  };

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/analytics', label: 'Gráficas & Analítica', icon: PieChart },
    { to: '/pantry', label: 'Mi Despensa (FIFO)', icon: ShoppingBasket },
    { to: '/history', label: 'Historial Completo', icon: Receipt },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col ${
        isCollapsed ? 'w-20 p-3 items-center' : 'w-64 p-5'
      } bg-white dark:bg-[#131b2e] border-r border-slate-200 dark:border-[#1f293d] justify-between sticky top-0 h-screen transition-all duration-300 z-30`}
    >
      <div className="w-full">
        {/* Header with Logo and Collapse Button */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-6`}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 font-bold text-xl flex-shrink-0">
              💰
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <h1 className="font-bold text-sm leading-tight text-slate-900 dark:text-slate-100 truncate">
                  Finanzas & Despensa
                </h1>
                <span className="text-[10px] text-emerald-500 font-semibold tracking-wider uppercase">
                  Vite Pro
                </span>
              </div>
            )}
          </div>

          <button
            onClick={handleToggleCollapse}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex-shrink-0"
            title={isCollapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5 w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center ${
                    isCollapsed ? 'justify-center px-0 py-3' : 'space-x-3 px-3.5 py-2.5'
                  } rounded-2xl font-medium text-xs transition ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}

          {/* Quick Bolsillos / Capital Button */}
          <button
            onClick={() => dispatch(openFundsModal({ activeTab: 'recharge' }))}
            title={isCollapsed ? 'Recargar Bolsillos / Capital' : undefined}
            className={`w-full flex items-center ${
              isCollapsed ? 'justify-center px-0 py-3' : 'space-x-3 px-3.5 py-2.5'
            } rounded-2xl font-semibold text-xs text-purple-400 hover:bg-purple-500/10 transition mt-2`}
          >
            <Wallet className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span className="truncate">⚡ Bolsillos & Capital</span>}
          </button>
        </nav>
      </div>

      {/* Footer Controls */}
      <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2 w-full">
        {isInstallable && (
          <button
            onClick={triggerInstall}
            title={isCollapsed ? 'Instalar Aplicación' : undefined}
            className={`w-full flex items-center justify-center ${
              isCollapsed ? 'p-2.5' : 'space-x-2 px-3 py-2'
            } rounded-xl text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/20 transition animate-pulse`}
          >
            <Download className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>Instalar App</span>}
          </button>
        )}

        <button
          onClick={() => dispatch(toggleTheme())}
          title={isCollapsed ? `Tema: ${themeMode}` : undefined}
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3.5 py-2'
          } rounded-xl text-xs font-medium bg-slate-100 dark:bg-[#1a233a] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition`}
        >
          <span className="flex items-center space-x-2">
            {themeMode === 'dark' ? <Moon className="w-4 h-4 text-purple-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            {!isCollapsed && <span>Tema</span>}
          </span>
          {!isCollapsed && (
            <span className="text-[10px] text-slate-400 uppercase font-bold">
              {themeMode === 'dark' ? 'Oscuro' : 'Claro'}
            </span>
          )}
        </button>

        <button
          onClick={() => dispatch(logout())}
          title={isCollapsed ? 'Bloquear App' : undefined}
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center p-2.5' : 'space-x-2 px-3.5 py-2'
          } text-xs text-rose-500 hover:bg-rose-500/10 rounded-xl transition`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && <span>Bloquear App</span>}
        </button>
      </div>
    </aside>
  );
}
