import { useState } from 'react';
import {
  TableProperties, Plus, Users, Clock,
  CheckCircle2, X, ShoppingCart, ChefHat,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';

// Mock data
const MOCK_TABLES = [
  { id: 1, number: 1, capacity: 2, status: 'available', zone: 'Interior', order: null },
  { id: 2, number: 2, capacity: 4, status: 'occupied', zone: 'Interior', order: { id: 'ORD-005', status: 'preparing', items: 3, total: 210 } },
  { id: 3, number: 3, capacity: 4, status: 'occupied', zone: 'Interior', order: { id: 'ORD-001', status: 'ready', items: 4, total: 320 } },
  { id: 4, number: 4, capacity: 6, status: 'available', zone: 'Interior', order: null },
  { id: 5, number: 5, capacity: 2, status: 'reserved', zone: 'Terraza', order: null },
  { id: 6, number: 6, capacity: 4, status: 'available', zone: 'Terraza', order: null },
  { id: 7, number: 7, capacity: 8, status: 'occupied', zone: 'Terraza', order: { id: 'ORD-003', status: 'pending', items: 6, total: 580 } },
];

const MOCK_MENU = [
  { id: 1, name: 'Tacos de carne asada', price: 65, category: 'Platos principales' },
  { id: 2, name: 'Pizza Margherita', price: 120, category: 'Platos principales' },
  { id: 3, name: 'Pasta carbonara', price: 95, category: 'Platos principales' },
  { id: 4, name: 'Hamburguesa clásica', price: 85, category: 'Platos principales' },
  { id: 5, name: 'Ensalada César', price: 70, category: 'Ensaladas' },
  { id: 6, name: 'Sopa del día', price: 45, category: 'Entradas' },
  { id: 7, name: 'Agua mineral', price: 20, category: 'Bebidas' },
  { id: 8, name: 'Refresco', price: 30, category: 'Bebidas' },
  { id: 9, name: 'Jugo natural', price: 40, category: 'Bebidas' },
  { id: 10, name: 'Postre del día', price: 55, category: 'Postres' },
];

const TABLE_STATUS_CONFIG = {
  available: { label: 'Disponible', color: 'bg-emerald-100 border-emerald-300 text-emerald-800' },
  occupied: { label: 'Ocupada', color: 'bg-amber-100 border-amber-300 text-amber-800' },
  reserved: { label: 'Reservada', color: 'bg-blue-100 border-blue-300 text-blue-800' },
  cleaning: { label: 'Limpieza', color: 'bg-gray-100 border-gray-300 text-gray-600' },
};

const ORDER_STATUS_CONFIG = {
  pending: { label: 'Enviado', variant: 'warning' },
  preparing: { label: 'Preparando', variant: 'info' },
  ready: { label: 'Listo!', variant: 'success' },
  delivered: { label: 'Entregado', variant: 'gray' },
};

function TableGrid({ tables, onSelectTable }) {
  const zones = [...new Set(tables.map((t) => t.zone))];

  return (
    <div>
      {zones.map((zone) => (
        <div key={zone} className="mb-8">
          <h2 className="text-base font-semibold text-gray-700 mb-3">{zone}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
            {tables
              .filter((t) => t.zone === zone)
              .map((table) => {
                const statusCfg = TABLE_STATUS_CONFIG[table.status];
                return (
                  <button
                    key={table.id}
                    onClick={() => onSelectTable(table)}
                    className={`relative rounded-xl border-2 p-4 text-left transition-all hover:shadow-md hover:scale-105 ${statusCfg.color}`}
                  >
                    <p className="text-2xl font-bold">#{table.number}</p>
                    <div className="flex items-center gap-1 text-xs mt-1 opacity-70">
                      <Users className="w-3 h-3" />
                      {table.capacity}
                    </div>
                    <p className="text-xs font-medium mt-2">{statusCfg.label}</p>

                    {/* Order status badge */}
                    {table.order && (
                      <div className="absolute top-2 right-2">
                        {table.order.status === 'ready' && (
                          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                        )}
                        {table.order.status === 'pending' && (
                          <div className="w-3 h-3 bg-amber-400 rounded-full" />
                        )}
                        {table.order.status === 'preparing' && (
                          <div className="w-3 h-3 bg-blue-400 rounded-full" />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}

function NewOrderModal({ table, open, onClose, onSubmit }) {
  const [orderItems, setOrderItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [notes, setNotes] = useState('');

  const categories = ['Todos', ...new Set(MOCK_MENU.map((p) => p.category))];
  const filteredMenu = selectedCategory === 'Todos'
    ? MOCK_MENU
    : MOCK_MENU.filter((p) => p.category === selectedCategory);

  const addItem = (product) => {
    setOrderItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...product, qty: 1, note: '' }];
    });
  };

  const removeItem = (id) => {
    setOrderItems((prev) => {
      const existing = prev.find((i) => i.id === id);
      if (existing?.qty > 1) {
        return prev.map((i) => i.id === id ? { ...i, qty: i.qty - 1 } : i);
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  const total = orderItems.reduce((sum, i) => sum + i.price * i.qty, 0);

  const handleSubmit = () => {
    if (orderItems.length === 0) return;
    onSubmit({ tableId: table.id, items: orderItems, notes });
    setOrderItems([]);
    setNotes('');
  };

  if (!table) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Nuevo pedido – Mesa ${table.number}`} size="2xl">
      <div className="flex gap-4 h-[60vh]">
        {/* Menu section */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Category filter */}
          <div className="flex gap-1.5 flex-wrap mb-3">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                  selectedCategory === cat
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Menu items */}
          <div className="overflow-y-auto flex-1 flex flex-col gap-1.5 pr-1">
            {filteredMenu.map((product) => {
              const inOrder = orderItems.find((i) => i.id === product.id);
              return (
                <div
                  key={product.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    inOrder ? 'bg-brand-50 border-brand-200' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500">${product.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {inOrder && (
                      <>
                        <button
                          onClick={() => removeItem(product.id)}
                          className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 text-sm font-bold flex items-center justify-center"
                        >
                          −
                        </button>
                        <span className="text-sm font-bold text-brand-700 w-4 text-center">{inOrder.qty}</span>
                      </>
                    )}
                    <button
                      onClick={() => addItem(product)}
                      className="w-6 h-6 rounded-full bg-brand-600 text-white hover:bg-brand-700 text-sm font-bold flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order summary */}
        <div className="w-56 flex flex-col border-l border-gray-100 pl-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">Resumen</p>
          <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 mb-3">
            {orderItems.length === 0 && (
              <p className="text-xs text-gray-400 text-center mt-4">Sin productos</p>
            )}
            {orderItems.map((item) => (
              <div key={item.id} className="flex items-start justify-between text-xs gap-2">
                <span className="text-gray-700 flex-1 min-w-0 truncate">{item.qty}x {item.name}</span>
                <span className="text-gray-500 shrink-0">${(item.qty * item.price).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-2 mb-3">
            <div className="flex justify-between text-sm font-semibold">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas del pedido..."
            rows={2}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-brand-400 mb-3"
          />

          <Button
            onClick={handleSubmit}
            disabled={orderItems.length === 0}
            className="w-full"
          >
            <ShoppingCart className="w-4 h-4" />
            Enviar a cocina
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function TableDetailModal({ table, open, onClose, onNewOrder, onMarkDelivered }) {
  if (!table) return null;

  const hasActiveOrder = table.order && table.order.status !== 'delivered';
  const orderStatus = table.order ? ORDER_STATUS_CONFIG[table.order.status] : null;

  return (
    <Modal open={open} onClose={onClose} title={`Mesa ${table.number} – ${table.zone}`} size="sm">
      <div className="flex flex-col gap-4">
        {/* Table info */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
            <Users className="w-5 h-5 text-gray-500" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Capacidad: {table.capacity} personas</p>
            <p className="text-sm text-gray-500">{TABLE_STATUS_CONFIG[table.status].label}</p>
          </div>
        </div>

        {/* Active order */}
        {table.order && (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
              <p className="text-sm font-medium text-gray-700">{table.order.id}</p>
              <Badge variant={orderStatus.variant}>{orderStatus.label}</Badge>
            </div>
            <div className="px-4 py-3 text-sm text-gray-600">
              <p>{table.order.items} productos · ${table.order.total.toFixed(2)}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {table.status === 'available' && (
            <Button onClick={() => onNewOrder(table)} className="w-full">
              <Plus className="w-4 h-4" />
              Nuevo pedido
            </Button>
          )}
          {table.order?.status === 'ready' && (
            <Button variant="success" onClick={() => onMarkDelivered(table.id)} className="w-full">
              <CheckCircle2 className="w-4 h-4" />
              Marcar como entregado
            </Button>
          )}
          {hasActiveOrder && (
            <Button variant="secondary" onClick={onClose} className="w-full">
              Cerrar
            </Button>
          )}
          {!hasActiveOrder && (
            <Button variant="secondary" onClick={onClose} className="w-full">
              Cerrar
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default function WaiterPage() {
  const [tables, setTables] = useState(MOCK_TABLES);
  const [selectedTable, setSelectedTable] = useState(null);
  const [showTableDetail, setShowTableDetail] = useState(false);
  const [showNewOrder, setShowNewOrder] = useState(false);

  const readyCount = tables.filter((t) => t.order?.status === 'ready').length;

  const handleSelectTable = (table) => {
    setSelectedTable(table);
    setShowTableDetail(true);
  };

  const handleNewOrder = (table) => {
    setSelectedTable(table);
    setShowTableDetail(false);
    setShowNewOrder(true);
  };

  const handleSubmitOrder = ({ tableId, items, notes }) => {
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? {
              ...t,
              status: 'occupied',
              order: {
                id: `ORD-${String(Date.now()).slice(-4)}`,
                status: 'pending',
                items: items.length,
                total: items.reduce((s, i) => s + i.price * i.qty, 0),
              },
            }
          : t
      )
    );
    setShowNewOrder(false);
    setSelectedTable(null);
  };

  const handleMarkDelivered = (tableId) => {
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? { ...t, status: 'available', order: null }
          : t
      )
    );
    setShowTableDetail(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis mesas</h1>
          <p className="text-gray-500 mt-1">Gestiona los pedidos de tus mesas</p>
        </div>
        {readyCount > 0 && (
          <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full font-medium text-sm animate-pulse">
            <ChefHat className="w-4 h-4" />
            {readyCount} pedido{readyCount > 1 ? 's' : ''} listo{readyCount > 1 ? 's' : ''}!
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-6">
        {Object.entries(TABLE_STATUS_CONFIG).map(([key, { label, color }]) => (
          <div key={key} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-xs font-medium ${color}`}>
            {label}
          </div>
        ))}
        <div className="flex items-center gap-2 text-xs text-gray-500 ml-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          Listo para servir
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400 ml-2" />
          Preparando
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ml-2" />
          Pendiente
        </div>
      </div>

      {/* Table grid */}
      <TableGrid tables={tables} onSelectTable={handleSelectTable} />

      {/* Modals */}
      <TableDetailModal
        table={selectedTable}
        open={showTableDetail}
        onClose={() => setShowTableDetail(false)}
        onNewOrder={handleNewOrder}
        onMarkDelivered={handleMarkDelivered}
      />
      <NewOrderModal
        table={selectedTable}
        open={showNewOrder}
        onClose={() => setShowNewOrder(false)}
        onSubmit={handleSubmitOrder}
      />
    </div>
  );
}
