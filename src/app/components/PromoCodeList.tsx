import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import {
  Search, Plus, Edit, Trash2, Percent, BookOpen, Building2,
  ChevronDown, ChevronRight, Hash, Calendar, Tag, ToggleLeft, ToggleRight,
  AlertTriangle,
} from 'lucide-react';

export type PromoCodeListCodeType = 'Discount' | 'Free bookings';

export interface PromoCodeListBatch {
  id: number;
  companyId: number;
  companyName: string;
  companyShortCode: string;
  prefix: string;
  titleEn: string;
  titleTradChi: string;
  codeType: PromoCodeListCodeType;
  startDate: string;
  endDate: string;
  reusable: boolean;
  amount: number;
  useLimit: number;
  totalCodes: number;
  usedCount: number;
  availability: boolean;
  sampleCodes: string[];
}

export interface PromoCodeListCompanyGroup {
  companyId: number;
  companyName: string;
  companyShortCode: string;
  batches: PromoCodeListBatch[];
}

export interface PromoCodeListProps {
  batches: PromoCodeListBatch[];
  companyGroups: PromoCodeListCompanyGroup[];
  filteredGroups: PromoCodeListCompanyGroup[];
  searchTerm: string;
  filterType: 'all' | PromoCodeListCodeType;
  filterStatus: 'all' | 'active' | 'inactive';
  filterCompany: 'all' | string;
  expandedCompanies: Set<number>;
  onSearchTermChange: (value: string) => void;
  onFilterTypeChange: (value: 'all' | PromoCodeListCodeType) => void;
  onFilterStatusChange: (value: 'all' | 'active' | 'inactive') => void;
  onFilterCompanyChange: (value: 'all' | string) => void;
  onToggleCompanyExpanded: (companyId: number) => void;
  onEditPromoCode?: (promoCodeId: number) => void;
  onCreatePromoCode?: () => void;
  onDeletePromoCode?: (promoCodeId: number) => void;
}

export const isBatchActive = (batch: PromoCodeListBatch): boolean => {
  const now = new Date();
  return (
    now >= new Date(batch.startDate) &&
    now <= new Date(batch.endDate) &&
    batch.availability &&
    batch.usedCount < batch.totalCodes
  );
};

const daysUntilDate = (dateStr: string): number => {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const usagePct = (b: PromoCodeListBatch) =>
  Math.min(100, Math.round((b.usedCount / b.totalCodes) * 100));

const TypeBadge = ({ type }: { type: PromoCodeListCodeType }) => {
  if (type === 'Discount') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
        <Percent className="w-3 h-3" /> Discount
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
      <BookOpen className="w-3 h-3" /> Free Bookings
    </span>
  );
};

const StatusBadge = ({ active }: { active: boolean }) =>
  active ? (
    <Badge className="bg-green-500 text-white text-xs">Active</Badge>
  ) : (
    <Badge variant="outline" className="text-gray-500 text-xs">Inactive</Badge>
  );

