import { useState, useEffect, useCallback } from 'react';
import {
  ChefHat, Clock, CheckCircle2, AlertTriangle, RefreshCw, Bell,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';
import { getOrders, updateOrderStatus, toggleOrderItem } from '../../api/orders';

const PRIORITY_CONFIG = {
  urgent: { label: 'URGENTE', color: 'bg-red-500 text-white', border: 'border-red-400' },
  high: { label: 'Alta', color: 'bg-amber-400 text-amber-900', border: 'border-amber-300' },
  normal: { label: 'Normal', color: 'bg-gray-100 text-gray-600', border: 'border-gray-200' },
};

const STATUS_COLUMNS = [
  { key: 'pending', label: 'Nuevos pedidos', icon: Bell, color: 'text-amber-500', bg: 'bg-amber-50' },
  { key: 'preparing', label: 'En preparación', icon: ChefHat, color: 'text-blue-500', bg: 'bg-blue-50' },
  { key: 'ready', label: 'Listos para servir', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
];

function elapsed(date) {
  const diffMs = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Ahora';
  if (mins === 1) return '1 min';
  return `${mins} min`;
}

function elapsedColor(date) {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins >= 15) return 'text-red-600 font-bold';
  if (mins >= 10) return 'text-amber-600 font-semibold';
  return 'text-gray-400';
}

function KitchenOrderCard({ order, onAdvance, onToggleItem }) {
  const priority = PRIORITY_CONFIG[order.priority] || PRIORITY_CONFIG.normal;
  const items = order.items || [];
  const doneCount = items.filter((i) => i.is_done).length;
  const allDone = doneCount === items.length;

  const tableName = order.table ? `Mesa ${order.table.number}` : (order.type === 'takeout' ? 'Para llevar' : 'Delivery');
  const waiterName = order.waiter?.name || '—';

  return (
    <div className={`bg-white rounded-xl border-2 ${priority.border} shadow-sm overflow-hidden`}>
      {/* Card header */}
      <div className="px-4 pt-3 pb-2 flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-bold text-gray-900">{tableName}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priority.color}`}>
              {priority.label}
            </span>
          </div>
          <p className="text-xs text-gray-500">#{order.id} · {waiterName}</p>
        </div>
        <div className={`flex items-center gap-1 text-xs ${elapsedColor(order.created_at)}`}>
          <Clock className="w-3.5 h-3.5" />
          {elapsed(order.created_at)}
        </div>
      </div>

      {/* Items */}
      <div className="px-4 pb-3">
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => onToggleItem(order.id, item.id)}
              className={`flex items-start gap-3 p-2.5 rounded-lg text-left transition-colors ${
                item.is_done ? 'bg-emerald-50 opacity-60' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center transition-colors ${
                item.is_done ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'
              }`}>
                {item.is_done && <CheckCircle2 className="w-3 h-3 text-white" />}
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-medium ${item.is_done ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                  {item.quantity}x {item.product?.nombre || 'Producto'}
                </p>
                {item.notes && (
                  <p className="text-xs text-amber-600 mt-0.5">Nota: {item.notes}</p>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Progress bar */}
        {items.length > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Progreso</span>
              <span>{doneCount}/{items.length}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${(doneCount / items.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Action */}
      {order.status !== 'ready' && (
        <div className="px-4 pb-4">
          {order.status === 'pending' && (
            <Button
              size="sm"
              variant="warning"
              onClick={() => onAdvance(order.id, 'preparing')}
              className="w-full"
            >
              <ChefHat className="w-4 h-4" />
              Empezar a preparar
            </Button>
          )}
          {order.status === 'preparing' && (
            <Button
              size="sm"
              variant="success"
              onClick={() => onAdvance(order.id, 'ready')}
              disabled={!allDone}
              className="w-full"
            >
              <CheckCircle2 className="w-4 h-4" />
              {allDone ? 'Marcar como listo' : `Faltan ${items.length - doneCount} ítems`}
            </Button>
          )}
        </div>
      )}

      {order.status === 'ready' && (
        <div className="px-4 pb-4">
          <div className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 rounded-lg py-2 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Listo para servir
          </div>
        </div>
      )}
    </div>
  );
}

export default function KitchenPage() {
  const { user } = useAuth();
  const companyId = user?.company_id;
  const branchId = user?.branch_id;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [tick, setTick] = useState(0);

  // Re-render every minute to update elapsed times
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!companyId || !branchId) return;
    try {
      setLoading(true);
      const res = await getOrders(companyId, branchId, {
        status: 'pending,preparing,ready',
        per_page: 100,
        today: 1,
      });
      setOrders(res.data.data || []);
      setLastUpdated(new Date());
    } catch {
      setError('No se pudieron cargar los pedidos');
    } finally {
      setLoading(false);
    }
  }, [companyId, branchId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleAdvance = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(companyId, branchId, orderId, newStatus);
      await fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar el pedido');
    }
  };

  const handleToggleItem = async (orderId, itemId) => {
    try {
      await toggleOrderItem(companyId, branchId, orderId, itemId);
      await fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar el ítem');
    }
  };

  const pendingCount = orders.filter((o) => o.status === 'pending').length;

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Spinner className="w-8 h-8 text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Kitchen Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="bg-brand-600 p-2 rounded-lg">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Vista de Cocina</h1>
              <p className="text-xs text-gray-400">
                Actualizado: {lastUpdated.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <div className="flex items-center gap-2 bg-amber-500 text-amber-950 px-3 py-1.5 rounded-full text-sm font-bold animate-pulse">
                <Bell className="w-4 h-4" />
                {pendingCount} nuevo{pendingCount > 1 ? 's' : ''}
              </div>
            )}
            <button
              onClick={fetchOrders}
              className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-900/50 border border-red-700 text-red-300 text-sm rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200 font-medium">✕</button>
        </div>
      )}

      {/* Kanban columns */}
      <div className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STATUS_COLUMNS.map((col) => {
            const colOrders = orders.filter((o) => o.status === col.key);
            const Icon = col.icon;
            return (
              <div key={col.key}>
                {/* Column header */}
                <div className={`flex items-center gap-2 mb-4 px-3 py-2 rounded-xl ${col.bg} bg-opacity-10`}>
                  <Icon className={`w-5 h-5 ${col.color}`} />
                  <h2 className={`font-semibold ${col.color}`}>{col.label}</h2>
                  <span className={`ml-auto text-sm font-bold px-2 py-0.5 rounded-full ${col.bg} ${col.color}`}>
                    {colOrders.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-4">
                  {colOrders.length === 0 && (
                    <div className="text-center py-8 text-gray-600 text-sm border-2 border-dashed border-gray-800 rounded-xl">
                      Sin pedidos
                    </div>
                  )}
                  {colOrders.map((order) => (
                    <KitchenOrderCard
                      key={order.id}
                      order={order}
                      onAdvance={handleAdvance}
                      onToggleItem={handleToggleItem}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
