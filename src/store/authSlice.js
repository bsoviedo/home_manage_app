import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../services/api';

export const verifyPin = createAsyncThunk('auth/verifyPin', async (pin, { rejectWithValue }) => {
  const res = await api.verifyPin(pin);
  if (res.ok) {
    localStorage.setItem('pwa_token', res.token);
    return res.token;
  }
  return rejectWithValue(res.message || 'PIN incorrecto');
});

const initialState = {
  token: localStorage.getItem('pwa_token') || '',
  isAuthenticated: !!localStorage.getItem('pwa_token'),
  loading: false,
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      localStorage.removeItem('pwa_token');
      state.token = '';
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(verifyPin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyPin.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(verifyPin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'PIN incorrecto';
      });
  }
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
