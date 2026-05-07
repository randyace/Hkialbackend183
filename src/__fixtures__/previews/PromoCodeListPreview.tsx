import { useMemo, useState } from 'react';
import {
  PromoCodeList,
  type PromoCodeListBatch,
  type PromoCodeListCodeType,
  type PromoCodeListCompanyGroup,
  isBatchActive,
} from '../../app/components/PromoCodeList';
import { mockPromoBatches } from '../PromoCodeList.fixture';

interface PromoCodeListPreviewProps {
  onEditPromoCode?: (promoCodeId: number) => void;
  onCreatePromoCode?: () => void;
}

export function PromoCodeListPreview({ onEditPromoCode, onCreatePromoCode }: PromoCodeListPreviewProps) {
  const [batches] = useState<PromoCodeListBatch[]>(mockPromoBatches);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | PromoCodeListCodeType>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterCompany, setFilterCompany] = useState<'all' | string>('all');
  const [expandedCompanies, setExpandedCompanies] = useState<Set<number>>(
    () => new Set(Array.from(new Set(mockPromoBatches.map((b) => b.companyId))))
  );

  const companyGroups = useMemo<PromoCodeListCompanyGroup[]>(() => {
    return Array.from(new Map(batches.map((b) => [b.companyId, b])).values()).map((rep) => ({
      companyId: rep.companyId,
      companyName: rep.companyName,
      companyShortCode: rep.companyShortCode,
      batches: batches.filter((b) => b.companyId === rep.companyId),
    }));
  }, [batches]);

  const filteredGroups = useMemo<PromoCodeListCompanyGroup[]>(() => {
    return companyGroups
      .filter((group) => {
        if (filterCompany !== 'all' && String(group.companyId) !== filterCompany) return false;
        if (searchTerm) {
          const q = searchTerm.toLowerCase();
          const hit = group.batches.some(
            (b) =>
              b.prefix.toLowerCase().includes(q) ||
              b.titleEn.toLowerCase().includes(q) ||
              b.companyName.toLowerCase().includes(q)
          );
          if (!hit) return false;
        }
        return true;
      })
      .map((group) => ({
        ...group,
        batches: group.batches.filter((b) => {
          const matchType = filterType === 'all' || b.codeType === filterType;
          const matchStatus =
            filterStatus === 'all' ||
            (filterStatus === 'active' && isBatchActive(b)) ||
            (filterStatus === 'inactive' && !isBatchActive(b));
          if (searchTerm) {
            const q = searchTerm.toLowerCase();
            const matchSearch =
              b.prefix.toLowerCase().includes(q) ||
              b.titleEn.toLowerCase().includes(q) ||
              b.companyName.toLowerCase().includes(q);
            return matchType && matchStatus && matchSearch;
          }
          return matchType && matchStatus;
        }),
      }))
      .filter((group) => group.batches.length > 0);
  }, [companyGroups, filterCompany, filterStatus, filterType, searchTerm]);

  const toggleCompanyExpanded = (companyId: number) => {
    setExpandedCompanies((prev) => {
      const next = new Set(prev);
      if (next.has(companyId)) next.delete(companyId);
      else next.add(companyId);
      return next;
    });
  };

  return (
    <PromoCodeList
      batches={batches}
      companyGroups={companyGroups}
      filteredGroups={filteredGroups}
      searchTerm={searchTerm}
      filterType={filterType}
      filterStatus={filterStatus}
      filterCompany={filterCompany}
      expandedCompanies={expandedCompanies}
      onSearchTermChange={setSearchTerm}
      onFilterTypeChange={setFilterType}
      onFilterStatusChange={setFilterStatus}
      onFilterCompanyChange={setFilterCompany}
      onToggleCompanyExpanded={toggleCompanyExpanded}
      onEditPromoCode={onEditPromoCode}
      onCreatePromoCode={onCreatePromoCode}
    />
  );
}
