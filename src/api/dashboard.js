import api from './axios';

export const getDashboardStats = (companyId, branchId) =>
  api.get(`/companies/${companyId}/branches/${branchId}/dashboard`);
