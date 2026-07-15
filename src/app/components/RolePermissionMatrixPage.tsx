/**
 * Figma / standalone demo page for RolePermissionMatrix.
 * Production wiring lives in hkial-react/src/components/RolePermissionMatrix.tsx.
 */

import { useState } from 'react';
import { RolePermissionMatrix } from './RolePermissionMatrix';
import type { RolePermissionModule, RoleOption } from './RolePermissionMatrix';

const DEMO_ROLES: RoleOption[] = [
  { id: 1, name: 'Supervisor' },
  { id: 2, name: 'Staff' },
  { id: 3, name: 'Administrator' },
  { id: 4, name: 'Super Admin' },
];

const DEMO_MODULES: RolePermissionModule[] = [
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
        label: 'Schedules',
        actions: [
          { key: 'read', label: 'Read', name: 'booking_schedules.read', exists: true },
          { key: 'scan_entry', label: 'Scan Entry', name: 'booking_schedules.scan_entry', exists: true },
        ],
      },
    ],
  },
  {
    key: 'customer_management',
    label: 'Customer Management',
    features: [
      {
        key: 'accounts',
        label: 'Customer Accounts',
        actions: [
          { key: 'read', label: 'Read', name: 'accounts.read', exists: true },
          { key: 'create', label: 'Create', name: 'accounts.create', exists: true },
          { key: 'update', label: 'Update', name: 'accounts.update', exists: true },
          { key: 'delete', label: 'Delete', name: 'accounts.delete', exists: true },
        ],
      },
      {
        key: 'guest_profiles',
        label: 'Guest Profiles',
        actions: [
          { key: 'read', label: 'Read', name: 'guest_profiles.read', exists: true },
          { key: 'update', label: 'Update', name: 'guest_profiles.update', exists: true },
          { key: 'merge', label: 'Merge', name: 'guest_profiles.merge', exists: true },
        ],
      },
    ],
  },
];

const DEMO_ROLE_PERMS: Record<number, string[]> = {
  1: ['bookings.read', 'bookings.create', 'bookings.update', 'bookings.approve', 'accounts.read'],
  2: ['bookings.read', 'bookings.create', 'booking_schedules.read'],
  3: ['bookings.read', 'accounts.read'],
  4: [],
};

export function RolePermissionMatrixPage() {
  const [selectedRoleId, setSelectedRoleId] = useState<number>(1);
  const [rolePermissions, setRolePermissions] = useState<string[]>(DEMO_ROLE_PERMS[1]);
  const [isSaving, setIsSaving] = useState(false);

  return (
    <RolePermissionMatrix
      roles={DEMO_ROLES}
      selectedRoleId={selectedRoleId}
      groupedPermissions={DEMO_MODULES}
      rolePermissions={rolePermissions}
      isSaving={isSaving}
      canEdit={selectedRoleId !== 4}
      notice={
        selectedRoleId === 4
          ? 'Super Admin is granted all abilities via Gate::before. Select another role to edit its template.'
          : null
      }
      onRoleChange={(id) => {
        setSelectedRoleId(id);
        setRolePermissions([...(DEMO_ROLE_PERMS[id] ?? [])]);
      }}
      onTogglePermission={(name) => {
        setRolePermissions((prev) =>
          prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name],
        );
      }}
      onRolePermissionsChange={setRolePermissions}
      onSave={() => {
        setIsSaving(true);
        window.setTimeout(() => {
          DEMO_ROLE_PERMS[selectedRoleId] = [...rolePermissions];
          setIsSaving(false);
          console.log('[demo] Save Role Template', selectedRoleId, rolePermissions);
        }, 400);
      }}
    />
  );
}
