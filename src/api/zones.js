import api from './axios';

const base = (companyId, branchId) =>
  `/companies/${companyId}/branches/${branchId}/zones`;

export const getZones = (companyId, branchId, params = {}) =>
  api.get(base(companyId, branchId), { params });

export const getZone = (companyId, branchId, zoneId) =>
  api.get(`${base(companyId, branchId)}/${zoneId}`);

export const createZone = (companyId, branchId, data) =>
  api.post(base(companyId, branchId), data);

export const updateZone = (companyId, branchId, zoneId, data) =>
  api.put(`${base(companyId, branchId)}/${zoneId}`, data);

export const deleteZone = (companyId, branchId, zoneId) =>
  api.delete(`${base(companyId, branchId)}/${zoneId}`);
