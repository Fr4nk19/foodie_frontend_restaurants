import api from './axios';

// NOTE: These endpoints are not yet implemented in the backend.
// When added, they should follow the pattern:
// /api/v1/companies/{company}/branches/{branch}/orders
// The functions below use the expected URL structure.

export const getOrders = (companyId, branchId, params = {}) =>
  api.get(`/companies/${companyId}/branches/${branchId}/orders`, { params });

export const getOrder = (companyId, branchId, orderId) =>
  api.get(`/companies/${companyId}/branches/${branchId}/orders/${orderId}`);

export const createOrder = (companyId, branchId, data) =>
  api.post(`/companies/${companyId}/branches/${branchId}/orders`, data);

export const updateOrder = (companyId, branchId, orderId, data) =>
  api.put(`/companies/${companyId}/branches/${branchId}/orders/${orderId}`, data);

export const updateOrderStatus = (companyId, branchId, orderId, status) =>
  api.patch(`/companies/${companyId}/branches/${branchId}/orders/${orderId}/status`, { status });

export const cancelOrder = (companyId, branchId, orderId, reason) =>
  api.delete(`/companies/${companyId}/branches/${branchId}/orders/${orderId}`, { data: { reason } });
