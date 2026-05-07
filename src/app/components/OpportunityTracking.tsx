import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from './ui/dialog';
import {
  Phone, Mail, Users, Plus, Eye, Edit, Calendar, TrendingUp,
  CheckCircle, XCircle, Clock as ClockIcon, AlertCircle, Target, MessageSquare,
  Building2, Plane,
} from 'lucide-react';

void ClockIcon;

export type OpportunityTrackingDealStage =
  | 'Prospecting'
  | 'Proposal Sent'
  | 'Negotiation'
  | 'Renewal Due'
  | 'Closed Won'
  | 'Closed Lost';

export type OpportunityTrackingInteractionType = 'Meeting' | 'Call' | 'Email' | 'Site Visit';
export type OpportunityTrackingAccountType = 'Corporate' | 'Travel Agency';

export interface OpportunityTrackingInteraction {
  id: number;
  date: string;
  type: OpportunityTrackingInteractionType;
  summary: string;
  followUpDate?: string;
  conductedBy: string;
}

export interface OpportunityTrackingOpportunity {
  id: number;
  opportunityRef: string;
  companyName: string;
  accountNumber: string;
  accountType: OpportunityTrackingAccountType;
  contactName: string;
  contactEmail: string;
  stage: OpportunityTrackingDealStage;
  estimatedValue: number;
  currency: string;
  expectedCloseDate: string;
  assignedTo: string;
  description: string;
  createdDate: string;
  lastActivityDate: string;
  interactions: OpportunityTrackingInteraction[];
  notes: string;
}

export interface OpportunityTrackingLogDraft {
  oppId: number | null;
  type: OpportunityTrackingInteractionType;
  summary: string;
  date: string;
  followUpDate: string;
  conductedBy: string;
}

export interface OpportunityTrackingProps {
  opportunities: OpportunityTrackingOpportunity[];
  filteredOpportunities: OpportunityTrackingOpportunity[];
  filterStage: 'all' | OpportunityTrackingDealStage;
  filterType: 'all' | OpportunityTrackingAccountType;
  searchTerm: string;
  viewMode: 'pipeline' | 'table';

  selectedOpp: OpportunityTrackingOpportunity | null;
  isDetailOpen: boolean;

  isLogOpen: boolean;
  logDraft: OpportunityTrackingLogDraft;

  onSearchTermChange: (value: string) => void;
  onFilterStageChange: (value: 'all' | OpportunityTrackingDealStage) => void;
  onFilterTypeChange: (value: 'all' | OpportunityTrackingAccountType) => void;
  onViewModeChange: (mode: 'pipeline' | 'table') => void;
  onSelectOpportunity: (opp: OpportunityTrackingOpportunity | null) => void;
  onCloseDetail: () => void;
  onOpenLog: (opp: OpportunityTrackingOpportunity) => void;
  onCloseLog: () => void;
  onLogDraftChange: (draft: OpportunityTrackingLogDraft) => void;
  onLogInteraction: () => void;
  onCreateOpportunity: () => void;
  onEditOpportunity: (opp: OpportunityTrackingOpportunity) => void;
}

const STAGE_CONFIG: Record<OpportunityTrackingDealStage, { color: string; bg: string; border: string; icon: React.ReactNode; order: number }> = {
  'Prospecting':   { color: 'text-gray-700',   bg: 'bg-gray-100',   border: 'border-gray-300',  icon: <Target className="w-3.5 h-3.5" />,       order: 1 },
  'Proposal Sent': { color: 'text-blue-700',   bg: 'bg-blue-100',   border: 'border-blue-300',  icon: <Mail className="w-3.5 h-3.5" />,          order: 2 },
  'Negotiation':   { color: 'text-purple-700', bg: 'bg-purple-100', border: 'border-purple-300',icon: <MessageSquare className="w-3.5 h-3.5" />, order: 3 },
  'Renewal Due':   { color: 'text-amber-700',  bg: 'bg-amber-100',  border: 'border-amber-300', icon: <AlertCircle className="w-3.5 h-3.5" />,   order: 4 },
  'Closed Won':    { color: 'text-green-700',  bg: 'bg-green-100',  border: 'border-green-300', icon: <CheckCircle className="w-3.5 h-3.5" />,   order: 5 },
  'Closed Lost':   { color: 'text-red-700',    bg: 'bg-red-100',    border: 'border-red-300',   icon: <XCircle className="w-3.5 h-3.5" />,       order: 6 },
};

const INTERACTION_ICONS: Record<OpportunityTrackingInteractionType, React.ReactNode> = {
  Meeting:    <Users className="w-3.5 h-3.5" />,
  Call:       <Phone className="w-3.5 h-3.5" />,
  Email:      <Mail className="w-3.5 h-3.5" />,
  'Site Visit': <Building2 className="w-3.5 h-3.5" />,
};