const UsageBar = ({ batch }: { batch: PromoCodeListBatch }) => {
  const pct = usagePct(batch);
  const barColor = pct >= 90 ? 'bg-red-500' : pct >= 60 ? 'bg-amber-500' : 'bg-blue-500';
  return (
    <div className="min-w-[130px]">
      <div className="flex justify-between mb-1">
        <span className="text-xs text-gray-600">
          {batch.usedCount.toLocaleString()} / {batch.totalCodes.toLocaleString()} used
        </span>
        <span className="text-xs text-gray-400">{pct}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`h-2 rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

export function PromoCodeList({
  batches,
  companyGroups,
  filteredGroups,
  searchTerm,
  filterType,
  filterStatus,
  filterCompany,
  expandedCompanies,
  onSearchTermChange,
  onFilterTypeChange,
  onFilterStatusChange,
  onFilterCompanyChange,
  onToggleCompanyExpanded,
  onEditPromoCode,
  onCreatePromoCode,
  onDeletePromoCode,
}: PromoCodeListProps) {
  const totalBatches = batches.length;
  const activeBatches = batches.filter(isBatchActive).length;
  const totalCodesAll = batches.reduce((s, b) => s + b.totalCodes, 0);
  const totalUsed = batches.reduce((s, b) => s + b.usedCount, 0);

  const batchCompanies = Array.from(
    new Map(batches.map((b) => [b.companyId, { id: b.companyId, name: b.companyName }])).values()
  );

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-gray-900 mb-1">Promo Code Batches</h1>
          <p className="text-sm text-gray-500">
            Corporate promo codes are created in batches per company. Expand a company to view its batches.
          </p>
        </div>
        <Button className="bg-[#0f2942] hover:bg-[#1a3d5c] text-white shrink-0" onClick={onCreatePromoCode}>
          <Plus className="w-4 h-4 mr-2" />
          Create Batch
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 bg-[#0f2942] text-white">
          <p className="text-xs text-blue-200 mb-1">Total Batches</p>
          <p className="text-2xl text-white">{totalBatches}</p>
          <p className="text-xs text-blue-300 mt-1">{companyGroups.length} companies</p>
        </Card>
        <Card className="p-4 border-2 border-green-300 bg-green-50">
          <p className="text-xs text-green-700 mb-1">Active Batches</p>
          <p className="text-2xl text-green-600">{activeBatches}</p>
          <p className="text-xs text-gray-500 mt-1">Currently running</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500 mb-1">Total Codes Generated</p>
          <p className="text-2xl text-blue-600">{totalCodesAll.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500 mb-1">Total Codes Used</p>
          <p className="text-2xl text-gray-700">{totalUsed.toLocaleString()}</p>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
            <div
              className="bg-blue-500 h-1.5 rounded-full"
              style={{ width: `${totalCodesAll > 0 ? (totalUsed / totalCodesAll) * 100 : 0}%` }}
            />
          </div>
        </Card>
      </div>

      <Card className="p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by prefix, title, or company…"
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterCompany} onValueChange={(v) => onFilterCompanyChange(v as 'all' | string)}>
            <SelectTrigger className="w-full md:w-52">
              <SelectValue placeholder="All Companies" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectItem value="all">All Companies</SelectItem>
              {batchCompanies.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={(v) => onFilterTypeChange(v as 'all' | PromoCodeListCodeType)}>
            <SelectTrigger className="w-full md:w-44">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Discount">Discount</SelectItem>
              <SelectItem value="Free bookings">Free Bookings</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={(v) => onFilterStatusChange(v as 'all' | 'active' | 'inactive')}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Batches</TableHead>
                <TableHead>
                  <span className="flex items-center gap-1">
                    <Hash className="w-3 h-3" /> Total Codes
                  </span>
                </TableHead>
                <TableHead>Used</TableHead>
                <TableHead>Active Batches</TableHead>
                <TableHead>Inactive Batches</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGroups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-10">
                    No promo code batches found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredGroups.flatMap((group) => {
                  const isExpanded = expandedCompanies.has(group.companyId);
                  const groupTotalCodes = group.batches.reduce((s, b) => s + b.totalCodes, 0);
                  const groupUsed = group.batches.reduce((s, b) => s + b.usedCount, 0);
                  const groupActive = group.batches.filter(isBatchActive).length;
                  const groupInactive = group.batches.length - groupActive;
                  const overallPct = groupTotalCodes > 0 ? Math.round((groupUsed / groupTotalCodes) * 100) : 0;

                  const companyRow = (
                    <TableRow
                      key={`company-${group.companyId}`}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => onToggleCompanyExpanded(group.companyId)}
                    >
                      <TableCell className="text-gray-400">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#0f2942] text-white flex items-center justify-center shrink-0">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-900 leading-tight">{group.companyName}</p>
                            <p className="text-xs text-gray-400 font-mono">{group.companyShortCode}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-900">{group.batches.length}</span>
                        <span className="text-xs text-gray-500 ml-1">batch{group.batches.length !== 1 ? 'es' : ''}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-700">{groupTotalCodes.toLocaleString()}</span>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-[120px]">
                          <div className="flex justify-between mb-1">
                            <span className="text-xs text-gray-600">{groupUsed.toLocaleString()}</span>
                            <span className="text-xs text-gray-400">{overallPct}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${overallPct >= 90 ? 'bg-red-500' : overallPct >= 60 ? 'bg-amber-500' : 'bg-blue-500'}`}
                              style={{ width: `${overallPct}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {groupActive > 0 ? (
                          <Badge className="bg-green-500 text-white text-xs">{groupActive} Active</Badge>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {groupInactive > 0 ? (
                          <Badge variant="outline" className="text-gray-500 text-xs">{groupInactive} Inactive</Badge>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );

                  if (!isExpanded) return [companyRow];

                  const batchRows = group.batches.map((batch) => {
                    const active = isBatchActive(batch);
                    const days = daysUntilDate(batch.endDate);
                    const expiryColor =
                      days < 0 ? 'text-red-600' : days < 30 ? 'text-amber-600' : 'text-gray-600';

                    return (
                      <TableRow key={`batch-${batch.id}`} className="bg-gray-50/50">
                        <TableCell></TableCell>
                        <TableCell colSpan={6}>
                          <div className="pl-8 pr-4 py-3">
                            <div className="grid grid-cols-12 gap-4 items-start">
                              <div className="col-span-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <Tag className="w-4 h-4 text-gray-400" />
                                  <span className="font-mono text-sm text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                                    {batch.prefix}-*
                                  </span>
                                </div>
                                <p className="text-sm text-gray-900 ml-6 leading-snug">{batch.titleEn}</p>
                                <p className="text-xs text-gray-500 ml-6">{batch.titleTradChi}</p>
                              </div>

                              <div className="col-span-2">
                                <div className="flex flex-col gap-1.5">
                                  <TypeBadge type={batch.codeType} />
                                  <p className="text-xs text-gray-700">
                                    {batch.codeType === 'Discount' ? (
                                      <span className="text-blue-700">{batch.amount}% off</span>
                                    ) : (
                                      <span className="text-green-700">
                                        {batch.amount} booking{batch.amount !== 1 ? 's' : ''} free
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-xs text-gray-500 flex items-center gap-1">
                                    {batch.reusable ? (
                                      <><ToggleRight className="w-3 h-3 text-green-600" /> Reusable</>
                                    ) : (
                                      <><ToggleLeft className="w-3 h-3 text-gray-400" /> Single-use</>
                                    )}
                                  </p>
                                </div>
                              </div>

                              <div className="col-span-3">
                                <div className="flex items-start gap-2">
                                  <Calendar className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                  <div>
                                    <p className="text-xs text-gray-500">Start: {batch.startDate}</p>
                                    <p className={`text-xs ${expiryColor}`}>End: {batch.endDate}</p>
                                    <p className={`text-xs ${expiryColor} mt-0.5`}>
                                      {days < 0 ? 'Expired' : days === 0 ? 'Expires today' : `${days} days left`}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      Use limit: <strong className="text-gray-700">{batch.useLimit} per code</strong>
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="col-span-2">
                                <p className="text-xs text-gray-500 mb-1">Code Usage</p>
                                <UsageBar batch={batch} />
                                {usagePct(batch) >= 90 && (
                                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" /> Nearly exhausted
                                  </p>
                                )}
                              </div>

                              <div className="col-span-2">
                                <div className="flex items-center gap-2 mb-2">
                                  <StatusBadge active={active} />
                                </div>
                                <div className="flex items-center gap-1 mt-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onEditPromoCode?.(batch.id);
                                    }}
                                  >
                                    <Edit className="w-3 h-3 mr-1" />
                                    Edit
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeletePromoCode?.(batch.id);
                                    }}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  });

                  return [companyRow, ...batchRows];
                })
              )}
            </TableBody>
          </Table>
        </div>
        <div className="px-4 py-3 border-t text-xs text-gray-500">
          Showing {filteredGroups.length} of {companyGroups.length} companies ·{' '}
          {filteredGroups.reduce((s, g) => s + g.batches.length, 0)} batches ·{' '}
          {filteredGroups.reduce((s, g) => s + g.batches.reduce((bs, b) => bs + b.totalCodes, 0), 0).toLocaleString()} codes total
        </div>
      </Card>
    </div>
  );
}
