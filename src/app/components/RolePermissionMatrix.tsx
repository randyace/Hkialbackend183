/**
 * RolePermissionMatrix.tsx — Presentational enterprise Role Permissions matrix.
 */

import { Fragment, useEffect, useRef } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Loader2, Pencil, Save, Shield, Trash2 } from 'lucide-react';

export interface RolePermissionAction {
  key: string;
  label: string;
  name: string;
  description?: string;
  exists?: boolean;
}

export interface RolePermissionFeature {
  key: string;
  label: string;
  actions: RolePermissionAction[];
}

export interface RolePermissionModule {
  key: string;
  label: string;
  features: RolePermissionFeature[];
}

export interface RoleOption {
  id: number;
  name: string;
  is_core?: boolean;
}

export interface RolePermissionMatrixProps {
  roles: RoleOption[];
  selectedRoleId: number | null;
  groupedPermissions: RolePermissionModule[];
  rolePermissions: string[];
  isLoading?: boolean;
  isSaving?: boolean;
  canEdit?: boolean;
  canCreateRole?: boolean;
  canRenameRole?: boolean;
  canDeleteRole?: boolean;
  notice?: string | null;
  onRoleChange: (roleId: number) => void;
  onTogglePermission: (permissionName: string) => void;
  /** Replace the full selected permission list (used by row Select All). */
  onRolePermissionsChange: (permissions: string[]) => void;
  onSave: () => void;
  onCreateRole?: () => void;
  onRenameRole?: () => void;
  onDeleteRole?: () => void;
}

const CRUD_KEYS = ['read', 'create', 'update', 'delete'] as const;
const TABLE_COL_COUNT = 7;

function crudAction(
  feature: RolePermissionFeature,
  key: (typeof CRUD_KEYS)[number],
): RolePermissionAction | undefined {
  return feature.actions.find((a) => a.key === key && a.exists !== false);
}

function specialActions(feature: RolePermissionFeature): RolePermissionAction[] {
  return feature.actions.filter(
    (a) => !(CRUD_KEYS as readonly string[]).includes(a.key) && a.exists !== false,
  );
}

/** Available permission names for a feature row (CRUD + specials, no nulls). */
function availableRowPermissions(feature: RolePermissionFeature): string[] {
  const names = [
    crudAction(feature, 'read')?.name,
    crudAction(feature, 'create')?.name,
    crudAction(feature, 'update')?.name,
    crudAction(feature, 'delete')?.name,
    ...specialActions(feature).map((s) => s.name),
  ];
  return names.filter((name): name is string => typeof name === 'string' && name !== '');
}

function RowSelectAllCheckbox({
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
      className="w-4 h-4 rounded border-gray-300 accent-black cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 shrink-0"
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      aria-label="Select all permissions in this row"
    />
  );
}

