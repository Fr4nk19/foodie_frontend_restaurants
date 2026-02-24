import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, ChefHat, Coffee, ShieldCheck } from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';
import { getUsers } from '../../api/users';

const ROLE_MAP = {
  company_admin: { label: 'Administrador', variant: 'purple', icon: ShieldCheck },
  branch_manager: { label: 'Gerente', variant: 'info', icon: ShieldCheck },
  employee: { label: 'Empleado', variant: 'gray', icon: Coffee },
};

const JOB_TYPE_MAP = {
  kitchen: { label: 'Cocina', variant: 'orange', icon: ChefHat },
  waiter: { label: 'Mesero', variant: 'success', icon: Coffee },
};

export default function AdminStaffPage() {
  const { user } = useAuth();
  const companyId = user?.company_id;

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const fetchStaff = useCallback(async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      const res = await getUsers(companyId);
      setStaff(res.data.data || []);
    } catch {
      setError('No se pudo cargar el personal');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const filtered = staff.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Personal</h1>
          <p className="text-gray-500 mt-1">Equipo del restaurante</p>
        </div>
        <Button>
          <Plus className="w-4 h-4" />
          Agregar empleado
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
      <div className="mb-5">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar empleado..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Staff list */}
      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Empleado</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Rol</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Tipo</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                  No se encontró personal
                </td>
              </tr>
            )}
            {filtered.map((member) => {
              const role = ROLE_MAP[member.role] || { label: member.role, variant: 'gray' };
              const jobType = member.job_type ? JOB_TYPE_MAP[member.job_type] : null;
              return (
                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-semibold text-sm shrink-0">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{member.name}</p>
                        <p className="text-xs text-gray-400">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={role.variant}>{role.label}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {jobType ? (
                      <Badge variant={jobType.variant}>{jobType.label}</Badge>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={member.is_active ? 'success' : 'error'}>
                      {member.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
