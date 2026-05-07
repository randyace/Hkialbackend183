import { useMemo, useState } from 'react';
import {
  SystemUsers,
  type SystemUsersFormState,
  type SystemUsersUser,
} from '../../app/components/SystemUsers';
import { mockSystemUsers } from '../SystemUsers.fixture';

const ITEMS_PER_PAGE = 10;

const emptyForm: SystemUsersFormState = {
  name: '',
  email: '',
  role: 'Staff',
  department: 'IT Department',
};

export function SystemUsersPreview() {
  const [users] = useState<SystemUsersUser[]>(mockSystemUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUsersUser | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [form, setForm] = useState<SystemUsersFormState>(emptyForm);

  const filteredUsers = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return users
      .filter((user) => {
        const matchesSearch =
          user.name.toLowerCase().includes(search) ||
          user.email.toLowerCase().includes(search) ||
          user.role.toLowerCase().includes(search);
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        const matchesStartDate = !startDate || new Date(user.createdDate) >= new Date(startDate);
        const matchesEndDate = !endDate || new Date(user.createdDate) <= new Date(endDate);
        return matchesSearch && matchesRole && matchesStartDate && matchesEndDate;
      })
      .sort((a, b) => b.id - a.id);
  }, [users, searchTerm, roleFilter, startDate, endDate]);

  const totalUsers = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalUsers / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const handleCreate = () => {
    setEditingUser(null);
    setForm({ ...emptyForm });
    setIsDialogOpen(true);
  };

  const handleEdit = (user: SystemUsersUser) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    });
    setIsDialogOpen(true);
  };

  const handleQuickFill = () => {
    setForm({
      name: 'Karen Leung',
      email: 'karen.leung@hkial.com',
      role: 'Supervisor',
      department: 'Lounge Operations',
    });
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setRoleFilter('all');
    setSearchTerm('');
    setCurrentPage(1);
  };

  return (
    <SystemUsers
      users={users}
      totalUsers={totalUsers}
      paginatedUsers={paginatedUsers}
      startIndex={startIndex}
      endIndex={endIndex}
      totalPages={totalPages}
      currentPage={safePage}
      searchTerm={searchTerm}
      roleFilter={roleFilter}
      startDate={startDate}
      endDate={endDate}
      isDialogOpen={isDialogOpen}
      editingUser={editingUser}
      form={form}
      onSearchTermChange={(v) => { setSearchTerm(v); setCurrentPage(1); }}
      onRoleFilterChange={(v) => { setRoleFilter(v); setCurrentPage(1); }}
      onStartDateChange={(v) => { setStartDate(v); setCurrentPage(1); }}
      onEndDateChange={(v) => { setEndDate(v); setCurrentPage(1); }}
      onClearFilters={handleClearFilters}
      onPageChange={setCurrentPage}
      onCreate={handleCreate}
      onEdit={handleEdit}
      onDelete={() => { /* preview only */ }}
      onManagePermissions={() => { /* preview only */ }}
      onDialogOpenChange={setIsDialogOpen}
      onFormChange={setForm}
      onQuickFill={handleQuickFill}
      onSubmit={() => setIsDialogOpen(false)}
    />
  );
}
