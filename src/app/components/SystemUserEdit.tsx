/**
 * SystemUserEdit.tsx — Pure presentational create/edit page for system users.
 *
 * Rules:
 *  - Zero business mutations (reported via onSave / onBack)
 *  - Form + tab UI state only
 *  - Default props fall back to sensible empty values for figma Make
 */

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { expandPermissionAliases } from '@/lib/permissions';
import { getMasterPermissionGroups } from '@/lib/permissionModules';
import {
  PermissionMatrixGrid,
  type PermissionMatrixModule,
} from '@/components/permissions/PermissionMatrixGrid';
import type {
  SystemUserFormData,
  SystemUserRole,
  SystemUserStatus,
} from './SystemUsers';

export type { SystemUserFormData };

/** Flat module section — converted to matrix modules when `permissionModules` is omitted. */
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
  /**
   * Canonical Module → Feature → Actions matrix (same as Role Permissions).
   * Preferred over `permissionGroups`.
   */
  permissionModules?: PermissionMatrixModule[];
  /** Legacy flat groups — used only when `permissionModules` is omitted. */
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
   * When set, codes outside this set are disabled as not grantable.
   * Omit / undefined / null with Super Admin = show full matrix.
   */
  grantablePermissionNames?: string[] | null;
  /** Tab to open initially: profile | permissions */
  initialTab?: 'profile' | 'permissions';
  onBack?: () => void;
  onSave?: (data: SystemUserFormData) => void;
  /**
   * Presentational Microsoft AD-link section on the Profile tab.
   * Null hides the section (create, self-edit, flag off, cannot update target).
   * Parent owns every mutation.
   */
  microsoftLink?: MicrosoftLinkProps | null;
  staffAccountPolicy?: { allowed_email_domains: string[]; ad_email_domains: string[] };
  adAccountLocked?: boolean;
  accountTypeReadOnly?: boolean;
}

/** Convert legacy flat groups into matrix modules (all actions as specials). */
function groupsToModules(groups: DirectPermissionGroup[]): PermissionMatrixModule[] {
  return groups.map((group) => ({
    key: group.key,
    label: group.label,
    features: [
      {
        key: group.key,
        label: group.label,
        actions: group.permissions.map((permission) => ({
          key: permission.name.includes('.')
            ? permission.name.split('.').slice(1).join('.')
            : permission.name,
          label: permission.label,
          name: permission.name,
          exists: true,
        })),
      },
    ],
  }));
}

