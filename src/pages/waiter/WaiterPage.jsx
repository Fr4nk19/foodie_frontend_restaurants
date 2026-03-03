import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Users, CheckCircle2, ShoppingCart, ChefHat, RefreshCw,
  ShoppingBag, Truck, Phone, MapPin, User,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';
import { getZones } from '../../api/zones';
import { getTables } from '../../api/tables';
import { createOrder, updateOrderStatus, getOrders } from '../../api/orders';
import { getProducts } from '../../api/products';

const TABLE_STATUS_CONFIG = {
  available: { label: 'Disponible', color: 'bg-emerald-100 border-emerald-300 text-emerald-800' },
  occupied:  { label: 'Ocupada',    color: 'bg-amber-100 border-amber-300 text-amber-800' },
  reserved:  { label: 'Reservada',  color: 'bg-blue-100 border-blue-300 text-blue-800' },
  cleaning:  { label: 'En limpieza', color: 'bg-gray-100 border-gray-300 text-gray-500' },
};

const ORDER_STATUS_CONFIG = {
  pending:   { label: 'Enviado',    variant: 'warning' },
  preparing: { label: 'Preparando', variant: 'info' },
  ready:     { label: 'Listo!',     variant: 'success' },
  delivered: { label: 'Entregado',  variant: 'gray' },
};

const ORDER_TYPE_CONFIG = {
  takeout:  { label: 'Para llevar', Icon: ShoppingBag, badgeVariant: 'orange' },
  delivery: { label: 'Con envío',   Icon: Truck,       badgeVariant: 'purple' },
  dine_in:  { label: 'Mesa',        Icon: Users,       badgeVariant: 'info'   },
};

// ─── Table Grid ───────────────────────────────────────────────────────────────

