/**
 * Sidebar.tsx — presentation + React Router NavLinks.
 *
 * Active highlight is derived from the live URL (`useLocation` / NavLink
 * `isActive`). Navigation uses `<NavLink>` so the same BrowserRouter history
 * that drives `<Outlet />` updates — never bare `<a href>` / pushState.
 *
 * Demo mode: props are optional — falls back to MOCK_MENU_ITEMS / MOCK_USER.
 */

import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  ChevronDown, LayoutDashboard, Users, Calendar, Package,
  Settings, Building2, CreditCard, LogOut, FileText, Tag, FileSignature, DollarSign, UserCog,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

const DEFAULT_LOGO = '/images/commercial-logo.png';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface SidebarMenuSubItem {
  id: string;
  label: string;
  path: string;
  /** Optional red count badge (same style as Point of Sales). Hidden when 0/undefined. */
  badge?: number;
}

export interface SidebarMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  submenu?: SidebarMenuSubItem[];
}

export interface SidebarUser {
  name: string;
  role: string;
  /** Optional initials override — defaults to first 2 chars of name */
  avatar?: string;
}

export interface SidebarProps {
  /**
   * Optional override for active path (tests). When omitted, live
   * `useLocation().pathname` drives the highlight.
   */
  currentPath?: string;
  /** Aggregated POS alert count (booking conflicts + overdue order suites). Shown on Point of Sales. */
  overdueOrdersCount?: number;
  /** Logged-in user info */
  user?: SidebarUser;
  /** Optional click hook after NavLink navigation (analytics / close mobile drawer). */
  onNavigate?: (path: string) => void;
  /** Called when Logout is clicked */
  onLogout?: () => void;
  /** Called when "My Account" is clicked (self name / password) */
  onEditProfile?: () => void;
  /** Full menu structure — if omitted, falls back to MOCK_MENU_ITEMS */
  menuItems?: SidebarMenuItem[];
  /** Tenant branding logo (hostname-resolved by the container). */
  logoUrl?: string;
  brandName?: string;
  /** Sidebar background — defaults to CSS var / commercial navy */
  sidebarBg?: string;
}

// ─── MOCK data (isolated — replace by passing props from container) ───────────

