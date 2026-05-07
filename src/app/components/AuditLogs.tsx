import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Search } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

export interface AuditLogsLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  details: string;
  ipAddress: string;
  status: 'success' | 'failed' | 'warning';
}

export interface AuditLogsStats {
  total: number;
  successCount: number;
  failedCount: number;
  warningCount: number;
}

export interface AuditLogsProps {
  loading?: boolean;
  error?: string | null;
  logs: AuditLogsLog[];
  totalCount: number;
  stats: AuditLogsStats;
  searchTerm: string;
  moduleFilter: string;
  statusFilter: string;
  currentPage: number;
  totalPages: number;
  onSearchTermChange: (value: string) => void;
  onModuleFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onPageChange: (page: number) => void;
}

const STATUS_COLORS: Record<AuditLogsLog['status'], string> = {
  success: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  warning: 'bg-yellow-100 text-yellow-700',
};

export function AuditLogs({
  loading,
  error,
  logs,
  totalCount,
  stats,
  searchTerm,
  moduleFilter,
  statusFilter,
  currentPage,
  totalPages,
  onSearchTermChange,
  onModuleFilterChange,
  onStatusFilterChange,
  onPageChange,
}: AuditLogsProps) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1>Audit Logs</h1>
        <p className="text-gray-600">Track all system activities and user actions</p>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by user, action, or details..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
            />
          </div>
          <Select value={moduleFilter} onValueChange={onModuleFilterChange}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by module" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modules</SelectItem>
              <SelectItem value="Bookings">Bookings</SelectItem>
              <SelectItem value="Customers">Customers</SelectItem>
              <SelectItem value="Items">Bookable Items</SelectItem>
              <SelectItem value="System Users">System Users</SelectItem>
              <SelectItem value="Reports">Reports</SelectItem>
              <SelectItem value="Authentication">Authentication</SelectItem>
              <SelectItem value="Settings">Settings</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
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
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Activities</p>
          <h2 className="mt-1">{stats.total}</h2>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Successful Actions</p>
          <h2 className="mt-1 text-green-600">{stats.successCount}</h2>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Failed Actions</p>
          <h2 className="mt-1 text-red-600">{stats.failedCount}</h2>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Warnings</p>
          <h2 className="mt-1 text-yellow-600">{stats.warningCount}</h2>
        </Card>
      </div>

      <Card>
        {error && (
          <div className="p-4 text-sm text-red-600 bg-red-50 border-b border-red-200">
            {error}
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Module</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Details</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">IP Address</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{log.timestamp}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{log.user}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="outline">{log.module}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{log.action}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-md truncate">
                    {log.details}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{log.ipAddress}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={STATUS_COLORS[log.status]}>{log.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && logs.length === 0 && (
          <div className="text-center py-12 text-gray-500">No audit logs match your filters.</div>
        )}
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {logs.length} of {totalCount} entries
        </p>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm disabled:opacity-50"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm disabled:opacity-50"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