function TableGrid({ zones, onSelectTable }) {
  return (
    <div>
      {zones.map((zone) => (
        <div key={zone.id} className="mb-8">
          <h2 className="text-base font-semibold text-gray-700 mb-3">{zone.name}</h2>
          {zone.tables.length === 0 ? (
            <p className="text-sm text-gray-400 mb-4">Sin mesas en esta zona.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {zone.tables.map((table) => {
                const statusCfg   = TABLE_STATUS_CONFIG[table.status] ?? TABLE_STATUS_CONFIG.available;
                const activeOrder = table.active_order;
                return (
                  <button
                    key={table.id}
                    onClick={() => onSelectTable(table, zone)}
                    disabled={table.status === 'cleaning'}
                    className={`relative rounded-xl border-2 p-4 text-left transition-all hover:shadow-md hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed ${statusCfg.color}`}
                  >
                    <p className="text-2xl font-bold">#{table.number}</p>
                    <div className="flex items-center gap-1 text-xs mt-1 opacity-70">
                      <Users className="w-3 h-3" />
                      {table.capacity}
                    </div>
                    <p className="text-xs font-medium mt-2">{statusCfg.label}</p>

                    {activeOrder && (
                      <div className="absolute top-2 right-2">
                        {activeOrder.status === 'ready' && (
                          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                        )}
                        {activeOrder.status === 'pending' && (
                          <div className="w-3 h-3 bg-amber-400 rounded-full" />
                        )}
                        {activeOrder.status === 'preparing' && (
                          <div className="w-3 h-3 bg-blue-400 rounded-full" />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Quick Orders Section (takeout / delivery) ────────────────────────────────

function QuickOrdersSection({ orders, onMarkDelivered }) {
  if (orders.length === 0) return null;
  return (
    <div className="mb-8">
      <h2 className="text-base font-semibold text-gray-700 mb-3">Para llevar y envíos</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        {orders.map((order) => {
          const typeCfg   = ORDER_TYPE_CONFIG[order.type] ?? ORDER_TYPE_CONFIG.takeout;
          const statusCfg = ORDER_STATUS_CONFIG[order.status] ?? { label: order.status, variant: 'gray' };
          const TypeIcon  = typeCfg.Icon;
          const total     = Number(order.total) || 0;
          const items     = order.items || [];
          return (
            <div
              key={order.id}
              className="rounded-xl border-2 border-gray-200 bg-white p-4 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <TypeIcon className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{typeCfg.label}</p>
                    {order.customer_name && (
                      <p className="text-xs text-gray-500">{order.customer_name}</p>
                    )}
                  </div>
                </div>
                <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
              </div>

              {order.delivery_address && (
                <div className="flex items-start gap-1.5 text-xs text-gray-500">
                  <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-purple-400" />
                  <span className="truncate">{order.delivery_address}</span>
                </div>
              )}

              <div className="text-xs text-gray-500">
                {items.slice(0, 2).map((i) => (
                  <p key={i.id}>{i.quantity}x {i.product_name}</p>
                ))}
                {items.length > 2 && <p className="text-gray-400">+{items.length - 2} más</p>}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-400">{order.code ?? `#${order.id}`}</p>
                <p className="text-sm font-semibold text-gray-900">${total.toFixed(2)}</p>
              </div>

              {order.status === 'ready' && (
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => onMarkDelivered(order.id)}
                  className="w-full"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Entregar
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── New Order Modal (dine_in) ────────────────────────────────────────────────

function NewOrderModal({ table, zone, open, onClose, onSubmit, menu, saving }) {
  const [orderItems, setOrderItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) { setOrderItems([]); setNotes(''); setSelectedCategory('Todos'); }
  }, [open]);

  const categories = ['Todos', ...new Set(menu.map((p) => p.categoria?.nombre || 'Sin categoría'))];
  const filteredMenu = selectedCategory === 'Todos'
    ? menu
    : menu.filter((p) => (p.categoria?.nombre || 'Sin categoría') === selectedCategory);

  const addItem = (product) => {
    setOrderItems((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        return prev.map((i) => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        product_id:   product.id,
        product_name: product.nombre,
        unit_price:   Number(product.precio),
        quantity:     1,
        notes:        '',
      }];
    });
  };

  const removeItem = (productId) => {
    setOrderItems((prev) => {
      const existing = prev.find((i) => i.product_id === productId);
      if (existing?.quantity > 1) {
        return prev.map((i) => i.product_id === productId ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter((i) => i.product_id !== productId);
    });
  };

  const total = orderItems.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

  const handleSubmit = () => {
    if (orderItems.length === 0) return;
    onSubmit({
      table_id: table.id,
      type:     'dine_in',
      notes:    notes || undefined,
      items:    orderItems.map((i) => ({
        product_id: i.product_id,
        quantity:   i.quantity,
        notes:      i.notes || undefined,
      })),
    });
  };

  if (!table) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Nuevo pedido – Mesa ${table.number} · ${zone?.name ?? ''}`} size="2xl">
      <div className="flex gap-4 h-[60vh]">
        {/* Menu */}
        <div className="flex-1 flex flex-col min-w-0">
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
          <div className="overflow-y-auto flex-1 flex flex-col gap-1.5 pr-1">
            {filteredMenu.map((product) => {
              const inOrder = orderItems.find((i) => i.product_id === product.id);
              return (
                <div
                  key={product.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    inOrder ? 'bg-brand-50 border-brand-200' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{product.nombre}</p>
                    <p className="text-xs text-gray-500">${Number(product.precio).toFixed(2)}</p>
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
                        <span className="text-sm font-bold text-brand-700 w-4 text-center">{inOrder.quantity}</span>
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

        {/* Summary */}
        <div className="w-56 flex flex-col border-l border-gray-100 pl-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">Resumen</p>
          <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 mb-3">
            {orderItems.length === 0 && (
              <p className="text-xs text-gray-400 text-center mt-4">Sin productos</p>
            )}
            {orderItems.map((item) => (
              <div key={item.product_id} className="flex items-start justify-between text-xs gap-2">
                <span className="text-gray-700 flex-1 min-w-0 truncate">{item.quantity}x {item.product_name}</span>
                <span className="text-gray-500 shrink-0">${(item.quantity * item.unit_price).toFixed(2)}</span>
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
            disabled={orderItems.length === 0 || saving}
            loading={saving}
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

// ─── Quick Order Modal (takeout / delivery) ───────────────────────────────────

function QuickOrderModal({ open, onClose, onSubmit, menu, saving }) {
  const [orderType, setOrderType]         = useState('takeout');
  const [orderItems, setOrderItems]       = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [customerName, setCustomerName]   = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes]                 = useState('');

  useEffect(() => {
    if (open) {
      setOrderType('takeout');
      setOrderItems([]);
      setSelectedCategory('Todos');
      setCustomerName('');
      setCustomerPhone('');
      setDeliveryAddress('');
      setNotes('');
    }
  }, [open]);

  const categories = ['Todos', ...new Set(menu.map((p) => p.categoria?.nombre || 'Sin categoría'))];
  const filteredMenu = selectedCategory === 'Todos'
    ? menu
    : menu.filter((p) => (p.categoria?.nombre || 'Sin categoría') === selectedCategory);

  const addItem = (product) => {
    setOrderItems((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        return prev.map((i) => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        product_id:   product.id,
        product_name: product.nombre,
        unit_price:   Number(product.precio),
        quantity:     1,
      }];
    });
  };

  const removeItem = (productId) => {
    setOrderItems((prev) => {
      const existing = prev.find((i) => i.product_id === productId);
      if (existing?.quantity > 1) {
        return prev.map((i) => i.product_id === productId ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter((i) => i.product_id !== productId);
    });
  };

  const total = orderItems.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

  const handleSubmit = () => {
    if (orderItems.length === 0) return;
    const data = {
      type:  orderType,
      notes: notes || undefined,
      items: orderItems.map((i) => ({
        product_id: i.product_id,
        quantity:   i.quantity,
      })),
    };
    if (customerName)    data.customer_name  = customerName;
    if (customerPhone)   data.customer_phone = customerPhone;
    if (orderType === 'delivery' && deliveryAddress) data.delivery_address = deliveryAddress;
    onSubmit(data);
  };

  return (
    <Modal open={open} onClose={onClose} title="Nuevo pedido" size="2xl">
      {/* Type selector */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setOrderType('takeout')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
            orderType === 'takeout'
              ? 'border-amber-400 bg-amber-50 text-amber-700'
              : 'border-gray-100 text-gray-500 hover:border-gray-200 hover:bg-gray-50'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Para llevar
        </button>
        <button
          onClick={() => setOrderType('delivery')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
            orderType === 'delivery'
              ? 'border-purple-400 bg-purple-50 text-purple-700'
              : 'border-gray-100 text-gray-500 hover:border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Truck className="w-4 h-4" />
          Con envío
        </button>
      </div>

      {/* Customer info */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <label className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 focus-within:ring-1 focus-within:ring-brand-400 focus-within:border-brand-300">
          <User className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Nombre del cliente"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="text-sm flex-1 outline-none bg-transparent"
          />
        </label>
        <label className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 focus-within:ring-1 focus-within:ring-brand-400 focus-within:border-brand-300">
          <Phone className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="tel"
            placeholder="Teléfono"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="text-sm flex-1 outline-none bg-transparent"
          />
        </label>
      </div>

      {orderType === 'delivery' && (
        <label className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 mb-3 focus-within:ring-1 focus-within:ring-brand-400 focus-within:border-brand-300">
          <MapPin className="w-4 h-4 text-purple-400 shrink-0" />
          <input
            type="text"
            placeholder="Dirección de entrega"
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            className="text-sm flex-1 outline-none bg-transparent"
          />
        </label>
      )}

      {/* Menu + Summary */}
      <div className="flex gap-4 h-[42vh]">
        {/* Menu */}
        <div className="flex-1 flex flex-col min-w-0">
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
          <div className="overflow-y-auto flex-1 flex flex-col gap-1.5 pr-1">
            {filteredMenu.map((product) => {
              const inOrder = orderItems.find((i) => i.product_id === product.id);
              return (
                <div
                  key={product.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    inOrder ? 'bg-brand-50 border-brand-200' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{product.nombre}</p>
                    <p className="text-xs text-gray-500">${Number(product.precio).toFixed(2)}</p>
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
                        <span className="text-sm font-bold text-brand-700 w-4 text-center">{inOrder.quantity}</span>
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

        {/* Summary */}
        <div className="w-56 flex flex-col border-l border-gray-100 pl-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">Resumen</p>
          <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 mb-3">
            {orderItems.length === 0 && (
              <p className="text-xs text-gray-400 text-center mt-4">Sin productos</p>
            )}
            {orderItems.map((item) => (
              <div key={item.product_id} className="flex items-start justify-between text-xs gap-2">
                <span className="text-gray-700 flex-1 min-w-0 truncate">{item.quantity}x {item.product_name}</span>
                <span className="text-gray-500 shrink-0">${(item.quantity * item.unit_price).toFixed(2)}</span>
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
            disabled={orderItems.length === 0 || saving}
            loading={saving}
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

// ─── Table Detail Modal ───────────────────────────────────────────────────────

function TableDetailModal({ table, zone, open, onClose, onNewOrder, onMarkDelivered }) {
  if (!table) return null;
  const activeOrder = table.active_order;
  const orderStatus = activeOrder ? ORDER_STATUS_CONFIG[activeOrder.status] : null;

  return (
    <Modal open={open} onClose={onClose} title={`Mesa ${table.number} – ${zone?.name ?? ''}`} size="sm">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
            <Users className="w-5 h-5 text-gray-500" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Capacidad: {table.capacity} personas</p>
            <p className="text-sm text-gray-500">{TABLE_STATUS_CONFIG[table.status]?.label ?? table.status}</p>
          </div>
        </div>

        {activeOrder && (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
              <p className="text-sm font-medium text-gray-700">{activeOrder.code ?? `Orden #${activeOrder.id}`}</p>
              {orderStatus && <Badge variant={orderStatus.variant}>{orderStatus.label}</Badge>}
            </div>
            <div className="px-4 py-3 text-sm text-gray-600">
              <p>{(activeOrder.items ?? []).length} producto(s) · ${Number(activeOrder.total).toFixed(2)}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {table.status === 'available' && (
            <Button onClick={() => onNewOrder(table, zone)} className="w-full">
              <Plus className="w-4 h-4" />
              Nuevo pedido
            </Button>
          )}
          {activeOrder?.status === 'ready' && (
            <Button variant="success" onClick={() => onMarkDelivered(activeOrder.id)} className="w-full">
              <CheckCircle2 className="w-4 h-4" />
              Marcar como entregado
            </Button>
          )}
          <Button variant="secondary" onClick={onClose} className="w-full">Cerrar</Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WaiterPage() {
  const { user } = useAuth();
  const companyId = user?.company_id;
  const branchId  = user?.branch_id;

  const [zones, setZones]           = useState([]);
  const [menu, setMenu]             = useState([]);
  const [quickOrders, setQuickOrders] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState(null);

  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedZone,  setSelectedZone]  = useState(null);
  const [showDetail,    setShowDetail]    = useState(false);
  const [showNewOrder,  setShowNewOrder]  = useState(false);
  const [showQuickOrder, setShowQuickOrder] = useState(false);

  const loadZonesWithTables = useCallback(async () => {
    const zonesRes  = await getZones(companyId, branchId);
    const zonesData = zonesRes.data.data || [];
    return Promise.all(
      zonesData
        .filter((z) => z.status === 'active')
        .map(async (zone) => {
          try {
            const tRes = await getTables(companyId, branchId, { table_zone_id: zone.id });
            return { ...zone, tables: tRes.data.data || [] };
          } catch {
            return { ...zone, tables: [] };
          }
        })
    );
  }, [companyId, branchId]);

  const loadQuickOrders = useCallback(async () => {
    try {
      const res = await getOrders(companyId, branchId, { per_page: 50 });
      const all = res.data.data || [];
      return all.filter(
        (o) => (o.type === 'takeout' || o.type === 'delivery') &&
               !['delivered', 'cancelled'].includes(o.status)
      );
    } catch {
      return [];
    }
  }, [companyId, branchId]);

  const fetchData = useCallback(async () => {
    if (!companyId || !branchId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [withTables, productsRes, quick] = await Promise.all([
        loadZonesWithTables(),
        getProducts(companyId, { per_page: 200, status: 'active' }),
        loadQuickOrders(),
      ]);
      setZones(withTables);
      setMenu(productsRes.data.data || []);
      setQuickOrders(quick);
    } catch {
      setError('No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [companyId, branchId, loadZonesWithTables, loadQuickOrders]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 15 s
  useEffect(() => {
    if (!companyId || !branchId) return;
    const interval = setInterval(async () => {
      try {
        const [withTables, quick] = await Promise.all([
          loadZonesWithTables(),
          loadQuickOrders(),
        ]);
        setZones(withTables);
        setQuickOrders(quick);
      } catch {
        // silent
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [companyId, branchId, loadZonesWithTables, loadQuickOrders]);

  const readyCount = zones
    .flatMap((z) => z.tables)
    .filter((t) => t.active_order?.status === 'ready').length;

  const quickReadyCount = quickOrders.filter((o) => o.status === 'ready').length;

  const handleSelectTable = (table, zone) => {
    setSelectedTable(table);
    setSelectedZone(zone);
    setShowDetail(true);
  };

  const handleNewOrder = (table, zone) => {
    setSelectedTable(table);
    setSelectedZone(zone);
    setShowDetail(false);
    setShowNewOrder(true);
  };

  const handleSubmitOrder = async (orderData) => {
    try {
      setSaving(true);
      await createOrder(companyId, branchId, orderData);
      setShowNewOrder(false);
      setSelectedTable(null);
      setSelectedZone(null);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear el pedido');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitQuickOrder = async (orderData) => {
    try {
      setSaving(true);
      await createOrder(companyId, branchId, orderData);
      setShowQuickOrder(false);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear el pedido');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkDelivered = async (orderId) => {
    try {
      await updateOrderStatus(companyId, branchId, orderId, 'delivered');
      setShowDetail(false);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al marcar como entregado');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  const totalReadyCount = readyCount + quickReadyCount;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis mesas</h1>
          <p className="text-gray-500 mt-1">Gestiona los pedidos de tus mesas</p>
        </div>
        <div className="flex items-center gap-3">
          {totalReadyCount > 0 && (
            <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full font-medium text-sm animate-pulse">
              <ChefHat className="w-4 h-4" />
              {totalReadyCount} pedido{totalReadyCount > 1 ? 's' : ''} listo{totalReadyCount > 1 ? 's' : ''}!
            </div>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowQuickOrder(true)}
          >
            <Plus className="w-4 h-4" />
            Para llevar / Envío
          </Button>
          <button onClick={fetchData} className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 font-medium">✕</button>
        </div>
      )}

      {/* Quick orders (takeout / delivery) */}
      <QuickOrdersSection orders={quickOrders} onMarkDelivered={handleMarkDelivered} />

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-6">
        {Object.entries(TABLE_STATUS_CONFIG).map(([key, { label, color }]) => (
          <div key={key} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-xs font-medium ${color}`}>
            {label}
          </div>
        ))}
        <div className="flex items-center gap-2 text-xs text-gray-500 ml-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" /> Listo
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400 ml-2" /> Preparando
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ml-2" /> Pendiente
        </div>
      </div>

      {/* Zones + tables */}
      {zones.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="font-medium">No hay zonas configuradas</p>
          <p className="text-sm mt-1">Contacta al administrador para configurar las zonas y mesas.</p>
        </div>
      ) : (
        <TableGrid zones={zones} onSelectTable={handleSelectTable} />
      )}

      {/* Modals */}
      <TableDetailModal
        table={selectedTable}
        zone={selectedZone}
        open={showDetail}
        onClose={() => setShowDetail(false)}
        onNewOrder={handleNewOrder}
        onMarkDelivered={handleMarkDelivered}
      />
      <NewOrderModal
        table={selectedTable}
        zone={selectedZone}
        open={showNewOrder}
        onClose={() => setShowNewOrder(false)}
        onSubmit={handleSubmitOrder}
        menu={menu}
        saving={saving}
      />
      <QuickOrderModal
        open={showQuickOrder}
        onClose={() => setShowQuickOrder(false)}
        onSubmit={handleSubmitQuickOrder}
        menu={menu}
        saving={saving}
      />
    </div>
  );
}
