/**
 * SystemUserEdit.tsx — Pure presentational create/edit page for system users.
 *
 * Rules:
 *  - Zero business mutations (reported via onSave / onBack)
 *  - Form + tab UI state only
 *  - Default props fall back to sensible empty values for figma Make
 */

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import type {
  PermissionOption,
  SystemUserFormData,
  SystemUserRole,
  SystemUserStatus,
} from './SystemUsers';

export type { SystemUserFormData };

/** One module section for the Direct Permissions 2-column grid. */
export interface DirectPermissionGroup {
  key: string;
  label: string;
  permissions: Array<{ name: string; label: string }>;
}

export interface SpatieRoleOption {
  id: number;
  name: string;
}

export interface SystemUserEditProps {
  userId?: number | null;
  isLoading?: boolean;
  isSaving?: boolean;
  initialData?: SystemUserFormData | null;
  /** @deprecated Prefer permissionGroups from the Spatie matrix */
  availablePermissions?: PermissionOption[];
  /** Grouped permissions from GET /permissions-matrix */
  permissionGroups?: DirectPermissionGroup[];
  /** Initial direct (user-level) permission names from GET /users/{id}/direct-permissions */
  initialDirectPermissions?: string[];
  /** Spatie roles used to resolve the selected role id for GET /roles/{id}/permissions */
  spatieRoles?: SpatieRoleOption[];
  /** Fetch permission names assigned to a role (by id or name). */
  loadRolePermissions?: (roleIdOrName: number | string) => Promise<string[]>;
  rolePermissions?: Partial<Record<SystemUserRole, string[]>>;
  roleLabels?: Record<SystemUserRole, string>;
  editableRoles?: SystemUserRole[];
  /** Tab to open initially: profile | permissions */
  initialTab?: 'profile' | 'permissions';
  onBack?: () => void;
  onSave?: (data: SystemUserFormData) => void;
}

const ALL_PERMISSIONS: PermissionOption[] = [
  { value: 'bookings.view', label: 'View Bookings' },
  { value: 'bookings.create', label: 'Create Bookings' },
  { value: 'bookings.update', label: 'Update Bookings' },
  { value: 'bookings.delete', label: 'Delete Bookings' },
  { value: 'bookings.approve', label: 'Approve Bookings' },
  { value: 'bookings.schedules.view', label: 'View Booking Schedules' },
  { value: 'bookings.settings.view', label: 'View Booking Settings' },
  { value: 'bookings.settings.update', label: 'Update Booking Settings' },
  { value: 'system_users.view', label: 'View System Users' },
  { value: 'system_users.create', label: 'Create System Users' },
  { value: 'system_users.update', label: 'Update System Users' },
  { value: 'system_users.delete', label: 'Delete System Users' },
  { value: 'audit_logs.view', label: 'View Audit Logs' },
];

const DEFAULT_ROLE_LABELS: Record<SystemUserRole, string> = {
  Administrator: 'System Admin',
  Supervisor: 'Supervisor',
  Staff: 'Staff',
  Viewer: 'Viewer',
};

const DEFAULT_FORM: SystemUserFormData = {
  name: '',
  email: '',
  role: 'Staff',
  department: 'IT Department',
  permissions: [],
  status: 'Active',
  password: '',
};

function fallbackGroupsFromOptions(options: PermissionOption[]): DirectPermissionGroup[] {
  return [
    {
      key: 'all',
      label: 'System Permissions',
      permissions: options.map((o) => ({ name: o.value, label: o.label })),
    },
  ];
}

function GroupSelectAllCheckbox({
  id,
  checked,
  indeterminate,
  disabled,
  onChange,
}: {
  id: string;
  checked: boolean;
  indeterminate: boolean;
  disabled?: boolean;
  onChange: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      id={id}
      type="checkbox"
      className="rounded border-gray-300 accent-black shrink-0 disabled:cursor-not-allowed disabled:opacity-40"
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      aria-label="Select all permissions in this group"
    />
  );
}

