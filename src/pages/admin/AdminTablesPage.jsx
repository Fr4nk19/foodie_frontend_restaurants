import { useState } from 'react';
import { Plus, Edit2, Trash2, Users } from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';

const TABLE_STATUS = {
  available: { label: 'Disponible', variant: 'success' },
  occupied: { label: 'Ocupada', variant: 'warning' },
  reserved: { label: 'Reservada', variant: 'info' },
  cleaning: { label: 'Limpieza', variant: 'gray' },
};

const INITIAL_TABLES = [
  { id: 1, number: 1, capacity: 2, status: 'available', zone: 'Interior' },
  { id: 2, number: 2, capacity: 4, status: 'occupied', zone: 'Interior' },
  { id: 3, number: 3, capacity: 4, status: 'occupied', zone: 'Interior' },
  { id: 4, number: 4, capacity: 6, status: 'available', zone: 'Interior' },
  { id: 5, number: 5, capacity: 2, status: 'reserved', zone: 'Terraza' },
  { id: 6, number: 6, capacity: 4, status: 'available', zone: 'Terraza' },
  { id: 7, number: 7, capacity: 8, status: 'occupied', zone: 'Terraza' },
  { id: 8, number: 8, capacity: 2, status: 'cleaning', zone: 'Barra' },
];

function TableCard({ table, onEdit, onDelete, onStatusChange }) {
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
        <Button variant="danger" size="sm" onClick={() => onDelete(table.id)}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

function TableFormModal({ open, onClose, onSave, initialData }) {
  const [form, setForm] = useState(initialData || { number: '', capacity: 4, zone: 'Interior' });

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
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
          <Button type="submit" className="flex-1">Guardar</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function AdminTablesPage() {
  const [tables, setTables] = useState(INITIAL_TABLES);
  const [editingTable, setEditingTable] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const zones = [...new Set(tables.map((t) => t.zone))];

  const handleSave = (data) => {
    if (editingTable) {
      setTables((prev) => prev.map((t) => t.id === editingTable.id ? { ...t, ...data } : t));
      setEditingTable(null);
    } else {
      setTables((prev) => [...prev, { ...data, id: Date.now(), status: 'available' }]);
      setShowCreateModal(false);
    }
  };

  const handleDelete = (id) => {
    setTables((prev) => prev.filter((t) => t.id !== id));
  };

  const handleStatusChange = (id, newStatus) => {
    setTables((prev) => prev.map((t) => t.id === id ? { ...t, status: newStatus } : t));
  };

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
      {zones.map((zone) => (
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
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                />
              ))}
          </div>
        </div>
      ))}

      <TableFormModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleSave}
      />
      <TableFormModal
        open={Boolean(editingTable)}
        onClose={() => setEditingTable(null)}
        onSave={handleSave}
        initialData={editingTable}
      />
    </div>
  );
}
