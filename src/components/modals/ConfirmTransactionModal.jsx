import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Plus, Trash2, Calculator, ChevronDown, ChevronUp, Check, Wallet, Users, HandCoins } from 'lucide-react';
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
  
  // Split payment state
  const [isSplit, setIsSplit] = useState(false);
  const [splitType, setSplitType] = useState('shared'); // 'shared' | 'loan'
  const [thirdAmount, setThirdAmount] = useState(0);
  const [ownAmount, setOwnAmount] = useState(0);
  const [lenderNote, setLenderNote] = useState('');
  
  const [items, setItems] = useState([]);
  const [showItemsAccordion, setShowItemsAccordion] = useState(false);
  const [loading, setLoading] = useState(false);

  const isIncome = data?.tipo === 'ingreso';
  const raw = isIncome ? data?.datos_ingreso : data?.datos_gasto;

  // Initialize ONLY when modal opens or data changes
  useEffect(() => {
    if (isOpen && data && raw) {
      setConcept(raw.comercio || raw.concepto || (isIncome ? 'Ingreso' : 'Gasto'));
      const t = parseFloat(raw.total || raw.monto || 0);
      setTotal(t);
      setDate(raw.fecha || new Date().toISOString().substring(0, 10));

      const initialFund = raw.fondo_sugerido || (isIncome ? raw.fondo_destino : 'personal') || 'personal';
      const hasSplitData = raw.monto_terceros > 0 && raw.monto_propio > 0;

      setSelectedFund(initialFund === 'split' ? 'personal' : initialFund);

      if (hasSplitData) {
        setIsSplit(true);
        const isLoanCandidate =
          raw.nota_encargo?.toLowerCase().includes('préstamo') ||
          raw.nota_encargo?.toLowerCase().includes('prestamo');
        setSplitType(isLoanCandidate ? 'loan' : 'shared');
        setThirdAmount(raw.monto_terceros || 0);
        setOwnAmount(raw.monto_propio || 0);
        setLenderNote(raw.nota_encargo || '');
      } else {
        setIsSplit(false);
        setSplitType('shared');
        setThirdAmount(0);
        setOwnAmount(t);
        setLenderNote('');
      }

      // Smart Category Matching
      const catList = isIncome ? categoriesIncome : categoriesExpense;
      const matchedCat = catList.find(
        (c) => c.id === raw.categoria_sugerida || c.id === (raw.id_categoria || '')
      ) || (catList.length > 0 ? catList[0] : { id: 'mercado' });

      setCategoryId(matchedCat.id);

      // Initialize editable items
      if (raw.items && Array.isArray(raw.items) && raw.items.length > 0) {
        setItems(
          raw.items.map((it, idx) => ({
            id_temp: idx,
            nombre: it.nombre || it.nombre_producto || '',
            precio: parseFloat(it.precio || 0),
          }))
        );
        setShowItemsAccordion(true);
      } else {
        setItems([]);
        setShowItemsAccordion(false);
      }
    }
  }, [isOpen, data]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  const handleTotalChange = (val) => {
    const newTotal = parseFloat(val || 0);
    setTotal(newTotal);
    if (isSplit) {
      const own = Math.max(0, newTotal - thirdAmount);
      setOwnAmount(own);
    } else {
      setOwnAmount(newTotal);
    }
  };

  const handleToggleSplit = () => {
    const nextState = !isSplit;
    setIsSplit(nextState);
    if (nextState) {
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
    setShowItemsAccordion(true);
  };

  const handleSumItemsToTotal = () => {
    const sum = items.reduce((acc, it) => acc + (parseFloat(it.precio) || 0), 0);
    if (sum > 0) {
      setTotal(sum);
      if (isSplit) {
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

    if (isSplit) {
      montoTerceros = thirdAmount;
      montoPropio = ownAmount;
      if (splitType === 'loan') {
        desgloseFondos = [
          { id_fondo: 'prestamo_deuda', monto: montoTerceros, prestamista: lenderNote },
          { id_fondo: selectedFund, monto: montoPropio },
        ];
      } else {
        desgloseFondos = [
          { id_fondo: 'terceros_compartido', monto: montoTerceros },
          { id_fondo: selectedFund, monto: montoPropio },
        ];
      }
    } else if (selectedFund === 'padres_terceros') {
      montoPropio = 0;
      montoTerceros = total;
    }

    let finalDesc = concept;
    if (isSplit) {
      if (splitType === 'loan') {
        finalDesc += lenderNote ? ` (Préstamo: ${lenderNote})` : ' (Préstamo)';
      } else {
        finalDesc += ' (Dividido)';
      }
    }

    const payload = {
      tipo: isIncome ? 'ingreso' : 'gasto',
      descripcion: finalDesc,
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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#131b2e] border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[92vh] sm:max-h-[88vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-4 sm:zoom-in duration-200">
        
        {/* Sticky Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 sticky top-0 bg-white dark:bg-[#131b2e] z-20">
          <h3 className="font-bold text-sm sm:text-base flex items-center space-x-2 text-slate-900 dark:text-slate-100">
            <span>{isIncome ? '💰' : '🧾'}</span>
            <span>{isIncome ? 'Confirmar Ingreso' : 'Confirmar Gasto / Factura'}</span>
          </h3>
          <button
            onClick={() => dispatch(closeConfirmModal())}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Concept / Merchant */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Concepto / Comercio</label>
            <input
              type="text"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Amount and Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Total Factura (COP)</label>
              <input
                type="number"
                value={total}
                onChange={(e) => handleTotalChange(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-bold text-emerald-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Fecha</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Fund / Pocket Selector */}
          <div>
            <label className="block text-slate-400 mb-1.5 font-medium flex items-center space-x-1">
              <Wallet className="w-3.5 h-3.5 text-purple-400" />
              <span>Bolsillo / Origen del Dinero</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {funds.map((f) => {
                const isSel = selectedFund === f.id;
                const emoji = f.nombre.split(' ')[0];
                const cleanName = f.nombre.substring(f.nombre.indexOf(' ') + 1) || f.nombre;

                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFund(f.id)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition text-left sm:text-center flex items-center sm:justify-center space-x-2 touch-manipulation active:scale-98 ${
                      isSel
                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                        : 'bg-slate-50 dark:bg-[#0b0f19] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500/40'
                    }`}
                  >
                    <span className="text-sm">{emoji}</span>
                    <span className="truncate">{cleanName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-slate-400 mb-1.5 font-medium">Categoría del Gasto</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-emerald-500 transition touch-manipulation cursor-pointer"
            >
              {catList.map((c) => (
                <option
                  key={c.id}
                  value={c.id}
                  className="bg-white dark:bg-[#131b2e] text-slate-900 dark:text-slate-100 py-1.5"
                >
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* SPLIT & LOAN SECTION (COEXISTENCE OF SHARED SPLIT AND LOAN) */}
          {!isIncome && (
            <div className="p-3.5 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 transition">
              <div
                className="flex items-center justify-between cursor-pointer select-none touch-manipulation"
                onClick={handleToggleSplit}
              >
                <div className="flex items-center space-x-2.5">
                  <span className="text-base">🍕</span>
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      ¿Dividir este pago con terceros o préstamo?
                    </span>
                    <p className="text-[10px] text-slate-400">
                      Pago compartido o dinero prestado para no asumir el 100%
                    </p>
                  </div>
                </div>

                {/* Switch Graphic */}
                <div
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out flex-shrink-0 ${
                    isSplit ? 'bg-purple-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-200 ease-in-out ${
                      isSplit ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>

              {/* Unfolded Split Box */}
              {isSplit && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 space-y-3 animate-in fade-in duration-150">
                  
                  {/* Mode Selector: Shared Split vs Loan */}
                  <div className="flex bg-slate-100 dark:bg-[#131b2e] p-1 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setSplitType('shared')}
                      className={`flex-1 py-1.5 rounded-lg flex items-center justify-center space-x-1.5 transition ${
                        splitType === 'shared'
                          ? 'bg-purple-500 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>🍕 Pago Compartido</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSplitType('loan')}
                      className={`flex-1 py-1.5 rounded-lg flex items-center justify-center space-x-1.5 transition ${
                        splitType === 'loan'
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <HandCoins className="w-3.5 h-3.5" />
                      <span>🤝 Con Préstamo (Deuda)</span>
                    </button>
                  </div>

                  {/* Amounts inputs */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-emerald-400 mb-1">
                        💰 Mi Parte (De mi saldo)
                      </label>
                      <input
                        type="number"
                        value={ownAmount}
                        onChange={(e) => handleOwnChange(e.target.value)}
                        className="w-full bg-white dark:bg-[#131b2e] border border-emerald-500/40 rounded-xl px-2.5 py-1.5 text-xs font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className={`block text-[10px] font-semibold mb-1 ${splitType === 'loan' ? 'text-amber-400' : 'text-purple-400'}`}>
                        {splitType === 'loan' ? '🤝 Me Prestaron' : '👥 Parte de Terceros'}
                      </label>
                      <input
                        type="number"
                        value={thirdAmount}
                        onChange={(e) => handleThirdChange(e.target.value)}
                        className={`w-full bg-white dark:bg-[#131b2e] border rounded-xl px-2.5 py-1.5 text-xs font-bold focus:outline-none ${
                          splitType === 'loan'
                            ? 'border-amber-500/40 text-amber-400 focus:border-amber-500'
                            : 'border-purple-500/40 text-purple-400 focus:border-purple-500'
                        }`}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Optional Note / Lender */}
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">
                      {splitType === 'loan' ? 'Prestamista / A quién devolver (Opcional)' : 'Nota de la división (Opcional)'}
                    </label>
                    <input
                      type="text"
                      placeholder={splitType === 'loan' ? 'Ej. Me prestó Cami / Papás / Amigo' : 'Ej. Almuerzo mitad y mitad con amigos'}
                      value={lenderNote}
                      onChange={(e) => setLenderNote(e.target.value)}
                      className="w-full bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  {/* Summary Helper */}
                  <div className={`text-[10px] p-2.5 rounded-xl border leading-relaxed ${
                    splitType === 'loan'
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                      : 'bg-purple-500/10 border-purple-500/20 text-purple-300'
                  }`}>
                    {splitType === 'loan' ? (
                      <span>
                        🤝 <strong>Préstamo:</strong> De tu saldo saldrán <strong className="text-emerald-400">${Number(ownAmount).toLocaleString()}</strong>. Los <strong className="text-amber-400">${Number(thirdAmount).toLocaleString()}</strong> quedan registrados como dinero prestado para que lo devuelvas más adelante.
                      </span>
                    ) : (
                      <span>
                        🍕 <strong>Pago Compartido:</strong> De tu saldo saldrán <strong className="text-emerald-400">${Number(ownAmount).toLocaleString()}</strong>. Los <strong className="text-purple-400">${Number(thirdAmount).toLocaleString()}</strong> restantes los cubrió otra persona (no genera deuda).
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* EDITABLE ITEMS GRID (COLLAPSIBLE ACCORDION) */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div
              className="flex items-center justify-between cursor-pointer select-none py-1"
              onClick={() => setShowItemsAccordion(!showItemsAccordion)}
            >
              <div className="flex items-center space-x-1.5 font-semibold text-slate-700 dark:text-slate-300">
                <span>🛒</span>
                <span>Productos para Despensa ({items.length})</span>
                {showItemsAccordion ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>

              <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSumItemsToTotal}
                    className="text-[10px] font-bold text-purple-400 hover:text-purple-300 bg-purple-500/10 px-2 py-1 rounded-lg flex items-center space-x-1"
                    title="Calcular Total sumando precios"
                  >
                    <Calculator className="w-3 h-3" />
                    <span className="hidden sm:inline">Sumar a Total</span>
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

            {showItemsAccordion && (
              <div className="space-y-1.5 animate-in fade-in duration-150">
                {items.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic py-1 text-center">
                    No hay productos agregados.
                  </p>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {items.map((it, idx) => (
                      <div
                        key={it.id_temp || idx}
                        className="flex items-center space-x-2 p-1.5 bg-slate-50 dark:bg-[#0b0f19] rounded-xl border border-slate-200 dark:border-slate-800"
                      >
                        <input
                          type="text"
                          value={it.nombre}
                          onChange={(e) => handleItemNameChange(idx, e.target.value)}
                          placeholder="Producto..."
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
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="flex items-center space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800 sticky bottom-0 bg-white dark:bg-[#131b2e] z-20">
          <button
            type="button"
            onClick={() => dispatch(closeConfirmModal())}
            className="flex-1 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-98 touch-manipulation"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/30 active:scale-98 touch-manipulation flex items-center justify-center space-x-1.5"
          >
            {loading ? <span>Guardando...</span> : <><span>Guardar</span><Check className="w-4 h-4" /></>}
          </button>
        </div>
      </div>
    </div>
  );
}
