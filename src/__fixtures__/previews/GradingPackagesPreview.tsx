import { useState } from 'react';
import { toast } from 'sonner';
import {
  GradingPackages,
  type GradingPackagesPackage,
} from '../../app/components/GradingPackages';
import { initialPackages } from '../GradingPackages.fixture';

export function GradingPackagesPreview() {
  const [packages, setPackages] = useState<GradingPackagesPackage[]>(initialPackages);
  const [editingPackage, setEditingPackage] = useState<GradingPackagesPackage | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newBenefitText, setNewBenefitText] = useState('');

  const handleOpenEdit = (pkg: GradingPackagesPackage) => {
    setEditingPackage(JSON.parse(JSON.stringify(pkg)));
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingPackage) return;
    setPackages((prev) => prev.map((p) => (p.id === editingPackage.id ? editingPackage : p)));
    toast.success(`${editingPackage.tier} package updated successfully.`);
    setIsDialogOpen(false);
    setEditingPackage(null);
    setNewBenefitText('');
  };

  const handleToggleActive = (id: number) => {
    setPackages((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, isActive: !p.isActive };
        toast.success(`${p.tier} package ${updated.isActive ? 'activated' : 'deactivated'}.`);
        return updated;
      }),
    );
  };

  const handleAddBenefit = () => {
    if (!editingPackage || !newBenefitText.trim()) return;
    const newId = Math.max(0, ...editingPackage.benefits.map((b) => b.id)) + 1;
    setEditingPackage({
      ...editingPackage,
      benefits: [...editingPackage.benefits, { id: newId, text: newBenefitText.trim() }],
    });
    setNewBenefitText('');
  };

  const handleRemoveBenefit = (benefitId: number) => {
    if (!editingPackage) return;
    setEditingPackage({
      ...editingPackage,
      benefits: editingPackage.benefits.filter((b) => b.id !== benefitId),
    });
  };

  const handleUpdateBenefitText = (benefitId: number, text: string) => {
    if (!editingPackage) return;
    setEditingPackage({
      ...editingPackage,
      benefits: editingPackage.benefits.map((b) => (b.id === benefitId ? { ...b, text } : b)),
    });
  };

  const handleQuickFill = () => {
    if (!editingPackage) return;
    setEditingPackage({
      ...editingPackage,
      description: `Premium ${editingPackage.tier} membership package with exclusive airport lounge access, priority services, and complimentary refreshments.`,
      price:
        editingPackage.tier === 'Gold' ? 32000 :
        editingPackage.tier === 'Platinum' ? 45000 :
        editingPackage.tier === 'Diamond' ? 84000 : 325000,
      bookingCredits:
        editingPackage.tier === 'Gold' ? 8 :
        editingPackage.tier === 'Platinum' ? 12 :
        editingPackage.tier === 'Diamond' ? 24 : -1,
      validityMonths: 12,
      isActive: true,
    });
  };

  return (
    <GradingPackages
      packages={packages}
      editingPackage={editingPackage}
      isDialogOpen={isDialogOpen}
      newBenefitText={newBenefitText}
      onOpenEdit={handleOpenEdit}
      onCloseDialog={() => {
        setIsDialogOpen(false);
        setEditingPackage(null);
        setNewBenefitText('');
      }}
      onTogglePackageActive={handleToggleActive}
      onSaveEditingPackage={handleSave}
      onChangeEditingPackage={setEditingPackage}
      onChangeNewBenefitText={setNewBenefitText}
      onAddBenefit={handleAddBenefit}
      onRemoveBenefit={handleRemoveBenefit}
      onUpdateBenefitText={handleUpdateBenefitText}
      onQuickFill={handleQuickFill}
    />
  );
}
