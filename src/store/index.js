import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import themeReducer from './themeSlice';
import financeReducer from './financeSlice';
import pantryReducer from './pantrySlice';
import uiReducer from './uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
    finance: financeReducer,
    pantry: pantryReducer,
    ui: uiReducer
  }
});
