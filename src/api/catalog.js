import api from './axios';

export const getUnidadesDeMedida = (params = {}) =>
  api.get('/catalog/unidades-de-medida', { params });

export const getDepartamentos = (params = {}) =>
  api.get('/catalog/departamentos', { params });

export const getMunicipios = (params = {}) =>
  api.get('/catalog/municipios', { params });
