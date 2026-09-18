import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Plus, Trash2, Calculator, Loader2 } from 'lucide-react';
import { closeEditModal, showToast } from '../../store/uiSlice';
import { fetchTransactions, fetchDashboard } from '../../store/financeSlice';
import { fetchPantry } from '../../store/pantrySlice';
import { api } from '../../services/api';

export default function EditTransactionModal() {
  const dispatch = useDispatch();
  const { isOpen, txId } = useSelector((state) => state.ui.editModal);
  const { funds, categoriesExpense, categoriesIncome } = useSelector((state) => state.finance);

  const [loadingFetch, setLoadingFetch] = useState(false);
  const [concept, setConcept] = useState('');
  const [total, setTotal] = useState(0);
  const [date, setDate] = useState('');
  const [type, setType] = useState('gasto');
  const [selectedFund, setSelectedFund] = useState('personal');
  const [categoryId, setCategoryId] = useState('');
  const [thirdAmount, setThirdAmount] = useState(0);
  const [ownAmount, setOwnAmount] = useState(0);
  const [items, setItems] = useState([]);
  const [loadingSave, setLoadingSave] = useState(false);

  useEffect(() => {
    if (isOpen && txId) {
      setLoadingFetch(true);
      api.getTransaction(txId)
        .then((res) => {
          setLoadingFetch(false);
          if (res.ok && res.data) {
            const tx = res.data;
            setConcept(tx.descripcion || '');
            const t = parseFloat(tx.monto || 0);
            setTotal(t);
            setDate(tx.fecha?.substring(0, 10) || new Date().toISOString().substring(0, 10));
            setType(tx.tipo || 'gasto');
            setCategoryId(tx.id_categoria || 'general');

            const isSplit = tx.monto_terceros > 0 && tx.monto_propio > 0;
            if (isSplit) {
              setSelectedFund('split');
              setThirdAmount(parseFloat(tx.monto_terceros || 0));
              setOwnAmount(parseFloat(tx.monto_propio || 0));
            } else {
              setSelectedFund(tx.id_fondo || tx.id_cuenta || 'personal');
              setThirdAmount(0);
              setOwnAmount(t);
            }

            setItems((tx.items || []).map((it) => ({
              id: it.id,
              nombre: it.nombre_producto || '',
              precio: parseFloat(it.precio || 0),
              estado: it.estado || 'activo'
            })));
          }
        })
        .catch(() => {
          setLoadingFetch(false);
          dispatch(showToast({ message: 'Error cargando datos de la transacción', icon: '❌' }));
        });
    }
  }, [isOpen, txId, dispatch]);

  if (!isOpen) return null;

  const isIncome = type === 'ingreso';

  const handleTotalChange = (val) => {
    const newTotal = parseFloat(val || 0);
    setTotal(newTotal);
    if (selectedFund === 'split') {
      setOwnAmount(Math.max(0, newTotal - thirdAmount));
    }
  };

  const handleThirdChange = (val) => {
    const third = parseFloat(val || 0);
    setThirdAmount(third);
    setOwnAmount(Math.max(0, total - third));
  };

  const handleOwnChange = (val) => {
    const own = parseFloat(val || 0);
    setOwnAmount(own);
    setThirdAmount(Math.max(0, total - own));
  };

  const handleItemFieldChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = field === 'precio' ? parseFloat(value || 0) : value;
    setItems(updated);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleAddItem = () => {
    setItems([...items, { nombre: '', precio: 0, estado: 'activo' }]);
  };

  const handleSumItemsToTotal = () => {
    const sum = items.reduce((acc, it) => acc + (parseFloat(it.precio) || 0), 0);
    if (sum > 0) {
      setTotal(sum);
      if (selectedFund === 'split') {
        setOwnAmount(Math.max(0, sum - thirdAmount));
      } else {
        setOwnAmount(sum);
      }
      dispatch(showToast({ message: `Total actualizado a $${sum.toLocaleString()}`, icon: '⚡' }));
    }
  };

  const handleSave = async () => {
    setLoadingSave(true);
    let montoPropio = total;
    let montoTerceros = 0;
    let desgloseFondos = null;

    if (selectedFund === 'split') {
      montoTerceros = thirdAmount;
      montoPropio = ownAmount;
      desgloseFondos = [
        { id_fondo: 'padres_terceros', monto: montoTerceros },
        { id_fondo: 'personal', monto: montoPropio },
      ];
    } else if (selectedFund === 'padres_terceros' || selectedFund === 'conjunto') {
      montoPropio = 0;
      montoTerceros = total;
    }

    const payload = {
      tipo: type,
      descripcion: concept,
      monto: total,
      fecha: date,
      id_fondo: selectedFund === 'split' ? 'padres_terceros' : selectedFund,
      id_categoria: categoryId || 'general',
      monto_propio: montoPropio,
      monto_terceros: montoTerceros,
      desglose_fondos: desgloseFondos,
      items: items.filter((it) => it.nombre.trim() !== ''),
    };

    try {
      const res = await api.updateTransaction(txId, payload);
      setLoadingSave(false);
      if (res.ok) {
        dispatch(closeEditModal());
        dispatch(showToast({ message: '¡Transacción e ítems actualizados con éxito!', icon: '✅' }));
        dispatch(fetchTransactions({}));
        dispatch(fetchDashboard());
        dispatch(fetchPantry('activo'));
      } else {
        dispatch(showToast({ message: res.message || 'Error actualizando', icon: '❌' }));
      }
    } catch {
      setLoadingSave(false);
      dispatch(showToast({ message: 'Error de conexión al actualizar', icon: '❌' }));
    }
  };

  const catList = isIncome ? categoriesIncome : categoriesExpense;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 glass flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 sticky top-0 bg-white dark:bg-[#131b2e] z-10">
          <h3 className="font-bold text-base flex items-center space-x-2">
            <span>✏️</span>
            <span>Editar Transacción #{txId}</span>
          </h3>
          <button
            onClick={() => dispatch(closeEditModal())}
            className="p-1 rounded-full text-slate-400 hover:text-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loadingFetch ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            <span className="text-xs">Cargando transacción e ítems...</span>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Concepto / Comercio</label>
              <input
                type="text"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Total (COP)</label>
                <input
                  type="number"
                  value={total}
                  onChange={(e) => handleTotalChange(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm font-bold text-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Fecha</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none"
                />
              </div>
            </div>

            {/* Fund Selector */}
            <div>
              <label className="block text-slate-400 mb-1.5">Fondo / Origen del Dinero</label>
              <div className="grid grid-cols-3 gap-2">
                {funds.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFund(f.id)}
                    className={`px-2.5 py-2 rounded-xl text-xs font-semibold border transition text-center truncate ${
                      selectedFund === f.id
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'bg-slate-50 dark:bg-[#0b0f19] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {f.nombre.split(' ')[0]} {f.nombre.split(' ')[1] || ''}
                  </button>
                ))}
                {!isIncome && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFund('split');
                      setOwnAmount(total - thirdAmount);
                    }}
                    className={`px-2.5 py-2 rounded-xl text-xs font-semibold border transition text-center col-span-3 ${
                      selectedFund === 'split'
                        ? 'bg-purple-500 text-white border-purple-500'
                        : 'bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20 text-purple-600 dark:text-purple-400'
                    }`}
                  >
                    🍕 Pago Dividido / Mixto
                  </button>
                )}
              </div>
            </div>

            {/* Split Section */}
            {selectedFund === 'split' && (
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl space-y-2">
                <div className="flex items-center justify-between font-bold text-purple-400">
                  <span>🍕 Desglose de Fondos</span>
                  <span>Mío: ${Number(ownAmount).toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400">Aporte Terceros</label>
                    <input
                      type="number"
                      value={thirdAmount}
                      onChange={(e) => handleThirdChange(e.target.value)}
                      className="w-full bg-[#0b0f19] border border-slate-800 rounded-lg px-2 py-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Aporte Propio</label>
                    <input
                      type="number"
                      value={ownAmount}
                      onChange={(e) => handleOwnChange(e.target.value)}
                      className="w-full bg-[#0b0f19] border border-slate-800 rounded-lg px-2 py-1 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Category */}
            <div>
              <label className="block text-slate-400 mb-1.5">Categoría</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none"
              >
                {catList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* LINKED ITEMS EDITING */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  🛒 Productos Vinculados en Despensa ({items.length})
                </label>
                <div className="flex items-center space-x-1.5">
                  {items.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSumItemsToTotal}
                      className="text-[10px] font-bold text-purple-400 hover:text-purple-300 bg-purple-500/10 px-2 py-1 rounded-lg flex items-center space-x-1"
                      title="Calcular Total de la Factura sumando los precios de los productos"
                    >
                      <Calculator className="w-3 h-3" />
                      <span>Sumar a Total</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-[10px] font-bold text-emerald-500 hover:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Agregar</span>
                  </button>
                </div>
              </div>

              {items.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic py-1">
                  Esta transacción no tiene productos específicos vinculados.
                </p>
              ) : (
                <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
                  {items.map((it, idx) => (
                    <div
                      key={it.id || idx}
                      className="p-2 bg-slate-50 dark:bg-[#0b0f19] rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={it.nombre}
                          onChange={(e) => handleItemFieldChange(idx, 'nombre', e.target.value)}
                          placeholder="Nombre del producto..."
                          className="flex-1 bg-transparent border-none text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-slate-400 hover:text-rose-500 transition"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center space-x-2 text-[11px]">
                        <div className="flex items-center space-x-1 w-28 bg-white dark:bg-[#131b2e] px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
                          <span className="text-slate-400 text-[10px]">$</span>
                          <input
                            type="number"
                            value={it.precio}
                            onChange={(e) => handleItemFieldChange(idx, 'precio', e.target.value)}
                            placeholder="0"
                            className="w-full bg-transparent border-none font-bold text-emerald-500 focus:outline-none text-right text-xs"
                          />
                        </div>

                        <select
                          value={it.estado}
                          onChange={(e) => handleItemFieldChange(idx, 'estado', e.target.value)}
                          className="bg-white dark:bg-[#131b2e] px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
                        >
                          <option value="activo">🟢 Activo en Despensa</option>
                          <option value="consumido">🍽️ Consumido</option>
                          <option value="dañado">⚠️ Dañado</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800 sticky bottom-0 bg-white dark:bg-[#131b2e]">
          <button
            onClick={() => dispatch(closeEditModal())}
            className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loadingSave || loadingFetch}
            className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/30"
          >
            {loadingSave ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
