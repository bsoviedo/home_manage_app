import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Plus, Trash2, Calculator } from 'lucide-react';
import { closeConfirmModal, showToast } from '../../store/uiSlice';
import { fetchDashboard } from '../../store/financeSlice';
import { fetchPantry } from '../../store/pantrySlice';
import { api } from '../../services/api';

export default function ConfirmTransactionModal() {
  const dispatch = useDispatch();
  const { isOpen, data } = useSelector((state) => state.ui.confirmModal);
  const { funds, categoriesExpense, categoriesIncome } = useSelector((state) => state.finance);

  const [concept, setConcept] = useState('');
  const [total, setTotal] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [selectedFund, setSelectedFund] = useState('personal');
  const [categoryId, setCategoryId] = useState('');
  const [isLoan, setIsLoan] = useState(false);
  const [thirdAmount, setThirdAmount] = useState(0);
  const [ownAmount, setOwnAmount] = useState(0);
  const [lenderNote, setLenderNote] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const isIncome = data?.tipo === 'ingreso';
  const raw = isIncome ? data?.datos_ingreso : data?.datos_gasto;

  useEffect(() => {
    if (data && raw) {
      setConcept(raw.comercio || raw.concepto || (isIncome ? 'Ingreso' : 'Gasto'));
      const t = parseFloat(raw.total || raw.monto || 0);
      setTotal(t);
      setDate(raw.fecha || new Date().toISOString().substring(0, 10));

      const initialFund = raw.fondo_sugerido || (isIncome ? raw.fondo_destino : 'personal') || 'personal';
      const hasBorrowed = raw.monto_terceros > 0 && raw.monto_propio > 0;

      setSelectedFund(initialFund === 'split' ? 'personal' : initialFund);

      if (hasBorrowed) {
        setIsLoan(true);
        setThirdAmount(raw.monto_terceros || 0);
        setOwnAmount(raw.monto_propio || 0);
        setLenderNote(raw.nota_encargo || '');
      } else {
        setIsLoan(false);
        setThirdAmount(0);
        setOwnAmount(t);
        setLenderNote('');
      }

      const catList = isIncome ? categoriesIncome : categoriesExpense;
      if (catList.length > 0) {
        setCategoryId(catList[0].id);
      }

      // Initialize editable items
      if (raw.items && Array.isArray(raw.items)) {
        setItems(raw.items.map((it, idx) => ({
          id_temp: idx,
          nombre: it.nombre || it.nombre_producto || '',
          precio: parseFloat(it.precio || 0)
        })));
      } else {
        setItems([]);
      }
    }
  }, [data, raw, isIncome, categoriesIncome, categoriesExpense]);

  if (!isOpen) return null;

  const handleTotalChange = (val) => {
    const newTotal = parseFloat(val || 0);
    setTotal(newTotal);
    if (isLoan) {
      const own = Math.max(0, newTotal - thirdAmount);
      setOwnAmount(own);
    } else {
      setOwnAmount(newTotal);
    }
  };

  const handleToggleLoan = () => {
    const nextState = !isLoan;
    setIsLoan(nextState);
    if (nextState) {
      // Default: half or 0
      const half = Math.round(total / 2);
      setThirdAmount(half);
      setOwnAmount(total - half);
    } else {
      setThirdAmount(0);
      setOwnAmount(total);
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

  // Item list editing functions
  const handleItemNameChange = (index, newName) => {
    const updated = [...items];
    updated[index].nombre = newName;
    setItems(updated);
  };

  const handleItemPriceChange = (index, newPrice) => {
    const updated = [...items];
    updated[index].precio = parseFloat(newPrice || 0);
    setItems(updated);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleAddItem = () => {
    setItems([...items, { id_temp: Date.now(), nombre: '', precio: 0 }]);
  };

  const handleSumItemsToTotal = () => {
    const sum = items.reduce((acc, it) => acc + (parseFloat(it.precio) || 0), 0);
    if (sum > 0) {
      setTotal(sum);
      if (isLoan) {
        const own = Math.max(0, sum - thirdAmount);
        setOwnAmount(own);
      } else {
        setOwnAmount(sum);
      }
      dispatch(showToast({ message: `Total actualizado a $${sum.toLocaleString()}`, icon: '⚡' }));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    let montoPropio = total;
    let montoTerceros = 0;
    let desgloseFondos = null;

    if (isLoan) {
      montoTerceros = thirdAmount;
      montoPropio = ownAmount;
      desgloseFondos = [
        { id_fondo: 'prestamo_deuda', monto: montoTerceros, prestamista: lenderNote },
        { id_fondo: selectedFund, monto: montoPropio },
      ];
    } else if (selectedFund === 'padres_terceros') {
      montoPropio = 0;
      montoTerceros = total;
    }

    const payload = {
      tipo: isIncome ? 'ingreso' : 'gasto',
      descripcion: concept + (isLoan && lenderNote ? ` (Préstamo: ${lenderNote})` : ''),
      monto: total,
      fecha: date,
      id_fondo: selectedFund,
      id_categoria: categoryId || 'general',
      monto_propio: montoPropio,
      monto_terceros: montoTerceros,
      desglose_fondos: desgloseFondos,
      items: items.filter((it) => it.nombre.trim() !== ''),
    };

    try {
      const res = await api.createTransaction(payload);
      setLoading(false);
      if (res.ok) {
        dispatch(closeConfirmModal());
        dispatch(showToast({ message: '¡Transacción e ítems registrados con éxito!', icon: '✅' }));
        dispatch(fetchDashboard());
        dispatch(fetchPantry('activo'));
      } else {
        dispatch(showToast({ message: res.message || 'Error guardando transacción', icon: '❌' }));
      }
    } catch {
      setLoading(false);
      dispatch(showToast({ message: 'Error de conexión al guardar', icon: '❌' }));
    }
  };

  const catList = isIncome ? categoriesIncome : categoriesExpense;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 glass flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 sticky top-0 bg-white dark:bg-[#131b2e] z-10">
          <h3 className="font-bold text-base flex items-center space-x-2">
            <span>{isIncome ? '💰' : '🧾'}</span>
            <span>{isIncome ? 'Confirmar Ingreso' : 'Confirmar Gasto / Factura'}</span>
          </h3>
          <button
            onClick={() => dispatch(closeConfirmModal())}
            className="p-1 rounded-full text-slate-400 hover:text-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
              <label className="block text-slate-400 mb-1">Total Factura (COP)</label>
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
            </div>
          </div>

          {/* FLUID SWITCH: BORROWED MONEY / LOAN SPLIT */}
          {!isIncome && (
            <div className="p-3.5 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 transition">
              <div
                className="flex items-center justify-between cursor-pointer select-none"
                onClick={handleToggleLoan}
              >
                <div className="flex items-center space-x-2.5">
                  <span className="text-base">🤝</span>
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      ¿Te prestaron dinero para este pago?
                    </span>
                    <p className="text-[10px] text-slate-400">
                      Divide el pago para no descontar todo de tu cuenta
                    </p>
                  </div>
                </div>

                {/* Switch Graphic */}
                <div
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${
                    isLoan ? 'bg-purple-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-200 ease-in-out ${
                      isLoan ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>

              {/* Unfolded Split Fields */}
              {isLoan && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 space-y-3 animate-in fade-in duration-150">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-purple-400 mb-1">
                        🤝 Me Prestaron (Deuda)
                      </label>
                      <input
                        type="number"
                        value={thirdAmount}
                        onChange={(e) => handleThirdChange(e.target.value)}
                        className="w-full bg-white dark:bg-[#131b2e] border border-purple-500/40 rounded-xl px-2.5 py-1.5 text-xs font-bold text-purple-400 focus:outline-none focus:border-purple-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-emerald-400 mb-1">
                        💰 De Mi Saldo Real
                      </label>
                      <input
                        type="number"
                        value={ownAmount}
                        onChange={(e) => handleOwnChange(e.target.value)}
                        className="w-full bg-white dark:bg-[#131b2e] border border-emerald-500/40 rounded-xl px-2.5 py-1.5 text-xs font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">
                      Prestamista / Nota de la Deuda (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Me prestó Cami / Papás / Amigo"
                      value={lenderNote}
                      onChange={(e) => setLenderNote(e.target.value)}
                      className="w-full bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  <div className="text-[10px] text-slate-400 bg-purple-500/10 p-2.5 rounded-xl border border-purple-500/20 leading-relaxed">
                    💡 <span className="font-semibold text-purple-300">Resumen:</span> De tu saldo solo saldrán <strong className="text-emerald-400">${Number(ownAmount).toLocaleString()}</strong>. Los <strong className="text-purple-400">${Number(thirdAmount).toLocaleString()}</strong> prestados no te descontarán saldo en este momento.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block text-slate-400 mb-1.5">Categoría del Gasto</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
            >
              {catList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* EDITABLE ITEMS GRID (OCR CORRECTION PRE-SAVE) */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                🛒 Productos para Despensa ({items.length})
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
                  <span>Agregar Producto</span>
                </button>
              </div>
            </div>

            {items.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic py-1">
                No se agregaron productos específicos. (Puedes agregarlos arriba si deseas que vayan a tu despensa).
              </p>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {items.map((it, idx) => (
                  <div
                    key={it.id_temp || idx}
                    className="flex items-center space-x-2 p-1.5 bg-slate-50 dark:bg-[#0b0f19] rounded-xl border border-slate-200 dark:border-slate-800"
                  >
                    <input
                      type="text"
                      value={it.nombre}
                      onChange={(e) => handleItemNameChange(idx, e.target.value)}
                      placeholder="Nombre del producto..."
                      className="flex-1 bg-transparent border-none text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                    <div className="flex items-center space-x-1 w-24">
                      <span className="text-slate-400 text-[10px]">$</span>
                      <input
                        type="number"
                        value={it.precio}
                        onChange={(e) => handleItemPriceChange(idx, e.target.value)}
                        placeholder="0"
                        className="w-full bg-transparent border-none text-xs font-bold text-emerald-500 focus:outline-none text-right"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1 text-slate-400 hover:text-rose-500 transition"
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800 sticky bottom-0 bg-white dark:bg-[#131b2e]">
          <button
            onClick={() => dispatch(closeConfirmModal())}
            className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/30"
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