const MOCK_MENU_ITEMS: SidebarMenuItem[] = [
  {
    id: 'dashboard',
    label: 'DashBoard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    path: '/dashboard',
  },
  {
    id: 'customers',
    label: 'Customers Management',
    icon: <Users className="w-5 h-5" />,
    submenu: [
      { id: 'all-customers',    label: 'All Customers',      path: '/customers' },
      { id: 'create-customers', label: 'Create Customer',    path: '/customers/create' },
      { id: 'customer-company', label: 'Customer Companies', path: '/customers/company' },
      { id: 'travel-agency',    label: 'Agency',             path: '/travel-agency' },
      { id: 'grading-packages', label: 'Grading Packages',   path: '/grading-packages' },
    ],
  },
  {
    id: 'contract',
    label: 'Contract Management',
    icon: <FileSignature className="w-5 h-5" />,
    submenu: [
      { id: 'purchase-management', label: 'New Contract', path: '/membership/purchase' },
      { id: 'balance-tracker',     label: 'All Contract', path: '/membership/balance' },
    ],
  },
  {
    id: 'bookings',
    label: 'Bookings Management',
    icon: <Calendar className="w-5 h-5" />,
    submenu: [
      { id: 'all-bookings',         label: 'All Bookings',            path: '/bookings' },
      { id: 'approve-bookings',     label: 'Approve Booking Request', path: '/bookings/approve' },
      { id: 'supervising-approval', label: 'Supervising Approval',    path: '/bookings/supervising-approval' },
      { id: 'create-bookings',      label: 'Create Booking',          path: '/bookings/create' },
      { id: 'bookings-settings',    label: 'Booking Settings',        path: '/bookings/settings' },
    ],
  },
  {
    id: 'booking-schedules',
    label: 'Booking Schedules',
    icon: <Calendar className="w-5 h-5" />,
    submenu: [
      { id: 'all-schedules',   label: 'All Booking Schedules',   path: '/bookings/schedules' },
      { id: 'suite-schedules', label: 'Suite Booking Schedules', path: '/suites' },
      { id: 'table-schedules', label: 'Table Booking Schedules', path: '/bookings/schedules/table' },
    ],
  },
  {
    id: 'bookable-items',
    label: 'Bookable Items Management',
    icon: <Package className="w-5 h-5" />,
    submenu: [
      { id: 'all-items',    label: 'All Bookable Items',    path: '/items' },
      { id: 'create-item',  label: 'Create Bookable Item',  path: '/items/create' },
    ],
  },
  {
    id: 'pos',
    label: 'Point of Sales',
    icon: <CreditCard className="w-5 h-5" />,
    submenu: [
      { id: 'pos-floor-plan',  label: 'POS Floor Plan',  path: '/pos' },
      { id: 'pos-transaction', label: 'Transaction',      path: '/pos/transactions' },
      { id: 'kitchen-display', label: 'Kitchen Display',  path: '/pos/kitchen' },
    ],
  },
  {
    id: 'lounge',
    label: 'Lounge Management',
    icon: <Building2 className="w-5 h-5" />,
    submenu: [
      { id: 'lounge-layout',    label: 'Lounge Layout Plan', path: '/lounge-layout' },
      { id: 'price-management', label: 'Price Management',   path: '/price-management' },
    ],
  },
  {
    id: 'promo',
    label: 'Promo Code',
    icon: <Tag className="w-5 h-5" />,
    submenu: [
      { id: 'all-promo-codes',   label: 'All Promo Codes',   path: '/promo-codes' },
      { id: 'create-promo-code', label: 'Create Promo Code', path: '/promo-codes/create' },
      { id: 'promo-code-usage',  label: 'Promo Code Usage',  path: '/promo-codes/usage' },
    ],
  },
  {
    id: 'reports',
    label: 'Reports & Analytics',
    icon: <FileText className="w-5 h-5" />,
    submenu: [
      { id: 'corporate-reports', label: 'BD Usage Reports', path: '/reports/corporate' },
      { id: 'refund-report',     label: 'Refund Report',    path: '/reports/refund' },
      { id: 'movements-report',  label: 'Movements Report', path: '/reports/movements' },
    ],
  },
  {
    id: 'system-users',
    label: 'System Users Management',
    icon: <Settings className="w-5 h-5" />,
    submenu: [
      { id: 'manage-system-users', label: 'Manage System Users', path: '/system-users' },
      { id: 'role-permissions', label: 'Role Permissions', path: '/system-users/role-permissions' },
      { id: 'audit-logs',          label: 'Audit Logs',          path: '/audit-logs' },
    ],
  },
];

const MOCK_USER: SidebarUser = { name: 'HKIAL Staff', role: 'Administrator' };

// ─── Helper — derive which groups should start expanded based on currentPath ──

