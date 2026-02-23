import api from './axios';

export const getTables = (branchId, params = {}) =>
  api.get(`/branches/${branchId}/tables`, { params });

export const getTable = (branchId, tableId) =>
  api.get(`/branches/${branchId}/tables/${tableId}`);

export const createTable = (branchId, data) =>
  api.post(`/branches/${branchId}/tables`, data);

export const updateTable = (branchId, tableId, data) =>
  api.put(`/branches/${branchId}/tables/${tableId}`, data);

export const deleteTable = (branchId, tableId) =>
  api.delete(`/branches/${branchId}/tables/${tableId}`);
