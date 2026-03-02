import api from './axios';

// Tables are a flat resource under /companies/{company}/branches/{branch}/tables
// Use table_zone_id as a query param to filter by zone

const base = (companyId, branchId) =>
  `/companies/${companyId}/branches/${branchId}/tables`;

export const getTables = (companyId, branchId, params = {}) =>
  api.get(base(companyId, branchId), { params });

export const getTable = (companyId, branchId, tableId) =>
  api.get(`${base(companyId, branchId)}/${tableId}`);

export const createTable = (companyId, branchId, data) =>
  api.post(base(companyId, branchId), data);

export const updateTable = (companyId, branchId, tableId, data) =>
  api.put(`${base(companyId, branchId)}/${tableId}`, data);

export const deleteTable = (companyId, branchId, tableId) =>
  api.delete(`${base(companyId, branchId)}/${tableId}`);
