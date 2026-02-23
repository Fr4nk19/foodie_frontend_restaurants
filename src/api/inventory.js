import api from './axios';

// Inventory scoped to a branch: /api/v1/companies/{company}/branches/{branch}/inventory

export const getInventory = (companyId, branchId, params = {}) =>
  api.get(`/companies/${companyId}/branches/${branchId}/inventory`, { params });

export const getInventoryItem = (companyId, branchId, inventoryId) =>
  api.get(`/companies/${companyId}/branches/${branchId}/inventory/${inventoryId}`);

export const createInventoryItem = (companyId, branchId, data) =>
  api.post(`/companies/${companyId}/branches/${branchId}/inventory`, data);

export const updateInventoryItem = (companyId, branchId, inventoryId, data) =>
  api.put(`/companies/${companyId}/branches/${branchId}/inventory/${inventoryId}`, data);

export const deleteInventoryItem = (companyId, branchId, inventoryId) =>
  api.delete(`/companies/${companyId}/branches/${branchId}/inventory/${inventoryId}`);
