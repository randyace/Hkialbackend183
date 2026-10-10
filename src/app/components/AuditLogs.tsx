import { useMemo, useState } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Search, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { StringDatePicker } from '../../../../ui/CustomDatePicker';

export interface AuditLog {
  id: string | number;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  /** e.g. "Booking #12345", or "—" when no entity_id */
  targetRecord?: string;
  details: string;
  ipAddress: string;
  status: 'success' | 'failed' | 'warning';
}

const MOCK_AUDIT_LOGS: AuditLog[] = [
  { id: '1',  timestamp: '2024-10-22 14:30:25', user: 'HKIAL Staff',    action: 'UPDATE', module: 'Booking',      targetRecord: 'Booking #1001', details: 'Changed status from Pending to Approved for A-202602-000001',          ipAddress: '192.168.1.100', status: 'warning' },
  { id: '2',  timestamp: '2024-10-22 14:15:12', user: 'Wong Chi Ming',  action: 'CREATE', module: 'Application',  targetRecord: 'Application #15', details: 'Approved application APP-2024-015 and assigned account ACC-2024-0234', ipAddress: '192.168.1.105', status: 'success' },
  { id: '3',  timestamp: '2024-10-22 13:45:33', user: 'Chan Siu Lan',   action: 'LOGIN',  module: 'auth',         targetRecord: '—', details: 'Invalid password entered',                                              ipAddress: '192.168.1.120', status: 'failed'  },
  { id: '4',  timestamp: '2024-10-22 13:30:18', user: 'Lee Ka Wai',     action: 'CREATE', module: 'Booking',      targetRecord: 'Booking #1045', details: 'Created booking A-202602-000045 for guest John Smith',                  ipAddress: '192.168.1.108', status: 'success' },
  { id: '5',  timestamp: '2024-10-22 12:20:44', user: 'Lam Mei Ling',   action: 'UPDATE', module: 'BookableItem', targetRecord: 'BookableItem #3', details: 'Changed price of VIP Suite A from HK$4,200 to HK$4,500',               ipAddress: '192.168.1.115', status: 'warning' },
  { id: '6',  timestamp: '2024-10-22 11:55:09', user: 'HKIAL Staff',    action: 'CREATE', module: 'SystemUser',   targetRecord: 'SystemUser #12', details: 'Created new staff account for Tang Wai Hong',                           ipAddress: '192.168.1.100', status: 'success' },
  { id: '7',  timestamp: '2024-10-22 11:30:22', user: 'Wong Chi Ming',  action: 'VIEW',   module: 'Report',       targetRecord: '—', details: 'Generated and exported Daily Booking Report for 2024-10-22',            ipAddress: '192.168.1.105', status: 'success' },
  { id: '8',  timestamp: '2024-10-22 10:45:15', user: 'Lee Ka Wai',     action: 'OTHER',  module: 'SystemUser',   targetRecord: '—', details: 'Tried to access System Users Management without permission',            ipAddress: '192.168.1.108', status: 'warning' },
  { id: '9',  timestamp: '2024-10-22 10:15:38', user: 'Chan Siu Lan',   action: 'UPDATE', module: 'Booking',      targetRecord: 'Booking #1044', details: 'Rejected booking A-202602-000044 - Reason: Suite not available',        ipAddress: '192.168.1.120', status: 'warning' },
  { id: '10', timestamp: '2024-10-22 09:30:51', user: 'HKIAL Staff',    action: 'UPDATE', module: 'system',       targetRecord: '—', details: 'Changed email notification settings for booking confirmations',         ipAddress: '192.168.1.100', status: 'warning' },
];

const MODULE_LABELS: Record<string, string> = {
  Booking: 'Bookings',
  Account: 'Customers',
  Company: 'Companies',
  PromoCode: 'Promo Codes',
  Purchase: 'Purchases',
  TravelAgency: 'Travel Agencies',
  SystemUser: 'System Users',
  AuditLog: 'Audit Logs',
  Application: 'Applications',
  Suite: 'Suites',
  BookableItem: 'Bookable Items',
  Refund: 'Refunds',
  Opportunity: 'Opportunities',
  GradingPackage: 'Grading Packages',
  Member: 'Members',
  Contract: 'Contracts',
  invoices: 'Invoices',
  Email: 'Email',
  Cirium: 'Flight Info',
  system: 'System',
  auth: 'Authentication',
};

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Create',
  UPDATE: 'Update',
  DELETE: 'Delete',
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  VIEW: 'View',
  OTHER: 'Other',
};

