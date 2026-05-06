import { useState } from 'react';
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

interface SystemUser {
  id: number;
  name: string;
  email: string;
  role: 'System Admin' | 'Lounge Manager' | 'Supervisor' | 'Staff';
  department: string;
  status: 'active' | 'inactive';
  lastLogin: string;
  createdDate: string;
  permissions: string[];
}

const generateMockUsers = (): SystemUser[] => {
  const firstNames = ['Wong', 'Chan', 'Lee', 'Lam', 'Cheng', 'Ng', 'Cheung', 'Ho', 'Leung', 'Tang', 'Yip', 'Fong', 'Tsang', 'Chow', 'Kwok'];
  const lastNames = ['Chi Ming', 'Siu Lan', 'Ka Wai', 'Mei Ling', 'Hoi Man', 'Yuk Fai', 'Wai Ying', 'Chun Kit', 'Sum Yi', 'Wing Sze'];
  const roles: ('System Admin' | 'Lounge Manager' | 'Supervisor' | 'Staff')[] = ['System Admin', 'Lounge Manager', 'Supervisor', 'Staff', 'Staff', 'Staff'];
  const departments = ['IT Department', 'Lounge Operations', 'Guest Services', 'Finance', 'Management', 'Security', 'Housekeeping', 'F&B Services'];
  const statuses: ('active' | 'inactive')[] = ['active', 'active', 'active', 'active', 'inactive'];
  
  const users: SystemUser[] = [];
  for (let i = 1; i <= 45; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];
    const name = `${firstName} ${lastName}`;
    const role = roles[i % roles.length];
    const department = departments[i % departments.length];
    const status = statuses[i % statuses.length];
    
    const createdDate = new Date(2023, Math.floor(i / 10), (i % 28) + 1);
    const lastLoginDate = new Date(2026, 0, 15 + (i % 8));
    const lastLoginHour = 8 + (i % 12);
    const lastLoginMinute = (i * 15) % 60;
    
    let permissions: string[] = [];
    if (role === 'System Admin') {
      permissions = ['all'];
    } else if (role === 'Lounge Manager') {
      permissions = ['approve_invoices', 'manage_staff', 'view_reports', 'approve_bookings'];
    } else if (role === 'Supervisor') {
      permissions = ['approve_bookings', 'manage_bookings', 'view_reports', 'create_bookings'];
    } else {
      permissions = ['create_bookings', 'edit_bookings', 'view_guests'];
    }
    
    users.push({
      id: i,
      name: i === 1 ? 'HKIAL Staff' : name,
      email: i === 1 ? 'admin@hkial.com' : `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(' ', '')}@hkial.com`,
      role,
      department,
      status,
      lastLogin: `${lastLoginDate.toISOString().split('T')[0]} ${String(lastLoginHour).padStart(2, '0')}:${String(lastLoginMinute).padStart(2, '0')}`,
      createdDate: createdDate.toISOString().split('T')[0],
      permissions
    });
  }
  return users;
};

export function SystemUsers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form state for create/edit dialog
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState('Staff');
  const [formDepartment, setFormDepartment] = useState('IT Department');

  const users: SystemUser[] = generateMockUsers();

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStartDate = !startDate || new Date(user.createdDate) >= new Date(startDate);
    const matchesEndDate = !endDate || new Date(user.createdDate) <= new Date(endDate);
    return matchesSearch && matchesRole && matchesStartDate && matchesEndDate;
  }).sort((a, b) => b.id - a.id);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, -1, totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, -1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, -1, currentPage - 1, currentPage, currentPage + 1, -2, totalPages);
      }
    }

    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
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
                  onClick={() => setCurrentPage(page)}
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
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

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

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
  };

  const handleEdit = (user: SystemUser) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormRole(user.role);
    setFormDepartment(user.department);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormRole('Staff');
    setFormDepartment('IT Department');
    setIsDialogOpen(true);
  };

  // ── Quick Fill for Dialog ───────────────────────────────────────────────────
  const handleQuickFill = () => {
    setFormName('Karen Leung');
    setFormEmail('karen.leung@hkial.com');
    setFormRole('Supervisor');
    setFormDepartment('Lounge Operations');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>System Users Management</h1>
          <p className="text-gray-600">Manage staff accounts, roles, and permissions</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add New User
        </Button>
      </div>

      {/* Filters */}
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
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
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

          {/* Date Range Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label>Start Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
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
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                />
                <Calendar className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setRoleFilter('all');
                  setSearchTerm('');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <div className="p-4 border-b flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
          </div>
          <div>
            {renderPagination()}
          </div>
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
                        onClick={() => handleEdit(user)}
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
                    <Badge className={getStatusColor(user.status)}>
                      {user.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.lastLogin}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(user)}
                        className="h-8 w-8 p-0"
                        title="Edit User"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => console.log('Manage permissions:', user.id)}
                        className="h-8 w-8 p-0 text-purple-600 hover:text-purple-800 hover:bg-purple-50"
                        title="Manage Permissions"
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => console.log('Delete user:', user.id)}
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

        {filteredUsers.length > 0 && (
          <div className="p-4 border-t flex justify-end">
            {renderPagination()}
          </div>
        )}
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                onClick={handleQuickFill}
                className="gap-1 mt-2 w-fit bg-gradient-to-r from-yellow-400/20 to-amber-400/20 border-yellow-400/50 text-yellow-700 hover:from-yellow-400/30 hover:to-amber-400/30 hover:border-yellow-500/70 hover:text-yellow-800 transition-all text-[10px] px-2 py-0.5 h-[25px]"
              >
                <Shuffle className="w-3 h-3" />
                Quick Fill Demo
              </Button>
            )}
          </DialogHeader>
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label>Full Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Wong Chi Ming"
                />
              </div>
              <div>
                <label>Email Address</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  placeholder="email@hkial.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label>Role</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
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
                  value={formDepartment}
                  onChange={(e) => setFormDepartment(e.target.value)}
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
                  'Daily Movement Log'
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
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
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