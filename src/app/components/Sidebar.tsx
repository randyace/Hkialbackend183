import {
  ChevronDown, LayoutDashboard, Users, Calendar, Package,
  Settings, Building2, CreditCard, LogOut, FileText, Tag, FileSignature,
} from 'lucide-react';
import logoImage from 'figma:asset/5314118f44483d10b69aeb99485c2f5942c726a2.png';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface SidebarProps {
  overdueOrdersCount?: number;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  url?: string;
  submenu?: { id: string; label: string; url: string }[];
}

// ── URL map for every sidebar item ──────────────────────────────────────────
const ITEM_URL: Record<string, string> = {
  dashboard:                '/dashboard',
  // Customers
  'all-customers':          '/customer',
  'create-customers':       '/customer/create',
  'approve-customers':      '/customer/approve',
  'customer-company':       '/customer/company',
  'travel-agency':          '/travel-agency',
  'grading-packages':       '/membership/packages',
  'customers-report':       '/customer/report',
  // Contract
  'purchase-management':    '/membership/purchase',
  'balance-tracker':        '/membership/balance',
  // Bookings
  'all-bookings':           '/booking',
  'approve-bookings':       '/booking/approve',
  'supervising-approval':   '/booking/supervising',
  'create-bookings':        '/booking/create',
  'bookings-report':        '/booking/report',
  // Booking Schedules
  'booking-schedules':            '/booking/schedules',
  'suite-booking-schedules':      '/booking/schedules/suite',
  'table-booking-schedules':      '/booking/schedules/table',
  // Bookable Items
  'all-bookable-items':     '/bookable-items',
  'create-bookable-items':  '/bookable-items/create',
  'sales-report':           '/bookable-items/report',
  // POS
  'pos-floor-plan':         '/pos',
  'pos-transactions':       '/pos/transactions',
  'kitchen-display':        '/pos/kitchen',
  // Lounge
  'lounge-layout':          '/lounge',
  // Promo
  'all-promo-codes':        '/promo-codes',
  'create-promo-code':      '/promo-codes/create',
  'promo-code-usage':       '/promo-codes/usage',
  // Reports
  reports:                  '/reports',
  analytics:                '/reports/analytics',
  'corporate-reports':      '/reports/corporate',
  'refund-report':          '/reports/refund',
  // System
  'manage-system-users':    '/system/users',
  'audit-logs':             '/system/audit',
};

// ── Determine which sidebar groups should be expanded for a given path ───────
function getGroupsForPath(pathname: string): string[] {
  const p = pathname;
  const groups: string[] = [];
  if (p === '/' || p === '/dashboard') return groups;
  if (p.startsWith('/customer') || p.startsWith('/travel-agency') || p.startsWith('/membership/packages')) {
    groups.push('customers');
  }
  if (p.startsWith('/membership/purchase') || p.startsWith('/membership/balance')) {
    groups.push('contract');
  }
  if (p.startsWith('/booking') && !p.startsWith('/booking/schedules')) {
    groups.push('bookings');
  }
  if (p.startsWith('/booking/schedules')) {
    groups.push('booking-schedules-group');
  }
  if (p.startsWith('/bookable-items')) groups.push('bookable-items');
  if (p.startsWith('/pos'))            groups.push('pos');
  if (p.startsWith('/lounge'))         groups.push('lounge');
  if (p.startsWith('/promo-codes'))    groups.push('promo');
  if (p.startsWith('/reports'))        groups.push('reports');
  if (p.startsWith('/system'))         groups.push('system-users');
  return groups;
}

