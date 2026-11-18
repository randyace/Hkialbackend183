/**
 * GradingPackages.tsx — Pure presentational component.
 *
 * Rules:
 *  - Zero business state (packages[] comes entirely from props)
 *  - Dialog / draft-edit / benefit-input state are pure UI state — allowed
 *  - All mutations (save, toggle) reported via typed callbacks
 *  - Default props fall back to mockGradingPackagesData (fixture pattern)
 */

import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import {
  Edit, Star, Gem, Award, Trophy,
  Plus, X, Check, DollarSign, CreditCard, Clock, Gift,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { toast } from 'sonner';
import { mockGradingPackagesData } from './__fixtures__/GradingPackages.mocks';

// Suppress unused-import warning for Award (kept for future tiers)
void Award;

// ─── Public types ─────────────────────────────────────────────────────────────

export type PackageTier = 'Gold' | 'Platinum' | 'Diamond' | 'Sapphire';

export interface PackageBenefit {
  id:   number;
  text: string;
  textTrad?: string;
  textSimp?: string;
}

export interface GradingPackage {
  id:             number;
  tier:           PackageTier;
  price:          number;
  currency:       string;
  bookingCredits: number;
  /** Free Premiere Suite upgrades included with the package */
  psFreeUpgrades: number;
  /** Validity in calendar days — maps 1:1 to grading_packages.duration_days */
  durationDays: number;
  description:    string;
  descriptionTrad?: string;
  descriptionSimp?: string;
  benefits:       PackageBenefit[];
  isActive:       boolean;
  memberCount:    number;
  /** Tailwind text-colour class */
  color:       string;
  /** Tailwind background-colour class */
  bgColor:     string;
  /** Tailwind border-colour class */
  borderColor: string;
  /** Tailwind badge background + text classes */
  badgeBg:     string;
}

export interface GradingPackagesProps {
  /** Full list of packages to display */
  packages?: GradingPackage[];
  /** Called when the user saves an edited package */
  onSavePackage?: (updatedPackage: GradingPackage) => void;
  /** Called when the user toggles a package's active state */
  onToggleActive?: (id: number, isActive: boolean) => void;
}

// ─── Static display config (not business data) ────────────────────────────────

const TIER_META: Record<PackageTier, { icon: React.ReactNode }> = {
  Gold:     { icon: <Star  className="w-8 h-8" /> },
  Platinum: { icon: <Trophy className="w-8 h-8" /> },
  Diamond:  { icon: <Gem  className="w-8 h-8" /> },
  Sapphire: { icon: <Gem  className="w-8 h-8" /> },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function GradingPackages({
  packages       = mockGradingPackagesData.packages ?? [],
  onSavePackage  = () => {},
  onToggleActive = () => {},
}: GradingPackagesProps) {

  // ── Pure UI state (dialog / in-progress edits) ─────────────────────────────
  const [isDialogOpen,   setIsDialogOpen]   = useState(false);
  const [editingPackage, setEditingPackage] = useState<GradingPackage | null>(null);
  const [newBenefitText, setNewBenefitText] = useState('');

  // ── Dialog helpers ─────────────────────────────────────────────────────────

  const openEdit = (pkg: GradingPackage) => {
    setEditingPackage(JSON.parse(JSON.stringify(pkg)) as GradingPackage);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingPackage(null);
    setNewBenefitText('');
  };

  const handleSave = () => {
    if (!editingPackage) return;
    onSavePackage(editingPackage);
    toast.success(`${editingPackage.tier} package updated successfully.`);
    closeDialog();
  };

  const handleToggleActive = (pkg: GradingPackage) => {
    const next = !pkg.isActive;
    onToggleActive(pkg.id, next);
    toast.success(`${pkg.tier} package ${next ? 'activated' : 'deactivated'}.`);
  };

  // ── Benefit helpers (mutate the local editing draft only) ──────────────────

  const addBenefit = () => {
    if (!editingPackage || !newBenefitText.trim()) return;
    const newId = Math.max(0, ...editingPackage.benefits.map(b => b.id)) + 1;
    setEditingPackage({
      ...editingPackage,
      benefits: [...editingPackage.benefits, {
        id: newId,
        text: newBenefitText.trim(),
        textTrad: '',
        textSimp: '',
      }],
    });
    setNewBenefitText('');
  };

  const removeBenefit = (benefitId: number) => {
    if (!editingPackage) return;
    setEditingPackage({
      ...editingPackage,
      benefits: editingPackage.benefits.filter(b => b.id !== benefitId),
    });
  };

  const updateBenefitText = (
    benefitId: number,
    patch: Partial<Pick<PackageBenefit, 'text' | 'textTrad' | 'textSimp'>>,
  ) => {
    if (!editingPackage) return;
    setEditingPackage({
      ...editingPackage,
      benefits: editingPackage.benefits.map(b => b.id === benefitId ? { ...b, ...patch } : b),
    });
  };

  const missingChinese = (pkg: GradingPackage): boolean => {
    const descMissing = !(pkg.descriptionTrad ?? '').trim() || !(pkg.descriptionSimp ?? '').trim();
    const benefitMissing = pkg.benefits.some(
      (b) => !(b.textTrad ?? '').trim() || !(b.textSimp ?? '').trim(),
    );
    return descMissing || benefitMissing;
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-gray-900 mb-1">Grading Package Management</h1>
        <p className="text-sm text-gray-500">
          Configure membership tiers, pricing, booking credits, and benefits for individual customers.
        </p>
      </div>

      {/* Package Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {packages.map((pkg) => (
          <Card key={pkg.id} className={`border-2 ${pkg.borderColor} overflow-hidden`}>
            {/* Card Header */}
            <div className={`${pkg.bgColor} px-6 py-4 border-b ${pkg.borderColor}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={pkg.color}>{TIER_META[pkg.tier].icon}</span>
                  <div>
                    <h3 className={`${pkg.color} text-lg`}>{pkg.tier} Package</h3>
                    <p className="text-xs text-gray-500">{pkg.durationDays} Days validity</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={pkg.isActive}
                    onCheckedChange={() => handleToggleActive(pkg)}
                  />
                  <span className="text-xs text-gray-500">{pkg.isActive ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600">{pkg.description}</p>
                {missingChinese(pkg) && (
                  <p className="text-xs text-amber-700 mt-2">
                    Missing Traditional / Simplified copy — customer Chinese UI will fall back to English until you fill it here.
                  </p>
                )}
              </div>

              {/* Key Details */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <DollarSign className="w-4 h-4 text-gray-500 mx-auto mb-1" />
                  <p className="text-sm text-gray-900">{pkg.currency} {pkg.price.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Price</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <CreditCard className="w-4 h-4 text-gray-500 mx-auto mb-1" />
                  <p className="text-sm text-gray-900">{pkg.bookingCredits === -1 ? '∞' : pkg.bookingCredits}</p>
                  <p className="text-xs text-gray-500">Entries</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <Clock className="w-4 h-4 text-gray-500 mx-auto mb-1" />
                  <p className="text-sm text-gray-900">{pkg.durationDays} Days</p>
                  <p className="text-xs text-gray-500">Validity</p>
                </div>
              </div>

              {/* Benefits */}
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                  <Gift className="w-3 h-3" /> Benefits
                </p>
                <ul className="space-y-1">
                  {pkg.benefits.map((benefit) => (
                    <li key={benefit.id} className="flex items-start gap-2 text-sm text-gray-700">
                      <Check className={`w-4 h-4 ${pkg.color} mt-0.5 shrink-0`} />
                      {benefit.text}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Edit action */}
              <Button variant="outline" size="sm" className="w-full" onClick={() => openEdit(pkg)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Package
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => { if (!open) closeDialog(); }}
      >
        <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-4xl">
          <DialogHeader className="shrink-0">
            <DialogTitle>
              {editingPackage && (
                <span className={editingPackage.color}>
                  Edit {editingPackage.tier} Package
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {editingPackage && (
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto py-2">
              {/* Description — staff-owned EN / 繁 / 简. Customer SPA reads these columns. */}
              <div className="space-y-3">
                <p className="text-xs text-gray-500">
                  Customer membership pages show Traditional / Simplified when filled. Empty fields fall back to English. Do not rely on the customer app to translate this copy.
                </p>
                <div>
                  <Label htmlFor="edit-desc" className="mb-[10px] block">Package Description (English)</Label>
                  <Textarea
                    id="edit-desc"
                    value={editingPackage.description}
                    onChange={(e) =>
                      setEditingPackage({ ...editingPackage, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-desc-trad" className="mb-[10px] block">Package Description (Traditional Chinese)</Label>
                  <Textarea
                    id="edit-desc-trad"
                    value={editingPackage.descriptionTrad ?? ''}
                    onChange={(e) =>
                      setEditingPackage({ ...editingPackage, descriptionTrad: e.target.value })
                    }
                    placeholder="繁體中文描述…"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-desc-simp" className="mb-[10px] block">Package Description (Simplified Chinese)</Label>
                  <Textarea
                    id="edit-desc-simp"
                    value={editingPackage.descriptionSimp ?? ''}
                    onChange={(e) =>
                      setEditingPackage({ ...editingPackage, descriptionSimp: e.target.value })
                    }
                    placeholder="简体中文描述…"
                    rows={3}
                  />
                </div>
              </div>

              {/* Pricing & Credits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-price" className="mb-[10px] block">Price (HKD)</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    min={0}
                    value={editingPackage.price}
                    onChange={(e) =>
                      setEditingPackage({ ...editingPackage, price: Number(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-validity" className="mb-[10px] block">Validity (Days)</Label>
                  <Input
                    id="edit-validity"
                    type="number"
                    min={1}
                    max={3650}
                    value={editingPackage.durationDays}
                    onChange={(e) =>
                      setEditingPackage({ ...editingPackage, durationDays: Number(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-credits" className="mb-[10px] block">
                    Lounge Deluxe Entries (-1 = Unlimited)
                  </Label>
                  <Input
                    id="edit-credits"
                    type="number"
                    min={-1}
                    value={editingPackage.bookingCredits}
                    onChange={(e) =>
                      setEditingPackage({ ...editingPackage, bookingCredits: Number(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-ps-upgrades" className="mb-[10px] block">Free Premiere Suite Upgrades</Label>
                  <Input
                    id="edit-ps-upgrades"
                    type="number"
                    min={0}
                    value={editingPackage.psFreeUpgrades}
                    onChange={(e) =>
                      setEditingPackage({ ...editingPackage, psFreeUpgrades: Number(e.target.value) })
                    }
                  />
                </div>
              </div>

              {/* Benefits */}
              <div>
                <Label className="mb-[10px] block">Package Benefits (English / Traditional / Simplified)</Label>
                <div className="space-y-2 mb-3">
                  {editingPackage.benefits.map((benefit) => (
                    <div key={benefit.id} className="flex gap-2 items-start">
                      <Check className={`w-4 h-4 ${editingPackage.color} shrink-0 mt-2.5`} />
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                        <Input
                          value={benefit.text}
                          onChange={(e) => updateBenefitText(benefit.id, { text: e.target.value })}
                          placeholder="English"
                        />
                        <Input
                          value={benefit.textTrad ?? ''}
                          onChange={(e) => updateBenefitText(benefit.id, { textTrad: e.target.value })}
                          placeholder="繁體中文"
                        />
                        <Input
                          value={benefit.textSimp ?? ''}
                          onChange={(e) => updateBenefitText(benefit.id, { textSimp: e.target.value })}
                          placeholder="简体中文"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeBenefit(benefit.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0 mt-0.5"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                {/* Add Benefit */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add new benefit..."
                    value={newBenefitText}
                    onChange={(e) => setNewBenefitText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addBenefit(); } }}
                  />
                  <Button variant="outline" size="sm" onClick={addBenefit} className="shrink-0">
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </div>
              </div>

              {/* Status toggle */}
              <div className="flex items-center gap-3">
                <Switch
                  id="edit-active"
                  checked={editingPackage.isActive}
                  onCheckedChange={(val) =>
                    setEditingPackage({ ...editingPackage, isActive: val })
                  }
                />
                <Label htmlFor="edit-active">Package is Active</Label>
              </div>
            </div>
          )}

          <DialogFooter className="shrink-0 border-t pt-4">
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSave} className="bg-[#0f2942] hover:bg-[#1a3d5c] text-white">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
