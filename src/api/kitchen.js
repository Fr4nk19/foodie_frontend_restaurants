import api from './axios';

// ── Kitchen module endpoints ──────────────────────────────────────────────

// Active orders (pending, confirmed, in_progress, ready) sorted by priority
export const getKitchenOrders = (branchId) =>
  api.get(`/branches/${branchId}/kitchen/orders`);

// Kitchen advances order: confirmed | in_progress | ready
export const updateKitchenOrderStatus = (branchId, orderId, status) =>
  api.patch(`/branches/${branchId}/kitchen/orders/${orderId}/status`, { status });

// Update a single item status: pending | in_progress | ready | cancelled
export const updateKitchenItemStatus = (branchId, itemId, status) =>
  api.patch(`/branches/${branchId}/kitchen/items/${itemId}/status`, { status });

// Stats for the kitchen dashboard header
export const getKitchenStats = (branchId) =>
  api.get(`/branches/${branchId}/kitchen/stats`);
