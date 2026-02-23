import { useState } from 'react';
import { Filter, RefreshCw, Plus } from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';

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

const MOCK_ORDERS = [
  {
    id: 1, table: 'Mesa 3', waiter: 'Juan Pérez', items: [
      { name: 'Tacos de carne', qty: 2, price: 45 },
      { name: 'Agua mineral', qty: 2, price: 20 },
    ], status: 'pending', time: '12:34', total: 130,
  },
  {
    id: 2, table: 'Mesa 7', waiter: 'Ana López', items: [
      { name: 'Pizza Margherita', qty: 1, price: 120 },
    ], status: 'preparing', time: '12:30', total: 120,
  },
  {
    id: 3, table: 'Mesa 1', waiter: 'Juan Pérez', items: [
      { name: 'Pasta carbonara', qty: 2, price: 95 },
      { name: 'Refresco', qty: 2, price: 30 },
      { name: 'Postre del día', qty: 1, price: 55 },
    ], status: 'ready', time: '12:25', total: 305,
  },
  {
    id: 4, table: 'Mesa 5', waiter: 'Carlos Ruiz', items: [
      { name: 'Hamburguesa clásica', qty: 3, price: 85 },
    ], status: 'delivered', time: '12:15', total: 255,
  },
  {
    id: 5, table: 'Para llevar', waiter: 'Ana López', items: [
      { name: 'Ensalada César', qty: 1, price: 70 },
    ], status: 'preparing', time: '12:10', total: 70,
  },
];

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

  return (
    <Modal open={Boolean(order)} onClose={onClose} title={`Pedido #${order.id} – ${order.table}`} size="md">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Mesero: <span className="font-medium text-gray-900">{order.waiter}</span></p>
            <p className="text-sm text-gray-500">Hora: <span className="font-medium text-gray-900">{order.time}</span></p>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Productos</p>
          <div className="border border-gray-100 rounded-lg overflow-hidden">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 last:border-0 text-sm">
                <span className="text-gray-900">{item.qty}x {item.name}</span>
                <span className="text-gray-600 font-medium">${(item.qty * item.price).toFixed(2)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 text-sm font-semibold">
              <span>Total</span>
              <span>${order.total.toFixed(2)}</span>
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
  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState(MOCK_ORDERS);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const filtered = activeTab === 'all' ? orders : orders.filter((o) => o.status === activeTab);

  const handleStatusChange = (orderId, newStatus) => {
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
    setSelectedOrder(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-gray-500 mt-1">Gestión de todos los pedidos del restaurante</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4" />
            Nuevo pedido
          </Button>
        </div>
      </div>

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
          return (
            <button
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="card text-left hover:shadow-md transition-shadow cursor-pointer hover:border-brand-200 border border-gray-100"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900">{order.table}</p>
                  <p className="text-xs text-gray-400">{order.waiter} · {order.time}</p>
                </div>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
              <div className="text-sm text-gray-600 mb-3">
                {order.items.slice(0, 2).map((item, i) => (
                  <p key={i}>{item.qty}x {item.name}</p>
                ))}
                {order.items.length > 2 && (
                  <p className="text-gray-400">+{order.items.length - 2} más</p>
                )}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400">#{order.id}</p>
                <p className="font-semibold text-gray-900">${order.total.toFixed(2)}</p>
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
