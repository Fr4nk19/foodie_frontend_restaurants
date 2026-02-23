import api from './axios';

export const getUsers = (companyId, params = {}) =>
  api.get(`/companies/${companyId}/users`, { params });

export const createUser = (companyId, data) =>
  api.post(`/companies/${companyId}/users`, data);

export const updateUser = (companyId, userId, data) =>
  api.put(`/companies/${companyId}/users/${userId}`, data);

export const deleteUser = (companyId, userId) =>
  api.delete(`/companies/${companyId}/users/${userId}`);
