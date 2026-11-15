/**
 * RolePermissionMatrix.tsx — Presentational Role Permissions page chrome + shared matrix.
 */

import { Card } from './ui/card';
import { Button } from './ui/button';
import { Loader2, Save, Shield } from 'lucide-react';
import {
  PermissionMatrixGrid,
  type PermissionMatrixModule,
} from '@/components/permissions/PermissionMatrixGrid';

export type {
  PermissionMatrixAction as RolePermissionAction,
  PermissionMatrixFeature as RolePermissionFeature,
  PermissionMatrixModule as RolePermissionModule,
} from '@/components/permissions/PermissionMatrixGrid';

export interface RoleOption {
  id: number;
  name: string;
  is_core?: boolean;
}

export interface RolePermissionMatrixProps {
  roles: RoleOption[];
  selectedRoleId: number | null;
  groupedPermissions: PermissionMatrixModule[];
  rolePermissions: string[];
  isLoading?: boolean;
  isSaving?: boolean;
  canEdit?: boolean;
  notice?: string | null;
  onRoleChange: (roleId: number) => void;
  onTogglePermission: (permissionName: string) => void;
  /** Replace the full selected permission list (used by row Select All). */
  onRolePermissionsChange: (permissions: string[]) => void;
  onSave: () => void;
}

export function RolePermissionMatrix({
  roles,
  selectedRoleId,
  groupedPermissions,
  rolePermissions,
  isLoading = false,
  isSaving = false,
  canEdit = true,
  notice = null,
  onRoleChange,
  onTogglePermission,
  onRolePermissionsChange,
  onSave,
}: RolePermissionMatrixProps) {
  const selectedRole = roles.find((r) => r.id === selectedRoleId) ?? null;

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[320px] text-gray-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading role permissions…
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 w-full">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-gray-700" />
            Role Permissions
          </h1>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Assign module and feature access for each role template. Changes apply after you save
            the role template.
          </p>
        </div>
        <Button
          type="button"
          onClick={onSave}
          disabled={!canEdit || isSaving || !selectedRoleId}
          className="gap-2 shrink-0"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Role Template
        </Button>
      </div>

      <Card className="p-4">
        <label className="block space-y-1.5 max-w-md">
          <span className="text-sm font-medium text-gray-700">Target role</span>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
            value={selectedRoleId ?? ''}
            onChange={(e) => {
              const id = Number(e.target.value);
              if (!Number.isNaN(id)) onRoleChange(id);
            }}
            disabled={roles.length === 0 || isSaving}
          >
            {roles.length === 0 && <option value="">No roles available</option>}
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
          {selectedRole && (
            <span className="text-xs text-gray-500">
              Editing template for <span className="font-medium text-gray-700">{selectedRole.name}</span>
              {' · '}
              {rolePermissions.length} permission{rolePermissions.length === 1 ? '' : 's'} selected
            </span>
          )}
        </label>
      </Card>

      {notice && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {notice}
        </div>
      )}

      <Card className="p-0">
        <PermissionMatrixGrid
          availablePermissions={groupedPermissions}
          selectedPermissions={rolePermissions}
          readOnly={!canEdit}
          disabled={isSaving}
          onTogglePermission={onTogglePermission}
          onSelectedPermissionsChange={onRolePermissionsChange}
        />
      </Card>
    </div>
  );
}
