import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    confirmModal: {
      isOpen: false,
      data: null
    },
    editModal: {
      isOpen: false,
      txId: null,
      data: null
    },
    scanModal: {
      isOpen: false,
      previewUrl: '',
      isScanning: false
    },
    toast: {
      show: false,
      message: '',
      icon: '✅'
    }
  },
  reducers: {
    openConfirmModal(state, action) {
      state.confirmModal.isOpen = true;
      state.confirmModal.data = action.payload;
    },
    closeConfirmModal(state) {
      state.confirmModal.isOpen = false;
      state.confirmModal.data = null;
    },
    openEditModal(state, action) {
      state.editModal.isOpen = true;
      state.editModal.txId = action.payload.txId;
      state.editModal.data = action.payload.data || null;
    },
    closeEditModal(state) {
      state.editModal.isOpen = false;
      state.editModal.txId = null;
      state.editModal.data = null;
    },
    openScanModal(state, action) {
      state.scanModal.isOpen = true;
      state.scanModal.previewUrl = action.payload || '';
      state.scanModal.isScanning = true;
    },
    closeScanModal(state) {
      state.scanModal.isOpen = false;
      state.scanModal.previewUrl = '';
      state.scanModal.isScanning = false;
    },
    showToast(state, action) {
      state.toast = {
        show: true,
        message: action.payload.message,
        icon: action.payload.icon || '✅'
      };
    },
    hideToast(state) {
      state.toast.show = false;
    }
  }
});

export const {
  openConfirmModal,
  closeConfirmModal,
  openEditModal,
  closeEditModal,
  openScanModal,
  closeScanModal,
  showToast,
  hideToast
} = uiSlice.actions;
export default uiSlice.reducer;
