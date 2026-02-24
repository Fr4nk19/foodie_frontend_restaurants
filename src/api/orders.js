import api from './axios';

export const getOrders = (companyId, branchId, params = {}) =>
  api.get(`/companies/${companyId}/branches/${branchId}/orders`, { params });

export const getOrder = (companyId, branchId, orderId) =>
  api.get(`/companies/${companyId}/branches/${branchId}/orders/${orderId}`);

export const createOrder = (companyId, branchId, data) =>
  api.post(`/companies/${companyId}/branches/${branchId}/orders`, data);

export const updateOrder = (companyId, branchId, orderId, data) =>
  api.put(`/companies/${companyId}/branches/${branchId}/orders/${orderId}`, data);

export const updateOrderStatus = (companyId, branchId, orderId, status, reason) =>
  api.patch(`/companies/${companyId}/branches/${branchId}/orders/${orderId}/status`, { status, reason });

export const toggleOrderItem = (companyId, branchId, orderId, itemId) =>
  api.patch(`/companies/${companyId}/branches/${branchId}/orders/${orderId}/items/${itemId}/toggle`);

export const deleteOrder = (companyId, branchId, orderId) =>
  api.delete(`/companies/${companyId}/branches/${branchId}/orders/${orderId}`);
