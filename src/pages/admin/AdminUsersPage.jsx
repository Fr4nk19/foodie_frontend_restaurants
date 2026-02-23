import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Search, UserPlus, Shield, Eye, EyeOff } from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';
import { getUsers, createUser, updateUser, deleteUser } from '../../api/users';
import { getBranches } from '../../api/branches';

const ROLE_MAP = {
  super_admin: { label: 'Super Admin', variant: 'purple' },
  company_admin: { label: 'Admin', variant: 'orange' },
  branch_manager: { label: 'Gerente', variant: 'info' },
  employee: { label: 'Empleado', variant: 'gray' },
};

const AVAILABLE_ROLES = [
  { value: 'company_admin', label: 'Administrador de empresa' },
  { value: 'branch_manager', label: 'Gerente de sucursal' },
  { value: 'employee', label: 'Empleado' },
];

function UserFormModal({ open, onClose, onSave, initialData, saving, branches }) {
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'employee', branch_id: '', is_active: true,
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setForm({
          name: initialData.name || '',
          email: initialData.email || '',
          password: '',
          role: initialData.role || 'employee',
          branch_id: initialData.branch_id || initialData.branch?.id || '',
          is_active: initialData.is_active !== undefined ? initialData.is_active : true,
        });
      } else {
        setForm({
          name: '', email: '', password: '', role: 'employee', branch_id: '', is_active: true,
        });
      }
      setShowPassword(false);
    }
  }, [open, initialData]);

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (!payload.branch_id) delete payload.branch_id;
    if (initialData && !payload.password) delete payload.password;
    onSave(payload);
  };

  return (
    <Modal open={open} onClose={onClose} title={initialData ? 'Editar usuario' : 'Nuevo usuario'} size="md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nombre *"
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
          required
          maxLength={255}
          placeholder="Nombre completo"
        />
        <Input
          label="Email *"
          type="email"
          value={form.email}
          onChange={(e) => handleChange('email', e.target.value)}
          required
          maxLength={255}
          placeholder="correo@ejemplo.com"
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Contraseña {initialData ? '(dejar vacío para no cambiar)' : '*'}
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              required={!initialData}
              minLength={8}
              className="w-full px-3 py-2 pr-10 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              placeholder="Mínimo 8 caracteres"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Rol *</label>
            <select
              value={form.role}
              onChange={(e) => handleChange('role', e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {AVAILABLE_ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Sucursal</label>
            <select
              value={form.branch_id}
              onChange={(e) => handleChange('branch_id', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Sin asignar</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="is_active"
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => handleChange('is_active', e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          <label htmlFor="is_active" className="text-sm text-gray-700">Usuario activo</label>
        </div>
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={saving} className="flex-1">Guardar</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function AdminUsersPage() {
  const { user } = useAuth();
  const companyId = user?.company_id;

  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchData = useCallback(async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      const [usersRes, branchesRes] = await Promise.all([
        getUsers(companyId),
        getBranches(companyId),
      ]);
      setUsers(usersRes.data.data || []);
      setBranches(branchesRes.data.data || []);
    } catch {
      setError('No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (data) => {
    try {
      setSaving(true);
      if (editingUser) {
        await updateUser(companyId, editingUser.id, data);
      } else {
        await createUser(companyId, data);
      }
      setEditingUser(null);
      setShowCreateModal(false);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar el usuario');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteUser(companyId, id);
      setDeleteConfirm(null);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar el usuario');
    }
  };

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = !filterRole || u.role === filterRole;
    return matchSearch && matchRole;
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
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-500 mt-1">Gestión de usuarios y permisos</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <UserPlus className="w-4 h-4" />
          Nuevo usuario
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 font-medium">✕</button>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {Object.entries(ROLE_MAP).filter(([key]) => key !== 'super_admin').map(([key, { label, variant }]) => {
          const count = users.filter((u) => u.role === key).length;
          return (
            <div key={key} className="card text-center py-4">
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <Badge variant={variant} className="mt-1">{label}</Badge>
            </div>
          );
        })}
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-gray-900">{users.length}</p>
          <Badge variant="success" className="mt-1">Total</Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Todos los roles</option>
          {AVAILABLE_ROLES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No hay usuarios</p>
          <p className="text-sm mt-1">Agrega usuarios para que puedan acceder al sistema.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Usuario</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 hidden sm:table-cell">Email</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600">Rol</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 hidden md:table-cell">Sucursal</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600">Estado</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const role = ROLE_MAP[u.role] || ROLE_MAP.employee;
                const branchName = u.branch?.name || '—';
                return (
                  <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-semibold text-sm shrink-0">
                          {u.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{u.name}</p>
                          <p className="text-xs text-gray-500 sm:hidden">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-500 hidden sm:table-cell">{u.email}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={role.variant}>{role.label}</Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-500 hidden md:table-cell">{branchName}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={u.is_active ? 'success' : 'gray'}>
                        {u.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditingUser(u)}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        {u.role !== 'super_admin' && u.id !== user?.id && (
                          <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(u)}>
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      <UserFormModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleSave}
        saving={saving}
        branches={branches}
      />
      <UserFormModal
        open={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        onSave={handleSave}
        initialData={editingUser}
        saving={saving}
        branches={branches}
      />

      {/* Delete Confirmation */}
      <Modal open={Boolean(deleteConfirm)} onClose={() => setDeleteConfirm(null)} title="Eliminar usuario" size="sm">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">
            ¿Estás seguro de que deseas eliminar al usuario <strong>{deleteConfirm?.name}</strong>? Esta acción no se puede deshacer.
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
