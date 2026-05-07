import { useMemo, useState } from 'react';
import { toast } from 'sonner@2.0.3';
import {
  OpportunityTracking,
  type OpportunityTrackingAccountType,
  type OpportunityTrackingDealStage,
  type OpportunityTrackingInteraction,
  type OpportunityTrackingLogDraft,
  type OpportunityTrackingOpportunity,
} from '../../app/components/OpportunityTracking';
import { mockOpportunities } from '../OpportunityTracking.fixture';

const emptyDraft: OpportunityTrackingLogDraft = {
  oppId: null,
  type: 'Meeting',
  summary: '',
  date: new Date().toISOString().split('T')[0],
  followUpDate: '',
  conductedBy: 'HKIAL Staff',
};

export function OpportunityTrackingPreview() {
  const [opportunities, setOpportunities] = useState<OpportunityTrackingOpportunity[]>(mockOpportunities);
  const [filterStage, setFilterStage] = useState<'all' | OpportunityTrackingDealStage>('all');
  const [filterType, setFilterType] = useState<'all' | OpportunityTrackingAccountType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'pipeline' | 'table'>('pipeline');

  const [selectedOpp, setSelectedOpp] = useState<OpportunityTrackingOpportunity | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [isLogOpen, setIsLogOpen] = useState(false);
  const [logDraft, setLogDraft] = useState<OpportunityTrackingLogDraft>(emptyDraft);

  const filteredOpportunities = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return opportunities.filter(o => {
      const matchSearch =
        !search ||
        o.companyName.toLowerCase().includes(search) ||
        o.opportunityRef.toLowerCase().includes(search);
      const matchStage = filterStage === 'all' || o.stage === filterStage;
      const matchType = filterType === 'all' || o.accountType === filterType;
      return matchSearch && matchStage && matchType;
    });
  }, [opportunities, searchTerm, filterStage, filterType]);

  const handleSelectOpportunity = (opp: OpportunityTrackingOpportunity | null) => {
    setSelectedOpp(opp);
    setIsDetailOpen(opp !== null);
  };

  const handleOpenLog = (opp: OpportunityTrackingOpportunity) => {
    setLogDraft({
      ...emptyDraft,
      oppId: opp.id,
      date: new Date().toISOString().split('T')[0],
    });
    setIsLogOpen(true);
  };

  const handleCloseLog = () => {
    setIsLogOpen(false);
    setLogDraft(emptyDraft);
  };

  const handleLogInteraction = () => {
    const { oppId, summary, date, type, followUpDate, conductedBy } = logDraft;
    if (!oppId || !summary.trim()) return;

    setOpportunities(prev => prev.map(o => {
      if (o.id !== oppId) return o;
      const newInteraction: OpportunityTrackingInteraction = {
        id: Math.max(0, ...o.interactions.map(i => i.id)) + 1,
        date,
        type,
        summary,
        followUpDate: followUpDate || undefined,
        conductedBy,
      };
      return { ...o, interactions: [newInteraction, ...o.interactions], lastActivityDate: date };
    }));

    if (selectedOpp?.id === oppId) {
      setSelectedOpp(prev => {
        if (!prev) return prev;
        const newInteraction: OpportunityTrackingInteraction = {
          id: Math.max(0, ...prev.interactions.map(i => i.id)) + 1,
          date,
          type,
          summary,
          followUpDate: followUpDate || undefined,
          conductedBy,
        };
        return {
          ...prev,
          lastActivityDate: date,
          interactions: [newInteraction, ...prev.interactions],
        };
      });
    }

    toast.success('Interaction Logged', {
      description: `${type} logged for ${opportunities.find(o => o.id === oppId)?.companyName}`,
    });
    handleCloseLog();
  };

  return (
    <OpportunityTracking
      opportunities={opportunities}
      filteredOpportunities={filteredOpportunities}
      filterStage={filterStage}
      filterType={filterType}
      searchTerm={searchTerm}
      viewMode={viewMode}
      selectedOpp={selectedOpp}
      isDetailOpen={isDetailOpen}
      isLogOpen={isLogOpen}
      logDraft={logDraft}
      onSearchTermChange={setSearchTerm}
      onFilterStageChange={setFilterStage}
      onFilterTypeChange={setFilterType}
      onViewModeChange={setViewMode}
      onSelectOpportunity={handleSelectOpportunity}
      onCloseDetail={() => { setIsDetailOpen(false); setSelectedOpp(null); }}
      onOpenLog={handleOpenLog}
      onCloseLog={handleCloseLog}
      onLogDraftChange={setLogDraft}
      onLogInteraction={handleLogInteraction}
      onCreateOpportunity={() => toast.info('New opportunity form coming soon.')}
      onEditOpportunity={() => toast.info('Edit opportunity form coming soon.')}
    />
  );
}
