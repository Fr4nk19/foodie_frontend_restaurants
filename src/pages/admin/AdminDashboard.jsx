import { useState, useEffect } from 'react';
import {
  ClipboardList, TableProperties, Users, TrendingUp,
  Clock, CheckCircle2, AlertCircle, ChefHat,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';

// Mock data – replace with real API calls when orders endpoint is ready
const MOCK_STATS = {
  pendingOrders: 5,
  inProgressOrders: 3,
  completedToday: 28,
  activeTables: 7,
  totalTables: 12,
  staff: 8,
};

const MOCK_RECENT_ORDERS = [
  { id: 1, table: 'Mesa 3', items: 4, status: 'pending', time: '12:34' },
  { id: 2, table: 'Mesa 7', items: 2, status: 'preparing', time: '12:30' },
  { id: 3, table: 'Mesa 1', items: 6, status: 'ready', time: '12:25' },
  { id: 4, table: 'Mesa 5', items: 3, status: 'delivered', time: '12:15' },
  { id: 5, table: 'Para llevar', items: 1, status: 'preparing', time: '12:10' },
];

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
  const [loading, setLoading] = useState(false);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {getGreeting()}, {user?.name?.split(' ')[0] ?? 'Administrador'}
        </h1>
        <p className="text-gray-500 mt-1">Resumen del día en el restaurante</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Clock}
          label="Pedidos pendientes"
          value={MOCK_STATS.pendingOrders}
          sub="En espera de ser tomados"
          color="amber"
        />
        <StatCard
          icon={ChefHat}
          label="En preparación"
          value={MOCK_STATS.inProgressOrders}
          sub="Siendo preparados en cocina"
          color="blue"
        />
        <StatCard
          icon={CheckCircle2}
          label="Completados hoy"
          value={MOCK_STATS.completedToday}
          sub="Pedidos entregados"
          color="emerald"
        />
        <StatCard
          icon={TableProperties}
          label="Mesas ocupadas"
          value={`${MOCK_STATS.activeTables}/${MOCK_STATS.totalTables}`}
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
                {MOCK_RECENT_ORDERS.map((order) => {
                  const status = STATUS_MAP[order.status] || { label: order.status, variant: 'gray' };
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 text-gray-400">#{order.id}</td>
                      <td className="py-3 font-medium text-gray-900">{order.table}</td>
                      <td className="py-3 text-gray-600">{order.items} productos</td>
                      <td className="py-3">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                      <td className="py-3 text-gray-500">{order.time}</td>
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
