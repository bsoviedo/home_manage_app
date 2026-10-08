import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Wallet,
  TrendingDown,
  TrendingUp,
  X,
  Trash2,
  Check,
  Sparkles,
  AlertCircle,
  Tag
} from 'lucide-react';
import { api } from '../services/api';
import { openConfirmModal, showToast } from '../store/uiSlice';
import { fetchDashboard } from '../store/financeSlice';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const WEEKDAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export default function CalendarPage() {
  const dispatch = useDispatch();
  const { funds, dashboard } = useSelector((state) => state.finance);

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-12
  const [calendarData, setCalendarData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Selected Day Modal
  const [selectedDayData, setSelectedDayData] = useState(null);

  // Event Create / Edit Modal
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState('ingreso'); // 'ingreso' | 'gasto'
  const [eventDay, setEventDay] = useState(15);
  const [eventRecurrence, setEventRecurrence] = useState('mensual');
  const [eventFund, setEventFund] = useState('personal');
  const [eventAmount, setEventAmount] = useState('');
  const [savingEvent, setSavingEvent] = useState(false);

  const formatCOP = (val) => '$' + Number(val || 0).toLocaleString('es-CO');

  const loadMonthData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getCalendarMonth(currentYear, currentMonth);
      if (res && res.ok) {
        setCalendarData(res);
      }
    } catch {
      dispatch(showToast({ message: 'Error cargando datos del calendario', icon: '❌' }));
    } finally {
      setLoading(false);
    }
  }, [currentYear, currentMonth, dispatch]);

  useEffect(() => {
    loadMonthData();
  }, [loadMonthData]);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleGoToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth() + 1);
  };

  // Day click handler
  const handleDayClick = (dayObj) => {
    setSelectedDayData(dayObj);
  };

  // Open Event Modal
  const handleOpenAddEvent = (presetDay = null) => {
    setEditingEvent(null);
    setEventTitle('');
    setEventType('ingreso');
    setEventDay(presetDay || today.getDate());
    setEventRecurrence('mensual');
    setEventFund('personal');
    setEventAmount('');
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    setSavingEvent(true);
    try {
      const payload = {
        id: editingEvent?.id || undefined,
        titulo: eventTitle.trim(),
        tipo: eventType,
        dia_mes: Number(eventDay),
        recurrencia: eventRecurrence,
        id_fondo: eventFund,
        monto_estimado: Number(eventAmount) || 0,
        color: eventType === 'ingreso' ? (eventFund === 'conjunto' ? 'purple' : 'emerald') : 'rose'
      };

      const res = await api.saveCalendarEvent(payload);
      setSavingEvent(false);
      if (res && res.ok) {
        dispatch(showToast({ message: '¡Fecha clave guardada en el calendario!', icon: '📅' }));
        setIsEventModalOpen(false);
        loadMonthData();
      }
    } catch {
      setSavingEvent(false);
      dispatch(showToast({ message: 'Error guardando evento', icon: '❌' }));
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('¿Deseas eliminar esta fecha programada del calendario?')) return;
    try {
      const res = await api.deleteCalendarEvent(eventId);
      if (res && res.ok) {
        dispatch(showToast({ message: 'Fecha programada eliminada', icon: '🗑️' }));
        loadMonthData();
        if (selectedDayData) {
          setSelectedDayData((prev) =>
            prev ? { ...prev, eventos: prev.eventos.filter((e) => e.id !== eventId) } : null
          );
        }
      }
    } catch {
      dispatch(showToast({ message: 'Error eliminando evento', icon: '❌' }));
    }
  };

  // Quick transaction on date
  const handleAddTransactionOnDate = (dateStr) => {
    dispatch(
      openConfirmModal({
        tipo: 'gasto',
        datos_gasto: {
          comercio: '',
          total: 0,
          fecha: dateStr,
          fondo_sugerido: 'personal'
        }
      })
    );
    setSelectedDayData(null);
  };

  // Compute offset for the 1st day of the month (Monday = 0 ... Sunday = 6)
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();
  // In JS getDay(): Sunday = 0, Monday = 1, etc. Convert to Monday = 0:
  const firstDayOffset = (firstDayOfMonth + 6) % 7;

  const daysList = calendarData?.dias || [];
  const proximoPago = calendarData?.proximo_pago;
  const saldoTotalDisponible = dashboard?.resumen?.patrimonio_neto || 0;
  const diasRestantes = proximoPago?.dias_restantes;
  const presupuestoDiario =
    diasRestantes && diasRestantes > 0 && saldoTotalDisponible > 0
      ? Math.round(saldoTotalDisponible / diasRestantes)
      : null;

  return (
    <div className="space-y-6">
      {/* HEADER & CONTROLS */}
      <div className="bg-white dark:bg-[#131b2e] p-4 md:p-5 rounded-3xl border border-slate-200 dark:border-[#1f293d] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5 text-purple-400" />
            <span>Calendario Financiero & Días de Pago</span>
          </h1>
          <p className="text-xs text-slate-400">
            Control de nóminas, aportes, vencimientos y flujo diario de gastos
          </p>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <div className="flex items-center bg-slate-100 dark:bg-[#0b0f19] p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-800 transition"
              title="Mes Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 text-xs font-bold text-slate-900 dark:text-slate-100 min-w-[120px] text-center">
              {MONTH_NAMES[currentMonth - 1]} {currentYear}
            </span>

            <button
              onClick={handleNextMonth}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-800 transition"
              title="Mes Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleGoToday}
            className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition"
          >
            Hoy
          </button>

          <button
            onClick={() => handleOpenAddEvent()}
            className="px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/20 transition flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Programar Fecha</span>
          </button>
        </div>
      </div>

      {/* COUNTDOWN & DAILY BUDGET BANNER */}
      {proximoPago && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Card 1: Next Payment */}
          <div className="p-4 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 rounded-2xl flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Próximo Día de Pago</span>
              </span>
              <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {proximoPago.titulo}
              </div>
              <div className="text-xs text-slate-400">{proximoPago.fecha}</div>
            </div>
            <div className="text-right">
              <span className="px-2.5 py-1 bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm">
                {proximoPago.dias_restantes === 0
                  ? '¡Hoy! 🎉'
                  : `En ${proximoPago.dias_restantes} días`}
              </span>
            </div>
          </div>

          {/* Card 2: Recommended Daily Budget */}
          <div className="p-4 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border border-purple-500/20 rounded-2xl flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-purple-400 font-bold flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ritmo de Gasto Sugerido</span>
              </span>
              <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {presupuestoDiario ? formatCOP(presupuestoDiario) + ' / día' : 'Control Activo'}
              </div>
              <div className="text-xs text-slate-400">Para llegar con saldo al pago</div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
              ⚡
            </div>
          </div>

          {/* Card 3: Month Flow */}
          <div className="p-4 bg-slate-50 dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                Movimientos del Mes
              </span>
              <div className="flex items-center space-x-3 text-xs font-bold">
                <span className="text-emerald-400">
                  +{formatCOP(calendarData?.resumen_mes?.total_ingresos || 0)}
                </span>
                <span className="text-rose-400">
                  -{formatCOP(calendarData?.resumen_mes?.total_gastos_bruto || 0)}
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                {calendarData?.resumen_mes?.cantidad_transacciones || 0} transacciones registradas
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
              📊
            </div>
          </div>
        </div>
      )}

      {/* MONTHLY CALENDAR GRID */}
      <div className="bg-white dark:bg-[#131b2e] p-3 md:p-6 rounded-3xl border border-slate-200 dark:border-[#1f293d] shadow-sm">
        {/* Weekday Header */}
        <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2 text-center text-xs font-bold text-slate-400">
          {WEEKDAY_NAMES.map((w) => (
            <div key={w} className="py-1">
              {w}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {/* Blank Offset Cells */}
          {Array.from({ length: firstDayOffset }).map((_, i) => (
            <div
              key={`blank-${i}`}
              className="min-h-[75px] md:min-h-[105px] p-1.5 rounded-2xl bg-slate-50/50 dark:bg-[#0b0f19]/30 border border-transparent opacity-30"
            />
          ))}

          {/* Month Day Cells */}
          {daysList.map((d) => {
            const isToday =
              d.dia === today.getDate() &&
              currentMonth === today.getMonth() + 1 &&
              currentYear === today.getFullYear();

            const hasEvents = d.eventos.length > 0;
            const hasTx = d.cantidad_transacciones > 0;

            return (
              <div
                key={`day-${d.dia}`}
                onClick={() => handleDayClick(d)}
                className={`min-h-[75px] md:min-h-[105px] p-1.5 md:p-2 rounded-2xl border transition flex flex-col justify-between cursor-pointer group relative ${
                  isToday
                    ? 'bg-emerald-50/50 dark:bg-emerald-500/10 border-emerald-500/50 shadow-sm'
                    : 'bg-slate-50/80 dark:bg-[#0b0f19] border-slate-200/80 dark:border-slate-800/80 hover:border-purple-500/40'
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday
                        ? 'bg-emerald-500 text-white font-black shadow-sm'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {d.dia}
                  </span>

                  {hasEvents && (
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                  )}
                </div>

                {/* Day Content Badges */}
                <div className="space-y-1 my-1 overflow-hidden">
                  {/* Scheduled Events */}
                  {d.eventos.map((ev) => (
                    <div
                      key={ev.id}
                      className={`text-[9px] md:text-[10px] font-semibold px-1.5 py-0.5 rounded-md truncate ${
                        ev.tipo === 'ingreso'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                      }`}
                      title={ev.titulo}
                    >
                      {ev.titulo}
                    </div>
                  ))}

                  {/* Real Transactions Badge */}
                  {hasTx && (
                    <div className="text-[9px] font-medium text-slate-400 dark:text-slate-400 flex items-center justify-between">
                      {d.total_gastos > 0 && (
                        <span className="text-rose-400 font-semibold truncate">
                          -{formatCOP(d.total_gastos).replace(' COP', '')}
                        </span>
                      )}
                      {d.total_ingresos > 0 && (
                        <span className="text-emerald-400 font-semibold truncate">
                          +{formatCOP(d.total_ingresos).replace(' COP', '')}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom marker */}
                <div className="text-[9px] text-slate-400 text-right opacity-0 group-hover:opacity-100 transition">
                  {d.cantidad_transacciones > 0 && `${d.cantidad_transacciones} movs`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DAY DETAIL MODAL / DRAWER */}
      {selectedDayData && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 md:p-6 max-w-md w-full shadow-2xl space-y-4 max-h-[88vh] overflow-y-auto relative">
            <button
              onClick={() => setSelectedDayData(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div>
              <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">
                Detalle del Día
              </span>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                {selectedDayData.fecha}
              </h3>
            </div>

            {/* Scheduled Events Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>Fechas Clave & Pagos Programados</span>
                <button
                  onClick={() => {
                    setSelectedDayData(null);
                    handleOpenAddEvent(selectedDayData.dia);
                  }}
                  className="text-purple-400 hover:underline flex items-center space-x-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Programar</span>
                </button>
              </div>

              {selectedDayData.eventos.length === 0 ? (
                <p className="text-xs text-slate-400 bg-slate-50 dark:bg-[#0b0f19] p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 italic">
                  No hay fechas de pago programadas para este día.
                </p>
              ) : (
                selectedDayData.eventos.map((ev) => (
                  <div
                    key={ev.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between ${
                      ev.tipo === 'ingreso'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs">{ev.titulo}</div>
                      <div className="text-[10px] opacity-80">
                        {ev.tipo === 'ingreso' ? '📥 Ingreso Programado' : '💸 Fecha Límite de Pago'} •{' '}
                        {ev.recurrencia === 'mensual' ? 'Cada mes' : 'Fecha única'}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteEvent(ev.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 transition"
                      title="Eliminar evento programado"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Actual Transactions Section */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>Movimientos Reales ({selectedDayData.transacciones.length})</span>
                <button
                  onClick={() => handleAddTransactionOnDate(selectedDayData.fecha)}
                  className="text-emerald-400 hover:underline flex items-center space-x-1 font-bold"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Registrar Gasto</span>
                </button>
              </div>

              {selectedDayData.transacciones.length === 0 ? (
                <p className="text-xs text-slate-400 bg-slate-50 dark:bg-[#0b0f19] p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 italic">
                  No se realizaron compras ni ingresos en esta fecha.
                </p>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {selectedDayData.transacciones.map((t) => {
                    const isInc = t.tipo === 'ingreso';
                    const fLabel =
                      funds.find((f) => f.id === (t.id_fondo || t.id_cuenta))?.nombre || 'Personal';
                    return (
                      <div
                        key={t.id}
                        className="p-2.5 bg-slate-50 dark:bg-[#0b0f19] rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-[180px]">
                            {t.descripcion}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {fLabel} • {t.id_categoria}
                          </div>
                        </div>
                        <div
                          className={`font-bold ${
                            isInc ? 'text-emerald-400' : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {isInc ? '+' : '-'}
                          {formatCOP(t.monto)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Daily Totals */}
            <div className="p-3 bg-slate-100 dark:bg-[#0b0f19] rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
              <span>Total del Día:</span>
              <div className="space-x-3">
                {selectedDayData.total_ingresos > 0 && (
                  <span className="text-emerald-400">
                    +{formatCOP(selectedDayData.total_ingresos)}
                  </span>
                )}
                <span className="text-rose-400">
                  -{formatCOP(selectedDayData.total_gastos)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT EVENT MODAL */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 md:p-6 max-w-md w-full shadow-2xl space-y-4 relative">
            <button
              onClick={() => setIsEventModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-500/10 text-purple-400 rounded-2xl flex items-center justify-center border border-purple-500/20">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Programar Fecha Clave / Pago
                </h3>
                <p className="text-[11px] text-slate-400">
                  Marca cuándo te pagan o cuándo vencen tus cuentas
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-3.5 text-xs">
              {/* Event Type */}
              <div className="flex bg-slate-100 dark:bg-[#0b0f19] p-1 rounded-xl border border-slate-200 dark:border-slate-800 font-semibold">
                <button
                  type="button"
                  onClick={() => setEventType('ingreso')}
                  className={`flex-1 py-1.5 rounded-lg transition ${
                    eventType === 'ingreso'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  📥 Día que me pagan (Ingreso)
                </button>
                <button
                  type="button"
                  onClick={() => setEventType('gasto')}
                  className={`flex-1 py-1.5 rounded-lg transition ${
                    eventType === 'gasto'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  💸 Fecha Límite de Pago
                </button>
              </div>

              {/* Title */}
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Título / Concepto del Pago
                </label>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Ej. Nómina quincena, Aporte de Cami, Administración, Tarjeta"
                  className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-purple-400"
                  required
                />
              </div>

              {/* Day of Month and Estimated Amount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Día del Mes (1 - 31)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={eventDay}
                    onChange={(e) => setEventDay(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Monto Estimado (Opcional)</label>
                  <input
                    type="number"
                    value={eventAmount}
                    onChange={(e) => setEventAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              {/* Pocket / Fund */}
              <div>
                <label className="block text-slate-400 font-medium mb-1">Bolsillo Asociado</label>
                <select
                  value={eventFund}
                  onChange={(e) => setEventFund(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-400"
                >
                  {funds.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Recurrence */}
              <div>
                <label className="block text-slate-400 font-medium mb-1">Frecuencia</label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setEventRecurrence('mensual')}
                    className={`flex-1 py-1.5 rounded-xl border text-xs font-medium transition ${
                      eventRecurrence === 'mensual'
                        ? 'border-purple-500 bg-purple-500/10 text-purple-400 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-400'
                    }`}
                  >
                    🔄 Todos los meses
                  </button>
                  <button
                    type="button"
                    onClick={() => setEventRecurrence('unica_vez')}
                    className={`flex-1 py-1.5 rounded-xl border text-xs font-medium transition ${
                      eventRecurrence === 'unica_vez'
                        ? 'border-purple-500 bg-purple-500/10 text-purple-400 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-400'
                    }`}
                  >
                    📌 Solo este mes
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEvent}
                  className="flex-1 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold transition shadow-lg shadow-purple-500/20 flex items-center justify-center space-x-1.5"
                >
                  {savingEvent ? <span>Guardando...</span> : <><span>Guardar Fecha</span><Check className="w-4 h-4" /></>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
