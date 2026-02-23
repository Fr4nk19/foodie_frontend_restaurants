import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Search, Package, Filter } from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';
import { getProducts, createProduct, updateProduct, deleteProduct, getProductCategories } from '../../api/products';
import { getUnidadesDeMedida } from '../../api/catalog';

const STATUS_MAP = {
  active: { label: 'Activo', variant: 'success' },
  inactive: { label: 'Inactivo', variant: 'gray' },
};

function ProductFormModal({ open, onClose, onSave, initialData, saving, categories, unidades }) {
  const [form, setForm] = useState({
    nombre: '', descripcion: '', codigo: '', precio: '', peso: '',
    tamanio: '', imagen: '', status: 'active', track_stock: false,
    product_category_id: '', cat_mh_unidad_de_medida_id: '',
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        setForm({
          nombre: initialData.nombre || '',
          descripcion: initialData.descripcion || '',
          codigo: initialData.codigo || '',
          precio: initialData.precio || '',
          peso: initialData.peso || '',
          tamanio: initialData.tamanio || '',
          imagen: initialData.imagen || '',
          status: initialData.status || 'active',
          track_stock: initialData.track_stock || false,
          product_category_id: initialData.product_category_id || '',
          cat_mh_unidad_de_medida_id: initialData.cat_mh_unidad_de_medida_id || '',
        });
      } else {
        setForm({
          nombre: '', descripcion: '', codigo: '', precio: '', peso: '',
          tamanio: '', imagen: '', status: 'active', track_stock: false,
          product_category_id: '', cat_mh_unidad_de_medida_id: unidades[0]?.id || '',
        });
      }
    }
  }, [open, initialData, unidades]);

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (!payload.product_category_id) delete payload.product_category_id;
    if (!payload.codigo) delete payload.codigo;
    if (!payload.peso) delete payload.peso;
    if (!payload.tamanio) delete payload.tamanio;
    if (!payload.imagen) delete payload.imagen;
    if (!payload.descripcion) delete payload.descripcion;
    onSave(payload);
  };

  return (
    <Modal open={open} onClose={onClose} title={initialData ? 'Editar producto' : 'Nuevo producto'} size="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Nombre *"
            value={form.nombre}
            onChange={(e) => handleChange('nombre', e.target.value)}
            required
            maxLength={255}
            placeholder="Nombre del producto"
          />
          <Input
            label="Código / SKU"
            value={form.codigo}
            onChange={(e) => handleChange('codigo', e.target.value)}
            maxLength={50}
            placeholder="SKU-001"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Descripción</label>
          <textarea
            value={form.descripcion}
            onChange={(e) => handleChange('descripcion', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
            rows={2}
            placeholder="Descripción del producto"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Precio *"
            type="number"
            step="0.01"
            min="0"
            value={form.precio}
            onChange={(e) => handleChange('precio', e.target.value)}
            required
            placeholder="0.00"
          />
          <Input
            label="Peso (kg)"
            type="number"
            step="0.001"
            min="0"
            value={form.peso}
            onChange={(e) => handleChange('peso', e.target.value)}
            placeholder="0.000"
          />
          <Input
            label="Tamaño"
            value={form.tamanio}
            onChange={(e) => handleChange('tamanio', e.target.value)}
            maxLength={100}
            placeholder="Ej: 30x20cm"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Categoría</label>
            <select
              value={form.product_category_id}
              onChange={(e) => handleChange('product_category_id', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Sin categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Unidad de medida *</label>
            <select
              value={form.cat_mh_unidad_de_medida_id}
              onChange={(e) => handleChange('cat_mh_unidad_de_medida_id', e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Seleccionar...</option>
              {unidades.map((u) => (
                <option key={u.id} value={u.id}>{u.descripcion || u.codigo}</option>
              ))}
            </select>
          </div>
        </div>
        <Input
          label="URL de imagen"
          value={form.imagen}
          onChange={(e) => handleChange('imagen', e.target.value)}
          maxLength={500}
          placeholder="https://..."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Estado</label>
            <select
              value={form.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input
              id="track_stock"
              type="checkbox"
              checked={form.track_stock}
              onChange={(e) => handleChange('track_stock', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="track_stock" className="text-sm text-gray-700">Controlar inventario</label>
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={saving} className="flex-1">Guardar</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function AdminProductsPage() {
  const { user } = useAuth();
  const companyId = user?.company_id;

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);

  const fetchData = useCallback(async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      const [prodRes, catRes, unidRes] = await Promise.all([
        getProducts(companyId, { per_page: 20, page }),
        getProductCategories(companyId, { per_page: 200 }),
        getUnidadesDeMedida({ per_page: 100 }),
      ]);
      setProducts(prodRes.data.data || []);
      setMeta(prodRes.data.meta || null);
      setCategories(catRes.data.data || []);
      setUnidades(unidRes.data.data || []);
    } catch {
      setError('No se pudieron cargar los productos');
    } finally {
      setLoading(false);
    }
  }, [companyId, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (data) => {
    try {
      setSaving(true);
      if (editingProduct) {
        await updateProduct(companyId, editingProduct.id, data);
      } else {
        await createProduct(companyId, data);
      }
      setEditingProduct(null);
      setShowCreateModal(false);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar el producto');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteProduct(companyId, id);
      setDeleteConfirm(null);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar el producto');
    }
  };

  const filtered = products.filter((p) => {
    const matchSearch =
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (p.codigo && p.codigo.toLowerCase().includes(search.toLowerCase()));
    const matchCategory = !filterCategory || String(p.product_category_id) === filterCategory;
    return matchSearch && matchCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-500 mt-1">Catálogo de productos del restaurante</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4" />
          Nuevo producto
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 font-medium">✕</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No hay productos</p>
          <p className="text-sm mt-1">Agrega tu primer producto al catálogo.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Producto</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 hidden sm:table-cell">Código</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Categoría</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">Precio</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600">Estado</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => {
                const status = STATUS_MAP[product.status] || STATUS_MAP.inactive;
                const catName = product.categoria?.nombre || '—';
                return (
                  <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {product.imagen ? (
                          <img src={product.imagen} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Package className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{product.nombre}</p>
                          {product.descripcion && (
                            <p className="text-xs text-gray-500 line-clamp-1">{product.descripcion}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-500 hidden sm:table-cell">{product.codigo || '—'}</td>
                    <td className="py-3 px-4">
                      {product.categoria ? (
                        <span
                          className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: product.categoria.color ? `${product.categoria.color}20` : '#f3f4f6',
                            color: product.categoria.color || '#6b7280',
                          }}
                        >
                          {catName}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900">
                      ${Number(product.precio).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditingProduct(product)}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(product)}>
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Mostrando {meta.from}–{meta.to} de {meta.total}
          </p>
          <div className="flex gap-1">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= meta.last_page}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <ProductFormModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleSave}
        saving={saving}
        categories={categories}
        unidades={unidades}
      />
      <ProductFormModal
        open={Boolean(editingProduct)}
        onClose={() => setEditingProduct(null)}
        onSave={handleSave}
        initialData={editingProduct}
        saving={saving}
        categories={categories}
        unidades={unidades}
      />

      {/* Delete Confirmation */}
      <Modal open={Boolean(deleteConfirm)} onClose={() => setDeleteConfirm(null)} title="Eliminar producto" size="sm">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">
            ¿Estás seguro de que deseas eliminar el producto <strong>{deleteConfirm?.nombre}</strong>? Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)} className="flex-1">Cancelar</Button>
            <Button variant="danger" onClick={() => handleDelete(deleteConfirm.id)} className="flex-1">Eliminar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
