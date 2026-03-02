import api from './axios';

// ── Tables live under /branches/{branch}/zones/{zone}/tables ──────────────

export const getTables = (branchId, zoneId, params = {}) =>
  api.get(`/branches/${branchId}/zones/${zoneId}/tables`, { params });

export const getTable = (branchId, zoneId, tableId) =>
  api.get(`/branches/${branchId}/zones/${zoneId}/tables/${tableId}`);

export const createTable = (branchId, zoneId, data) =>
  api.post(`/branches/${branchId}/zones/${zoneId}/tables`, data);

// Bulk creation: POST with { tables: [{number, capacity}, ...] }
export const createTablesBulk = (branchId, zoneId, tables) =>
  api.post(`/branches/${branchId}/zones/${zoneId}/tables`, { tables });

export const updateTable = (branchId, zoneId, tableId, data) =>
  api.put(`/branches/${branchId}/zones/${zoneId}/tables/${tableId}`, data);

export const deleteTable = (branchId, zoneId, tableId) =>
  api.delete(`/branches/${branchId}/zones/${zoneId}/tables/${tableId}`);
