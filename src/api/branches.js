import api from './axios';

export const getBranches = (companyId, params = {}) =>
  api.get(`/companies/${companyId}/branches`, { params });

export const createBranch = (companyId, data) =>
  api.post(`/companies/${companyId}/branches`, data);

export const updateBranch = (companyId, branchId, data) =>
  api.put(`/companies/${companyId}/branches/${branchId}`, data);

export const deleteBranch = (companyId, branchId) =>
  api.delete(`/companies/${companyId}/branches/${branchId}`);
