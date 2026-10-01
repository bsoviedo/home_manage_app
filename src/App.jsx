import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DesktopSidebar from './components/layout/DesktopSidebar';
import MobileBottomNav from './components/layout/MobileBottomNav';
import Header from './components/layout/Header';
import PinLockModal from './components/auth/PinLockModal';
import ConfirmTransactionModal from './components/modals/ConfirmTransactionModal';
import EditTransactionModal from './components/modals/EditTransactionModal';
import ScanReceiptModal from './components/modals/ScanReceiptModal';
import Toast from './components/common/Toast';
import AppRoutes from './routes/AppRoutes';
import { fetchInitialFinanceData } from './store/financeSlice';

export default function App() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchInitialFinanceData());
    }
  }, [isAuthenticated, dispatch]);

  if (!isAuthenticated) {
    return <PinLockModal />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row min-h-screen">
        <DesktopSidebar />

        <main className="flex-1 p-3 md:p-6 max-w-5xl mx-auto w-full pb-28 md:pb-8 transition-all">
          <Header />
          <AppRoutes />
        </main>

        <MobileBottomNav />
      </div>

      <ConfirmTransactionModal />
      <EditTransactionModal />
      <ScanReceiptModal />
      <Toast />
    </div>
  );
}
