import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Sun, Moon, Lock, Download } from 'lucide-react';
import { toggleTheme } from '../../store/themeSlice';
import { logout } from '../../store/authSlice';
import { usePwaInstall } from '../../hooks/usePwaInstall';

export default function Header() {
  const dispatch = useDispatch();
  const themeMode = useSelector((state) => state.theme.mode);
  const { isInstallable, triggerInstall } = usePwaInstall();

  return (
    <header className="flex md:hidden items-center justify-between mb-5">
      <div className="flex items-center space-x-2.5">
        <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-md shadow-emerald-500/20">
          💰
        </div>
        <div>
          <h1 className="font-bold text-sm leading-tight">Finanzas & Despensa</h1>
          <span className="text-[10px] text-emerald-500 font-semibold tracking-wider uppercase">React PWA</span>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {isInstallable && (
          <button
            onClick={triggerInstall}
            className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 font-semibold text-xs flex items-center space-x-1 animate-pulse"
            title="Instalar App en tu pantalla de inicio"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Instalar</span>
          </button>
        )}
        <button
          onClick={() => dispatch(toggleTheme())}
          className="p-2 rounded-xl bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
        >
          {themeMode === 'dark' ? <Moon className="w-4 h-4 text-purple-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
        </button>
        <button
          onClick={() => dispatch(logout())}
          className="p-2 rounded-xl bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 text-rose-500"
        >
          <Lock className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
