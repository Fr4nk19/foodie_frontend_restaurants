import api from './axios';

// Kitchen module endpoints

const base = (companyId, branchId) =>
  `/companies/${companyId}/branches/${branchId}/kitchen`;

// Active orders (pending, preparing, ready) sorted by priority
export const getKitchenOrders = (companyId, branchId) =>
  api.get(`${base(companyId, branchId)}/orders`);

// Advance order status: preparing | ready
export const updateKitchenOrderStatus = (companyId, branchId, orderId, status) =>
  api.patch(`${base(companyId, branchId)}/orders/${orderId}/status`, { status });

// Toggle item is_done (auto-advances order to ready when all items done)
export const toggleKitchenItem = (companyId, branchId, orderId, itemId) =>
  api.patch(`${base(companyId, branchId)}/orders/${orderId}/items/${itemId}/toggle`);

// Stats for the kitchen dashboard header
export const getKitchenStats = (companyId, branchId) =>
  api.get(`${base(companyId, branchId)}/stats`);
