import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Edit2, Trash2, Users, ChevronDown, ChevronRight,
  LayoutGrid, FolderPlus,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';
import { getZones, createZone, updateZone, deleteZone } from '../../api/zones';
import { getTables, createTable, updateTable, deleteTable } from '../../api/tables';

const TABLE_STATUS = {
  available: { label: 'Disponible', variant: 'success' },
  occupied:  { label: 'Ocupada',    variant: 'warning' },
  reserved:  { label: 'Reservada',  variant: 'info' },
  cleaning:  { label: 'En limpieza', variant: 'gray' },
};

// ─── Zone Form Modal ──────────────────────────────────────────────────────────

function ZoneFormModal({ open, onClose, onSave, initialData, saving }) {
  const [form, setForm] = useState({ name: '', description: '', sort_order: 0 });

  useEffect(() => {
    if (open) {
      setForm({
        name:        initialData?.name        ?? '',
        description: initialData?.description ?? '',
        sort_order:  initialData?.sort_order  ?? 0,
      });
    }
  }, [open, initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, sort_order: Number(form.sort_order) });
  };

  return (
    <Modal open={open} onClose={onClose} title={initialData ? 'Editar zona' : 'Nueva zona'} size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nombre de la zona"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          placeholder="Ej: Terraza, Interior, Barra"
          required
        />
        <Input
          label="Descripción (opcional)"
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          placeholder="Descripción corta"
        />
        <Input
          label="Orden de visualización"
          type="number"
          min="0"
          value={form.sort_order}
          onChange={(e) => setForm((p) => ({ ...p, sort_order: e.target.value }))}
        />
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={saving} className="flex-1">Guardar</Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Table Form Modal ─────────────────────────────────────────────────────────

function TableFormModal({ open, onClose, onSave, initialData, saving }) {
  const [form, setForm] = useState({ number: '', capacity: 4 });

  useEffect(() => {
    if (open) {
      setForm({
        number:   initialData?.number   ?? '',
        capacity: initialData?.capacity ?? 4,
      });
    }
  }, [open, initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ number: Number(form.number), capacity: Number(form.capacity) });
  };

  return (
    <Modal open={open} onClose={onClose} title={initialData ? 'Editar mesa' : 'Nueva mesa'} size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Número / identificador"
          type="number"
          min="1"
          value={form.number}
          onChange={(e) => setForm((p) => ({ ...p, number: e.target.value }))}
          placeholder="Ej: 1, 5, 12"
          required
        />
        <Input
          label="Capacidad (personas)"
          type="number"
          min="1"
          max="50"
          value={form.capacity}
          onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))}
          required
        />
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={saving} className="flex-1">Guardar</Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Table Card ───────────────────────────────────────────────────────────────

