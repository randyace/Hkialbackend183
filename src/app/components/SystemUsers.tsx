/**
 * SystemUsers.tsx — Pure presentational list component.
 *
 * Rules:
 *  - Zero business state (users[] comes entirely from props)
 *  - Filter / pagination are pure UI state — allowed
 *  - Create / edit navigation reported via typed callbacks (no modal)
 *  - Default props fall back to mockSystemUsersData (fixture pattern)
 *  - Backend contract aligned: roles/status/permissions match the Laravel API
 */

import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Plus, Edit2, Trash2, Search, Shield, Key, Calendar, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './ui/pagination';
import { mockSystemUsersData } from './__fixtures__/SystemUsers.mocks';

// ─── Public types ─────────────────────────────────────────────────────────────

export type SystemUserRole   = 'Administrator' | 'Supervisor' | 'Staff' | 'Super Admin';
export type SystemUserStatus = 'Active' | 'Inactive';

export interface SystemUser {
  id:          number;
  name:        string;
  email:       string;
  role:        SystemUserRole;
  department:  string;
  status:      SystemUserStatus;
  lastLogin:   string;
  createdDate: string;
  permissions: string[];
}

export interface SystemUserFormData {
  name:        string;
  email:       string;
  role:        SystemUserRole;
  department:  string;
  permissions: string[];
  status:      SystemUserStatus;
  password?:   string;
}

export interface PermissionOption {
  value: string;
  label: string;
}

export interface SystemUsersProps {
  /** Full list of system users to display */
  users?: SystemUser[];
  /** Map from backend role value to display label */
  roleLabels?: Record<SystemUserRole, string>;
  /** Whether data is being fetched */
  isLoading?: boolean;
  /** Permission flags controlling which actions are surfaced */
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
  /** Navigate to create page */
  onCreateUser?: () => void;
  /** Navigate to edit page */
  onEditUser?: (id: number) => void;
  /** Called when the Delete button is clicked */
  onDeleteUser?: (id: number) => void;
  /** Navigate to edit permissions (defaults to edit page) */
  onManagePermissions?: (id: number) => void;
}

const DEFAULT_ROLE_LABELS: Record<SystemUserRole, string> = {
  Administrator: 'Administrator',
  Supervisor: 'Supervisor',
  Staff: 'Staff',
  'Super Admin': 'Super Admin',
};

function getRoleColor(role: SystemUserRole): string {
  switch (role) {
    case 'Administrator': return 'bg-purple-100 text-purple-700';
    case 'Supervisor':    return 'bg-green-100 text-green-700';
    case 'Staff':         return 'bg-gray-100 text-gray-700';
    case 'Super Admin':   return 'bg-indigo-100 text-indigo-700';
  }
}

function getStatusColor(status: SystemUserStatus): string {
  return status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
}

