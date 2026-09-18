import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../services/api';

export const fetchPantry = createAsyncThunk('pantry/fetchPantry', async (estado = 'activo') => {
  const res = await api.getPantry(estado);
  return { items: res.data || [], estado };
});

export const updatePantryItem = createAsyncThunk('pantry/updateItem', async ({ id, estado }, { dispatch }) => {
  const res = await api.updatePantryStatus(id, estado);
  dispatch(fetchPantry('activo'));
  return res;
});

const pantrySlice = createSlice({
  name: 'pantry',
  initialState: {
    items: [],
    damagedItems: [],
    currentFilter: 'activo',
    searchQuery: '',
    loading: false
  },
  reducers: {
    setSearchQuery(state, action) {
      state.searchQuery = action.payload;
    },
    setPantryFilter(state, action) {
      state.currentFilter = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPantry.fulfilled, (state, action) => {
        if (action.payload.estado === 'dañado') {
          state.damagedItems = action.payload.items;
        } else {
          state.items = action.payload.items;
        }
        state.currentFilter = action.payload.estado;
      });
  }
});

export const { setSearchQuery, setPantryFilter } = pantrySlice.actions;
export default pantrySlice.reducer;
