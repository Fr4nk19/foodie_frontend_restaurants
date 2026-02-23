import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Search, Tag } from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';
import {
  getProductCategories,
  createProductCategory,
  updateProductCategory,
  deleteProductCategory,
} from '../../api/products';

const STATUS_MAP = {
  active: { label: 'Activa', variant: 'success' },
  inactive: { label: 'Inactiva', variant: 'gray' },
};

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16',
  '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
  '#6366f1', '#8b5cf6', '#a855f7', '#ec4899',
];

function CategoryFormModal({ open, onClose, onSave, initialData, saving }) {
  const [form, setForm] = useState({ nombre: '', descripcion: '', color: '#3b82f6', status: 'active' });

  useEffect(() => {
    if (open) {
      setForm(initialData
        ? { nombre: initialData.nombre, descripcion: initialData.descripcion || '', color: initialData.color || '#3b82f6', status: initialData.status }
        : { nombre: '', descripcion: '', color: '#3b82f6', status: 'active' }
      );
    }
  }, [open, initialData]);

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Modal open={open} onClose={onClose} title={initialData ? 'Editar categoría' : 'Nueva categoría'} size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nombre"
          value={form.nombre}
          onChange={(e) => handleChange('nombre', e.target.value)}
          required
          maxLength={100}
          placeholder="Ej: Bebidas, Postres..."
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Descripción</label>
          <textarea
            value={form.descripcion}
            onChange={(e) => handleChange('descripcion', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
            rows={3}
            placeholder="Descripción opcional de la categoría"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Color</label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => handleChange('color', c)}
                className={`w-8 h-8 rounded-full border-2 transition-transform ${form.color === c ? 'border-gray-900 scale-110' : 'border-transparent hover:scale-105'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Estado</label>
          <select
            value={form.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="active">Activa</option>
            <option value="inactive">Inactiva</option>
          </select>
        </div>
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={saving} className="flex-1">Guardar</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function AdminProductCategoriesPage() {
  const { user } = useAuth();
  const companyId = user?.company_id;

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchCategories = useCallback(async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      const res = await getProductCategories(companyId, { per_page: 200 });
      setCategories(res.data.data || []);
    } catch (err) {
      setError('No se pudieron cargar las categorías');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSave = async (data) => {
    try {
      setSaving(true);
      if (editingCategory) {
        await updateProductCategory(companyId, editingCategory.id, data);
      } else {
        await createProductCategory(companyId, data);
      }
      setEditingCategory(null);
      setShowCreateModal(false);
      await fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar la categoría');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteProductCategory(companyId, id);
      setDeleteConfirm(null);
      await fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar la categoría');
    }
  };

  const filtered = categories.filter((c) =>
    c.nombre.toLowerCase().includes(search.toLowerCase())
  );

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
          <h1 className="text-2xl font-bold text-gray-900">Categorías de productos</h1>
          <p className="text-gray-500 mt-1">Organiza tus productos por categorías</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4" />
          Nueva categoría
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 font-medium">✕</button>
        </div>
      )}

      {/* Search */}
      <div className="mb-6 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar categoría..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Tag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No hay categorías</p>
          <p className="text-sm mt-1">Crea tu primera categoría para organizar tus productos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((cat) => {
            const status = STATUS_MAP[cat.status] || STATUS_MAP.inactive;
            return (
              <div key={cat.id} className="card flex flex-col gap-3 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: cat.color ? `${cat.color}20` : '#f3f4f6' }}
                    >
                      <Tag className="w-5 h-5" style={{ color: cat.color || '#6b7280' }} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{cat.nombre}</p>
                      {cat.descripcion && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{cat.descripcion}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <Button variant="secondary" size="sm" onClick={() => setEditingCategory(cat)} className="flex-1">
                    <Edit2 className="w-3.5 h-3.5" />
                    Editar
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => setDeleteConfirm(cat)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <CategoryFormModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleSave}
        saving={saving}
      />
      <CategoryFormModal
        open={Boolean(editingCategory)}
        onClose={() => setEditingCategory(null)}
        onSave={handleSave}
        initialData={editingCategory}
        saving={saving}
      />

      {/* Delete Confirmation */}
      <Modal open={Boolean(deleteConfirm)} onClose={() => setDeleteConfirm(null)} title="Eliminar categoría" size="sm">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">
            ¿Estás seguro de que deseas eliminar la categoría <strong>{deleteConfirm?.nombre}</strong>? Esta acción no se puede deshacer.
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