function buildPageList(currentPage: number, totalPages: number): number[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (currentPage <= 3)             return [1, 2, 3, 4, -1, totalPages];
  if (currentPage >= totalPages - 2) return [1, -1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  return [1, -1, currentPage - 1, currentPage, currentPage + 1, -2, totalPages];
}

export function SystemUsers({
  users               = mockSystemUsersData.users ?? [],
  roleLabels          = DEFAULT_ROLE_LABELS,
  isLoading           = false,
  canCreate           = true,
  canUpdate           = true,
  canDelete           = true,
  onCreateUser        = () => {},
  onEditUser          = () => {},
  onDeleteUser        = () => {},
  onManagePermissions = () => {},
}: SystemUsersProps) {
  const [searchTerm,  setSearchTerm]  = useState('');
  const [roleFilter,  setRoleFilter]  = useState('all');
  const [statusFilter,setStatusFilter]= useState('all');
  const [startDate,   setStartDate]   = useState('');
  const [endDate,     setEndDate]     = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const allRoleEntries = Object.entries(roleLabels) as [SystemUserRole, string][];

  const filteredUsers = users
    .filter(u => {
      const q = searchTerm.toLowerCase();
      const matchSearch = u.name.toLowerCase().includes(q) ||
                          u.email.toLowerCase().includes(q) ||
                          roleLabels[u.role].toLowerCase().includes(q);
      const matchRole   = roleFilter === 'all' || u.role === roleFilter;
      const matchStatus = statusFilter === 'all' || u.status === statusFilter;
      const matchStart  = !startDate || new Date(u.createdDate) >= new Date(startDate);
      const matchEnd    = !endDate   || new Date(u.createdDate) <= new Date(endDate);
      return matchSearch && matchRole && matchStatus && matchStart && matchEnd;
    })
    .sort((a, b) => b.id - a.id);

  const totalPages     = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const startIndex     = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setRoleFilter('all');
    setStatusFilter('all');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const renderPagination = () => {
    const pages = buildPageList(currentPage, totalPages);
    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>
          {pages.map((page, idx) =>
            page < 0 ? (
              <PaginationItem key={`ellipsis-${idx}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={() => setCurrentPage(page)}
                  isActive={currentPage === page}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ),
          )}
          <PaginationItem>
            <PaginationNext
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <div className="flex min-h-full w-full flex-col gap-6 p-6">
      <div className="flex shrink-0 items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">System Users Management</h1>
          <p className="mt-1 text-sm text-gray-600">Manage staff accounts, roles, and permissions</p>
        </div>
        {canCreate && (
          <Button onClick={onCreateUser} className="shrink-0">
            <Plus className="w-4 h-4 mr-2" />
            Add New User
          </Button>
        )}
      </div>

      <Card className="w-full shrink-0 gap-0 p-4">
        <div className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or role..."
                className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {allRoleEntries.map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <label className="mb-[10px] block text-sm text-gray-700">Start Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                  className="w-full rounded-md border border-gray-300 px-4 py-2"
                />
                <Calendar className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <div className="flex-1">
              <label className="mb-[10px] block text-sm text-gray-700">End Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                  className="w-full rounded-md border border-gray-300 px-4 py-2"
                />
                <Calendar className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Fills remaining viewport height; page scrolls — no nested table scroll frame */}
      <Card className="flex w-full flex-1 flex-col gap-0">
        <div className="flex shrink-0 flex-col justify-between gap-3 border-b p-4 sm:flex-row sm:items-center">
          <div className="text-sm text-gray-500">
            Showing {isLoading ? '…' : `${startIndex + 1}–${Math.min(startIndex + itemsPerPage, filteredUsers.length)} of ${filteredUsers.length} users`}
          </div>
          <div>{renderPagination()}</div>
        </div>

        <div className="w-full">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Loading users…</span>
            </div>
          ) : (
            <table className="w-full table-fixed">
              <colgroup>
                <col className="w-[5%]" />
                <col className="w-[16%]" />
                <col className="w-[22%]" />
                <col className="w-[12%]" />
                <col className="w-[14%]" />
                <col className="w-[9%]" />
                <col className="w-[14%]" />
                <col className="w-[8%]" />
              </colgroup>
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-500">ID</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-500">Name</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-500">Email</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-500">Role</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-500">Department</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-500">Last Login</th>
                  <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{user.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <Shield className="h-4 w-4 shrink-0 text-gray-400" />
                        <button
                          type="button"
                          className="truncate text-left text-sm text-blue-600 hover:text-blue-800 hover:underline"
                          onClick={() => canUpdate && onEditUser(user.id)}
                        >
                          {user.name}
                        </button>
                      </div>
                    </td>
                    <td className="truncate px-4 py-3 text-sm text-gray-600" title={user.email}>
                      {user.email}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={getRoleColor(user.role)}>{roleLabels[user.role]}</Badge>
                    </td>
                    <td className="truncate px-4 py-3 text-sm" title={user.department}>
                      {user.department}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={getStatusColor(user.status)}>{user.status}</Badge>
                    </td>
                    <td className="truncate px-4 py-3 text-sm text-gray-600" title={user.lastLogin}>
                      {user.lastLogin}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center justify-end gap-1">
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditUser(user.id)}
                            className="h-8 w-8 p-0"
                            title="Edit User"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onManagePermissions(user.id)}
                            className="h-8 w-8 p-0 text-purple-600 hover:bg-purple-50 hover:text-purple-800"
                            title="Manage Permissions"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteUser(user.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-800"
                            title="Delete User"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {filteredUsers.length > 0 && !isLoading && (
          <div className="mt-auto flex shrink-0 justify-end border-t p-4">
            {renderPagination()}
          </div>
        )}
      </Card>
    </div>
  );
}
