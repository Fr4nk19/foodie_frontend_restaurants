import { NavLink, useNavigate } from 'react-router-dom';
import {
  UtensilsCrossed, LayoutDashboard, ClipboardList,
  ChefHat, Users, LogOut, TableProperties, Settings,
  Package, Tag, MapPin, UserCog,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150
         ${isActive
           ? 'bg-brand-600 text-white'
           : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
         }`
      }
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span>{label}</span>
    </NavLink>
  );
}

function NavSection({ title, children }) {
  return (
    <div className="mb-4">
      <p className="px-3 mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</p>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

export default function Sidebar() {
  const { user, signOut, isAdmin, isEmployee } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="bg-brand-600 text-white p-1.5 rounded-lg">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-gray-900 leading-none">Foodie</p>
            <p className="text-xs text-gray-500 mt-0.5">Panel del restaurante</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">

        {/* Admin navigation */}
        {isAdmin && (
          <>
            <NavSection title="General">
              <NavItem to="/admin/dashboard" icon={LayoutDashboard} label="Dashboard" />
              <NavItem to="/admin/orders" icon={ClipboardList} label="Pedidos" />
              <NavItem to="/admin/tables" icon={TableProperties} label="Mesas" />
            </NavSection>
            <NavSection title="Catálogo">
              <NavItem to="/admin/products" icon={Package} label="Productos" />
              <NavItem to="/admin/categories" icon={Tag} label="Categorías" />
            </NavSection>
            <NavSection title="Gestión">
              <NavItem to="/admin/branches" icon={MapPin} label="Sucursales" />
              <NavItem to="/admin/users" icon={UserCog} label="Usuarios" />
              <NavItem to="/admin/staff" icon={Users} label="Personal" />
              <NavItem to="/admin/settings" icon={Settings} label="Configuración" />
            </NavSection>
          </>
        )}

        {/* Kitchen staff navigation */}
        {isEmployee && (
          <NavSection title="Cocina">
            <NavItem to="/kitchen" icon={ChefHat} label="Pedidos en cocina" />
          </NavSection>
        )}

        {/* Waiter navigation */}
        {isEmployee && (
          <NavSection title="Servicio">
            <NavItem to="/waiter" icon={TableProperties} label="Mis mesas" />
          </NavSection>
        )}
      </nav>

      {/* User info + logout */}
      <div className="px-3 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 mb-2">
          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-semibold text-sm shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name ?? 'Usuario'}</p>
            <p className="text-xs text-gray-500 truncate capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