function getStatusColor(status: string): string {
  switch (status) {
    case 'success': return 'bg-green-100 text-green-700';
    case 'failed':  return 'bg-red-100 text-red-700';
    case 'warning': return 'bg-yellow-100 text-yellow-700';
    default:        return 'bg-gray-100 text-gray-700';
  }
}

export interface AuditLogsPagination {
  page: number;
  lastPage: number;
  total: number;
  perPage: number;
  onPageChange: (page: number) => void;
}

export interface AuditLogsServerFilters {
  search: string;
  module: string;
  action: string;
  onSearchChange: (value: string) => void;
  onModuleChange: (value: string) => void;
  onActionChange: (value: string) => void;
  moduleOptions: string[];
  actionOptions: string[];
}

export interface AuditLogsSummary {
  total: number;
  email: number;
  cirium: number;
  failed: number;
}

export interface AuditLogsProps {
  audits?: AuditLog[];
  isLoading?: boolean;
  onFilter?: (module: string, status: string) => void;
  /** Controlled date filters (container wires these to the API). */
  startDate?: string;
  endDate?: string;
  onStartDateChange?: (value: string) => void;
  onEndDateChange?: (value: string) => void;
  /** When set, the container owns paging — this view renders the current page only. */
  pagination?: AuditLogsPagination;
  /** When set, search/module/action are controlled and sent to the API. */
  serverFilters?: AuditLogsServerFilters;
  summary?: AuditLogsSummary;
}

