import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Edit, Star, Gem, Award, Trophy, Plus, X, Check, DollarSign, CreditCard, Clock, Gift, Shuffle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { toast } from 'sonner@2.0.3';

interface PackageBenefit {
  id: number;
  text: string;
}

interface GradingPackage {
  id: number;
  tier: 'Gold' | 'Platinum' | 'Diamond' | 'Sapphire';
  price: number;
  currency: string;
  bookingCredits: number;
  validityMonths: number;
  description: string;
  benefits: PackageBenefit[];
  isActive: boolean;
  memberCount: number;
  color: string;
  bgColor: string;
  borderColor: string;
  badgeBg: string;
}

const tierMeta: Record<string, { icon: React.ReactNode; color: string; bgColor: string; borderColor: string; badgeBg: string }> = {
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

const initialPackages: GradingPackage[] = [
  {
    id: 1,
    tier: 'Gold',
    price: 32000,
    currency: 'HKD',
    bookingCredits: 8,
    validityMonths: 12,
    description: 'Entry-level membership with 8 Lounge Deluxe entries per year and premium dining options.',
    benefits: [
      { id: 1, text: '8 Lounge Deluxe entries per year' },
      { id: 2, text: 'Paid upgrade to Premiere Suite Service (40% off)' },
      { id: 3, text: 'Birthday Month Special: Birthday cake' },
      { id: 4, text: 'Priority check-in & immigration assistance' },
      { id: 5, text: 'Complimentary à la carte dining' },
      { id: 6, text: 'Priority baggage handling' },
    ],
    isActive: true,
    memberCount: 142,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-300',
    badgeBg: 'bg-amber-100 text-amber-700',
  },
  {
    id: 2,
    tier: 'Platinum',
    price: 45000,
    currency: 'HKD',
    bookingCredits: 12,
    validityMonths: 12,
    description: 'Enhanced membership with 12 Lounge Deluxe entries per year and exclusive Platinum member benefits.',
    benefits: [
      { id: 1, text: '12 Lounge Deluxe entries per year' },
      { id: 2, text: 'Paid upgrade to Premiere Suite Service (40% off)' },
      { id: 3, text: 'Birthday Month Special: Birthday cake' },
      { id: 4, text: 'All Gold benefits included' },
      { id: 5, text: 'Exclusive Platinum lounge section' },
      { id: 6, text: 'Complimentary spa/shower facilities' },
      { id: 7, text: 'Guest passes (2 per visit)' },
    ],
    isActive: true,
    memberCount: 98,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-300',
    badgeBg: 'bg-purple-100 text-purple-700',
  },
  {
    id: 3,
    tier: 'Diamond',
    price: 84000,
    currency: 'HKD',
    bookingCredits: 24,
    validityMonths: 12,
    description: 'Premium membership with 24 Lounge Deluxe entries and 1 free Premiere Suite upgrade per year.',
    benefits: [
      { id: 1, text: '24 Lounge Deluxe entries per year' },
      { id: 2, text: '1 free upgrade to Premiere Suite Service per year' },
      { id: 3, text: 'Paid upgrade to Premiere Suite Service (40% off)' },
      { id: 4, text: 'Birthday Month Special: Birthday cake' },
      { id: 5, text: 'All Platinum benefits included' },
      { id: 6, text: 'Dedicated personal concierge' },
      { id: 7, text: 'Guest passes (3 per visit)' },
      { id: 8, text: 'Complimentary airport limousine (2 trips)' },
    ],
    isActive: true,
    memberCount: 56,
    color: 'text-sky-600',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-300',
    badgeBg: 'bg-sky-100 text-sky-700',
  },
  {
    id: 4,
    tier: 'Sapphire',
    price: 325000,
    currency: 'HKD',
    bookingCredits: -1,
    validityMonths: 12,
    description: 'Ultra-premium membership with unlimited Lounge Deluxe entries, 5 free Premiere Suite upgrades, and elite bespoke services.',
    benefits: [
      { id: 1, text: 'Unlimited Lounge Deluxe entries per year' },
      { id: 2, text: '5 free upgrades to Premiere Suite Service per year' },
      { id: 3, text: 'Paid upgrade to Premiere Suite Service (40% off)' },
      { id: 4, text: 'Birthday Month Special: Birthday cake' },
      { id: 5, text: 'All Diamond benefits included' },
      { id: 6, text: 'Unlimited airport limousine service' },
      { id: 7, text: 'Guest passes (5 per visit)' },
      { id: 8, text: '24/7 concierge hotline' },
      { id: 9, text: 'Priority rebooking assistance' },
    ],
    isActive: true,
    memberCount: 23,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-300',
    badgeBg: 'bg-indigo-100 text-indigo-700',
  },
];

export function GradingPackages() {
  const [packages, setPackages] = useState<GradingPackage[]>(initialPackages);
  const [editingPackage, setEditingPackage] = useState<GradingPackage | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newBenefitText, setNewBenefitText] = useState('');

  const openEdit = (pkg: GradingPackage) => {
    setEditingPackage(JSON.parse(JSON.stringify(pkg)));
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingPackage) return;
    setPackages(prev => prev.map(p => p.id === editingPackage.id ? editingPackage : p));
    toast.success(`${editingPackage.tier} package updated successfully.`);
    setIsDialogOpen(false);
    setEditingPackage(null);
    setNewBenefitText('');
  };

  const handleToggleActive = (id: number) => {
    setPackages(prev => prev.map(p => {
      if (p.id === id) {
        const updated = { ...p, isActive: !p.isActive };
        toast.success(`${p.tier} package ${updated.isActive ? 'activated' : 'deactivated'}.`);
        return updated;
      }
      return p;
    }));
  };

  const addBenefit = () => {
    if (!editingPackage || !newBenefitText.trim()) return;
    const newId = Math.max(0, ...editingPackage.benefits.map(b => b.id)) + 1;
    setEditingPackage({
      ...editingPackage,
      benefits: [...editingPackage.benefits, { id: newId, text: newBenefitText.trim() }],
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

  const updateBenefitText = (benefitId: number, text: string) => {
    if (!editingPackage) return;
    setEditingPackage({
      ...editingPackage,
      benefits: editingPackage.benefits.map(b => b.id === benefitId ? { ...b, text } : b),
    });
  };

  // ── Quick Fill for Dialog ───────────────────────────────────────────────────
  const handleQuickFill = () => {
    if (!editingPackage) return;
    setEditingPackage({
      ...editingPackage,
      description: `Premium ${editingPackage.tier} membership package with exclusive airport lounge access, priority services, and complimentary refreshments.`,
      price: editingPackage.tier === 'Gold' ? 32000 : editingPackage.tier === 'Platinum' ? 45000 : editingPackage.tier === 'Diamond' ? 84000 : 325000,
      bookingCredits: editingPackage.tier === 'Gold' ? 8 : editingPackage.tier === 'Platinum' ? 12 : editingPackage.tier === 'Diamond' ? 24 : -1,
      validityMonths: 12,
      isActive: true,
    });
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-gray-900 mb-1">Grading Package Management</h1>
        <p className="text-sm text-gray-500">Configure membership tiers, pricing, booking credits, and benefits for individual customers.</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {packages.map((pkg) => {
          const meta = tierMeta[pkg.tier];
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

      {/* Package Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {packages.map((pkg) => {
          const meta = tierMeta[pkg.tier];
          return (
            <Card key={pkg.id} className={`border-2 ${meta.borderColor} overflow-hidden`}>
              {/* Card Header */}
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
                      onCheckedChange={() => handleToggleActive(pkg.id)}
                    />
                    <span className="text-xs text-gray-500">{pkg.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-4">{pkg.description}</p>

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
                    <p className="text-xs text-gray-500">Entries/yr</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <Clock className="w-4 h-4 text-gray-500 mx-auto mb-1" />
                    <p className="text-sm text-gray-900">{pkg.validityMonths}mo</p>
                    <p className="text-xs text-gray-500">Validity</p>
                  </div>
                </div>

                {/* Benefits */}
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

                {/* Action */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => openEdit(pkg)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Package
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setEditingPackage(null); setNewBenefitText(''); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPackage && (
                <span className={tierMeta[editingPackage.tier].color}>Edit {editingPackage.tier} Package</span>
              )}
            </DialogTitle>
            <Button
              type="button"
              variant="outline"
              onClick={handleQuickFill}
              className="gap-1 mt-2 w-fit bg-gradient-to-r from-yellow-400/20 to-amber-400/20 border-yellow-400/50 text-yellow-700 hover:from-yellow-400/30 hover:to-amber-400/30 hover:border-yellow-500/70 hover:text-yellow-800 transition-all text-[10px] px-2 py-0.5 h-[25px]"
            >
              <Shuffle className="w-3 h-3" />
              Quick Fill Demo
            </Button>
          </DialogHeader>

          {editingPackage && (
            <div className="space-y-5 py-2">
              {/* Description */}
              <div>
                <Label htmlFor="edit-desc" className="mb-[10px] block">Package Description</Label>
                <Textarea
                  id="edit-desc"
                  value={editingPackage.description}
                  onChange={(e) => setEditingPackage({ ...editingPackage, description: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Pricing & Credits */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-price" className="mb-[10px] block">Price (HKD)</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    min={0}
                    value={editingPackage.price}
                    onChange={(e) => setEditingPackage({ ...editingPackage, price: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-credits" className="mb-[10px] block">Lounge Deluxe Entries/Year (-1 = Unlimited)</Label>
                  <Input
                    id="edit-credits"
                    type="number"
                    min={0}
                    value={editingPackage.bookingCredits}
                    onChange={(e) => setEditingPackage({ ...editingPackage, bookingCredits: Number(e.target.value) })}
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
                    onChange={(e) => setEditingPackage({ ...editingPackage, validityMonths: Number(e.target.value) })}
                  />
                </div>
              </div>

              {/* Benefits */}
              <div>
                <Label className="mb-[10px] block">Package Benefits</Label>
                <div className="space-y-2 mb-3">
                  {editingPackage.benefits.map((benefit) => (
                    <div key={benefit.id} className="flex gap-2 items-center">
                      <Check className={`w-4 h-4 ${tierMeta[editingPackage.tier].color} shrink-0`} />
                      <Input
                        value={benefit.text}
                        onChange={(e) => updateBenefitText(benefit.id, e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeBenefit(benefit.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
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

              {/* Status */}
              <div className="flex items-center gap-3">
                <Switch
                  id="edit-active"
                  checked={editingPackage.isActive}
                  onCheckedChange={(val) => setEditingPackage({ ...editingPackage, isActive: val })}
                />
                <Label htmlFor="edit-active">Package is Active</Label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-[#0f2942] hover:bg-[#1a3d5c] text-white">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}