function getInitialOpenGroups(pathname: string): string[] {
  const groups: string[] = [];
  if (pathname === '/' || pathname === '/dashboard') return groups;
  if (
    pathname.startsWith('/customers') ||
    pathname.startsWith('/travel-agency') ||
    pathname.startsWith('/grading-packages')
  ) groups.push('customers');
  if (pathname.startsWith('/purchase') || pathname.startsWith('/balance')) {
    groups.push('contract');
  }
  if (pathname.startsWith('/bookings') && !pathname.startsWith('/bookings/schedules')) groups.push('bookings');
  if (pathname.startsWith('/bookings/schedules') || pathname.startsWith('/suites')) groups.push('booking-schedules');
  if (pathname.startsWith('/items'))        groups.push('bookable-items');
  if (pathname.startsWith('/pos') || pathname.startsWith('/standalone-preorder') || pathname.startsWith('/kitchen')) {
    groups.push('pos');
  }
  if (pathname.startsWith('/lounge-layout') || pathname.startsWith('/price-management')) {
    groups.push('lounge');
  }
  if (pathname.startsWith('/promo-codes'))  groups.push('promo');
  if (pathname.startsWith('/reports') || pathname.startsWith('/admin/reports')) groups.push('reports');
  if (
    pathname.startsWith('/system-users') ||
    pathname.startsWith('/audit-logs') ||
    pathname.startsWith('/content/pages') ||
    pathname.startsWith('/system/data-import')
  ) {
    groups.push('system-users', 'system');
  }
  return groups;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Sidebar({
  currentPath: currentPathProp,
  overdueOrdersCount = 0,
  user,
  onNavigate,
  onLogout       = () => {},
  onEditProfile,
  menuItems,
  logoUrl = DEFAULT_LOGO,
  brandName = 'HKIA VIP Lounge',
  sidebarBg,
}: SidebarProps) {
  const location = useLocation();
  // Live URL is canonical; prop override is for unit tests only.
  const currentPath = currentPathProp ?? location.pathname;

  // Use prop-supplied menu items; fall back to mock for standalone demo
  const displayMenuItems = menuItems && menuItems.length > 0 ? menuItems : MOCK_MENU_ITEMS;
  const displayUser      = user ?? MOCK_USER;

  // Accordion open state — expand groups that own the current URL
  const [openMenus, setOpenMenus] = useState<string[]>(() =>
    getInitialOpenGroups(currentPath),
  );

  useEffect(() => {
    const needed = getInitialOpenGroups(currentPath);
    if (needed.length === 0) return;
    setOpenMenus((prev) => Array.from(new Set([...prev, ...needed])));
  }, [currentPath]);

  const toggleMenu = (menuId: string) => {
    setOpenMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId],
    );
  };

  const pathIsActive = (path: string, navLinkActive: boolean): boolean => {
    if (path === '/dashboard' || path === '/') {
      return currentPath === '/dashboard' || currentPath === '/';
    }
    return navLinkActive || currentPath === path;
  };

  const linkClass = (active: boolean, kind: 'top' | 'sub'): string => {
    if (kind === 'top') {
      return `flex items-center gap-3 w-full p-3 rounded transition-colors ${
        active ? 'bg-blue-600 text-white' : 'text-white hover:bg-gray-700/50'
      }`;
    }
    return `flex items-center justify-between gap-2 w-full text-left p-2 rounded text-sm transition-colors ${
      active
        ? 'bg-blue-600 text-white'
        : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
    }`;
  };

  // Initials for avatar fallback
  const initials = displayUser.avatar
    ?? displayUser.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div
      className="w-80 text-white flex flex-col h-full min-h-0"
      style={{ backgroundColor: sidebarBg || 'var(--tenant-sidebar-bg, #0f2942)' }}
    >

      {/* Logo */}
      <div className="p-6 border-b border-white/15 shrink-0">
        <img src={logoUrl || DEFAULT_LOGO} alt={brandName} className="h-10 max-w-full object-contain" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 min-h-0 p-4 overflow-y-auto overscroll-y-contain">
        <div className="space-y-1">
          {displayMenuItems.map(item => (
            <div key={item.id}>
              {item.submenu ? (
                <>
                  <button
                    type="button"
                    onClick={() => toggleMenu(item.id)}
                    className="flex items-center justify-between w-full p-3 rounded hover:bg-gray-700/50 transition-colors text-white"
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Overdue badge — only on the POS group */}
                      {item.id === 'pos' && overdueOrdersCount > 0 && (
                        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold leading-none shadow-sm">
                          {overdueOrdersCount > 99 ? '99+' : overdueOrdersCount}
                        </span>
                      )}
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          openMenus.includes(item.id) ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {openMenus.includes(item.id) && (
                    <div className="ml-11 mt-1 space-y-1">
                      {item.submenu.map(subItem => (
                        <NavLink
                          key={subItem.id}
                          to={subItem.path}
                          end
                          onClick={() => onNavigate?.(subItem.path)}
                          className={({ isActive }) =>
                            linkClass(pathIsActive(subItem.path, isActive), 'sub')
                          }
                        >
                          <span>{subItem.label}</span>
                          {typeof subItem.badge === 'number' && subItem.badge > 0 && (
                            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold leading-none shadow-sm shrink-0">
                              {subItem.badge > 99 ? '99+' : subItem.badge}
                            </span>
                          )}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </>
              ) : item.path ? (
                <NavLink
                  to={item.path}
                  end={item.path === '/' || item.path === '/dashboard'}
                  onClick={() => onNavigate?.(item.path!)}
                  className={({ isActive }) =>
                    linkClass(pathIsActive(item.path!, isActive), 'top')
                  }
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              ) : null}
            </div>
          ))}
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-700 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 w-full hover:bg-gray-700/50 p-2 rounded transition-colors">
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-xs">{initials}</span>
              </div>
              <div className="text-left">
                <p className="text-sm">{displayUser.name}</p>
                <p className="text-xs text-gray-400">{displayUser.role}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {onEditProfile && (
              <DropdownMenuItem onClick={onEditProfile}>
                <UserCog className="mr-2 h-4 w-4" />
                <span>My Account</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}