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
import { expandPermissionAliases } from '@/lib/permissions';
import { getMasterPermissionGroups } from '@/lib/permissionModules';
import type {
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
  /** Grouped permissions — defaults to the full PermissionMatrix master catalog. */
  permissionGroups?: DirectPermissionGroup[];
  /** Initial direct (user-level) permission names from GET /users/{id}/direct-permissions */
  initialDirectPermissions?: string[];
  /** Spatie roles used to resolve the selected role id for GET /roles/{id}/permissions */
  spatieRoles?: SpatieRoleOption[];
  /** Fetch permission names assigned to a role (by id or name). */
  loadRolePermissions?: (roleIdOrName: number | string) => Promise<string[]>;
  rolePermissions?: Partial<Record<SystemUserRole, string[]>>;
  roleLabels?: Partial<Record<SystemUserRole, string>> & Record<string, string>;
  editableRoles?: string[];
  /** Disable Role selects (self-edit). */
  roleSelectDisabled?: boolean;
  /** Entire permissions tab read-only (self-edit). */
  permissionsReadOnly?: boolean;
  /**
   * When editing self (read-only): permission names the target effectively holds.
   * Used for both visibility filtering and checkbox checked state.
   */
  effectivePermissionNames?: string[] | null;
  /**
   * Permission names the current actor may grant (editing others).
   * When set, checkboxes outside this set are hidden.
   * Omit / undefined / null with Super Admin = show full matrix.
   */
  grantablePermissionNames?: string[] | null;
  /** Tab to open initially: profile | permissions */
  initialTab?: 'profile' | 'permissions';
  onBack?: () => void;
  onSave?: (data: SystemUserFormData) => void;
}

const DEFAULT_ROLE_LABELS: Record<SystemUserRole, string> = {
  Administrator: 'Administrator',
  Supervisor: 'Supervisor',
  'Operation Officer': 'Operation Officer',
  'Business Development': 'Business Development',
  'Super Admin': 'Super Admin',
};

const DEFAULT_FORM: SystemUserFormData = {
  name: '',
  email: '',
  role: 'Administrator',
  department: 'IT Department',
  permissions: [],
  status: 'Active',
  password: '',
};