function StageBadge({ stage }: { stage: OpportunityTrackingDealStage }) {
  const cfg = STAGE_CONFIG[stage];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${cfg.bg} ${cfg.color}`}>
      {cfg.icon}{stage}
    </span>
  );
}

function InteractionIcon({ type }: { type: OpportunityTrackingInteractionType }) {
  const COLORS: Record<OpportunityTrackingInteractionType, string> = {
    Meeting: 'bg-blue-100 text-blue-600', Call: 'bg-green-100 text-green-600',
    Email: 'bg-gray-100 text-gray-600', 'Site Visit': 'bg-purple-100 text-purple-600',
  };
  return (
    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${COLORS[type]}`}>
      {INTERACTION_ICONS[type]}
    </span>
  );
}

const PIPELINE_STAGES: OpportunityTrackingDealStage[] = ['Prospecting', 'Proposal Sent', 'Negotiation', 'Renewal Due'];
const CLOSED_STAGES:   OpportunityTrackingDealStage[] = ['Closed Won', 'Closed Lost'];

export function OpportunityTracking({
  opportunities,
  filteredOpportunities,
  filterStage,
  filterType,
  searchTerm,
  viewMode,
  selectedOpp,
  isDetailOpen,
  isLogOpen,
  logDraft,
  onSearchTermChange,
  onFilterStageChange,
  onFilterTypeChange,
  onViewModeChange,
  onSelectOpportunity,
  onCloseDetail,
  onOpenLog,
  onCloseLog,
  onLogDraftChange,
  onLogInteraction,
  onCreateOpportunity,
  onEditOpportunity,
}: OpportunityTrackingProps) {
  const totalPipelineValue = opportunities
    .filter(o => !CLOSED_STAGES.includes(o.stage))
    .reduce((s, o) => s + o.estimatedValue, 0);
  const closedWonValue = opportunities.filter(o => o.stage === 'Closed Won').reduce((s, o) => s + o.estimatedValue, 0);
  const renewalDueCount = opportunities.filter(o => o.stage === 'Renewal Due').length;

  const daysUntil = (d: string) => Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);

  const setDraft = (patch: Partial<OpportunityTrackingLogDraft>) => onLogDraftChange({ ...logDraft, ...patch });

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-gray-900 mb-1">CRM & Opportunity Tracking</h1>
          <p className="text-sm text-gray-500">Track deal pipeline, log client interactions, and manage renewal cycles.</p>
        </div>
        <Button className="bg-[#0f2942] hover:bg-[#1a3d5c] text-white" onClick={onCreateOpportunity}>
          <Plus className="w-4 h-4 mr-2" />New Opportunity
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 bg-[#0f2942] text-white">
          <p className="text-xs text-blue-200 mb-1">Pipeline Value</p>
          <p className="text-xl text-white">HKD {(totalPipelineValue / 1000).toFixed(0)}K</p>
          <p className="text-xs text-blue-300 mt-1">{opportunities.filter(o => !CLOSED_STAGES.includes(o.stage)).length} open deals</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-1 mb-1"><CheckCircle className="w-4 h-4 text-green-500" /><p className="text-xs text-gray-500">Closed Won</p></div>
          <p className="text-xl text-green-600">HKD {(closedWonValue / 1000).toFixed(0)}K</p>
        </Card>
        <Card className="p-4 border-2 border-amber-300 bg-amber-50">
          <div className="flex items-center gap-1 mb-1"><AlertCircle className="w-4 h-4 text-amber-600" /><p className="text-xs text-amber-700">Renewal Due</p></div>
          <p className="text-2xl text-amber-600">{renewalDueCount}</p>
          <p className="text-xs text-gray-500 mt-1">Action required</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-1 mb-1"><TrendingUp className="w-4 h-4 text-blue-500" /><p className="text-xs text-gray-500">Total Opportunities</p></div>
          <p className="text-2xl text-blue-600">{opportunities.length}</p>
        </Card>
      </div>

      <Card className="p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Input
              placeholder="Search by company or opportunity ref..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="pl-4"
            />
          </div>
          <Select value={filterStage} onValueChange={(v) => onFilterStageChange(v as 'all' | OpportunityTrackingDealStage)}>
            <SelectTrigger className="w-full md:w-52"><SelectValue placeholder="All Stages" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {(['Prospecting','Proposal Sent','Negotiation','Renewal Due','Closed Won','Closed Lost'] as OpportunityTrackingDealStage[]).map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={(v) => onFilterTypeChange(v as 'all' | OpportunityTrackingAccountType)}>
            <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="All Types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Corporate">Corporate</SelectItem>
              <SelectItem value="Travel Agency">Travel Agency</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex border rounded-md overflow-hidden">
            <button onClick={() => onViewModeChange('pipeline')}
              className={`px-3 py-2 text-sm transition-colors ${viewMode === 'pipeline' ? 'bg-[#0f2942] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              Pipeline
            </button>
            <button onClick={() => onViewModeChange('table')}
              className={`px-3 py-2 text-sm transition-colors ${viewMode === 'table' ? 'bg-[#0f2942] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              Table
            </button>
          </div>
        </div>
      </Card>

      {viewMode === 'pipeline' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {PIPELINE_STAGES.map(stage => {
              const cfg  = STAGE_CONFIG[stage];
              const opps = filteredOpportunities.filter(o => o.stage === stage);
              return (
                <div key={stage} className={`rounded-lg border-2 ${cfg.border} ${cfg.bg} p-3`}>
                  <div className={`flex items-center justify-between mb-3`}>
                    <div className={`flex items-center gap-1 text-sm ${cfg.color}`}>{cfg.icon}{stage}</div>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full bg-white/70 ${cfg.color}`}>{opps.length}</span>
                  </div>
                  <div className="space-y-2">
                    {opps.length === 0
                      ? <p className="text-xs text-gray-400 text-center py-4">No deals</p>
                      : opps.map(o => (
                          <div key={o.id} onClick={() => onSelectOpportunity(o)}
                            className="bg-white rounded p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow border border-gray-100">
                            <p className="text-xs text-gray-900 mb-1">{o.companyName}</p>
                            <p className="text-xs text-gray-500 mb-2">{o.accountType === 'Corporate' ? '🏢' : '✈️'} {o.opportunityRef}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-700">HKD {(o.estimatedValue / 1000).toFixed(0)}K</span>
                              <span className={`text-xs ${daysUntil(o.expectedCloseDate) < 30 ? 'text-red-600' : 'text-gray-500'}`}>
                                {daysUntil(o.expectedCloseDate) < 0 ? 'Overdue' : `${daysUntil(o.expectedCloseDate)}d`}
                              </span>
                            </div>
                          </div>
                        ))}
                  </div>
                  {opps.length > 0 && (
                    <p className="text-xs text-center mt-2 pt-2 border-t border-gray-200 opacity-60">
                      HKD {opps.reduce((s, o) => s + o.estimatedValue, 0).toLocaleString()}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CLOSED_STAGES.map(stage => {
              const cfg  = STAGE_CONFIG[stage];
              const opps = filteredOpportunities.filter(o => o.stage === stage);
              return (
                <div key={stage} className={`rounded-lg border-2 ${cfg.border} ${cfg.bg} p-3`}>
                  <div className={`flex items-center justify-between mb-3`}>
                    <div className={`flex items-center gap-1 text-sm ${cfg.color}`}>{cfg.icon}{stage}</div>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full bg-white/70 ${cfg.color}`}>{opps.length}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {opps.length === 0
                      ? <p className="text-xs text-gray-400 col-span-2 text-center py-3">No deals</p>
                      : opps.map(o => (
                          <div key={o.id} onClick={() => onSelectOpportunity(o)}
                            className="bg-white rounded p-2 shadow-sm cursor-pointer hover:shadow-md transition-shadow border border-gray-100">
                            <p className="text-xs text-gray-900">{o.companyName}</p>
                            <p className="text-xs text-gray-500">HKD {(o.estimatedValue / 1000).toFixed(0)}K</p>
                          </div>
                        ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === 'table' && (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ref</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Est. Value</TableHead>
                  <TableHead>Close Date</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOpportunities.map(o => (
                  <TableRow key={o.id} className="hover:bg-gray-50">
                    <TableCell className="text-sm text-blue-700">{o.opportunityRef}</TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-900">{o.companyName}</p>
                      <p className="text-xs text-gray-500">{o.contactName}</p>
                    </TableCell>
                    <TableCell>
                      {o.accountType === 'Corporate'
                        ? <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700"><Building2 className="w-3 h-3" />Corp</span>
                        : <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700"><Plane className="w-3 h-3" />Agency</span>}
                    </TableCell>
                    <TableCell><StageBadge stage={o.stage} /></TableCell>
                    <TableCell className="text-sm text-gray-900">HKD {o.estimatedValue.toLocaleString()}</TableCell>
                    <TableCell className={`text-sm ${daysUntil(o.expectedCloseDate) < 30 ? 'text-red-600' : 'text-gray-600'}`}>{o.expectedCloseDate}</TableCell>
                    <TableCell className="text-sm text-gray-700">{o.assignedTo}</TableCell>
                    <TableCell className="text-sm text-gray-600">{o.lastActivityDate}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="outline" size="sm" className="text-xs px-2"
                          onClick={() => onOpenLog(o)}>
                          <MessageSquare className="w-3 h-3 mr-1" />Log
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onSelectOpportunity(o)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <Dialog open={isDetailOpen} onOpenChange={(open) => { if (!open) onCloseDetail(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedOpp && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle>{selectedOpp.companyName}</DialogTitle>
                    <p className="text-sm text-gray-500 mt-1">{selectedOpp.opportunityRef}</p>
                  </div>
                  <StageBadge stage={selectedOpp.stage} />
                </div>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    ['Contact', selectedOpp.contactName],
                    ['Email', selectedOpp.contactEmail],
                    ['Est. Value', `HKD ${selectedOpp.estimatedValue.toLocaleString()}`],
                    ['Expected Close', selectedOpp.expectedCloseDate],
                    ['Assigned To', selectedOpp.assignedTo],
                    ['Last Activity', selectedOpp.lastActivityDate],
                  ].map(([k, v]) => (
                    <div key={k} className="bg-gray-50 rounded p-3">
                      <p className="text-xs text-gray-500 mb-1">{k}</p>
                      <p className="text-gray-900">{v}</p>
                    </div>
                  ))}
                  <div className="bg-gray-50 rounded p-3 col-span-2">
                    <p className="text-xs text-gray-500 mb-1">Description</p>
                    <p className="text-gray-700 text-sm">{selectedOpp.description}</p>
                  </div>
                  {selectedOpp.notes && (
                    <div className="bg-amber-50 rounded p-3 col-span-2 border border-amber-200">
                      <p className="text-xs text-amber-700 mb-1">Notes / BD Flags</p>
                      <p className="text-amber-800 text-sm">{selectedOpp.notes}</p>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-gray-700">Interaction History</p>
                    <Button variant="outline" size="sm" className="text-xs"
                      onClick={() => onOpenLog(selectedOpp)}>
                      <Plus className="w-3 h-3 mr-1" />Log Interaction
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {selectedOpp.interactions.map(intr => (
                      <div key={intr.id} className="flex gap-3">
                        <div className="mt-0.5 shrink-0"><InteractionIcon type={intr.type} /></div>
                        <div className="flex-1 bg-gray-50 rounded p-3">
                          <div className="flex items-start justify-between mb-1">
                            <span className="text-xs text-gray-500">{intr.date} · {intr.type}</span>
                            <span className="text-xs text-gray-400">{intr.conductedBy}</span>
                          </div>
                          <p className="text-sm text-gray-900">{intr.summary}</p>
                          {intr.followUpDate && (
                            <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />Follow-up: {intr.followUpDate}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={onCloseDetail}>Close</Button>
                <Button className="bg-[#0f2942] hover:bg-[#1a3d5c] text-white" onClick={() => onEditOpportunity(selectedOpp)}>
                  <Edit className="w-4 h-4 mr-2" />Edit Stage
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isLogOpen} onOpenChange={(open) => { if (!open) onCloseLog(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Interaction</DialogTitle>
            <DialogDescription>{opportunities.find(o => o.id === logDraft.oppId)?.companyName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-[10px] block">Interaction Type *</Label>
              <Select value={logDraft.type} onValueChange={(v) => setDraft({ type: v as OpportunityTrackingInteractionType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Meeting">Meeting</SelectItem>
                  <SelectItem value="Call">Call</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="Site Visit">Site Visit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-[10px] block">Date *</Label>
              <Input type="date" value={logDraft.date} onChange={(e) => setDraft({ date: e.target.value })} />
            </div>
            <div>
              <Label className="mb-[10px] block">Summary *</Label>
              <Textarea
                rows={3}
                placeholder="What was discussed / agreed..."
                value={logDraft.summary}
                onChange={(e) => setDraft({ summary: e.target.value })}
              />
            </div>
            <div>
              <Label className="mb-[10px] block">Follow-up Date</Label>
              <Input type="date" value={logDraft.followUpDate} onChange={(e) => setDraft({ followUpDate: e.target.value })} />
            </div>
            <div>
              <Label className="mb-[10px] block">Conducted By</Label>
              <Input value={logDraft.conductedBy} onChange={(e) => setDraft({ conductedBy: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onCloseLog}>Cancel</Button>
            <Button
              className="bg-[#0f2942] hover:bg-[#1a3d5c] text-white"
              disabled={!logDraft.summary.trim()}
              onClick={onLogInteraction}
            >
              <CheckCircle className="w-4 h-4 mr-2" />Save Interaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