export interface MicrosoftLinkProps {
  enabled: boolean;
  linked: boolean;
  upn: string | null;
  oidTruncated: string | null;
  pending?: { upn: string; oidTruncated: string } | null;
  saving?: boolean;
  onSaveUpn: (upn: string) => void;
  onUnlink: () => void;
  onLinkWithMicrosoft: () => void;
  onConfirmLink?: () => void;
  onCancelPending?: () => void;
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

function filterModulesByEffective(
  modules: PermissionMatrixModule[],
  effectiveSet: Set<string>,
): PermissionMatrixModule[] {
  return modules
    .map((module) => ({
      ...module,
      features: module.features
        .map((feature) => ({
          ...feature,
          actions: feature.actions.filter((action) =>
            setContainsPermission(effectiveSet, action.name),
          ),
        }))
        .filter((feature) => feature.actions.length > 0),
    }))
    .filter((module) => module.features.length > 0);
}

function MicrosoftLinkCard({ microsoftLink }: { microsoftLink: MicrosoftLinkProps }) {
  const [upnDraft, setUpnDraft] = useState(microsoftLink.upn ?? '');

  useEffect(() => {
    setUpnDraft(microsoftLink.upn ?? '');
  }, [microsoftLink.upn]);

  const pending = microsoftLink.pending ?? null;
  const saving = microsoftLink.saving === true;

  return (
    <Card className="p-6 space-y-4">
      <h3 className="text-base font-semibold text-gray-900">Microsoft account</h3>
      {pending ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p>
            Microsoft account {pending.upn} (oid {pending.oidTruncated}) will be linked to this staff
            user.
          </p>
          <div className="mt-3 flex gap-2">
            <Button type="button" onClick={microsoftLink.onConfirmLink} disabled={saving}>
              Confirm
            </Button>
            <Button type="button" variant="outline" onClick={microsoftLink.onCancelPending} disabled={saving}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
      <p className="text-sm text-gray-700">
        Status: {microsoftLink.linked ? 'Linked' : 'Not linked'}
      </p>
      {microsoftLink.linked && microsoftLink.oidTruncated ? (
        <div>
          <label htmlFor="su-azure-oid" className="mb-[10px] block text-sm text-gray-700">
            Object ID
          </label>
          <input
            id="su-azure-oid"
            type="text"
            value={microsoftLink.oidTruncated}
            readOnly
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
          />
        </div>
      ) : null}
      <div>
        <label htmlFor="su-azure-upn" className="mb-[10px] block text-sm text-gray-700">
          Azure UPN
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            id="su-azure-upn"
            type="text"
            value={upnDraft}
            onChange={(e) => setUpnDraft(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
            placeholder="user@tenant.onmicrosoft.com"
            disabled={saving}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => microsoftLink.onSaveUpn(upnDraft)}
            disabled={saving}
            className="shrink-0"
          >
            Save UPN
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        {microsoftLink.linked ? (
          <Button type="button" variant="outline" onClick={microsoftLink.onUnlink} disabled={saving}>
            Unlink
          </Button>
        ) : null}
        <Button type="button" onClick={microsoftLink.onLinkWithMicrosoft} disabled={saving}>
          Link with Microsoft
        </Button>
      </div>
    </Card>
  );
}

export function SystemUserEdit({
  userId = null,
  isLoading = false,
  isSaving = false,
  initialData = null,
  permissionModules,
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
  microsoftLink = null,
  staffAccountPolicy,
  adAccountLocked = false,
  accountTypeReadOnly = false,
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
  const [formAdAccount, setFormAdAccount] = useState(false);
  const [emailError, setEmailError] = useState('');
  const emailDomain = formEmail.trim().split('@')[1]?.toLowerCase();
  const domainRequiresAd = staffAccountPolicy?.ad_email_domains.some((domain) => domain.toLowerCase() === emailDomain) === true;
  const effectiveAdAccount = formAdAccount || domainRequiresAd || adAccountLocked;
  const passwordRequired = !isEditMode || (initialData?.is_ad_account === true && !effectiveAdAccount);

  useEffect(() => {
    if (effectiveAdAccount) setFormPassword('');
  }, [effectiveAdAccount]);

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

  /**
   * Prefer the Role Permissions matrix modules (API). Fall back to flat groups /
   * master catalog only when modules are omitted (tests / local figma).
   * Self-view: only permissions present in effective_permissions.
   */
  const matrixModules = useMemo(() => {
    const base: PermissionMatrixModule[] =
      permissionModules && permissionModules.length > 0
        ? permissionModules
        : groupsToModules(
            permissionGroups && permissionGroups.length > 0
              ? permissionGroups
              : getMasterPermissionGroups(),
          );

    if (permissionsReadOnly) {
      if (!effectiveSet) return [];
      return filterModulesByEffective(base, effectiveSet);
    }
    return base;
  }, [permissionModules, permissionGroups, effectiveSet, permissionsReadOnly]);

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
        setFormAdAccount(false);
        setEmailError('');
      }
      return;
    }
    setFormName(initialData.name);
    setFormEmail(initialData.email);
    setFormRole(initialData.role);
    setFormDepartment(initialData.department);
    setFormStatus(initialData.status);
    setFormPassword('');
    setFormAdAccount(initialData.is_ad_account === true);
    setEmailError('');
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

  const toggleDirectPermission = (perm: string) => {
    if (permissionsReadOnly) return;
    if (inheritedSet.has(perm)) return;
    if (grantableSet && !setContainsPermission(grantableSet, perm)) return;
    setDirectPermissions((prev) => {
      if (prev.includes(perm)) {
        return prev.filter((p) => p !== perm);
      }
      return [...prev, perm];
    });
  };

  const handleDirectPermissionsChange = (permissions: string[]) => {
    if (permissionsReadOnly) return;
    const next = permissions.filter(
      (name) =>
        !inheritedSet.has(name) &&
        (!grantableSet || setContainsPermission(grantableSet, name)),
    );
    setDirectPermissions(next);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEmailError('');
    const unchangedEmail = isEditMode && formEmail.trim().toLowerCase() === initialData?.email.trim().toLowerCase();
    if (!accountTypeReadOnly && !unchangedEmail && staffAccountPolicy && !staffAccountPolicy.allowed_email_domains.some((domain) => domain.toLowerCase() === emailDomain)) {
      setEmailError('Use an email address from an allowed domain.');
      setActiveTab('profile');
      return;
    }
    if (!formName.trim() || !formEmail.trim() || (passwordRequired && !effectiveAdAccount && formPassword.length < 8)) {
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
      is_ad_account: effectiveAdAccount,
      ...(!effectiveAdAccount && formPassword ? { password: formPassword } : {}),
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
                    onChange={(e) => { setFormEmail(e.target.value); setEmailError(''); }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    aria-describedby="su-email-policy su-email-error"
                    aria-invalid={!!emailError}
                    placeholder="Email address"
                    required
                  />
                  <p id="su-email-policy" className="mt-2 text-sm text-gray-700 break-words">
                    {staffAccountPolicy
                      ? `Allowed email domains: ${staffAccountPolicy.allowed_email_domains.join(', ') || 'None configured'}`
                      : 'Email domain policy is unavailable. Reload this page before creating an account or changing an email.'}
                  </p>
                  {emailError ? <p id="su-email-error" role="alert" className="mt-1 text-sm text-red-700">{emailError}</p> : null}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="su-ad-account" className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    id="su-ad-account"
                    type="checkbox"
                    checked={effectiveAdAccount}
                    disabled={domainRequiresAd || adAccountLocked || accountTypeReadOnly}
                    onChange={(e) => setFormAdAccount(e.target.checked)}
                    aria-describedby="su-ad-account-hint"
                    className="rounded border-gray-300 accent-black disabled:cursor-not-allowed"
                  />
                  AD login account
                </label>
                <p id="su-ad-account-hint" className="text-sm text-gray-700">
                  {effectiveAdAccount
                    ? 'This account uses AD login only. Local passwords and password reminders do not apply.'
                    : 'Select for staff who must sign in through AD.'}
                  {domainRequiresAd ? ' AD login is required for this email domain.' : adAccountLocked ? ' AD login is required while a Microsoft identity is linked.' : ''}
                </p>
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
                    <option value="Business Development">Business Development</option>
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
                {!effectiveAdAccount ? <div>
                  <label htmlFor="su-password" className="mb-[10px] block text-sm text-gray-700">
                    Password {isEditMode && !passwordRequired && '(leave blank to keep current)'}
                  </label>
                  <input
                    id="su-password"
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    placeholder={isEditMode ? '••••••••' : 'Minimum 8 characters'}
                    required={passwordRequired}
                    minLength={passwordRequired ? 8 : undefined}
                  />
                </div> : null}
              </div>
            </Card>
            {microsoftLink ? <MicrosoftLinkCard microsoftLink={microsoftLink} /> : null}
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
                ) : (
                  <PermissionMatrixGrid
                    availablePermissions={matrixModules}
                    selectedPermissions={
                      permissionsReadOnly && effectivePermissionNames
                        ? effectivePermissionNames
                        : directPermissions
                    }
                    lockedPermissions={
                      permissionsReadOnly ? [] : roleInheritedPermissions
                    }
                    grantablePermissions={
                      permissionsReadOnly ? null : grantablePermissionNames
                    }
                    readOnly={permissionsReadOnly}
                    disabled={isSaving}
                    onTogglePermission={toggleDirectPermission}
                    onSelectedPermissionsChange={handleDirectPermissionsChange}
                    emptyMessage="No permissions available."
                  />
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