function TableCard({ table, onEdit, onDelete, onStatusChange, saving }) {
  const status = TABLE_STATUS[table.status] ?? TABLE_STATUS.available;
  return (
    <div className="card flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <p className="font-bold text-2xl text-gray-900">#{table.number}</p>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      <div className="flex items-center gap-1.5 text-sm text-gray-500">
        <Users className="w-4 h-4" />
        <span>{table.capacity} personas</span>
      </div>

      {/* Quick status change */}
      <div className="flex flex-wrap gap-1 pt-2 border-t border-gray-100">
        {Object.entries(TABLE_STATUS).map(([key, { label }]) => (
          <button
            key={key}
            onClick={() => onStatusChange(table.id, key)}
            disabled={saving || table.status === key}
            className={`text-xs px-2 py-1 rounded-lg transition-colors ${
              table.status === key
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50'
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

// ─── Zone Panel ───────────────────────────────────────────────────────────────

function ZonePanel({
  zone, branchId,
  onEditZone, onDeleteZone,
  onAddTable, onEditTable, onDeleteTable, onStatusChange,
  saving,
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden mb-4">
      {/* Zone header */}
      <div className="flex items-center gap-3 px-5 py-3 bg-gray-50 border-b border-gray-200">
        <button
          onClick={() => setOpen((o) => !o)}
          className="text-gray-500 hover:text-gray-800 transition-colors"
        >
          {open ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
        <LayoutGrid className="w-4 h-4 text-brand-600" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900">{zone.name}</p>
          {zone.description && <p className="text-xs text-gray-500">{zone.description}</p>}
        </div>
        <span className="text-xs text-gray-400 font-medium">
          {zone.tables?.length ?? 0} mesa{(zone.tables?.length ?? 0) !== 1 ? 's' : ''}
        </span>
        <Button size="sm" onClick={() => onAddTable(zone)}>
          <Plus className="w-3.5 h-3.5" />
          Mesa
        </Button>
        <Button size="sm" variant="secondary" onClick={() => onEditZone(zone)}>
          <Edit2 className="w-3.5 h-3.5" />
        </Button>
        <Button size="sm" variant="danger" onClick={() => onDeleteZone(zone)}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Tables grid */}
      {open && (
        <div className="p-4">
          {(zone.tables ?? []).length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
              <p>Sin mesas en esta zona</p>
              <button
                onClick={() => onAddTable(zone)}
                className="mt-2 text-brand-600 hover:text-brand-700 font-medium"
              >
                + Agregar mesa
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {zone.tables.map((table) => (
                <TableCard
                  key={table.id}
                  table={table}
                  onEdit={(t) => onEditTable(zone, t)}
                  onDelete={(t) => onDeleteTable(zone, t)}
                  onStatusChange={onStatusChange}
                  saving={saving}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminTablesPage() {
  const { user } = useAuth();
  const companyId = user?.company_id;
  const branchId  = user?.branch_id;

  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Zone modal state
  const [zoneModal, setZoneModal] = useState({ open: false, data: null });
  const [deleteZoneConfirm, setDeleteZoneConfirm] = useState(null);

  // Table modal state
  const [tableModal, setTableModal] = useState({ open: false, zone: null, data: null });
  const [deleteTableConfirm, setDeleteTableConfirm] = useState(null);

  // Load all zones with their tables
  const fetchZones = useCallback(async () => {
    if (!companyId || !branchId) return;
    try {
      setLoading(true);
      const res = await getZones(companyId, branchId);
      const zonesData = res.data.data || [];
      // Load tables for each zone in parallel
      const withTables = await Promise.all(
        zonesData.map(async (zone) => {
          try {
            const tRes = await getTables(companyId, branchId, { table_zone_id: zone.id });
            return { ...zone, tables: tRes.data.data || [] };
          } catch {
            return { ...zone, tables: [] };
          }
        })
      );
      setZones(withTables);
    } catch {
      setError('No se pudieron cargar las zonas');
    } finally {
      setLoading(false);
    }
  }, [companyId, branchId]);

  useEffect(() => { fetchZones(); }, [fetchZones]);

  // Summary counts across all tables
  const allTables = zones.flatMap((z) => z.tables ?? []);
  const statusCounts = Object.keys(TABLE_STATUS).reduce((acc, key) => {
    acc[key] = allTables.filter((t) => t.status === key).length;
    return acc;
  }, {});

  // ── Zone handlers ───────────────────────────────────────────────────────

  const handleSaveZone = async (data) => {
    try {
      setSaving(true);
      if (zoneModal.data) {
        await updateZone(companyId, branchId, zoneModal.data.id, data);
      } else {
        await createZone(companyId, branchId, data);
      }
      setZoneModal({ open: false, data: null });
      await fetchZones();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar la zona');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteZone = async (zone) => {
    try {
      await deleteZone(companyId, branchId, zone.id);
      setDeleteZoneConfirm(null);
      await fetchZones();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar la zona');
    }
  };

  // ── Table handlers ──────────────────────────────────────────────────────

  const handleSaveTable = async (data) => {
    const { zone, data: tableData } = tableModal;
    try {
      setSaving(true);
      if (tableData) {
        await updateTable(companyId, branchId, tableData.id, data);
      } else {
        await createTable(companyId, branchId, { ...data, table_zone_id: zone.id });
      }
      setTableModal({ open: false, zone: null, data: null });
      await fetchZones();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar la mesa');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTable = async ({ zone, table }) => {
    try {
      await deleteTable(companyId, branchId, table.id);
      setDeleteTableConfirm(null);
      await fetchZones();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar la mesa');
    }
  };

  const handleStatusChange = async (tableId, newStatus) => {
    try {
      setSaving(true);
      await updateTable(companyId, branchId, tableId, { status: newStatus });
      await fetchZones();
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
          <p className="text-gray-500 mt-1">Gestión de zonas y mesas del restaurante</p>
        </div>
        <Button onClick={() => setZoneModal({ open: true, data: null })}>
          <FolderPlus className="w-4 h-4" />
          Nueva zona
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 font-medium">✕</button>
        </div>
      )}

      {/* Status summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {Object.entries(TABLE_STATUS).map(([key, { label, variant }]) => (
          <div key={key} className="card text-center py-4">
            <p className="text-2xl font-bold text-gray-900">{statusCounts[key] ?? 0}</p>
            <Badge variant={variant} className="mt-1">{label}</Badge>
          </div>
        ))}
      </div>

      {/* Zones */}
      {zones.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <LayoutGrid className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No hay zonas configuradas</p>
          <p className="text-sm mt-1">Crea tu primera zona para empezar a agregar mesas.</p>
          <Button className="mt-4" onClick={() => setZoneModal({ open: true, data: null })}>
            <FolderPlus className="w-4 h-4" />
            Crear primera zona
          </Button>
        </div>
      ) : (
        zones.map((zone) => (
          <ZonePanel
            key={zone.id}
            zone={zone}
            branchId={branchId}
            onEditZone={(z) => setZoneModal({ open: true, data: z })}
            onDeleteZone={(z) => setDeleteZoneConfirm(z)}
            onAddTable={(z) => setTableModal({ open: true, zone: z, data: null })}
            onEditTable={(z, t) => setTableModal({ open: true, zone: z, data: t })}
            onDeleteTable={(z, t) => setDeleteTableConfirm({ zone: z, table: t })}
            onStatusChange={handleStatusChange}
            saving={saving}
          />
        ))
      )}

      {/* Zone modals */}
      <ZoneFormModal
        open={zoneModal.open}
        onClose={() => setZoneModal({ open: false, data: null })}
        onSave={handleSaveZone}
        initialData={zoneModal.data}
        saving={saving}
      />

      <Modal
        open={Boolean(deleteZoneConfirm)}
        onClose={() => setDeleteZoneConfirm(null)}
        title="Eliminar zona"
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">
            ¿Eliminar la zona <strong>{deleteZoneConfirm?.name}</strong>? Solo se puede eliminar si no tiene mesas asignadas.
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setDeleteZoneConfirm(null)} className="flex-1">Cancelar</Button>
            <Button variant="danger" onClick={() => handleDeleteZone(deleteZoneConfirm)} className="flex-1">Eliminar</Button>
          </div>
        </div>
      </Modal>

      {/* Table modals */}
      <TableFormModal
        open={tableModal.open}
        onClose={() => setTableModal({ open: false, zone: null, data: null })}
        onSave={handleSaveTable}
        initialData={tableModal.data}
        saving={saving}
      />

      <Modal
        open={Boolean(deleteTableConfirm)}
        onClose={() => setDeleteTableConfirm(null)}
        title="Eliminar mesa"
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">
            ¿Eliminar la mesa <strong>#{deleteTableConfirm?.table?.number}</strong> de la zona{' '}
            <strong>{deleteTableConfirm?.zone?.name}</strong>? Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setDeleteTableConfirm(null)} className="flex-1">Cancelar</Button>
            <Button variant="danger" onClick={() => handleDeleteTable(deleteTableConfirm)} className="flex-1">Eliminar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