export function RolePermissionMatrix({
  roles,
  selectedRoleId,
  groupedPermissions,
  rolePermissions,
  isLoading = false,
  isSaving = false,
  canEdit = true,
  canCreateRole = false,
  canRenameRole = false,
  canDeleteRole = false,
  notice = null,
  onRoleChange,
  onTogglePermission,
  onRolePermissionsChange,
  onSave,
  onCreateRole,
  onRenameRole,
  onDeleteRole,
}: RolePermissionMatrixProps) {
  const selectedSet = new Set(rolePermissions);
  const selectedRole = roles.find((r) => r.id === selectedRoleId) ?? null;

  const handleToggleRow = (rowPermissions: string[], isCurrentlyAllSelected: boolean) => {
    if (!canEdit || isSaving || rowPermissions.length === 0) return;

    if (isCurrentlyAllSelected) {
      const remove = new Set(rowPermissions);
      onRolePermissionsChange(rolePermissions.filter((name) => !remove.has(name)));
      return;
    }

    onRolePermissionsChange(Array.from(new Set([...rolePermissions, ...rowPermissions])));
  };

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
      {/* Top bar */}
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

      {/* Role selector */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <label className="block space-y-1.5 flex-1 max-w-md">
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
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {canCreateRole && onCreateRole && (
              <Button
                type="button"
                variant="outline"
                onClick={onCreateRole}
                disabled={isSaving}
                className="gap-2"
              >
                + Create Role
              </Button>
            )}
            {canRenameRole && onRenameRole && (
              <Button
                type="button"
                variant="outline"
                onClick={onRenameRole}
                disabled={isSaving || !selectedRoleId}
                className="gap-2"
              >
                <Pencil className="w-4 h-4" />
                Rename
              </Button>
            )}
            {canDeleteRole && onDeleteRole && (
              <Button
                type="button"
                variant="outline"
                onClick={onDeleteRole}
                disabled={isSaving || !selectedRoleId}
                className="gap-2 text-red-700 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            )}
          </div>
        </div>
        {selectedRole && (
          <p className="text-xs text-gray-500 mt-2">
            Editing template for <span className="font-medium text-gray-700">{selectedRole.name}</span>
            {' · '}
            {rolePermissions.length} permission{rolePermissions.length === 1 ? '' : 's'} selected
          </p>
        )}
      </Card>

      {notice && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {notice}
        </div>
      )}

      {/* Matrix table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-200">
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">
                  <span className="sr-only">Select all in row</span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-[24%]">
                  Feature
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-[10%]">
                  Read
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-[10%]">
                  Create
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-[10%]">
                  Update
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-[10%]">
                  Delete
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Special Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {groupedPermissions.map((module) => (
                <Fragment key={module.key}>
                  <tr className="bg-gray-50 border-y border-gray-200">
                    <td
                      colSpan={TABLE_COL_COUNT}
                      className="px-4 py-2.5 text-sm font-semibold text-gray-800"
                    >
                      {module.label}
                    </td>
                  </tr>
                  {module.features.map((feature) => {
                    const specials = specialActions(feature);
                    const rowPermissions = availableRowPermissions(feature);
                    const isAllRowSelected =
                      rowPermissions.length > 0 &&
                      rowPermissions.every((p) => selectedSet.has(p));
                    const isSomeRowSelected =
                      rowPermissions.some((p) => selectedSet.has(p)) && !isAllRowSelected;
                    const selectAllId = `rpm-row-select-${module.key}-${feature.key}`;

                    return (
                      <tr
                        key={`${module.key}-${feature.key}`}
                        className="border-b border-gray-100 hover:bg-gray-50/60"
                      >
                        <td className="px-3 py-3 text-center align-middle">
                          <RowSelectAllCheckbox
                            id={selectAllId}
                            checked={isAllRowSelected}
                            indeterminate={isSomeRowSelected}
                            disabled={!canEdit || isSaving || rowPermissions.length === 0}
                            onChange={() => handleToggleRow(rowPermissions, isAllRowSelected)}
                          />
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <label
                            htmlFor={selectAllId}
                            className="cursor-pointer"
                          >
                            <div className="text-sm font-medium text-gray-900">{feature.label}</div>
                            <div className="text-xs text-gray-400 font-mono mt-0.5">{feature.key}</div>
                          </label>
                        </td>
                        {CRUD_KEYS.map((key) => {
                          const action = crudAction(feature, key);
                          if (!action) {
                            return (
                              <td key={key} className="px-3 py-3 text-center align-middle">
                                <span className="inline-block w-4 h-4" aria-hidden />
                              </td>
                            );
                          }
                          const checked = selectedSet.has(action.name);
                          return (
                            <td key={key} className="px-3 py-3 text-center align-middle">
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-gray-300 accent-black cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                                checked={checked}
                                disabled={!canEdit || isSaving}
                                onChange={() => onTogglePermission(action.name)}
                                aria-label={`${feature.label} ${action.label}`}
                                title={action.description ?? action.name}
                              />
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 align-middle">
                          {specials.length === 0 ? (
                            <span className="text-xs text-gray-400">—</span>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {specials.map((action) => {
                                const checked = selectedSet.has(action.name);
                                return (
                                  <label
                                    key={action.name}
                                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs cursor-pointer transition-colors ${
                                      checked
                                        ? 'border-gray-900 bg-gray-900 text-white'
                                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                                    } ${!canEdit || isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    title={action.description ?? action.name}
                                  >
                                    <input
                                      type="checkbox"
                                      className="sr-only"
                                      checked={checked}
                                      disabled={!canEdit || isSaving}
                                      onChange={() => onTogglePermission(action.name)}
                                    />
                                    <span>{action.label}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </Fragment>
              ))}
              {groupedPermissions.length === 0 && (
                <tr>
                  <td colSpan={TABLE_COL_COUNT} className="px-4 py-12 text-center text-sm text-gray-500">
                    No permission modules available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
