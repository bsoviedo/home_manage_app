import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { Check, AlertTriangle } from 'lucide-react';
import KpiGrid from '../components/dashboard/KpiGrid';
import QuickInputBar from '../components/dashboard/QuickInputBar';
import FundsPills from '../components/dashboard/FundsPills';
import { updatePantryItem } from '../store/pantrySlice';
import { showToast } from '../store/uiSlice';

export default function DashboardPage() {
  const dispatch = useDispatch();
  const { dashboard, funds } = useSelector((state) => state.finance);
  const formatCOP = (val) => '$' + Number(val || 0).toLocaleString('es-CO');

  const handlePantryAction = (id, estado) => {
    dispatch(updatePantryItem({ id, estado }));
    dispatch(showToast({ message: `Producto marcado como ${estado.toUpperCase()}`, icon: '✅' }));
  };

  return (
    <div className="space-y-6">
      <QuickInputBar />

      <KpiGrid resumen={dashboard?.resumen} />

      <FundsPills funds={funds} resumen={dashboard?.resumen} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white dark:bg-[#131b2e] rounded-2xl p-4 md:p-5 border border-slate-200 dark:border-[#1f293d] shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-sm">Últimos Movimientos</h2>
            <Link to="/history" className="text-xs text-emerald-500 hover:underline font-medium">
              Ver todos
            </Link>
          </div>
          <div className="space-y-2.5">
            {(!dashboard?.transacciones_recientes || dashboard.transacciones_recientes.length === 0) ? (
              <p className="text-xs text-slate-400 py-4 text-center">No hay movimientos registrados.</p>
            ) : (
              dashboard.transacciones_recientes.map((t) => {
                const isInc = t.tipo === 'ingreso';
                const fLabel = funds.find((f) => f.id === (t.id_fondo || t.id_cuenta))?.nombre || 'Personal';
                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/60 last:border-0"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 rounded-xl ${
                          isInc ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        } flex items-center justify-center text-xs font-bold`}
                      >
                        {isInc ? '📥' : '💸'}
                      </div>
                      <div>
                        <div className="text-xs font-bold truncate max-w-[140px] md:max-w-xs">{t.descripcion}</div>
                        <div className="text-[10px] text-slate-400">
                          {t.fecha?.substring(0, 10)} • {fLabel}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`text-xs font-bold ${
                        isInc ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {isInc ? '+' : '-'}{formatCOP(t.monto)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Active Pantry Preview */}
        <div className="bg-white dark:bg-[#131b2e] rounded-2xl p-4 md:p-5 border border-slate-200 dark:border-[#1f293d] shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <h2 className="font-bold text-sm">Despensa (FIFO)</h2>
              <span className="px-2 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-400 rounded-full font-bold">
                {dashboard?.despensa_activa?.length || 0}
              </span>
            </div>
            <Link to="/pantry" className="text-xs text-emerald-500 hover:underline font-medium">
              Ver despensa
            </Link>
          </div>
          <div className="space-y-2.5">
            {(!dashboard?.despensa_activa || dashboard.despensa_activa.length === 0) ? (
              <p className="text-xs text-slate-400 py-4 text-center">No tienes alimentos activos en despensa.</p>
            ) : (
              dashboard.despensa_activa.slice(0, 4).map((it) => (
                <div
                  key={it.id}
                  className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/60 last:border-0"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="text-sm">🥫</span>
                    <div>
                      <div className="text-xs font-bold">{it.nombre_producto}</div>
                      <div className="text-[10px] text-slate-400">Ingreso: {it.created_at?.substring(0, 10)}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handlePantryAction(it.id, 'consumido')}
                      className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 active:scale-95 transition"
                      title="Consumido"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handlePantryAction(it.id, 'dañado')}
                      className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 dark:text-rose-400 hover:bg-rose-500/20 active:scale-95 transition"
                      title="Dañado"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