export function AuditLogs({
  audits: auditsProp,
  isLoading,
  startDate: startDateProp,
  endDate: endDateProp,
  onStartDateChange,
  onEndDateChange,
  pagination,
  serverFilters,
  summary,
}: AuditLogsProps = {}) {
  // Only fall back to MOCK when the prop is omitted (standalone figma Make).
  // An empty array from the container must not flash mock rows.
  const logs: AuditLog[] = auditsProp !== undefined ? auditsProp : MOCK_AUDIT_LOGS;
  const serverMode = pagination !== undefined;

  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [localStartDate, setLocalStartDate] = useState('');
  const [localEndDate, setLocalEndDate] = useState('');
  const startDate = startDateProp ?? localStartDate;
  const endDate = endDateProp ?? localEndDate;
  const setStartDate = (v: string) => {
    if (onStartDateChange) onStartDateChange(v);
    else setLocalStartDate(v);
  };
  const setEndDate = (v: string) => {
    if (onEndDateChange) onEndDateChange(v);
    else setLocalEndDate(v);
  };
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = pagination?.perPage ?? 20;

  const searchValue = serverFilters?.search ?? searchTerm;
  const moduleValue = serverFilters?.module ?? moduleFilter;
  const actionValue = serverFilters?.action ?? actionFilter;
  const setSearchValue = (v: string) => {
    if (serverFilters) serverFilters.onSearchChange(v);
    else setSearchTerm(v);
  };
  const setModuleValue = (v: string) => {
    if (serverFilters) serverFilters.onModuleChange(v);
    else setModuleFilter(v);
  };
  const setActionValue = (v: string) => {
    if (serverFilters) serverFilters.onActionChange(v);
    else setActionFilter(v);
  };

  const moduleOptions = useMemo(() => {
    if (serverFilters?.moduleOptions) return serverFilters.moduleOptions;
    const modules = new Set(logs.map((log) => log.module).filter(Boolean));
    return ['all', ...Array.from(modules).sort()];
  }, [logs, serverFilters]);

  const actionOptions = useMemo(() => {
    if (serverFilters?.actionOptions) return serverFilters.actionOptions;
    const actions = new Set(logs.map((log) => log.action).filter(Boolean));
    return ['all', ...Array.from(actions).sort()];
  }, [logs, serverFilters]);

  const filteredLogs = useMemo(() => {
    if (serverMode) {
      const totalPages = pagination.lastPage || 1;
      const safePage = Math.min(Math.max(pagination.page, 1), totalPages);
      return { list: logs, paginated: logs, totalPages, safePage };
    }

    const list = logs.filter((log) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        log.user.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.module.toLowerCase().includes(q) ||
        (log.targetRecord ?? '').toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q);
      const matchesModule = moduleFilter === 'all' || log.module === moduleFilter;
      const matchesAction = actionFilter === 'all' || log.action === actionFilter;
      const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
      // Parse timestamps that are already "YYYY-MM-DD HH:mm:ss" (container)
      // or ISO. Avoid Date(localeString) which is Invalid Date in many browsers.
      const ts = Date.parse(log.timestamp.includes('T') ? log.timestamp : log.timestamp.replace(' ', 'T'));
      const matchesStart = !startDate || (!Number.isNaN(ts) && ts >= Date.parse(startDate + 'T00:00:00'));
      const matchesEnd = !endDate || (!Number.isNaN(ts) && ts <= Date.parse(endDate + 'T23:59:59'));
      return matchesSearch && matchesModule && matchesAction && matchesStatus && matchesStart && matchesEnd;
    });

    const totalPages = Math.ceil(list.length / itemsPerPage) || 1;
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * itemsPerPage;
    return { list, paginated: list.slice(startIndex, startIndex + itemsPerPage), totalPages, safePage };
  }, [logs, searchTerm, moduleFilter, actionFilter, statusFilter, startDate, endDate, currentPage, itemsPerPage, serverMode, pagination]);

  const { list: filteredList, paginated, totalPages, safePage } = filteredLogs;
  const entryTotal = serverMode ? pagination.total : filteredList.length;
  const startIndex = (safePage - 1) * itemsPerPage;

  const goToPage = (page: number) => {
    if (pagination) pagination.onPageChange(page);
    else setCurrentPage(page);
  };

  const clearFilters = () => {
    setSearchValue('');
    setModuleValue('all');
    setActionValue('all');
    setStatusFilter('all');
    setStartDate('');
    setEndDate('');
    goToPage(1);
  };

  // When server-side date filters change, reset to page 1.
  // (Local module/action/status already reset page in their onChange handlers.)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1>Audit Logs</h1>
        <p className="text-gray-600">Track all system activities and user actions</p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by user, action, module, or details..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
                value={searchValue}
                onChange={(e) => { setSearchValue(e.target.value); if (!serverMode) setCurrentPage(1); }}
              />
            </div>
            <Select value={moduleValue} onValueChange={(v) => { setModuleValue(v); if (!serverMode) setCurrentPage(1); }}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by module" />
              </SelectTrigger>
              <SelectContent>
                {moduleOptions.map((module) => (
                  <SelectItem key={module} value={module}>
                    {module === 'all' ? 'All Modules' : (MODULE_LABELS[module] ?? module)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={actionValue} onValueChange={(v) => { setActionValue(v); if (!serverMode) setCurrentPage(1); }}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                {actionOptions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action === 'all' ? 'All Actions' : (ACTION_LABELS[action] ?? action)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!serverFilters ? (
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
              </SelectContent>
            </Select>
            ) : null}
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="mb-[10px] block text-sm text-gray-700">Start Date</label>
              <StringDatePicker
                value={startDate}
                onChange={(next) => { setStartDate(next); if (!serverMode) setCurrentPage(1); }}
              />
            </div>
            <div className="flex-1">
              <label className="mb-[10px] block text-sm text-gray-700">End Date</label>
              <StringDatePicker
                value={endDate}
                onChange={(next) => { setEndDate(next); if (!serverMode) setCurrentPage(1); }}
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={clearFilters}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Activities</p>
          <h2 className="mt-1">{summary ? summary.total : logs.length}</h2>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">{summary ? 'Emails' : 'Successful Actions'}</p>
          <h2 className="mt-1 text-green-600">
            {summary ? summary.email : logs.filter((l) => l.status === 'success').length}
          </h2>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">{summary ? 'Flight Info' : 'Failed Actions'}</p>
          <h2 className={summary ? 'mt-1 text-blue-600' : 'mt-1 text-red-600'}>
            {summary ? summary.cirium : logs.filter((l) => l.status === 'failed').length}
          </h2>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">{summary ? 'Failed' : 'Warnings'}</p>
          <h2 className={summary ? 'mt-1 text-red-600' : 'mt-1 text-yellow-600'}>
            {summary ? summary.failed : logs.filter((l) => l.status === 'warning').length}
          </h2>
        </Card>
      </div>

      {/* Logs Table */}
      <Card>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Loading audit logs…</span>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Module</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Target Record</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Details</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">IP Address</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginated.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{log.timestamp}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{log.user}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="outline">{MODULE_LABELS[log.module] ?? log.module}</Badge>
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-800"
                      title={log.targetRecord ?? '—'}
                    >
                      {log.targetRecord ?? '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{ACTION_LABELS[log.action] ?? log.action}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-md truncate" title={log.details}>
                      {log.details}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{log.ipAddress}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getStatusColor(log.status)}>
                        {log.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {isLoading
            ? 'Loading…'
            : `Showing ${entryTotal ? startIndex + 1 : 0}–${Math.min(startIndex + itemsPerPage, entryTotal)} of ${entryTotal} entries`}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => goToPage(Math.max(1, safePage - 1))}
            disabled={safePage <= 1}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm">
            {safePage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => goToPage(Math.min(totalPages, safePage + 1))}
            disabled={safePage >= totalPages}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
