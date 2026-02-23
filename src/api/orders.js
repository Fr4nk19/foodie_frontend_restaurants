import api from './axios';

// Orders scoped to a branch
export const getOrders = (branchId, params = {}) =>
  api.get(`/branches/${branchId}/orders`, { params });

export const getOrder = (branchId, orderId) =>
  api.get(`/branches/${branchId}/orders/${orderId}`);

export const createOrder = (branchId, data) =>
  api.post(`/branches/${branchId}/orders`, data);

export const updateOrderStatus = (branchId, orderId, status) =>
  api.patch(`/branches/${branchId}/orders/${orderId}/status`, { status });

export const updateOrder = (branchId, orderId, data) =>
  api.put(`/branches/${branchId}/orders/${orderId}`, data);

export const cancelOrder = (branchId, orderId, reason) =>
  api.delete(`/branches/${branchId}/orders/${orderId}`, { data: { reason } });
