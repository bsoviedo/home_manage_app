import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, AlertTriangle, AlertOctagon } from 'lucide-react';
import PantryItemCard from '../components/pantry/PantryItemCard';
import { fetchPantry, updatePantryItem } from '../store/pantrySlice';
import { showToast } from '../store/uiSlice';

export default function PantryPage() {
  const [search, setSearch] = useState('');
  const [viewState, setViewState] = useState('activo');
  const dispatch = useDispatch();
  const { items, damagedItems } = useSelector((state) => state.pantry);

  useEffect(() => {
    dispatch(fetchPantry(viewState));
  }, [viewState, dispatch]);

  const activeItems = viewState === 'dañado' ? damagedItems : items;
  const filtered = activeItems.filter((it) =>
    it.nombre_producto?.toLowerCase().includes(search.toLowerCase())
  );

  const formatCOP = (val) => '$' + Number(val || 0).toLocaleString('es-CO') + ' COP';
  const totalLost = damagedItems.reduce((acc, it) => acc + parseFloat(it.precio || 0), 0);

  const handleConsume = (id) => {
    dispatch(updatePantryItem({ id, estado: 'consumido' }));
    dispatch(showToast({ message: 'Producto marcado como CONSUMIDO', icon: '🍽️' }));
  };

  const handleDamage = (id) => {
    dispatch(updatePantryItem({ id, estado: 'dañado' }));
    dispatch(showToast({ message: 'Producto marcado como DAÑADO', icon: '⚠️' }));
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-[#131b2e] p-4 rounded-2xl border border-slate-200 dark:border-[#1f293d] transition-colors">
        <div className="flex items-center space-x-2">
          <span className="text-xl">🥫</span>
          <div>
            <h2 className="font-bold text-sm">Control de Despensa (FIFO)</h2>
            <p className="text-[11px] text-slate-400">
              Los alimentos más antiguos aparecen primero para consumirse a tiempo.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar alimento..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            onClick={() => setViewState(viewState === 'activo' ? 'dañado' : 'activo')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center space-x-1 ${
              viewState === 'dañado'
                ? 'bg-rose-500 text-white'
                : 'bg-rose-500/10 text-rose-500 dark:text-rose-400 hover:bg-rose-500/20'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{viewState === 'dañado' ? 'Ver Activos' : 'Dañados'}</span>
          </button>
        </div>
      </div>

      {/* Damaged Banner */}
      {viewState === 'dañado' && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center justify-between text-xs text-rose-400">
          <div className="flex items-center space-x-2">
            <AlertOctagon className="w-5 h-5" />
            <div>
              <span className="font-bold">{damagedItems.length} alimentos dañados</span>
              <p className="text-[11px] text-slate-400">Pérdida económica estimada calculada.</p>
            </div>
          </div>
          <div className="font-bold text-sm">{formatCOP(totalLost)}</div>
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-xs bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200 dark:border-[#1f293d]">
          No se encontraron productos en la despensa.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((item) => (
            <PantryItemCard
              key={item.id}
              item={item}
              onConsume={handleConsume}
              onDamage={handleDamage}
            />
          ))}
        </div>
      )}
    </div>
  );
}