export function SystemUserEdit({
  userId = null,
  isLoading = false,
  isSaving = false,
  initialData = null,
  availablePermissions = ALL_PERMISSIONS,
  permissionGroups,
  initialDirectPermissions,
  spatieRoles = [],
  loadRolePermissions,
  roleLabels = DEFAULT_ROLE_LABELS,
  editableRoles = ['Staff', 'Supervisor'],
  initialTab = 'profile',
  onBack = () => {},
  onSave = () => {},
}: SystemUserEditProps) {
  const isEditMode = !!userId;

  const [activeTab, setActiveTab] = useState(initialTab);
  const [formName, setFormName] = useState(DEFAULT_FORM.name);
  const [formEmail, setFormEmail] = useState(DEFAULT_FORM.email);
  const [formRole, setFormRole] = useState<SystemUserRole>(DEFAULT_FORM.role);
  const [formDepartment, setFormDepartment] = useState(DEFAULT_FORM.department);
  const [directPermissions, setDirectPermissions] = useState<string[]>([]);
  const [roleInheritedPermissions, setRoleInheritedPermissions] = useState<string[]>([]);
  const [formStatus, setFormStatus] = useState<SystemUserStatus>(DEFAULT_FORM.status);
  const [formPassword, setFormPassword] = useState('');
  const previousRoleRef = useRef<SystemUserRole | null>(null);
  const skipNextDirectHydrateRef = useRef(false);

  const groups =
    permissionGroups && permissionGroups.length > 0
      ? permissionGroups
      : fallbackGroupsFromOptions(availablePermissions);

  const selectedRoleId = useMemo(() => {
    const match = spatieRoles.find((role) => role.name === formRole);
    return match?.id ?? null;
  }, [spatieRoles, formRole]);

  const inheritedSet = useMemo(
    () => new Set(roleInheritedPermissions),
    [roleInheritedPermissions],
  );

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!initialData) {
      if (!isEditMode) {
        setFormName(DEFAULT_FORM.name);
        setFormEmail(DEFAULT_FORM.email);
        setFormRole(DEFAULT_FORM.role);
        setFormDepartment(DEFAULT_FORM.department);
        setDirectPermissions([]);
        setFormStatus(DEFAULT_FORM.status);
        setFormPassword('');
      }
      return;
    }
    setFormName(initialData.name);
    setFormEmail(initialData.email);
    setFormRole(initialData.role);
    setFormDepartment(initialData.department);
    setFormStatus(initialData.status);
    setFormPassword('');
  }, [initialData, isEditMode]);

  // Hydrate direct permissions from dedicated API (preferred) or form payload.
  useEffect(() => {
    if (skipNextDirectHydrateRef.current) {
      skipNextDirectHydrateRef.current = false;
      return;
    }
    if (initialDirectPermissions !== undefined) {
      setDirectPermissions([...initialDirectPermissions]);
      return;
    }
    if (initialData?.permissions) {
      setDirectPermissions([...initialData.permissions]);
    }
  }, [initialDirectPermissions, initialData]);

  // Load role defaults whenever the selected Spatie role changes.
  useEffect(() => {
    if (selectedRoleId === null || !loadRolePermissions) {
      setRoleInheritedPermissions([]);
      return;
    }

    let cancelled = false;

    loadRolePermissions(selectedRoleId)
      .then((permissions) => {
        if (!cancelled) {
          setRoleInheritedPermissions(permissions);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRoleInheritedPermissions([]);
        }
      });

    // On a user-driven role change, wipe direct extras so the UI mirrors the new role.
    if (previousRoleRef.current !== null && previousRoleRef.current !== formRole) {
      skipNextDirectHydrateRef.current = true;
      setDirectPermissions([]);
    }
    previousRoleRef.current = formRole;

    return () => {
      cancelled = true;
    };
  }, [selectedRoleId, formRole, loadRolePermissions]);

  const formRoleOptions: SystemUserRole[] =
    isEditMode && initialData && !editableRoles.includes(initialData.role)
      ? [...editableRoles, initialData.role]
      : editableRoles;

  const toggleDirectPermission = (perm: string) => {
    if (inheritedSet.has(perm)) return;
    setDirectPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    );
  };

  const handleToggleGroup = (groupPermissions: string[], isCurrentlyAllSelected: boolean) => {
    // Only toggle permissions that are not locked as role defaults.
    const toggleable = groupPermissions.filter((name) => !inheritedSet.has(name));
    if (toggleable.length === 0) return;

    setDirectPermissions((prev) => {
      if (isCurrentlyAllSelected) {
        const remove = new Set(toggleable);
        return prev.filter((name) => !remove.has(name));
      }
      return Array.from(new Set([...prev, ...toggleable]));
    });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim() || (!isEditMode && formPassword.length < 8)) {
      setActiveTab('profile');
      return;
    }
    onSave({
      name: formName,
      email: formEmail,
      role: formRole,
      department: formDepartment,
      // Persist only extras — role defaults stay on the role template.
      permissions: directPermissions.filter((name) => !inheritedSet.has(name)),
      status: formStatus,
      password: formPassword || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[320px] text-gray-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading user…
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 w-full">
      <div className="flex items-center gap-4">
        <Button type="button" variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {isEditMode ? 'Edit System User' : 'Create New System User'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isEditMode
              ? 'Edit the details of an existing system user.'
              : 'Create a new system user with the following details.'}
          </p>
        </div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'profile' | 'permissions')} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile &amp; Security</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="su-full-name" className="mb-[10px] block text-sm text-gray-700">Full Name</label>
                  <input
                    id="su-full-name"
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    placeholder="e.g., Wong Chi Ming"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="su-email" className="mb-[10px] block text-sm text-gray-700">Email Address</label>
                  <input
                    id="su-email"
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    placeholder="email@hkial.com"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-[10px] block text-sm text-gray-700">Role</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as SystemUserRole)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  >
                    {formRoleOptions.map((role) => (
                      <option key={role} value={role}>{roleLabels[role]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-[10px] block text-sm text-gray-700">Department</label>
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
                    <option value="Security">Security</option>
                    <option value="Housekeeping">Housekeeping</option>
                    <option value="F&B Services">F&amp;B Services</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-[10px] block text-sm text-gray-700">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as SystemUserStatus)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="su-password" className="mb-[10px] block text-sm text-gray-700">
                    Password {isEditMode && '(leave blank to keep current)'}
                  </label>
                  <input
                    id="su-password"
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    placeholder={isEditMode ? '••••••••' : 'Minimum 8 characters'}
                    required={!isEditMode}
                    minLength={isEditMode ? undefined : 8}
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="permissions">
            <Card className="p-6 space-y-6">
              <div>
                <label htmlFor="su-role-permissions" className="mb-[10px] block text-sm text-gray-700">
                  Role
                </label>
                <select
                  id="su-role-permissions"
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as SystemUserRole)}
                  className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md"
                >
                  {formRoleOptions.map((role) => (
                    <option key={role} value={role}>{roleLabels[role]}</option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-2">
                  Role defaults appear locked below. Only additional direct permissions are editable
                  for this user.
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Additional Direct Permissions
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Role defaults are checked and locked. Toggle extras on top of the role — changing
                  the role clears any previous direct extras.
                </p>
              </div>

              <div className="max-h-[32rem] overflow-y-auto pr-1">
                {groups.map((group) => {
                  const groupPermissionNames = group.permissions.map((p) => p.name);
                  const toggleablePermissions = groupPermissionNames.filter(
                    (name) => !inheritedSet.has(name),
                  );
                  const isAllSelected =
                    groupPermissionNames.length > 0 &&
                    groupPermissionNames.every(
                      (p) => inheritedSet.has(p) || directPermissions.includes(p),
                    );
                  const isSomeSelected =
                    groupPermissionNames.some(
                      (p) => inheritedSet.has(p) || directPermissions.includes(p),
                    ) && !isAllSelected;
                  const isToggleableAllSelected =
                    toggleablePermissions.length > 0 &&
                    toggleablePermissions.every((p) => directPermissions.includes(p));
                  const selectAllId = `su-group-select-all-${group.key}`;

                  return (
                    <section key={group.key} className="mb-2">
                      <div className="flex items-center gap-3 mb-4 border-b border-gray-200 pb-2">
                        <GroupSelectAllCheckbox
                          id={selectAllId}
                          checked={isAllSelected}
                          indeterminate={isSomeSelected}
                          disabled={toggleablePermissions.length === 0}
                          onChange={() =>
                            handleToggleGroup(groupPermissionNames, isToggleableAllSelected)
                          }
                        />
                        <label
                          htmlFor={selectAllId}
                          className="text-sm font-semibold text-gray-800 cursor-pointer select-none"
                        >
                          {group.label}
                        </label>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 mb-6">
                        {group.permissions.map((permission) => {
                          const isInherited = inheritedSet.has(permission.name);
                          const isDirectlyAssigned = directPermissions.includes(permission.name);
                          return (
                            <label
                              key={permission.name}
                              className={`flex items-center gap-3 rounded-md border border-transparent px-1 py-1 ${
                                isInherited
                                  ? 'cursor-not-allowed opacity-90'
                                  : 'cursor-pointer hover:bg-gray-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                className="rounded border-gray-300 accent-black shrink-0 disabled:cursor-not-allowed disabled:opacity-60"
                                checked={isInherited || isDirectlyAssigned}
                                disabled={isInherited}
                                onChange={() => toggleDirectPermission(permission.name)}
                              />
                              <span className={`text-sm ${isInherited ? 'text-gray-500' : 'text-gray-900'}`}>
                                <span className="block">
                                  {permission.label}
                                  {isInherited && (
                                    <span className="ml-1.5 text-xs font-normal text-gray-400">
                                      (Role Default)
                                    </span>
                                  )}
                                </span>
                                <span className="block text-xs text-gray-400 font-mono">
                                  {permission.name}
                                </span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
                {groups.length === 0 && (
                  <div className="py-8 text-sm text-gray-500 text-center">
                    No permissions available.
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={onBack} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEditMode ? 'Update User' : 'Create User'}
          </Button>
        </div>
      </form>
    </div>
  );
}
