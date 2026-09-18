// API Client for FastAPI Backend
const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getHeaders() {
  const token = localStorage.getItem('pwa_token') || '';
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
}

export const api = {
  // Auth
  async verifyPin(pin) {
    const res = await fetch(`${API_BASE}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin })
    });
    return res.json();
  },

  // Funds & Categories
  async getFunds() {
    const res = await fetch(`${API_BASE}/funds`, { headers: getHeaders() });
    return res.json();
  },

  async getCategories(tipo = 'gasto') {
    const res = await fetch(`${API_BASE}/categories?tipo=${tipo}`, { headers: getHeaders() });
    return res.json();
  },

  // Dashboard & Analytics
  async getDashboard() {
    const res = await fetch(`${API_BASE}/dashboard`, { headers: getHeaders() });
    return res.json();
  },

  async getAnalytics(period = 'month') {
    const res = await fetch(`${API_BASE}/analytics?period=${period}`, { headers: getHeaders() });
    return res.json();
  },

  async getCategoryDrilldown(categoryId, period = 'month') {
    const res = await fetch(`${API_BASE}/analytics/category/${categoryId}?period=${period}`, { headers: getHeaders() });
    return res.json();
  },

  // Transactions
  async getTransactions(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/transactions?${query}`, { headers: getHeaders() });
    return res.json();
  },

  async getTransaction(txId) {
    const res = await fetch(`${API_BASE}/transactions/${txId}`, { headers: getHeaders() });
    return res.json();
  },

  async createTransaction(data) {
    const res = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateTransaction(txId, data) {
    const res = await fetch(`${API_BASE}/transactions/${txId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async deleteTransaction(txId) {
    const res = await fetch(`${API_BASE}/transactions/${txId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  },

  async processText(text) {
    const res = await fetch(`${API_BASE}/transactions/process-text`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ text })
    });
    return res.json();
  },

  async scanReceipt(file) {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('pwa_token') || '';
    const res = await fetch(`${API_BASE}/transactions/scan-receipt`, {
      method: 'POST',
      headers: { 'Authorization': token ? `Bearer ${token}` : '' },
      body: formData
    });
    return res.json();
  },

  // Pantry (FIFO)
  async getPantry(estado = 'activo') {
    const res = await fetch(`${API_BASE}/pantry?estado=${estado}`, { headers: getHeaders() });
    return res.json();
  },

  async updatePantryStatus(id_item, estado) {
    const res = await fetch(`${API_BASE}/pantry/update`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ id_item, estado })
    });
    return res.json();
  }
};
