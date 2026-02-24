import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Users } from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';
import { getTables, createTable, updateTable, deleteTable } from '../../api/tables';

const TABLE_STATUS = {
  available: { label: 'Disponible', variant: 'success' },
  occupied: { label: 'Ocupada', variant: 'warning' },
  reserved: { label: 'Reservada', variant: 'info' },
  cleaning: { label: 'Limpieza', variant: 'gray' },
};

function TableCard({ table, onEdit, onDelete, onStatusChange, saving }) {
  const status = TABLE_STATUS[table.status];
  return (
    <div className="card flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-bold text-2xl text-gray-900">#{table.number}</p>
          <p className="text-xs text-gray-500">{table.zone}</p>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>
      <div className="flex items-center gap-1.5 text-sm text-gray-500">
        <Users className="w-4 h-4" />
        <span>{table.capacity} personas</span>
      </div>

      {/* Status quick-change */}
      <div className="flex flex-wrap gap-1 pt-2 border-t border-gray-100">
        {Object.entries(TABLE_STATUS).map(([key, { label }]) => (
          <button
            key={key}
            onClick={() => onStatusChange(table.id, key)}
            disabled={saving}
            className={`text-xs px-2 py-1 rounded-lg transition-colors ${
              table.status === key
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button variant="secondary" size="sm" onClick={() => onEdit(table)} className="flex-1">
          <Edit2 className="w-3.5 h-3.5" />
          Editar
        </Button>
        <Button variant="danger" size="sm" onClick={() => onDelete(table)}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

function TableFormModal({ open, onClose, onSave, initialData, saving }) {
  const [form, setForm] = useState(initialData || { number: '', capacity: 4, zone: 'Interior' });

  useEffect(() => {
    if (open) {
      if (initialData) {
        setForm({
          number: initialData.number || '',
          capacity: initialData.capacity || 4,
          zone: initialData.zone || 'Interior',
        });
      } else {
        setForm({ number: '', capacity: 4, zone: 'Interior' });
      }
    }
  }, [open, initialData]);

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, number: Number(form.number), capacity: Number(form.capacity) });
  };

  return (
    <Modal open={open} onClose={onClose} title={initialData ? 'Editar mesa' : 'Nueva mesa'} size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Número de mesa"
          type="number"
          min="1"
          value={form.number}
          onChange={(e) => handleChange('number', e.target.value)}
          required
        />
        <Input
          label="Capacidad (personas)"
          type="number"
          min="1"
          max="30"
          value={form.capacity}
          onChange={(e) => handleChange('capacity', Number(e.target.value))}
          required
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Zona</label>
          <select
            value={form.zone}
            onChange={(e) => handleChange('zone', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {['Interior', 'Terraza', 'Barra', 'Privado', 'Para llevar'].map((z) => (
              <option key={z}>{z}</option>
            ))}
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

export default function AdminTablesPage() {
  const { user } = useAuth();
  const companyId = user?.company_id;
  const branchId = user?.branch_id;

  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [editingTable, setEditingTable] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchTables = useCallback(async () => {
    if (!companyId || !branchId) return;
    try {
      setLoading(true);
      const res = await getTables(companyId, branchId);
      setTables(res.data.data || []);
    } catch {
      setError('No se pudieron cargar las mesas');
    } finally {
      setLoading(false);
    }
  }, [companyId, branchId]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const zones = [...new Set(tables.map((t) => t.zone))];

  const handleSave = async (data) => {
    try {
      setSaving(true);
      if (editingTable) {
        await updateTable(companyId, branchId, editingTable.id, data);
      } else {
        await createTable(companyId, branchId, data);
      }
      setEditingTable(null);
      setShowCreateModal(false);
      await fetchTables();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar la mesa');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTable(companyId, branchId, id);
      setDeleteConfirm(null);
      await fetchTables();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar la mesa');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      setSaving(true);
      await updateTable(companyId, branchId, id, { status: newStatus });
      await fetchTables();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cambiar el estado');
    } finally {
      setSaving(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Mesas</h1>
          <p className="text-gray-500 mt-1">Gestión del salón del restaurante</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4" />
          Nueva mesa
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
        {Object.entries(TABLE_STATUS).map(([key, { label, variant }]) => {
          const count = tables.filter((t) => t.status === key).length;
          return (
            <div key={key} className="card text-center py-4">
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <Badge variant={variant} className="mt-1">{label}</Badge>
            </div>
          );
        })}
      </div>

      {/* Tables by zone */}
      {tables.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="font-medium">No hay mesas registradas</p>
          <p className="text-sm mt-1">Crea tu primera mesa para comenzar.</p>
        </div>
      ) : (
        zones.map((zone) => (
          <div key={zone} className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">{zone}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {tables
                .filter((t) => t.zone === zone)
                .map((table) => (
                  <TableCard
                    key={table.id}
                    table={table}
                    onEdit={(t) => setEditingTable(t)}
                    onDelete={(t) => setDeleteConfirm(t)}
                    onStatusChange={handleStatusChange}
                    saving={saving}
                  />
                ))}
            </div>
          </div>
        ))
      )}

      <TableFormModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleSave}
        saving={saving}
      />
      <TableFormModal
        open={Boolean(editingTable)}
        onClose={() => setEditingTable(null)}
        onSave={handleSave}
        initialData={editingTable}
        saving={saving}
      />

      {/* Delete Confirmation */}
      <Modal open={Boolean(deleteConfirm)} onClose={() => setDeleteConfirm(null)} title="Eliminar mesa" size="sm">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">
            ¿Estás seguro de que deseas eliminar la mesa <strong>#{deleteConfirm?.number}</strong>? Esta acción no se puede deshacer.
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
