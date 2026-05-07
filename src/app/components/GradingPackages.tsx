import type { ReactNode } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Edit, Star, Gem, Trophy, Plus, X, Check, DollarSign, CreditCard, Clock, Gift, Shuffle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';

export interface GradingPackagesBenefit {
  id: number;
  text: string;
}

export type GradingPackagesTier = 'Gold' | 'Platinum' | 'Diamond' | 'Sapphire';

export interface GradingPackagesPackage {
  id: number;
  tier: GradingPackagesTier;
  price: number;
  currency: string;
  bookingCredits: number;
  validityMonths: number;
  description: string;
  benefits: GradingPackagesBenefit[];
  isActive: boolean;
  memberCount: number;
}

export interface GradingPackagesProps {
  loading?: boolean;
  error?: string | null;
  packages: GradingPackagesPackage[];
  editingPackage: GradingPackagesPackage | null;
  isDialogOpen: boolean;
  newBenefitText: string;
  onOpenEdit: (pkg: GradingPackagesPackage) => void;
  onCloseDialog: () => void;
  onTogglePackageActive: (id: number) => void;
  onSaveEditingPackage: () => void;
  onChangeEditingPackage: (next: GradingPackagesPackage) => void;
  onChangeNewBenefitText: (value: string) => void;
  onAddBenefit: () => void;
  onRemoveBenefit: (benefitId: number) => void;
  onUpdateBenefitText: (benefitId: number, text: string) => void;
  onQuickFill: () => void;
}

interface TierMeta {
  icon: ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  badgeBg: string;
}

const TIER_META: Record<GradingPackagesTier, TierMeta> = {
  Gold: {
    icon: <Star className="w-8 h-8" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-300',
    badgeBg: 'bg-amber-100 text-amber-700',
  },
  Platinum: {
    icon: <Trophy className="w-8 h-8" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-300',
    badgeBg: 'bg-purple-100 text-purple-700',
  },
  Diamond: {
    icon: <Gem className="w-8 h-8" />,
    color: 'text-sky-600',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-300',
    badgeBg: 'bg-sky-100 text-sky-700',
  },
  Sapphire: {
    icon: <Gem className="w-8 h-8" />,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-300',
    badgeBg: 'bg-indigo-100 text-indigo-700',
  },
};

