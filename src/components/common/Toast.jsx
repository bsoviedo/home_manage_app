import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { hideToast } from '../../store/uiSlice';

export default function Toast() {
  const dispatch = useDispatch();
  const { show, message, icon } = useSelector((state) => state.ui.toast);

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        dispatch(hideToast());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, dispatch]);

  if (!show) return null;

  return (
    <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center space-x-3 text-xs font-medium animate-in fade-in slide-in-from-top-4 duration-200">
      <span>{icon}</span>
      <span>{message}</span>
    </div>
  );
}
