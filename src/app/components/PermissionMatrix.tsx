/**
 * PermissionMatrix.tsx — Pure presentational Role → Permission matrix.
 *
 * Rules:
 *  - Zero API calls (modules / roles / selectedPermissions from props)
 *  - Checkbox toggles reported via onTogglePermission
 *  - Save / role change reported via callbacks
 */

import { Fragment } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Loader2, Save, Shield } from 'lucide-react';
import { mockPermissionMatrixData } from './__fixtures__/PermissionMatrix.mocks';

export interface PermissionActionView {
  key: string;
  label: string;
  name: string;
  description?: string;
  exists?: boolean;
}

export interface PermissionFeatureView {
  key: string;
  label: string;
  actions: PermissionActionView[];
}

export interface PermissionModuleView {
  key: string;
  label: string;
  features: PermissionFeatureView[];
}

export interface RoleOptionView {
  id: number;
  name: string;
}

export interface PermissionMatrixProps {
  modules?: PermissionModuleView[];
  roles?: RoleOptionView[];
  selectedRoleId?: number | null;
  selectedPermissions?: string[];
  isLoading?: boolean;
  isSaving?: boolean;
  isDirty?: boolean;
  canSave?: boolean;
  readOnlyMessage?: string | null;
  onSelectRole?: (roleId: number) => void;
  onTogglePermission?: (permissionName: string, enabled: boolean) => void;
  onSave?: () => void;
}

const CRUD_KEYS = ['read', 'create', 'update', 'delete'] as const;
type CrudKey = (typeof CRUD_KEYS)[number];

function actionByKey(feature: PermissionFeatureView, key: CrudKey): PermissionActionView | undefined {
  return feature.actions.find((a) => a.key === key && a.exists !== false);
}

function specialActions(feature: PermissionFeatureView): PermissionActionView[] {
  return feature.actions.filter(
    (a) => !(CRUD_KEYS as readonly string[]).includes(a.key) && a.exists !== false,
  );
}

export function PermissionMatrix({
  modules = mockPermissionMatrixData.modules ?? [],
  roles = mockPermissionMatrixData.roles ?? [],
  selectedRoleId = mockPermissionMatrixData.selectedRoleId ?? null,
  selectedPermissions = mockPermissionMatrixData.selectedPermissions ?? [],
  isLoading = false,
  isSaving = false,
  isDirty = false,
  canSave = true,
  readOnlyMessage = null,
  onSelectRole = mockPermissionMatrixData.onSelectRole,
  onTogglePermission = mockPermissionMatrixData.onTogglePermission,
  onSave = mockPermissionMatrixData.onSave,
}: PermissionMatrixProps) {
  const selectedSet = new Set(selectedPermissions);
  const selectedRole = roles.find((r) => r.id === selectedRoleId) ?? null;

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[320px] text-gray-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading permission matrix…
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 w-full">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-gray-700" />
            Role Permission Matrix
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Modules → Features → CRUD and special actions. Changes apply to the selected Spatie role.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <label className="block space-y-1.5 min-w-[220px]">
            <span className="text-sm font-medium text-gray-700">Role</span>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
              value={selectedRoleId ?? ''}
              onChange={(e) => {
                const id = Number(e.target.value);
                if (!Number.isNaN(id)) onSelectRole(id);
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

          <Button
            type="button"
            onClick={onSave}
            disabled={!canSave || !isDirty || isSaving || !selectedRole}
            className="gap-2"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Permissions
          </Button>
        </div>
      </div>

      {readOnlyMessage && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {readOnlyMessage}
        </div>
      )}

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-[28%]">
                  Feature
                </th>
                {CRUD_KEYS.map((key) => (
                  <th
                    key={key}
                    className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-[10%]"
                  >
                    {key === 'read' ? 'Read' : key === 'create' ? 'Create' : key === 'update' ? 'Update' : 'Delete'}
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Special Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {modules.map((module) => (
                <Fragment key={module.key}>
                  <tr className="bg-gray-100 border-y border-gray-200">
                    <td
                      colSpan={6}
                      className="px-4 py-2.5 text-sm font-semibold text-gray-800 tracking-wide"
                    >
                      {module.label}
                    </td>
                  </tr>
                  {module.features.map((feature) => {
                    const specials = specialActions(feature);
                    return (
                      <tr
                        key={`${module.key}-${feature.key}`}
                        className="border-b border-gray-100 hover:bg-gray-50/80"
                      >
                        <td className="px-4 py-3 align-middle">
                          <div className="text-sm font-medium text-gray-900">{feature.label}</div>
                          <div className="text-xs text-gray-400 font-mono mt-0.5">{feature.key}</div>
                        </td>
                        {CRUD_KEYS.map((key) => {
                          const action = actionByKey(feature, key);
                          if (!action) {
                            return (
                              <td key={key} className="px-3 py-3 text-center align-middle">
                                <span className="inline-block w-4 h-4 rounded border border-transparent" aria-hidden />
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
                                disabled={!canSave || isSaving}
                                onChange={() => onTogglePermission(action.name, !checked)}
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
                                  <button
                                    key={action.name}
                                    type="button"
                                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                                      checked
                                        ? 'border-gray-900 bg-gray-900 text-white'
                                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                                    } ${!canSave || isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                    title={action.description ?? action.name}
                                    aria-pressed={checked}
                                    aria-label={`${feature.label} ${action.label}`}
                                    disabled={!canSave || isSaving}
                                    onClick={() => onTogglePermission(action.name, !checked)}
                                  >
                                    {action.label}
                                  </button>
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
              {modules.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">
                    No permission modules available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedRole && (
        <p className="text-xs text-gray-500">
          Editing role <span className="font-medium text-gray-700">{selectedRole.name}</span>
          {' · '}
          {selectedPermissions.length} permission{selectedPermissions.length === 1 ? '' : 's'} selected
          {isDirty ? ' · unsaved changes' : ''}
        </p>
      )}
    </div>
  );
}
