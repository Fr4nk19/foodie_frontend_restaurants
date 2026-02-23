import api from './axios';

export const getProducts = (companyId, params = {}) =>
  api.get(`/companies/${companyId}/products`, { params });

export const getProductCategories = (companyId) =>
  api.get(`/companies/${companyId}/product-categories`);
