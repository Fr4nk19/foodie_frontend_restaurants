import api from './axios';

export const getProducts = (companyId, params = {}) =>
  api.get(`/companies/${companyId}/products`, { params });

export const createProduct = (companyId, data) =>
  api.post(`/companies/${companyId}/products`, data);

export const updateProduct = (companyId, productId, data) =>
  api.put(`/companies/${companyId}/products/${productId}`, data);

export const deleteProduct = (companyId, productId) =>
  api.delete(`/companies/${companyId}/products/${productId}`);

export const getProductCategories = (companyId, params = {}) =>
  api.get(`/companies/${companyId}/product-categories`, { params });

export const createProductCategory = (companyId, data) =>
  api.post(`/companies/${companyId}/product-categories`, data);

export const updateProductCategory = (companyId, categoryId, data) =>
  api.put(`/companies/${companyId}/product-categories/${categoryId}`, data);

export const deleteProductCategory = (companyId, categoryId) =>
  api.delete(`/companies/${companyId}/product-categories/${categoryId}`);
