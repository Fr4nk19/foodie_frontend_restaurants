import { useState, useEffect, useCallback } from 'react';
import { ChefHat, Clock, CheckCircle2, RefreshCw, Bell } from 'lucide-react';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';
import {
  getKitchenOrders,
  updateKitchenOrderStatus,
  updateKitchenItemStatus,
} from '../../api/kitchen';

// Kitchen columns: pending → confirmed → in_progress → ready
const STATUS_COLUMNS = [
  { key: 'pending',     label: 'Nuevos pedidos',    icon: Bell,         color: 'text-amber-500',   bg: 'bg-amber-50'   },
  { key: 'confirmed',   label: 'Confirmados',        icon: ChefHat,      color: 'text-blue-400',    bg: 'bg-blue-50'    },
  { key: 'in_progress', label: 'En preparación',     icon: ChefHat,      color: 'text-blue-500',    bg: 'bg-blue-50'    },
  { key: 'ready',       label: 'Listos para servir', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
];

const NEXT_STATUS = {
  pending:     'confirmed',
  confirmed:   'in_progress',
  in_progress: 'ready',
};

const NEXT_LABEL = {
  pending:     'Confirmar',
  confirmed:   'Empezar',
  in_progress: 'Marcar listo',
};

const ITEM_STATUS_MAP = {
  pending:     { label: 'Pendiente',   dot: 'bg-gray-300' },
  in_progress: { label: 'Preparando', dot: 'bg-blue-400' },
  ready:       { label: 'Listo',      dot: 'bg-emerald-500' },
  cancelled:   { label: 'Cancelado',  dot: 'bg-red-400' },
};

function elapsed(date) {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return 'Ahora';
  if (mins === 1) return '1 min';
  return `${mins} min`;
}

function elapsedColor(date) {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins >= 15) return 'text-red-400 font-bold';
  if (mins >= 10) return 'text-amber-400 font-semibold';
  return 'text-gray-500';
}

function KitchenOrderCard({ order, branchId, onAdvance, onToggleItem }) {
  const items     = order.items || [];
  const readyCount = items.filter((i) => i.status === 'ready').length;
  const allReady   = readyCount === items.length && items.length > 0;
  const nextStatus = NEXT_STATUS[order.status];
  const nextLabel  = NEXT_LABEL[order.status];

  const tableName = order.table
    ? `Mesa ${order.table.number}${order.table.zone ? ` · ${order.table.zone.name}` : ''}`
    : order.type === 'takeout' ? 'Para llevar' : 'Delivery';

  const waiterName = order.waiter?.name || '—';

  const borderColor = {
    pending:     'border-amber-300',
    confirmed:   'border-blue-300',
    in_progress: 'border-blue-500',
    ready:       'border-emerald-400',
  }[order.status] ?? 'border-gray-300';

  return (
    <div className={`bg-white rounded-xl border-2 ${borderColor} shadow-sm overflow-hidden`}>
      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex items-start justify-between gap-2">
        <div>
          <p className="font-bold text-gray-900">{tableName}</p>
          <p className="text-xs text-gray-500">#{order.code ?? order.id} · {waiterName}</p>
        </div>
        <div className={`flex items-center gap-1 text-xs ${elapsedColor(order.created_at)}`}>
          <Clock className="w-3.5 h-3.5" />
          {elapsed(order.created_at)}
        </div>
      </div>

      {/* Items */}
      <div className="px-4 pb-3 flex flex-col gap-2">
        {items.map((item) => {
          const itemStatus = ITEM_STATUS_MAP[item.status] ?? ITEM_STATUS_MAP.pending;
          const isDone     = item.status === 'ready';
          return (
            <button
              key={item.id}
              onClick={() => onToggleItem(branchId, item.id, isDone ? 'in_progress' : 'ready')}
              className={`flex items-start gap-3 p-2.5 rounded-lg text-left transition-colors ${
                isDone ? 'bg-emerald-50 opacity-70' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${itemStatus.dot}`} />
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium ${isDone ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                  {item.quantity}x {item.product_name}
                </p>
                {item.notes && (
                  <p className="text-xs text-amber-600 mt-0.5">Nota: {item.notes}</p>
                )}
              </div>
            </button>
          );
        })}

        {/* Progress bar */}
        {items.length > 0 && (
          <div className="mt-1">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Progreso</span>
              <span>{readyCount}/{items.length}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${items.length > 0 ? (readyCount / items.length) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="mx-4 mb-3 text-xs bg-amber-50 border border-amber-100 text-amber-700 px-3 py-1.5 rounded-lg">
          Nota: {order.notes}
        </div>
      )}

      {/* Action */}
      {nextStatus && (
        <div className="px-4 pb-4">
          <Button
            size="sm"
            variant={order.status === 'in_progress' ? 'success' : 'warning'}
            onClick={() => onAdvance(branchId, order.id, nextStatus)}
            disabled={order.status === 'in_progress' && !allReady}
            className="w-full"
          >
            {order.status === 'in_progress' && !allReady
              ? `Faltan ${items.length - readyCount} ítem(s)`
              : nextLabel}
          </Button>
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
  const branchId = user?.branch_id;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Re-render every minute for elapsed times
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!branchId) return;
    try {
      const res = await getKitchenOrders(branchId);
      setOrders(res.data.data || []);
      setLastUpdated(new Date());
    } catch {
      setError('No se pudieron cargar los pedidos');
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleAdvance = async (bid, orderId, newStatus) => {
    try {
      await updateKitchenOrderStatus(bid, orderId, newStatus);
      await fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar el pedido');
    }
  };

  const handleToggleItem = async (bid, itemId, newStatus) => {
    try {
      await updateKitchenItemStatus(bid, itemId, newStatus);
      await fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar el ítem');
    }
  };

  const pendingCount = orders.filter((o) => o.status === 'pending').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Spinner className="w-8 h-8 text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Kitchen header */}
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

      {/* Kanban */}
      <div className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {STATUS_COLUMNS.map((col) => {
            const colOrders = orders.filter((o) => o.status === col.key);
            const Icon = col.icon;
            return (
              <div key={col.key}>
                <div className={`flex items-center gap-2 mb-4 px-3 py-2 rounded-xl ${col.bg} bg-opacity-10`}>
                  <Icon className={`w-5 h-5 ${col.color}`} />
                  <h2 className={`font-semibold ${col.color}`}>{col.label}</h2>
                  <span className={`ml-auto text-sm font-bold px-2 py-0.5 rounded-full ${col.bg} ${col.color}`}>
                    {colOrders.length}
                  </span>
                </div>
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
                      branchId={branchId}
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