export function GradingPackages({
  loading,
  error,
  packages,
  editingPackage,
  isDialogOpen,
  newBenefitText,
  onOpenEdit,
  onCloseDialog,
  onTogglePackageActive,
  onSaveEditingPackage,
  onChangeEditingPackage,
  onChangeNewBenefitText,
  onAddBenefit,
  onRemoveBenefit,
  onUpdateBenefitText,
  onQuickFill,
}: GradingPackagesProps) {
  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-gray-900 mb-1">Grading Package Management</h1>
        <p className="text-sm text-gray-500">Configure membership tiers, pricing, booking credits, and benefits for individual customers.</p>
      </div>

      {error && (
        <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading packages...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {packages.map((pkg) => {
              const meta = TIER_META[pkg.tier];
              return (
                <Card key={pkg.id} className={`p-4 border-2 ${meta.borderColor} ${meta.bgColor}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`${meta.color}`}>{meta.icon}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${meta.badgeBg}`}>{pkg.tier}</span>
                  </div>
                  <p className="text-2xl text-gray-900">{pkg.memberCount}</p>
                  <p className="text-xs text-gray-500 mt-1">Active Members</p>
                </Card>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {packages.map((pkg) => {
              const meta = TIER_META[pkg.tier];
              return (
                <Card key={pkg.id} className={`border-2 ${meta.borderColor} overflow-hidden`}>
                  <div className={`${meta.bgColor} px-6 py-4 border-b ${meta.borderColor}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={meta.color}>{meta.icon}</span>
                        <div>
                          <h3 className={`${meta.color} text-lg`}>{pkg.tier} Package</h3>
                          <p className="text-xs text-gray-500">{pkg.validityMonths}-month validity</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={pkg.isActive}
                          onCheckedChange={() => onTogglePackageActive(pkg.id)}
                        />
                        <span className="text-xs text-gray-500">{pkg.isActive ? 'Active' : 'Inactive'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <p className="text-sm text-gray-600 mb-4">{pkg.description}</p>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <DollarSign className="w-4 h-4 text-gray-500 mx-auto mb-1" />
                        <p className="text-sm text-gray-900">{pkg.currency} {pkg.price.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">Price</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <CreditCard className="w-4 h-4 text-gray-500 mx-auto mb-1" />
                        <p className="text-sm text-gray-900">{pkg.bookingCredits === -1 ? '∞' : pkg.bookingCredits}</p>
                        <p className="text-xs text-gray-500">Entries/yr</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <Clock className="w-4 h-4 text-gray-500 mx-auto mb-1" />
                        <p className="text-sm text-gray-900">{pkg.validityMonths}mo</p>
                        <p className="text-xs text-gray-500">Validity</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-2 flex items-center gap-1"><Gift className="w-3 h-3" /> Benefits</p>
                      <ul className="space-y-1">
                        {pkg.benefits.map((benefit) => (
                          <li key={benefit.id} className="flex items-start gap-2 text-sm text-gray-700">
                            <Check className={`w-4 h-4 ${meta.color} mt-0.5 shrink-0`} />
                            {benefit.text}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => onOpenEdit(pkg)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Package
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) onCloseDialog(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPackage && (
                <span className={TIER_META[editingPackage.tier].color}>Edit {editingPackage.tier} Package</span>
              )}
            </DialogTitle>
            <Button
              type="button"
              variant="outline"
              onClick={onQuickFill}
              className="gap-1 mt-2 w-fit text-[10px] px-2 py-0.5 h-[25px]"
            >
              <Shuffle className="w-3 h-3" />
              Quick Fill Demo
            </Button>
          </DialogHeader>

          {editingPackage && (
            <div className="space-y-5 py-2">
              <div>
                <Label htmlFor="edit-desc" className="mb-[10px] block">Package Description</Label>
                <Textarea
                  id="edit-desc"
                  value={editingPackage.description}
                  onChange={(e) => onChangeEditingPackage({ ...editingPackage, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-price" className="mb-[10px] block">Price (HKD)</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    min={0}
                    value={editingPackage.price}
                    onChange={(e) => onChangeEditingPackage({ ...editingPackage, price: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-credits" className="mb-[10px] block">Lounge Deluxe Entries/Year</Label>
                  <Input
                    id="edit-credits"
                    type="number"
                    value={editingPackage.bookingCredits}
                    onChange={(e) => onChangeEditingPackage({ ...editingPackage, bookingCredits: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-validity" className="mb-[10px] block">Validity (Months)</Label>
                  <Input
                    id="edit-validity"
                    type="number"
                    min={1}
                    max={60}
                    value={editingPackage.validityMonths}
                    onChange={(e) => onChangeEditingPackage({ ...editingPackage, validityMonths: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <Label className="mb-[10px] block">Package Benefits</Label>
                <div className="space-y-2 mb-3">
                  {editingPackage.benefits.map((benefit) => (
                    <div key={benefit.id} className="flex gap-2 items-center">
                      <Check className={`w-4 h-4 ${TIER_META[editingPackage.tier].color} shrink-0`} />
                      <Input
                        value={benefit.text}
                        onChange={(e) => onUpdateBenefitText(benefit.id, e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemoveBenefit(benefit.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add new benefit..."
                    value={newBenefitText}
                    onChange={(e) => onChangeNewBenefitText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAddBenefit(); } }}
                  />
                  <Button variant="outline" size="sm" onClick={onAddBenefit} className="shrink-0">
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  id="edit-active"
                  checked={editingPackage.isActive}
                  onCheckedChange={(val) => onChangeEditingPackage({ ...editingPackage, isActive: val })}
                />
                <Label htmlFor="edit-active">Package is Active</Label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={onCloseDialog}>Cancel</Button>
            <Button onClick={onSaveEditingPackage} className="bg-[#0f2942] hover:bg-[#1a3d5c] text-white">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
