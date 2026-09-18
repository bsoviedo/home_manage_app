import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardPage from './DashboardPage';
import AnalyticsPage from './AnalyticsPage';
import PantryPage from './PantryPage';
import HistoryPage from './HistoryPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/pantry" element={<PantryPage />} />
      <Route path="/history" element={<HistoryPage />} />
    </Routes>
  );
}
