import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { fetchTransactions, fetchDashboard } from '../store/financeSlice';
import { openConfirmModal, openEditModal, showToast } from '../store/uiSlice';
import { api } from '../services/api';

export default function HistoryPage() {
  const dispatch = useDispatch();
  const { transactions, funds } = useSelector((state) => state.finance);

  const [fund, setFund] = useState('');
  const [type, setType] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    const params = {};
    if (fund) params.id_fondo = fund;
    if (type) params.tipo = type;
    if (fromDate) params.fecha_inicio = fromDate;
    if (toDate) params.fecha_fin = toDate;
    dispatch(fetchTransactions(params));
  }, [fund, type, fromDate, toDate, dispatch]);

  const formatCOP = (val) => '$' + Number(val || 0).toLocaleString('es-CO') + ' COP';

  const handleDelete = async (txId) => {
    if (!confirm(`¿Eliminar la transacción #${txId}?`)) return;
    try {
      const res = await api.deleteTransaction(txId);
      if (res.ok) {
        dispatch(showToast({ message: 'Transacción eliminada', icon: '🗑️' }));
        dispatch(fetchTransactions({ id_fondo: fund, tipo: type, fecha_inicio: fromDate, fecha_fin: toDate }));
        dispatch(fetchDashboard());
      }
    } catch {
      dispatch(showToast({ message: 'Error eliminando transacción', icon: '❌' }));
    }
  };

  const handleNewManual = () => {
    dispatch(
      openConfirmModal({
        tipo: 'gasto',
        datos_gasto: {
          comercio: '',
          total: 0,
          fecha: new Date().toISOString().substring(0, 10),
          fondo_sugerido: 'personal',
        },
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="bg-white dark:bg-[#131b2e] p-4 rounded-2xl border border-slate-200 dark:border-[#1f293d] space-y-3 transition-colors">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm">Historial de Transacciones</h2>
          <button
            onClick={handleNewManual}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Registro</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <select
            value={fund}
            onChange={(e) => setFund(e.target.value)}
            className="bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none"
          >
            <option value="">Todos los Fondos</option>
            {funds.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nombre}
              </option>
            ))}
          </select>

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none"
          >
            <option value="">Tipo: Todos</option>
            <option value="gasto">💸 Gastos</option>
            <option value="ingreso">📥 Ingresos</option>
          </select>

          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none"
          />

          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none"
          />
        </div>
      </div>

      {/* History List */}
      <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200 dark:border-[#1f293d] overflow-hidden shadow-sm transition-colors">
        {transactions.length === 0 ? (
          <p className="text-xs text-slate-400 py-12 text-center">
            No hay transacciones registradas con estos filtros.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {transactions.map((t) => {
              const isInc = t.tipo === 'ingreso';
              const fLabel = funds.find((f) => f.id === (t.id_fondo || t.id_cuenta))?.nombre || 'Personal';
              const hasSplit = t.monto_terceros > 0;

              return (
                <div
                  key={t.id}
                  className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#162036] transition"
                >
                  <div className="flex items-center space-x-3.5">
                    <div
                      className={`w-10 h-10 rounded-2xl ${
                        isInc ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      } flex items-center justify-center text-sm font-bold flex-shrink-0`}
                    >
                      {isInc ? '📥' : '💸'}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-slate-100">{t.descripcion}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center space-x-1.5 flex-wrap">
                        <span>{t.fecha?.substring(0, 10)}</span>
                        <span>•</span>
                        <span className="text-purple-400 font-semibold">{fLabel}</span>
                        <span>•</span>
                        <span className="text-slate-400 capitalize">{t.id_categoria || 'General'}</span>
                        {hasSplit && (
                          <span className="px-1.5 py-0.2 bg-purple-500/20 text-purple-300 rounded text-[9px]">
                            Dividido
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex items-center space-x-3">
                    <div>
                      <div
                        className={`font-bold text-xs ${
                          isInc ? 'text-emerald-400' : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {isInc ? '+' : '-'}{formatCOP(t.monto)}
                      </div>
                      {hasSplit && (
                        <div className="text-[9px] text-slate-400">Mío: {formatCOP(t.monto_propio)}</div>
                      )}
                    </div>
                    <button
                      onClick={() => dispatch(openEditModal({ txId: t.id }))}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition"
                      title="Editar transacción e ítems"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
