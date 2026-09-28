import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { ArrowLeft, BarChart2, Wallet, Receipt, Loader2, Pencil, Columns } from 'lucide-react';
import { api } from '../../services/api';
import { openEditModal } from '../../store/uiSlice';

export default function CategoryCompareView({
  categoryIds = [],
  categoryLabels = [],
  period,
  startDate,
  endDate,
  onBack,
  totalPeriodExpenses
}) {
  const dispatch = useDispatch();
  const [compareData, setCompareData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const palette = ['#10b981', '#8b5cf6', '#3b82f6', '#f59e0b', '#ec4899', '#06b6d4', '#64748b', '#f97316', '#14b8a6', '#a855f7'];

  const fetchInitialData = useCallback(async () => {
    if (!categoryIds || categoryIds.length === 0) return;
    setLoading(true);
    setOffset(0);
    try {
      const payload = {
        category_ids: categoryIds,
        offset: 0,
        limit
      };
      if (startDate && endDate) {
        payload.fecha_inicio = startDate;
        payload.fecha_fin = endDate;
      } else {
        payload.period = period || 'month';
      }

      const res = await api.compareCategories(payload);
      setLoading(false);
      if (res.ok) {
        setCompareData(res);
        setTransactions(res.transacciones || []);
        setHasMore(res.has_more || false);
        setOffset(res.transacciones?.length || 0);
      }
    } catch {
      setLoading(false);
    }
  }, [categoryIds, period, startDate, endDate]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const loadMoreTransactions = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const payload = {
        category_ids: categoryIds,
        offset,
        limit
      };
      if (startDate && endDate) {
        payload.fecha_inicio = startDate;
        payload.fecha_fin = endDate;
      } else {
        payload.period = period || 'month';
      }

      const res = await api.compareCategories(payload);
      setLoadingMore(false);
      if (res.ok) {
        const newTxs = res.transacciones || [];
        setTransactions((prev) => [...prev, ...newTxs]);
        setHasMore(res.has_more || false);
        setOffset((prev) => prev + newTxs.length);
      }
    } catch {
      setLoadingMore(false);
    }
  };

  const formatCOP = (val) => '$' + Number(val || 0).toLocaleString('es-CO') + ' COP';

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center space-y-2 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
        <span className="text-xs">Cargando comparativa de categorías...</span>
      </div>
    );
  }

  if (!compareData) {
    return (
      <div className="text-center py-8 text-xs text-slate-400">
        No se pudo cargar la comparativa.
        <button onClick={onBack} className="block mx-auto mt-2 text-purple-400 underline">Volver</button>
      </div>
    );
  }

  const combinedTotal = compareData.total_combinado || 0;
  const categoriesMap = compareData.categorias || {};
  const fondosMap = compareData.por_fondo_combinado || {};
  const totalCount = compareData.total_transacciones || compareData.cantidad_total || 0;

  // Group transactions by category for parallel rendering
  const txsByCat = {};
  categoryIds.forEach((cid) => {
    txsByCat[cid.toLowerCase()] = [];
  });
  transactions.forEach((t) => {
    const cKey = String(t.id_categoria || '').toLowerCase();
    if (txsByCat[cKey]) {
      txsByCat[cKey].push(t);
    } else {
      // Find approximate match
      const matched = Object.keys(txsByCat).find((k) => cKey.includes(k) || k.includes(cKey));
      if (matched) {
        txsByCat[matched].push(t);
      }
    }
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header & Back button */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <button
            onClick={onBack}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-[#0b0f19] text-slate-600 dark:text-slate-300 hover:bg-purple-500 hover:text-white transition"
            title="Volver a la vista general"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center space-x-2">
              <span>Comparativa ({categoryIds.length} Categorías)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-bold">
                {totalPeriodExpenses > 0 ? ((combinedTotal / totalPeriodExpenses) * 100).toFixed(0) : 0}% del total global
              </span>
            </h3>
            <p className="text-[10px] text-slate-400">{totalCount} movimientos sumados en el periodo</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-purple-500 dark:text-purple-400">{formatCOP(combinedTotal)}</div>
          {compareData.total_terceros > 0 && (
            <div className="text-[9px] text-slate-400">
              Propio: {formatCOP(compareData.total_propio)}
            </div>
          )}
        </div>
      </div>

      {/* Comparative Cards & Percentage Distribution */}
      <div>
        <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
          <BarChart2 className="w-3.5 h-3.5 text-purple-400" />
          <span>Distribución entre Categorías Seleccionadas</span>
        </h4>
        <div className="space-y-2">
          {Object.entries(categoriesMap).map(([cid, data], idx) => {
            const catPct = combinedTotal > 0 ? ((data.total / combinedTotal) * 100).toFixed(1) : '0.0';
            const color = palette[idx % palette.length];
            return (
              <div
                key={cid}
                className="p-2.5 bg-slate-50 dark:bg-[#0b0f19] rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className="font-bold text-slate-900 dark:text-slate-100 truncate">{data.nombre}</span>
                    <span className="text-[10px] text-slate-400">({data.cantidad} compras)</span>
                  </div>
                  <div className="text-right flex items-center space-x-2 flex-shrink-0">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCOP(data.total)}</span>
                    <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded-md">
                      {catPct}%
                    </span>
                  </div>
                </div>

                {/* Relative progress bar */}
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${catPct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Funds Breakdown for the compared categories */}
      <div>
        <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
          <Wallet className="w-3.5 h-3.5 text-emerald-400" />
          <span>Fondos Utilizados (Combinado)</span>
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {Object.keys(fondosMap).length === 0 ? (
            <p className="text-xs text-slate-400 col-span-2">Sin desglose de fondos registrado.</p>
          ) : (
            Object.entries(fondosMap).map(([fondoNom, monto]) => {
              const fundPct = combinedTotal > 0 ? ((monto / combinedTotal) * 100).toFixed(0) : 0;
              return (
                <div
                  key={fondoNom}
                  className="p-2.5 bg-slate-50 dark:bg-[#0b0f19] rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
                    <span className="truncate mr-1">{fondoNom}</span>
                    <span className="font-bold text-emerald-400">{fundPct}%</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1">{formatCOP(monto)}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* PARALLEL (SIDE-BY-SIDE) TRANSACTION COLUMNS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
            <Columns className="w-3.5 h-3.5 text-purple-400" />
            <span>Transacciones en Paralelo ({transactions.length} de {totalCount})</span>
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(categoriesMap).map(([cid, data], idx) => {
            const catTxs = txsByCat[cid.toLowerCase()] || [];
            const color = palette[idx % palette.length];

            return (
              <div
                key={cid}
                className="bg-slate-50/70 dark:bg-[#0b0f19] rounded-2xl border border-slate-200 dark:border-slate-800 p-3 space-y-2.5 flex flex-col justify-between"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 dark:border-slate-800">
                  <div className="flex items-center space-x-1.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">{data.nombre}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{formatCOP(data.total)}</span>
                </div>

                {/* Column Transaction List */}
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 flex-1">
                  {catTxs.length === 0 ? (
                    <p className="text-[11px] text-slate-400 py-6 text-center">Sin movimientos.</p>
                  ) : (
                    catTxs.map((t) => {
                      const hasSplit = t.monto_terceros > 0;
                      return (
                        <div
                          key={t.id}
                          className="p-2 bg-white dark:bg-[#131b2e] rounded-xl border border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-xs hover:border-slate-300 dark:hover:border-slate-700 transition"
                        >
                          <div className="truncate mr-1.5 flex-1">
                            <div className="font-semibold text-slate-900 dark:text-slate-100 truncate text-[11px]">
                              {t.descripcion}
                            </div>
                            <div className="text-[9px] text-slate-400 flex items-center space-x-1 mt-0.5">
                              <span>{t.fecha?.substring(0, 10)}</span>
                              {hasSplit && (
                                <span className="px-1 py-0.2 bg-purple-500/20 text-purple-300 rounded text-[8px]">
                                  Dividido
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-1.5 flex-shrink-0">
                            <span className="font-bold text-[11px] text-rose-500 dark:text-rose-400">
                              -{formatCOP(t.monto)}
                            </span>
                            <button
                              onClick={() => dispatch(openEditModal({ txId: t.id }))}
                              className="p-1 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition"
                              title="Editar transacción"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {hasMore && (
          <button
            onClick={loadMoreTransactions}
            disabled={loadingMore}
            className="w-full py-2 mt-3 text-xs font-semibold text-purple-400 hover:bg-purple-500/10 rounded-xl border border-purple-500/20 transition text-center flex items-center justify-center space-x-1.5"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Cargando más movimientos...</span>
              </>
            ) : (
              <span>+ Cargar más transacciones en paralelo</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
