import { useState, useEffect, useCallback } from 'react';
import {
  ClipboardList, TableProperties, Users, TrendingUp,
  Clock, CheckCircle2, AlertCircle, ChefHat,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import { getDashboardStats } from '../../api/dashboard';

const STATUS_MAP = {
  pending: { label: 'Pendiente', variant: 'warning' },
  preparing: { label: 'Preparando', variant: 'info' },
  ready: { label: 'Listo', variant: 'success' },
  delivered: { label: 'Entregado', variant: 'gray' },
  cancelled: { label: 'Cancelado', variant: 'error' },
};

function StatCard({ icon: Icon, label, value, sub, color = 'brand' }) {
  const colorMap = {
    brand: 'bg-brand-50 text-brand-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
  };
  return (
    <div className="card flex items-start gap-4">
      <div className={`p-3 rounded-xl ${colorMap[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const companyId = user?.company_id;
  const branchId = user?.branch_id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    pending_orders: 0,
    in_progress_orders: 0,
    completed_today: 0,
    active_tables: 0,
    total_tables: 0,
    staff: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);

  const fetchDashboard = useCallback(async () => {
    if (!companyId || !branchId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await getDashboardStats(companyId, branchId);
      setStats(res.data.data.stats || {});
      setRecentOrders(res.data.data.recent_orders || []);
    } catch {
      setError('No se pudo cargar el dashboard');
    } finally {
      setLoading(false);
    }
  }, [companyId, branchId]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {getGreeting()}, {user?.name?.split(' ')[0] ?? 'Administrador'}
        </h1>
        <p className="text-gray-500 mt-1">Resumen del día en el restaurante</p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 font-medium">✕</button>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Clock}
          label="Pedidos pendientes"
          value={stats.pending_orders}
          sub="En espera de ser tomados"
          color="amber"
        />
        <StatCard
          icon={ChefHat}
          label="En preparación"
          value={stats.in_progress_orders}
          sub="Siendo preparados en cocina"
          color="blue"
        />
        <StatCard
          icon={CheckCircle2}
          label="Completados hoy"
          value={stats.completed_today}
          sub="Pedidos entregados"
          color="emerald"
        />
        <StatCard
          icon={TableProperties}
          label="Mesas ocupadas"
          value={`${stats.active_tables}/${stats.total_tables}`}
          sub="Capacidad del salón"
          color="brand"
        />
      </div>

      {/* Recent orders */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Pedidos recientes</h2>
          <a href="/admin/orders" className="text-sm text-brand-600 hover:underline font-medium">
            Ver todos
          </a>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : recentOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No hay pedidos hoy</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-3 text-left font-medium text-gray-500">#</th>
                  <th className="pb-3 text-left font-medium text-gray-500">Mesa / Tipo</th>
                  <th className="pb-3 text-left font-medium text-gray-500">Items</th>
                  <th className="pb-3 text-left font-medium text-gray-500">Estado</th>
                  <th className="pb-3 text-left font-medium text-gray-500">Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.map((order) => {
                  const status = STATUS_MAP[order.status] || { label: order.status, variant: 'gray' };
                  const tableName = order.table ? `Mesa ${order.table.number}` : (order.type === 'takeout' ? 'Para llevar' : 'Delivery');
                  const orderTime = order.created_at ? new Date(order.created_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : '';
                  const itemCount = order.items?.length || order.items_count || 0;
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 text-gray-400">#{order.id}</td>
                      <td className="py-3 font-medium text-gray-900">{tableName}</td>
                      <td className="py-3 text-gray-600">{itemCount} productos</td>
                      <td className="py-3">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                      <td className="py-3 text-gray-500">{orderTime}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