function setContainsPermission(set: Set<string>, name: string): boolean {
  return expandPermissionAliases(name).some((alias) => set.has(alias));
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
  permissionGroups,
  initialDirectPermissions,
  spatieRoles = [],
  loadRolePermissions,
  roleLabels = DEFAULT_ROLE_LABELS,
  editableRoles = [],
  roleSelectDisabled = false,
  permissionsReadOnly = false,
  effectivePermissionNames = null,
  grantablePermissionNames = null,
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
  const [rolePermissionsReady, setRolePermissionsReady] = useState(false);
  const [formStatus, setFormStatus] = useState<SystemUserStatus>(DEFAULT_FORM.status);
  const [formPassword, setFormPassword] = useState('');

  const effectiveSet = useMemo(() => {
    if (effectivePermissionNames == null) return null;
    return new Set(effectivePermissionNames);
  }, [effectivePermissionNames]);

  const grantableSet = useMemo(() => {
    if (grantablePermissionNames == null) return null;
    return new Set(grantablePermissionNames);
  }, [grantablePermissionNames]);

  const selectedRoleId = useMemo(() => {
    const match = spatieRoles.find((role) => role.name === formRole);
    return match?.id ?? null;
  }, [spatieRoles, formRole]);

  const inheritedSet = useMemo(
    () => new Set(roleInheritedPermissions),
    [roleInheritedPermissions],
  );

  /** Role defaults ∪ direct extras — checked state when editing others. */
  const heldSet = useMemo(
    () => new Set([...roleInheritedPermissions, ...directPermissions]),
    [roleInheritedPermissions, directPermissions],
  );

  const permissionIsOwned = (name: string): boolean => {
    if (permissionsReadOnly && effectiveSet) {
      return setContainsPermission(effectiveSet, name);
    }
    return heldSet.has(name) || setContainsPermission(heldSet, name);
  };

  /**
   * Always start from the master PermissionMatrix catalog (never the old 12-item list).
   * Self-view: only permissions present in effective_permissions.
   * Editing others: show the full catalog and let each checkbox decide whether
   * it is grantable. This prevents available permissions from disappearing or
   * looking permanently locked just because they are currently unchecked.
   */
  const groups = useMemo(() => {
    const base =
      permissionGroups && permissionGroups.length > 0
        ? permissionGroups
        : getMasterPermissionGroups();

    return base
      .map((group) => ({
        ...group,
        permissions: group.permissions.filter((p) => {
          if (permissionsReadOnly) {
            if (!effectiveSet) return false;
            return setContainsPermission(effectiveSet, p.name);
          }
          return true;
        }),
      }))
      .filter((group) => group.permissions.length > 0);
  }, [
    permissionGroups,
    effectiveSet,
    permissionsReadOnly,
  ]);

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
    if (initialDirectPermissions && initialDirectPermissions.length > 0) {
      setDirectPermissions([...initialDirectPermissions]);
    } else if (initialData?.permissions) {
      setDirectPermissions([...initialData.permissions]);
    }
  }, [initialDirectPermissions, initialData]);

  // Load role defaults whenever the selected Spatie role changes.
  useEffect(() => {
    if (selectedRoleId === null || !loadRolePermissions) {
      setRoleInheritedPermissions([]);
      setRolePermissionsReady(true);
      return;
    }

    let cancelled = false;
    setRolePermissionsReady(false);

    loadRolePermissions(selectedRoleId)
      .then((permissions) => {
        if (!cancelled) {
          setRoleInheritedPermissions(permissions);
          setRolePermissionsReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRoleInheritedPermissions([]);
          setRolePermissionsReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedRoleId, formRole, loadRolePermissions]);

  useEffect(() => {
    if (isEditMode || editableRoles.length === 0) return;
    if (!editableRoles.includes(formRole)) {
      setFormRole(editableRoles[0] as SystemUserRole);
    }
  }, [isEditMode, editableRoles, formRole]);

  const formRoleOptions: string[] =
    isEditMode && initialData && !editableRoles.includes(initialData.role)
      ? [...editableRoles, initialData.role]
      : editableRoles;

  const handleRoleChange = (newRole: SystemUserRole) => {
    setFormRole(newRole);
    // Only wipe direct permissions when a human actively changes the role.
    if (newRole !== initialData?.role) {
      setDirectPermissions([]);
    }
  };

  const toggleDirectPermission = (perm: string, checked: boolean) => {
    if (permissionsReadOnly) return;
    if (inheritedSet.has(perm)) return;
    setDirectPermissions((prev) => {
      if (checked) {
        return prev.includes(perm) ? prev : [...prev, perm];
      }
      return prev.filter((p) => p !== perm);
    });
  };

  const handleToggleGroup = (groupPermissions: string[], isCurrentlyAllSelected: boolean) => {
    if (permissionsReadOnly) return;
    // Only toggle permissions that are not locked as role defaults.
    const toggleable = groupPermissions.filter(
      (name) => !inheritedSet.has(name) && (!grantableSet || setContainsPermission(grantableSet, name)),
    );
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

      <form className="flex min-h-0 flex-col space-y-4" onSubmit={handleSubmit}>
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'profile' | 'permissions')}
          className="flex min-h-0 flex-col space-y-4"
        >          <TabsList className="grid w-full grid-cols-2">
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
                    onChange={(e) => handleRoleChange(e.target.value as SystemUserRole)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-600"
                    disabled={roleSelectDisabled}
                  >
                    {formRoleOptions.map((role) => (
                      <option key={role} value={role}>{roleLabels[role] ?? role}</option>
                    ))}
                  </select>
                  {roleSelectDisabled ? (
                    <p className="mt-1 text-xs text-amber-700">You cannot change your own role.</p>
                  ) : null}
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

          <TabsContent
            value="permissions"
            className="flex min-h-0 flex-col data-[state=inactive]:hidden"
          >
            <Card className="flex max-h-[min(40rem,calc(100vh-14rem))] min-h-0 flex-col overflow-hidden p-6">
              <div className="shrink-0 space-y-6">
                <div>
                  <label htmlFor="su-role-permissions" className="mb-[10px] block text-sm text-gray-700">
                    Role
                  </label>
                  <select
                    id="su-role-permissions"
                    value={formRole}
                    onChange={(e) => handleRoleChange(e.target.value as SystemUserRole)}
                    className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-600"
                    disabled={roleSelectDisabled || permissionsReadOnly}
                  >
                    {formRoleOptions.map((role) => (
                      <option key={role} value={role}>{roleLabels[role] ?? role}</option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-500 mt-2">
                    {permissionsReadOnly
                      ? 'Permissions are read-only while editing your own account.'
                      : 'Role defaults appear locked below. Only additional direct permissions are editable for this user.'}
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
              </div>

              <div className="mt-6 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
                {!rolePermissionsReady ? (
                  <div className="py-8 text-sm text-gray-500 text-center">
                    Loading role default permissions…
                  </div>
                ) : null}
                {rolePermissionsReady ? groups.map((group) => {
                  const groupPermissionNames = group.permissions.map((p) => p.name);
                  if (groupPermissionNames.length === 0) {
                    return null;
                  }

                  const isPermissionHeld = (name: string) => permissionIsOwned(name);

                  const toggleablePermissions = groupPermissionNames.filter(
                    (name) => !inheritedSet.has(name) && (!grantableSet || setContainsPermission(grantableSet, name)),
                  );
                  const isAllSelected =
                    groupPermissionNames.length > 0 &&
                    groupPermissionNames.every(isPermissionHeld);
                  const isSomeSelected =
                    groupPermissionNames.some(isPermissionHeld) && !isAllSelected;
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
                          disabled={permissionsReadOnly || toggleablePermissions.length === 0}
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
                          const isHeld = isPermissionHeld(permission.name);
                          const canGrant = !grantableSet || setContainsPermission(grantableSet, permission.name);
                          const isLocked = permissionsReadOnly || isInherited;
                          return (
                            <label
                              key={permission.name}
                              className={`flex items-center gap-3 rounded-md border border-transparent px-1 py-1 ${
                                isLocked
                                  ? 'cursor-not-allowed opacity-90'
                                  : 'cursor-pointer hover:bg-gray-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                className="rounded border-gray-300 accent-black shrink-0 disabled:cursor-not-allowed disabled:opacity-60"
                                checked={isInherited || directPermissions.includes(permission.name)}
                                disabled={isLocked}
                                onChange={(e) =>
                                  toggleDirectPermission(permission.name, e.target.checked)
                                }
                              />
                              <span className={`text-sm ${isLocked ? 'text-gray-500' : 'text-gray-900'}`}>
                                <span className="block">
                                  {permission.label}
                                  {isInherited ? (
                                    <span className="ml-1.5 text-xs font-normal text-gray-400">
                                      (Role Default)
                                    </span>
                                  ) : !canGrant && !permissionsReadOnly ? (
                                    <span className="ml-1.5 text-xs font-normal text-gray-400">
                                      (Not Grantable)
                                    </span>
                                  ) : null}
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
                }) : null}
                {rolePermissionsReady && groups.length === 0 && (
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
