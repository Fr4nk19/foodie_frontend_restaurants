import api from './axios';

export const getTables = (companyId, branchId, params = {}) =>
  api.get(`/companies/${companyId}/branches/${branchId}/tables`, { params });

export const getTable = (companyId, branchId, tableId) =>
  api.get(`/companies/${companyId}/branches/${branchId}/tables/${tableId}`);

export const createTable = (companyId, branchId, data) =>
  api.post(`/companies/${companyId}/branches/${branchId}/tables`, data);

export const updateTable = (companyId, branchId, tableId, data) =>
  api.put(`/companies/${companyId}/branches/${branchId}/tables/${tableId}`, data);

export const deleteTable = (companyId, branchId, tableId) =>
  api.delete(`/companies/${companyId}/branches/${branchId}/tables/${tableId}`);