export function Sidebar({ overdueOrdersCount = 0 }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState<string[]>(() =>
    getGroupsForPath(location.pathname)
  );

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'DashBoard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      url: '/dashboard',
    },
    {
      id: 'customers',
      label: 'Customers Management',
      icon: <Users className="w-5 h-5" />,
      submenu: [
        { id: 'all-customers',    label: 'All Customers',      url: '/customer' },
        { id: 'create-customers', label: 'Create Customers',   url: '/customer/create' },
        { id: 'customer-company', label: 'Customer Companies', url: '/customer/company' },
        { id: 'travel-agency',    label: 'Travel Agency',      url: '/travel-agency' },
        { id: 'grading-packages', label: 'Grading Packages',   url: '/membership/packages' },
        { id: 'customers-report', label: 'Customers Report',   url: '/customer/report' },
      ],
    },
    {
      id: 'contract',
      label: 'Contract Management',
      icon: <FileSignature className="w-5 h-5" />,
      submenu: [
        { id: 'purchase-management', label: 'New Contract', url: '/membership/purchase' },
        { id: 'balance-tracker',     label: 'All Contract', url: '/membership/balance' },
      ],
    },
    {
      id: 'bookings',
      label: 'Bookings Management',
      icon: <Calendar className="w-5 h-5" />,
      submenu: [
        { id: 'all-bookings',         label: 'All Bookings',                url: '/booking' },
        { id: 'approve-bookings',     label: 'Approve Booking Request',     url: '/booking/approve' },
        { id: 'supervising-approval', label: 'Supervising Approval',        url: '/booking/supervising' },
        { id: 'create-bookings',      label: 'Create Bookings',             url: '/booking/create' },
        { id: 'bookings-report',      label: 'Bookings Report',             url: '/booking/report' },
      ],
    },
    {
      id: 'booking-schedules-group',
      label: 'Booking Schedules',
      icon: <Calendar className="w-5 h-5" />,
      submenu: [
        { id: 'booking-schedules',       label: 'All Booking Schedules',   url: '/booking/schedules' },
        { id: 'suite-booking-schedules', label: 'Suite Booking Schedules', url: '/booking/schedules/suite' },
        { id: 'table-booking-schedules', label: 'Table Booking Schedules', url: '/booking/schedules/table' },
      ],
    },
    {
      id: 'bookable-items',
      label: 'Bookable Items Management',
      icon: <Package className="w-5 h-5" />,
      submenu: [
        { id: 'all-bookable-items',    label: 'All Bookable Items',    url: '/bookable-items' },
        { id: 'create-bookable-items', label: 'Create Bookable Items', url: '/bookable-items/create' },
        { id: 'sales-report',          label: 'Sales Report',          url: '/bookable-items/report' },
      ],
    },
    {
      id: 'pos',
      label: 'Point of Sales',
      icon: <CreditCard className="w-5 h-5" />,
      submenu: [
        { id: 'pos-floor-plan',   label: 'POS Floor Plan', url: '/pos' },
        { id: 'pos-transactions', label: 'Transactions',   url: '/pos/transactions' },
        { id: 'kitchen-display',  label: 'Kitchen Display', url: '/pos/kitchen' },
      ],
    },
    {
      id: 'lounge',
      label: 'Lounge Management',
      icon: <Building2 className="w-5 h-5" />,
      submenu: [
        { id: 'lounge-layout', label: 'Manage Lounge Layout Plan', url: '/lounge' },
      ],
    },
    {
      id: 'promo',
      label: 'Promo Code',
      icon: <Tag className="w-5 h-5" />,
      submenu: [
        { id: 'all-promo-codes',   label: 'All Promo Codes',    url: '/promo-codes' },
        { id: 'create-promo-code', label: 'Create Promo Code',  url: '/promo-codes/create' },
        { id: 'promo-code-usage',  label: 'Promo Code Usage',   url: '/promo-codes/usage' },
      ],
    },
    {
      id: 'reports',
      label: 'Reports & Analytics',
      icon: <FileText className="w-5 h-5" />,
      submenu: [
        { id: 'reports',           label: 'Generate Reports',    url: '/reports' },
        { id: 'analytics',         label: 'Analytics Dashboard', url: '/reports/analytics' },
        { id: 'corporate-reports', label: 'BD Usage Reports',    url: '/reports/corporate' },
        { id: 'refund-report',     label: 'Refund Report',       url: '/reports/refund' },
      ],
    },
    {
      id: 'system-users',
      label: 'System Users Management',
      icon: <Settings className="w-5 h-5" />,
      submenu: [
        { id: 'manage-system-users', label: 'Manage System Users', url: '/system/users' },
        { id: 'audit-logs',          label: 'Audit Logs',          url: '/system/audit' },
      ],
    },
  ];

  const toggleMenu = (menuId: string) => {
    setOpenMenus((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId]
    );
  };

  const handleNavItem = (url: string) => {
    navigate(url);
  };

  const isActive = (url: string): boolean => {
    if (url === '/dashboard') return location.pathname === '/dashboard' || location.pathname === '/';
    return location.pathname === url;
  };

  return (
    <div className="w-80 bg-[#0f2942] text-white flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <img src={logoImage} alt="HKIA VIP Lounge" className="h-10" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <div key={item.id}>
              {item.submenu ? (
                <>
                  <button
                    onClick={() => toggleMenu(item.id)}
                    className="flex items-center justify-between w-full p-3 rounded hover:bg-gray-700/50 transition-colors text-white"
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Overdue orders badge on Point of Sales */}
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
                      {item.submenu.map((subItem) => (
                        <button
                          key={subItem.id}
                          onClick={() => handleNavItem(subItem.url)}
                          className={`w-full text-left p-2 rounded text-sm transition-colors ${
                            isActive(subItem.url)
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                          }`}
                        >
                          {subItem.label}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <button
                  onClick={() => item.url && handleNavItem(item.url)}
                  className={`flex items-center gap-3 w-full p-3 rounded transition-colors ${
                    item.url && isActive(item.url)
                      ? 'bg-blue-600 text-white'
                      : 'text-white hover:bg-gray-700/50'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-700">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 w-full hover:bg-gray-700/50 p-2 rounded transition-colors">
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-xs">HS</span>
              </div>
              <div className="text-left">
                <p className="text-sm">HKIAL Staff</p>
                <p className="text-xs text-gray-400">Administrator</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem
              onClick={() => {
                console.log('Logout clicked');
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
