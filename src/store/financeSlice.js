import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../services/api';

export const fetchInitialFinanceData = createAsyncThunk('finance/fetchInitial', async () => {
  const [fundsRes, catExpRes, catIncRes, dashRes] = await Promise.all([
    api.getFunds(),
    api.getCategories('gasto'),
    api.getCategories('ingreso'),
    api.getDashboard()
  ]);
  return {
    funds: fundsRes.data || [],
    categoriesExpense: catExpRes.data || [],
    categoriesIncome: catIncRes.data || [],
    dashboard: dashRes
  };
});

export const fetchDashboard = createAsyncThunk('finance/fetchDashboard', async () => {
  return await api.getDashboard();
});

export const fetchAnalytics = createAsyncThunk('finance/fetchAnalytics', async (period) => {
  return await api.getAnalytics(period);
});

export const fetchTransactions = createAsyncThunk('finance/fetchTransactions', async (params) => {
  const res = await api.getTransactions(params);
  return res.data || [];
});

const financeSlice = createSlice({
  name: 'finance',
  initialState: {
    funds: [],
    categoriesExpense: [],
    categoriesIncome: [],
    dashboard: null,
    analytics: null,
    transactions: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInitialFinanceData.fulfilled, (state, action) => {
        state.funds = action.payload.funds;
        state.categoriesExpense = action.payload.categoriesExpense;
        state.categoriesIncome = action.payload.categoriesIncome;
        state.dashboard = action.payload.dashboard;
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.dashboard = action.payload;
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.analytics = action.payload;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.transactions = action.payload;
      });
  }
});

export default financeSlice.reducer;
