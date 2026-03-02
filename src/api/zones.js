import api from './axios';

export const getZones = (branchId, params = {}) =>
  api.get(`/branches/${branchId}/zones`, { params });

export const getZone = (branchId, zoneId) =>
  api.get(`/branches/${branchId}/zones/${zoneId}`);

export const createZone = (branchId, data) =>
  api.post(`/branches/${branchId}/zones`, data);

export const updateZone = (branchId, zoneId, data) =>
  api.put(`/branches/${branchId}/zones/${zoneId}`, data);

export const deleteZone = (branchId, zoneId) =>
  api.delete(`/branches/${branchId}/zones/${zoneId}`);
