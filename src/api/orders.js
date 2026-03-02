import api from './axios';

// Orders live under /companies/{company}/branches/{branch}/orders

const base = (companyId, branchId) =>
  `/companies/${companyId}/branches/${branchId}/orders`;

export const getOrders = (companyId, branchId, params = {}) =>
  api.get(base(companyId, branchId), { params });

export const getOrder = (companyId, branchId, orderId) =>
  api.get(`${base(companyId, branchId)}/${orderId}`);

export const createOrder = (companyId, branchId, data) =>
  api.post(base(companyId, branchId), data);

// status: pending | preparing | ready | delivered | cancelled
export const updateOrderStatus = (companyId, branchId, orderId, status) =>
  api.patch(`${base(companyId, branchId)}/${orderId}/status`, { status });

export const deleteOrder = (companyId, branchId, orderId) =>
  api.delete(`${base(companyId, branchId)}/${orderId}`);
