import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Search, MapPin, Phone, Mail, Star } from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';
import { getBranches, createBranch, updateBranch, deleteBranch } from '../../api/branches';

const STATUS_MAP = {
  active: { label: 'Activa', variant: 'success' },
  inactive: { label: 'Inactiva', variant: 'gray' },
};

function BranchFormModal({ open, onClose, onSave, initialData, saving }) {
  const [form, setForm] = useState({
    name: '', address: '', city: '', state: '', phone: '', email: '',
    latitude: '', longitude: '', status: 'active',
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        setForm({
          name: initialData.name || '',
          address: initialData.address || '',
          city: initialData.city || '',
          state: initialData.state || '',
          phone: initialData.phone || '',
          email: initialData.email || '',
          latitude: initialData.latitude || '',
          longitude: initialData.longitude || '',
          status: initialData.status || 'active',
        });
      } else {
        setForm({
          name: '', address: '', city: '', state: '', phone: '', email: '',
          latitude: '', longitude: '', status: 'active',
        });
      }
    }
  }, [open, initialData]);

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (!payload.phone) delete payload.phone;
    if (!payload.email) delete payload.email;
    if (!payload.latitude) delete payload.latitude;
    if (!payload.longitude) delete payload.longitude;
    onSave(payload);
  };

  return (
    <Modal open={open} onClose={onClose} title={initialData ? 'Editar sucursal' : 'Nueva sucursal'} size="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nombre *"
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
          required
          maxLength={255}
          placeholder="Nombre de la sucursal"
        />
        <Input
          label="Dirección"
          value={form.address}
          onChange={(e) => handleChange('address', e.target.value)}
          maxLength={500}
          placeholder="Dirección completa"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Ciudad"
            value={form.city}
            onChange={(e) => handleChange('city', e.target.value)}
            maxLength={100}
            placeholder="Ciudad"
          />
          <Input
            label="Estado / Departamento"
            value={form.state}
            onChange={(e) => handleChange('state', e.target.value)}
            maxLength={100}
            placeholder="Estado"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Teléfono"
            value={form.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            maxLength={30}
            placeholder="+503 0000-0000"
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="sucursal@email.com"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Latitud"
            type="number"
            step="any"
            value={form.latitude}
            onChange={(e) => handleChange('latitude', e.target.value)}
            placeholder="13.6929"
          />
          <Input
            label="Longitud"
            type="number"
            step="any"
            value={form.longitude}
            onChange={(e) => handleChange('longitude', e.target.value)}
            placeholder="-89.2182"
          />
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

export default function AdminBranchesPage() {
  const { user } = useAuth();
  const companyId = user?.company_id;

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [editingBranch, setEditingBranch] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchBranches = useCallback(async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      const res = await getBranches(companyId);
      setBranches(res.data.data || []);
    } catch {
      setError('No se pudieron cargar las sucursales');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const handleSave = async (data) => {
    try {
      setSaving(true);
      if (editingBranch) {
        await updateBranch(companyId, editingBranch.id, data);
      } else {
        await createBranch(companyId, data);
      }
      setEditingBranch(null);
      setShowCreateModal(false);
      await fetchBranches();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar la sucursal');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteBranch(companyId, id);
      setDeleteConfirm(null);
      await fetchBranches();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar la sucursal');
    }
  };

  const filtered = branches.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    (b.address && b.address.toLowerCase().includes(search.toLowerCase())) ||
    (b.city && b.city.toLowerCase().includes(search.toLowerCase()))
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
          <h1 className="text-2xl font-bold text-gray-900">Sucursales</h1>
          <p className="text-gray-500 mt-1">Administra las sucursales del restaurante</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4" />
          Nueva sucursal
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
          placeholder="Buscar sucursal..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No hay sucursales</p>
          <p className="text-sm mt-1">Crea tu primera sucursal para comenzar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((branch) => {
            const status = STATUS_MAP[branch.status] || STATUS_MAP.inactive;
            return (
              <div key={branch.id} className="card flex flex-col gap-3 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{branch.name}</p>
                    {branch.is_default && (
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    )}
                  </div>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>

                <div className="flex flex-col gap-1.5 text-sm text-gray-500">
                  {branch.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{branch.address}{branch.city ? `, ${branch.city}` : ''}{branch.state ? `, ${branch.state}` : ''}</span>
                    </div>
                  )}
                  {branch.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 shrink-0" />
                      <span>{branch.phone}</span>
                    </div>
                  )}
                  {branch.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 shrink-0" />
                      <span className="truncate">{branch.email}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <Button variant="secondary" size="sm" onClick={() => setEditingBranch(branch)} className="flex-1">
                    <Edit2 className="w-3.5 h-3.5" />
                    Editar
                  </Button>
                  {!branch.is_default && (
                    <Button variant="danger" size="sm" onClick={() => setDeleteConfirm(branch)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <BranchFormModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleSave}
        saving={saving}
      />
      <BranchFormModal
        open={Boolean(editingBranch)}
        onClose={() => setEditingBranch(null)}
        onSave={handleSave}
        initialData={editingBranch}
        saving={saving}
      />

      {/* Delete Confirmation */}
      <Modal open={Boolean(deleteConfirm)} onClose={() => setDeleteConfirm(null)} title="Eliminar sucursal" size="sm">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">
            ¿Estás seguro de que deseas eliminar la sucursal <strong>{deleteConfirm?.name}</strong>? Esta acción no se puede deshacer.
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
