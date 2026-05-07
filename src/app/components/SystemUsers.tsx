import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Plus, Edit2, Trash2, Search, Shield, Key, Calendar, Shuffle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
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

export type SystemUsersRole = 'System Admin' | 'Lounge Manager' | 'Supervisor' | 'Staff';
export type SystemUsersStatus = 'active' | 'inactive';

export interface SystemUsersUser {
  id: number;
  name: string;
  email: string;
  role: SystemUsersRole;
  department: string;
  status: SystemUsersStatus;
  lastLogin: string;
  createdDate: string;
  permissions: string[];
}

export interface SystemUsersFormState {
  name: string;
  email: string;
  role: string;
  department: string;
}

export interface SystemUsersProps {
  users: SystemUsersUser[];
  totalUsers: number;
  paginatedUsers: SystemUsersUser[];
  startIndex: number;
  endIndex: number;
  totalPages: number;
  currentPage: number;
  searchTerm: string;
  roleFilter: string;
  startDate: string;
  endDate: string;
  isDialogOpen: boolean;
  editingUser: SystemUsersUser | null;
  form: SystemUsersFormState;
  onSearchTermChange: (value: string) => void;
  onRoleFilterChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onClearFilters: () => void;
  onPageChange: (page: number) => void;
  onCreate: () => void;
  onEdit: (user: SystemUsersUser) => void;
  onDelete: (user: SystemUsersUser) => void;
  onManagePermissions: (user: SystemUsersUser) => void;
  onDialogOpenChange: (open: boolean) => void;
  onFormChange: (form: SystemUsersFormState) => void;
  onQuickFill: () => void;
  onSubmit: () => void;
}

const getRoleColor = (role: string) => {
  switch (role) {
    case 'System Admin':
      return 'bg-purple-100 text-purple-700';
    case 'Lounge Manager':
      return 'bg-blue-100 text-blue-700';
    case 'Supervisor':
      return 'bg-green-100 text-green-700';
    case 'Staff':
      return 'bg-gray-100 text-gray-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const getStatusColor = (status: string) =>
  status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';

export function SystemUsers({
  totalUsers,
  paginatedUsers,
  startIndex,
  endIndex,
  totalPages,
  currentPage,
  searchTerm,
  roleFilter,
  startDate,
  endDate,
  isDialogOpen,
  editingUser,
  form,
  onSearchTermChange,
  onRoleFilterChange,
  onStartDateChange,
  onEndDateChange,
  onClearFilters,
  onPageChange,
  onCreate,
  onEdit,
  onDelete,
  onManagePermissions,
  onDialogOpenChange,
  onFormChange,
  onQuickFill,
  onSubmit,
}: SystemUsersProps) {
  const setForm = (patch: Partial<SystemUsersFormState>) => onFormChange({ ...form, ...patch });

  const renderPagination = () => {
    const pages: number[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, -1, totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, -1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, -1, currentPage - 1, currentPage, currentPage + 1, -2, totalPages);
    }

    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>
          {pages.map((page, index) => {
            if (page === -1 || page === -2) {
              return (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              );
            }
            return (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={() => onPageChange(page)}
                  isActive={currentPage === page}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            );
          })}
          <PaginationItem>
            <PaginationNext
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>System Users Management</h1>
          <p className="text-gray-600">Manage staff accounts, roles, and permissions</p>
        </div>
        <Button onClick={onCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add New User
        </Button>
      </div>

      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or role..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={onRoleFilterChange}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="System Admin">System Admin</SelectItem>
                <SelectItem value="Lounge Manager">Lounge Manager</SelectItem>
                <SelectItem value="Supervisor">Supervisor</SelectItem>
                <SelectItem value="Staff">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label>Start Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => onStartDateChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                />
                <Calendar className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="flex-1">
              <label>End Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => onEndDateChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                />
                <Calendar className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={onClearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-4 border-b flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {totalUsers === 0 ? 0 : startIndex + 1}-{Math.min(endIndex, totalUsers)} of {totalUsers} users
          </div>
          <div>{renderPagination()}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Last Login</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{user.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gray-400" />
                      <button
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        onClick={() => onEdit(user)}
                      >
                        {user.name}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{user.department}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={getStatusColor(user.status)}>{user.status}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.lastLogin}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(user)}
                        className="h-8 w-8 p-0"
                        title="Edit User"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onManagePermissions(user)}
                        className="h-8 w-8 p-0 text-purple-600 hover:text-purple-800 hover:bg-purple-50"
                        title="Manage Permissions"
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(user)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                        title="Delete User"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalUsers > 0 && (
          <div className="p-4 border-t flex justify-end">{renderPagination()}</div>
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={onDialogOpenChange}>
        <DialogContent className="min-w-[1200px] max-w-[1200px]">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Edit System User' : 'Create New System User'}
            </DialogTitle>
            <DialogDescription>
              {editingUser ? 'Edit the details of an existing system user.' : 'Create a new system user with the following details.'}
            </DialogDescription>
            {!editingUser && (
              <Button
                type="button"
                variant="outline"
                onClick={onQuickFill}
                className="gap-1 mt-2 w-fit bg-gradient-to-r from-yellow-400/20 to-amber-400/20 border-yellow-400/50 text-yellow-700 hover:from-yellow-400/30 hover:to-amber-400/30 hover:border-yellow-500/70 hover:text-yellow-800 transition-all text-[10px] px-2 py-0.5 h-[25px]"
              >
                <Shuffle className="w-3 h-3" />
                Quick Fill Demo
              </Button>
            )}
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label>Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Wong Chi Ming"
                />
              </div>
              <div>
                <label>Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  placeholder="email@hkial.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label>Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                >
                  <option value="System Admin">System Admin</option>
                  <option value="Lounge Manager">Lounge Manager</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Staff">Staff</option>
                </select>
              </div>
              <div>
                <label>Department</label>
                <select
                  value={form.department}
                  onChange={(e) => setForm({ department: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                >
                  <option value="IT Department">IT Department</option>
                  <option value="Lounge Operations">Lounge Operations</option>
                  <option value="Guest Services">Guest Services</option>
                  <option value="Finance">Finance</option>
                  <option value="Management">Management</option>
                </select>
              </div>
            </div>

            <div>
              <label>Permissions</label>
              <div className="grid grid-cols-2 gap-3 mt-2 p-4 border border-gray-300 rounded-md max-h-48 overflow-y-auto">
                {[
                  'Approve Members',
                  'Create Members',
                  'Edit Members',
                  'Approve Booking Request',
                  'Create Bookings',
                  'Edit Bookings',
                  'Approve Invoices',
                  'Process Payments',
                  'View Reports',
                  'Export Data',
                  'Manage Staff',
                  'Manage System Settings',
                  'View Audit Logs',
                  'Manage Bookable Items',
                  'Daily Movement Log',
                ].map((permission) => (
                  <label key={permission} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">{permission}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label>Status</label>
              <select
                defaultValue={editingUser?.status}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => onDialogOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingUser ? 'Update User' : 'Create User'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
