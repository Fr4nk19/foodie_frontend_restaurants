import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Plus } from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';
import { getOrders, updateOrderStatus } from '../../api/orders';

const STATUS_TABS = [
  { key: 'all', label: 'Todos' },
  { key: 'pending', label: 'Pendientes' },
  { key: 'preparing', label: 'Preparando' },
  { key: 'ready', label: 'Listos' },
  { key: 'delivered', label: 'Entregados' },
  { key: 'cancelled', label: 'Cancelados' },
];

const STATUS_MAP = {
  pending: { label: 'Pendiente', variant: 'warning' },
  preparing: { label: 'Preparando', variant: 'info' },
  ready: { label: 'Listo', variant: 'success' },
  delivered: { label: 'Entregado', variant: 'gray' },
  cancelled: { label: 'Cancelado', variant: 'error' },
};

function OrderDetailModal({ order, onClose, onStatusChange }) {
  if (!order) return null;
  const status = STATUS_MAP[order.status];

  const NEXT_STATUS = {
    pending: 'preparing',
    preparing: 'ready',
    ready: 'delivered',
  };
  const nextStatus = NEXT_STATUS[order.status];
  const nextLabel = nextStatus ? STATUS_MAP[nextStatus]?.label : null;

  const tableName = order.table ? `Mesa ${order.table.number}` : (order.type === 'takeout' ? 'Para llevar' : 'Delivery');
  const waiterName = order.waiter?.name || '—';
  const orderTime = order.created_at ? new Date(order.created_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : '';
  const items = order.items || [];
  const total = Number(order.total) || 0;

  return (
    <Modal open={Boolean(order)} onClose={onClose} title={`Pedido #${order.id} – ${tableName}`} size="md">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Mesero: <span className="font-medium text-gray-900">{waiterName}</span></p>
            <p className="text-sm text-gray-500">Hora: <span className="font-medium text-gray-900">{orderTime}</span></p>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Productos</p>
          <div className="border border-gray-100 rounded-lg overflow-hidden">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 last:border-0 text-sm">
                <span className="text-gray-900">{item.quantity}x {item.product?.nombre || 'Producto'}</span>
                <span className="text-gray-600 font-medium">${Number(item.subtotal).toFixed(2)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 text-sm font-semibold">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {nextStatus && (
          <Button
            variant="primary"
            onClick={() => onStatusChange(order.id, nextStatus)}
            className="w-full"
          >
            Marcar como: {nextLabel}
          </Button>
        )}
        {order.status !== 'cancelled' && order.status !== 'delivered' && (
          <Button
            variant="danger"
            onClick={() => onStatusChange(order.id, 'cancelled')}
            className="w-full"
          >
            Cancelar pedido
          </Button>
        )}
      </div>
    </Modal>
  );
}

export default function AdminOrdersPage() {
  const { user } = useAuth();
  const companyId = user?.company_id;
  const branchId = user?.branch_id;

  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = useCallback(async () => {
    if (!companyId || !branchId) return;
    try {
      setLoading(true);
      const res = await getOrders(companyId, branchId, { per_page: 100, today: 1 });
      setOrders(res.data.data || []);
    } catch {
      setError('No se pudieron cargar los pedidos');
    } finally {
      setLoading(false);
    }
  }, [companyId, branchId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filtered = activeTab === 'all' ? orders : orders.filter((o) => o.status === activeTab);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(companyId, branchId, orderId, newStatus);
      setSelectedOrder(null);
      await fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar el estado');
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
          <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-gray-500 mt-1">Gestión de todos los pedidos del restaurante</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={fetchOrders}>
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 font-medium">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 overflow-x-auto">
        {STATUS_TABS.map((tab) => {
          const count = tab.key === 'all' ? orders.length : orders.filter((o) => o.status === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key ? 'bg-brand-100 text-brand-700' : 'bg-gray-200 text-gray-600'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Orders list */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-400">
            No hay pedidos en este estado
          </div>
        )}
        {filtered.map((order) => {
          const status = STATUS_MAP[order.status];
          const tableName = order.table ? `Mesa ${order.table.number}` : (order.type === 'takeout' ? 'Para llevar' : 'Delivery');
          const waiterName = order.waiter?.name || '—';
          const orderTime = order.created_at ? new Date(order.created_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : '';
          const items = order.items || [];
          const total = Number(order.total) || 0;

          return (
            <button
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="card text-left hover:shadow-md transition-shadow cursor-pointer hover:border-brand-200 border border-gray-100"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900">{tableName}</p>
                  <p className="text-xs text-gray-400">{waiterName} · {orderTime}</p>
                </div>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
              <div className="text-sm text-gray-600 mb-3">
                {items.slice(0, 2).map((item) => (
                  <p key={item.id}>{item.quantity}x {item.product?.nombre || 'Producto'}</p>
                ))}
                {items.length > 2 && (
                  <p className="text-gray-400">+{items.length - 2} más</p>
                )}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400">#{order.id}</p>
                <p className="font-semibold text-gray-900">${total.toFixed(2)}</p>
              </div>
            </button>
          );
        })}
      </div>

      <OrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
