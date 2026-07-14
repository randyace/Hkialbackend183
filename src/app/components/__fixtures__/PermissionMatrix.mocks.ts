import type {
  PermissionMatrixProps,
  PermissionModuleView,
  RoleOptionView,
} from '../PermissionMatrix';

export const mockPermissionModules: PermissionModuleView[] = [
  {
    key: 'booking_management',
    label: 'Booking Management',
    features: [
      {
        key: 'bookings',
        label: 'Bookings',
        actions: [
          { key: 'read', label: 'Read', name: 'bookings.read', exists: true },
          { key: 'create', label: 'Create', name: 'bookings.create', exists: true },
          { key: 'update', label: 'Update', name: 'bookings.update', exists: true },
          { key: 'delete', label: 'Delete', name: 'bookings.delete', exists: true },
          { key: 'approve', label: 'Approve', name: 'bookings.approve', exists: true },
          { key: 'export', label: 'Export', name: 'bookings.export', exists: true },
        ],
      },
      {
        key: 'booking_schedules',
        label: 'Booking Schedules',
        actions: [
          { key: 'read', label: 'Read', name: 'booking_schedules.read', exists: true },
          { key: 'scan_entry', label: 'Scan Entry', name: 'booking_schedules.scan_entry', exists: true },
        ],
      },
    ],
  },
  {
    key: 'system_administration',
    label: 'System Administration',
    features: [
      {
        key: 'system_users',
        label: 'System Users',
        actions: [
          { key: 'read', label: 'Read', name: 'system_users.read', exists: true },
          { key: 'create', label: 'Create', name: 'system_users.create', exists: true },
          { key: 'update', label: 'Update', name: 'system_users.update', exists: true },
          { key: 'delete', label: 'Delete', name: 'system_users.delete', exists: true },
        ],
      },
      {
        key: 'audit_logs',
        label: 'Audit Logs',
        actions: [
          { key: 'read', label: 'Read', name: 'audit_logs.read', exists: true },
        ],
      },
    ],
  },
];

export const mockRoles: RoleOptionView[] = [
  { id: 1, name: 'Staff' },
  { id: 2, name: 'Supervisor' },
  { id: 3, name: 'Super Admin' },
];

export const mockPermissionMatrixData: PermissionMatrixProps = {
  modules: mockPermissionModules,
  roles: mockRoles,
  selectedRoleId: 1,
  selectedPermissions: ['bookings.read', 'bookings.create', 'booking_schedules.read'],
  isLoading: false,
  isSaving: false,
  isDirty: false,
  canSave: true,
  onSelectRole: (id) => console.log('[mock] onSelectRole', id),
  onTogglePermission: (name, enabled) => console.log('[mock] onTogglePermission', name, enabled),
  onSave: () => console.log('[mock] onSave'),
};
