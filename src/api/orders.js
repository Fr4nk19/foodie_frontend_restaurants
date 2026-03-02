import api from './axios';

// ── Orders live under /branches/{branch}/orders ───────────────────────────

export const getOrders = (branchId, params = {}) =>
  api.get(`/branches/${branchId}/orders`, { params });

export const getOrder = (branchId, orderId) =>
  api.get(`/branches/${branchId}/orders/${orderId}`);

export const createOrder = (branchId, data) =>
  api.post(`/branches/${branchId}/orders`, data);

// status: confirmed | in_progress | ready | served | cancelled
export const updateOrderStatus = (branchId, orderId, status) =>
  api.patch(`/branches/${branchId}/orders/${orderId}/status`, { status });

export const deleteOrder = (branchId, orderId) =>
  api.delete(`/branches/${branchId}/orders/${orderId}`);
