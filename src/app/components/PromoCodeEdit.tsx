import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { StringDatePicker } from '../../../../ui/CustomDatePicker';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { ArrowLeft, Download, Save, Building2, Eye, FileSpreadsheet, Receipt, Upload, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { INITIAL_RECORDS } from './PurchaseCreate';
import { toast } from 'sonner@2.0.3';
import type { GeneratedCodesData } from './PromoCodeGeneratedPage';
import {
  downloadPromoCodeImportTemplate,
  findContractOptionByImportRef,
  getLongestCommonPrefix,
  parsePromoCodeImportSheet,
  type PromoCodeImportMetadata,
} from '../../../../../lib/promoCodeImport';

// ─── Types ────────────────────────────────────────────────────────────────────
// 2026-07-02 — wrapper-supplied contract shape. Mirrors the PurchaseRecord
// fields the dropdown renders (id, primaryName, purchaseRef, packagePrice,
// sessionsAdded, purchaseCategory). When the production wrapper passes the
// prop (even an empty array), we use it and never fall back to mock
// INITIAL_RECORDS. Empty list = "No available contracts found" (e.g. all
// Corporate contracts already have a non-pending promo batch via
// promo_generated_at). INITIAL_RECORDS is only for figma Make when the
// prop is omitted entirely.
//
// `value` is a wrapper-supplied, globally-unique string used as the Radix
// SelectItem's `value` prop. Radix internally clones each item and uses the
// value as the React key in that clone layer, so the value MUST be unique
// across the entire array. Real `purchases.id` and `travel_agency_contracts.id`
// share the same AUTO_INCREMENT and can collide — `value` namespaces them
// by purchaseCategory so Radix's internal keying stays unique.
export interface ContractOption {
  id: number;
  value: string;
  purchaseRef: string;
  purchaseCategory: 'Corporate' | 'Agency';
  primaryName: string;
  packagePrice: number;
  sessionsAdded?: number;
  // 2026-07-02 — wrapper-supplied resolved `companies.id` for this
  // contract (Corporate purchases resolve via `purchase.account.company_id`;
  // Agency contracts leave this undefined because travel agencies aren't
  // companies in the current schema). Sent through `onNavigateToCodesPage`
  // so the wrapper can pass it as the `company_id` field on the batch
  // API without sending the wrong id.
  companyId?: number;
  // 2026-07-15 — Corporate contract promo intent from Purchase Create.
  // Autoloaded into Title / Prefix / Quantity when the contract is selected.
  promoCodeName?: string;
  promoCodeQuantity?: number;
  // 2026-07-15 — Contract validity window. Prefills promo start/end so the
  // batch stays in sync with the Corporate order expiry.
  startDate?: string;
  endDate?: string;
}

// ─── Get available contracts ──────────────────────────────────────────────────
function getAvailableContracts(prop?: ContractOption[]): ContractOption[] {
  // 2026-07-15 — When the production wrapper supplies the prop, honour it
  // even when empty. Previously `prop.length > 0` let an empty real list
  // (all contracts already generated promo / non-pending) fall through to
  // INITIAL_RECORDS, resurfacing Cathay/HSBC/Jardine mock rows in prod.
  if (prop !== undefined) {
    return prop.filter(c => c.purchaseCategory === 'Corporate' || c.purchaseCategory === 'Agency');
  }
  // figma Make fallback — mock records only when no wrapper prop is present
  return INITIAL_RECORDS
    .filter(r => r.purchaseCategory === 'Corporate' || r.purchaseCategory === 'Agency')
    .map(r => ({
      id: r.id,
      value: `${r.purchaseCategory}-${r.id}`,
      purchaseRef: r.purchaseRef,
      purchaseCategory: r.purchaseCategory as 'Corporate' | 'Agency',
      primaryName: r.primaryName,
      packagePrice: r.packagePrice,
      sessionsAdded: r.sessionsAdded,
    }));
}

// ─── Generate short code from company name ────────────────────────────────────
function generateShortCode(companyName: string): string {
  const words = companyName.split(' ').filter(w => w.length > 0);
  let code = words.map(w => w[0].toUpperCase()).join('').slice(0, 4);
  if (code.length < 3 && words[0]) {
    code = words[0].substring(0, 4).toUpperCase();
  }
  return code.replace(/[^A-Z0-9]/g, '') || 'PROMO';
}

// ─── Generate unique codes ────────────────────────────────────────────────────
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function randomSuffix(len = 6): string {
  let result = '';
  for (let i = 0; i < len; i++) result += CHARS[Math.floor(Math.random() * CHARS.length)];
  return result;
}

function generateUniqueCodes(prefix: string, count: number): string[] {
  const codes = new Set<string>();
  const cleanPrefix = prefix.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  while (codes.size < count) codes.add(`${cleanPrefix}-${randomSuffix(6)}`);
  return Array.from(codes);
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface PromoCodeEditInitialData {
  prefix: string;
  codeCount: number;
  codeType: 'Discount' | 'Free bookings';
  amount: number;
  useLimit: number;
  reusable: boolean;
  availability: boolean;
  startDate: string;
  endDate: string;
  titleEn: string;
  titleSimpChi: string;
  titleTradChi: string;
  descriptionEn: string;
  descriptionSimpChi: string;
  descriptionTradChi: string;
  /** Read-only contract label on Edit (company / account / purchase name). */
  contractDisplayName?: string;
  /** Read-only contract / purchase reference (e.g. CO-20260817). */
  contractRef?: string;
}

export interface PromoCodeEditProps {
  promoCodeId?: number | null;
  initialData?: PromoCodeEditInitialData | null;
  onBack?: () => void;
  onNavigateToCodesPage?: (data: GeneratedCodesData) => void;
  // 2026-07-02 — wrapper fetches real contracts (Corporate purchases +
  // TravelAgency contracts) and passes them down. When provided (including
  // `[]`), mock INITIAL_RECORDS must not appear. INITIAL_RECORDS is only
  // for figma Make when this prop is omitted.
  availableContracts?: ContractOption[];
}

// ─── Mock batch data for edit mode ───────────────────────────────────────────
const MOCK_BATCH_EDIT = {
  contractId: 101,
  prefix: 'CPA',
  codeCount: 20,
  titleEn: 'Cathay Pacific Welcome Offer',
  titleSimpChi: '国泰航空欢迎优惠',
  titleTradChi: '國泰航空歡迎優惠',
  codeType: 'Free bookings' as const,
  descriptionEn: 'Exclusive discount for Cathay Pacific employees',
  descriptionSimpChi: '国泰航空员工专享折扣',
  descriptionTradChi: '國泰航空員工專享折扣',
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  amount: 1,
  useLimit: 1,
  reusable: false,
  availability: true,
};

// ─── Main Component ───────────────────────────────────────────────────────────
export function PromoCodeEdit({ promoCodeId, initialData, onBack, onNavigateToCodesPage, availableContracts: availableContractsProp }: PromoCodeEditProps) {
  const isEditMode = promoCodeId !== null;
  const availableContracts = getAvailableContracts(availableContractsProp);

  // ── Contract & prefix state ────────────────────────────────────────────────
  // Radix Select is keyed by unique `value` (Corporate-{id} / Agency-{id});
  // numeric id alone is ambiguous across purchases vs travel_agency_contracts.
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null);
  const [selectedContractValue, setSelectedContractValue] = useState('');
  const [prefix, setPrefix]     = useState('');
  const [codeCount, setCodeCount] = useState<number>(10);
  /** Pre-generated codes from Excel/CSV import (create mode only). */
  const [uploadedCodes, setUploadedCodes] = useState<string[]>([]);
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);

  // ── Form fields ──────────────────────────────────────────────────────────
  const [codeType, setCodeType]   = useState<'Discount' | 'Free bookings'>('Free bookings');
  const [amount, setAmount]       = useState<number>(1);
  const [useLimit, setUseLimit]   = useState<number>(1);
  const [reusable, setReusable]   = useState(false);
  const [availability, setAvailability] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate]     = useState('');
  const [titleEn, setTitleEn]               = useState('');
  const [titleSimpChi, setTitleSimpChi]     = useState('');
  const [titleTradChi, setTitleTradChi]     = useState('');
  const [descriptionEn, setDescriptionEn]           = useState('');
  const [descriptionSimpChi, setDescriptionSimpChi] = useState('');
  const [descriptionTradChi, setDescriptionTradChi] = useState('');

  // Show "Reusable by Same User" only when use limit > 1
  const showReusableSection = useLimit > 1;

  // ── Prefill in edit mode ─────────────────────────────────────────────────
  useEffect(() => {
    if (initialData) {
      setPrefix(initialData.prefix);
      setCodeCount(initialData.codeCount);
      setCodeType(initialData.codeType);
      setAmount(initialData.amount);
      setUseLimit(initialData.useLimit);
      setReusable(initialData.reusable);
      setAvailability(initialData.availability);
      setStartDate(initialData.startDate);
      setEndDate(initialData.endDate);
      setTitleEn(initialData.titleEn);
      setTitleSimpChi(initialData.titleSimpChi);
      setTitleTradChi(initialData.titleTradChi);
      setDescriptionEn(initialData.descriptionEn);
      setDescriptionSimpChi(initialData.descriptionSimpChi);
      setDescriptionTradChi(initialData.descriptionTradChi);
    }
  }, [initialData]);

  const editContractDisplayName =
    selectedContract?.primaryName
    || initialData?.contractDisplayName
    || null;
  const editContractRef =
    selectedContract?.purchaseRef
    || initialData?.contractRef
    || null;

  // ── When contract changes, auto-fill code name + prefix + quantity + dates ─
  // 2026-07-15 — Corporate contracts carry promo_code_name / quantity from
  // Purchase Create. Prefer those over company-name initials so staff do not
  // retype SUMMER2026 / 100. Title = code name; prefix = cleaned code name
  // (fallback: generateShortCode(primaryName)); quantity = promo qty.
  // Start/end dates come from the contract validity window so promo expiry
  // stays aligned with the Corporate order (and later contract edits sync
  // end_date on the API side).
  const handleContractChange = (val: string, options?: { skipAutofill?: boolean }) => {
    const contract = availableContracts.find(c => c.value === val);
    if (!contract) return;

    setSelectedContractId(contract.id);
    setSelectedContractValue(contract.value);

    // Excel import already set quantity/prefix/titles/dates — only bind the Select.
    if (options?.skipAutofill || uploadedCodes.length > 0) {
      return;
    }

    const rawName = (contract.promoCodeName ?? '').trim();
    const cleanedPrefix = rawName
      ? rawName.toUpperCase().replace(/[^A-Z0-9]/g, '')
      : generateShortCode(contract.primaryName);
    setPrefix(cleanedPrefix || generateShortCode(contract.primaryName));

    const qty = contract.promoCodeQuantity ?? contract.sessionsAdded;
    setCodeCount(Math.max(1, Math.min(10000, Number(qty) > 0 ? Number(qty) : 1)));

    // Code name → Title (English). Always overwrite when the contract has a
    // name so the intended code name wins over a previous selection.
    if (rawName) {
      setTitleEn(rawName);
    } else if (!titleEn.trim()) {
      setTitleEn(`${contract.primaryName} Promo Codes`);
    }

    // Prefill validity from contract dates (YYYY-MM-DD).
    const toDateOnly = (d?: string) => (d ? String(d).split('T')[0] : '');
    if (contract.startDate) setStartDate(toDateOnly(contract.startDate));
    if (contract.endDate) setEndDate(toDateOnly(contract.endDate));
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const contract = selectedContract;
    if (!isEditMode && (!contract || selectedContractId == null)) {
      toast.error('Please select a contract');
      return;
    }
    const isCorporateOrTA = contract &&
      (contract.purchaseCategory === 'Corporate' || contract.purchaseCategory === 'Agency');

    toast.success('Promo code batch saved successfully!', {
      description: uploadedCodes.length > 0
        ? `Batch record created with ${uploadedCodes.length} imported codes…`
        : 'Batch record created. Generating unique codes…',
    });

    if (isCorporateOrTA && !isEditMode) {
      setTimeout(() => {
        toast.info('VIP Account Creation Request Sent', {
          description: `A request has been sent to create VIP accounts for ${contract.primaryName}.`,
          duration: 5000,
        });
      }, 500);
    }

    // Prefer Excel/CSV import; otherwise generate random codes from prefix.
    setTimeout(() => {
      const fromUpload = uploadedCodes.length > 0;
      const batchCodes = fromUpload
        ? uploadedCodes
        : generateUniqueCodes(prefix, codeCount);
      onNavigateToCodesPage({
        prefix,
        codes: batchCodes,
        fromUpload,
        companyName: contract?.primaryName,
        purchaseCategory: contract?.purchaseCategory as 'Corporate' | 'Agency' | undefined,
        mode: 'generate',
        // pass full form state through so container can call batch API
        codeType,
        amount,
        useLimit,
        reusable,
        startDate,
        endDate,
        titleEn,
        titleSimpChi,
        titleTradChi,
        descriptionEn,
        descriptionSimpChi,
        descriptionTradChi,
        selectedContractId,
        // 2026-07-02 — pass through the wrapper-resolved company_id so
        // the container can send it as `company_id` in the batch payload
        // (rather than the misleading `selectedContractId`).
        companyId: contract?.companyId ?? null,
      });
    }, 800);
  };

  const applyImportMetadata = useCallback(
    (metadata: PromoCodeImportMetadata) => {
      // Only overwrite fields that the spreadsheet actually provided.
      if (metadata.contractRef) {
        const match = findContractOptionByImportRef(availableContracts, metadata.contractRef);
        if (match) {
          // Bind Radix Select via unique option value (not ambiguous numeric id).
          handleContractChange(match.value, { skipAutofill: true });
        } else {
          toast.message('Contract from file not matched', {
            description: `No available contract matches “${metadata.contractRef}”. Select one manually.`,
          });
        }
      }
      if (metadata.startDate) setStartDate(metadata.startDate);
      if (metadata.endDate) setEndDate(metadata.endDate);
      if (metadata.titleEn) setTitleEn(metadata.titleEn);
      if (metadata.titleZh) setTitleTradChi(metadata.titleZh);
      if (metadata.titleCn) setTitleSimpChi(metadata.titleCn);
      if (metadata.descriptionEn) setDescriptionEn(metadata.descriptionEn);
      if (metadata.descriptionZh) setDescriptionTradChi(metadata.descriptionZh);
      if (metadata.descriptionCn) setDescriptionSimpChi(metadata.descriptionCn);
    },
    // handleContractChange closes over availableContracts / uploadedCodes;
    // availableContracts is the dependency that matters for matching.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [availableContracts],
  );

  const applyUploadedCodes = useCallback(
    (codes: string[], fileName: string, metadata: PromoCodeImportMetadata = {}) => {
      if (codes.length === 0) {
        toast.error('No promo codes found in the file', {
          description: 'Put one code per row in the first column (optional “Promo code” header).',
        });
        return;
      }
      if (codes.length > 10000) {
        toast.error('Too many codes', { description: 'Maximum 10,000 codes per batch.' });
        return;
      }
      const lcp = getLongestCommonPrefix(codes);
      setUploadedCodes(codes);
      setUploadFileName(fileName);
      setCodeCount(codes.length);
      // Prefix stays editable — LCP is only a starting suggestion.
      setPrefix(lcp.toUpperCase().replace(/[^A-Z0-9]/g, '') || prefix);
      applyImportMetadata(metadata);
      const metaBits: string[] = [];
      if (metadata.contractRef) metaBits.push('contract');
      if (metadata.startDate || metadata.endDate) metaBits.push('dates');
      if (metadata.titleEn || metadata.titleZh || metadata.titleCn) metaBits.push('titles');
      toast.success(`Imported ${codes.length} promo codes`, {
        description: [
          lcp ? `Suggested prefix: ${lcp}` : 'Could not detect a shared prefix — enter one manually.',
          metaBits.length ? `Also filled ${metaBits.join(', ')} from row 1.` : null,
        ]
          .filter(Boolean)
          .join(' '),
      });
    },
    [applyImportMetadata, prefix],
  );

  const clearUploadedCodes = useCallback(() => {
    setUploadedCodes([]);
    setUploadFileName(null);
  }, []);

  const onDropPromoFile = useCallback(
    async (accepted: File[]) => {
      const file = accepted[0];
      if (!file) return;
      try {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        // Prefer "Import Data" sheet from the official template when present.
        const sheetName =
          workbook.SheetNames.find((name) => name.trim().toLowerCase() === 'import data')
          ?? workbook.SheetNames[0];
        if (!sheetName) {
          toast.error('The file has no sheets');
          return;
        }
        const sheet = workbook.Sheets[sheetName];
        const parsed = parsePromoCodeImportSheet(sheet);
        applyUploadedCodes(parsed.codes, file.name, parsed.metadata);
      } catch {
        toast.error('Could not read the file', {
          description: 'Upload a .xlsx or .csv using the Promo Code Import Template.',
        });
      }
    },
    [applyUploadedCodes],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => {
      void onDropPromoFile(files);
    },
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
      'text/plain': ['.csv'],
    },
    multiple: false,
    disabled: isEditMode,
  });

  // ── View codes (edit mode) ───────────────────────────────────────────────
  const handleViewCodes = () => {
    const generatedCodes = generateUniqueCodes(prefix, codeCount);
    onNavigateToCodesPage({
      prefix,
      codes: generatedCodes,
      companyName: selectedContract?.primaryName,
      purchaseCategory: selectedContract?.purchaseCategory as 'Corporate' | 'Agency' | undefined,
      mode: 'view',
    });
  };

  const selectedContract =
    availableContracts.find((c) => c.value === selectedContractValue)
    ?? availableContracts.find((c) => c.id === selectedContractId);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1>{isEditMode ? 'Edit Promo Code Batch' : 'Create Promo Code Batch'}</h1>
            <p className="text-gray-600 text-sm">
              {isEditMode
                ? 'Update settings for this promo code batch'
                : 'Select a contract and configure the promo code batch settings'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditMode && (
            <Button
              type="button"
              variant="outline"
              onClick={handleViewCodes}
              className="gap-2 border-[#0f2942] text-[#0f2942] hover:bg-[#0f2942] hover:text-white"
            >
              <Eye className="w-4 h-4" />
              View Generated Codes
            </Button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── STEP 1 : Contract & Prefix ─────────────────────────── */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-6 h-6 rounded-full bg-[#0f2942] text-white flex items-center justify-center text-xs">1</div>
            <h2 className="text-base">Contract & Promo Code Settings</h2>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Contract selector */}
            <div>
              <label className="block text-sm" style={{ marginBottom: 10 }}>
                <Receipt className="inline w-4 h-4 mr-1 text-gray-500" />
                Select Contract *
              </label>
              {isEditMode ? (
                <div className="flex flex-col gap-2 px-3 py-3 bg-gray-50 border border-gray-200 rounded-md">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">
                      {editContractDisplayName ?? '—'}
                    </span>
                    <Badge variant="outline" className="ml-auto text-xs font-mono">{prefix}</Badge>
                  </div>
                  <div className="text-xs text-gray-500 pl-6 space-y-0.5">
                    {editContractRef ? (
                      <div>Contract ID: {editContractRef}</div>
                    ) : null}
                    {selectedContract ? (
                      <>
                        <div>Price: HKD {selectedContract.packagePrice.toLocaleString()}</div>
                        <div>Quantity: {selectedContract.promoCodeQuantity ?? selectedContract.sessionsAdded ?? 0}</div>
                      </>
                    ) : codeCount > 0 ? (
                      <div>Quantity: {codeCount}</div>
                    ) : null}
                  </div>
                </div>
              ) : (
                <>
                  <Select
                    value={selectedContractValue}
                    onValueChange={(val) => handleContractChange(val)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a contract…" />
                    </SelectTrigger>
                    <SelectContent className="max-h-80">
                      {availableContracts.length === 0 ? (
                        <div className="px-3 py-6 text-center text-sm text-gray-500">No available contracts found.</div>
                      ) : (
                        availableContracts.map(c => {
                          // Prefer contract promo name as prefix label; fall back to company initials.
                          const prefixLabel = (c.promoCodeName ?? '')
                            .toUpperCase()
                            .replace(/[^A-Z0-9]/g, '') || generateShortCode(c.primaryName);
                          const qty = c.promoCodeQuantity ?? c.sessionsAdded ?? 0;
                          return (
                          // 2026-07-02 — key/value uses c.value (a globally-unique
                          // string like "Corporate-1" or "Agency-1") so Radix's
                          // internal clone layer doesn't trip on the duplicate
                          // numeric ids that come from separate AUTO_INCREMENT
                          // tables (`purchases.id` vs `travel_agency_contracts.id`).
                          <SelectItem key={c.value} value={c.value}>
                            <div className="flex flex-col gap-1 py-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">{c.primaryName}</span>
                                <Badge variant="outline" className="text-xs font-mono">[{prefixLabel}]</Badge>
                              </div>
                              <div className="text-xs text-gray-500 space-x-3">
                                <span>Contract: {c.purchaseRef}</span>
                                <span>•</span>
                                <span>HKD {c.packagePrice.toLocaleString()}</span>
                                <span>•</span>
                                <span>Qty: {qty}</span>
                                {c.promoCodeName ? (
                                  <>
                                    <span>•</span>
                                    <span>Name: {c.promoCodeName}</span>
                                  </>
                                ) : null}
                              </div>
                            </div>
                          </SelectItem>
                          );
                        })
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    A contract is required. Selecting one auto-fills code name, prefix, quantity (locked), and contract dates.
                  </p>
                </>
              )}
            </div>

            {/* Excel / CSV import (create mode) */}
            {!isEditMode ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Import pre-generated codes (optional)
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2 shrink-0"
                    onClick={() => {
                      downloadPromoCodeImportTemplate();
                      toast.success('Template downloaded', {
                        description: 'Promo_Code_Import_Template.xlsx',
                      });
                    }}
                  >
                    <Download className="w-4 h-4" />
                    Download Template
                  </Button>
                </div>
                {uploadedCodes.length > 0 ? (
                  <div className="flex items-start justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <FileSpreadsheet className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-emerald-900 truncate">
                          {uploadFileName ?? 'Uploaded file'}
                        </p>
                        <p className="text-xs text-emerald-800 mt-0.5">
                          {uploadedCodes.length.toLocaleString()} codes imported — quantity locked; prefix is editable.
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-emerald-800 hover:text-red-600"
                      onClick={clearUploadedCodes}
                      aria-label="Clear uploaded codes"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    {...getRootProps()}
                    className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors ${
                      isDragActive
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Upload className="w-6 h-6 text-gray-500" />
                    <p className="text-sm text-gray-700">
                      {isDragActive
                        ? 'Drop the file here…'
                        : 'Drag & drop an Excel or CSV file, or click to browse'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Use the template: first column = codes; Contract / dates / titles / descriptions on row 1 are auto-filled.
                    </p>
                  </div>
                )}
              </div>
            ) : null}

            {/* Prefix & Quantity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div>
                <label className="block text-xs font-medium text-blue-900 mb-2">
                  Promo Code Prefix *
                </label>
                <Input
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  placeholder="e.g. CPA"
                  className="font-mono bg-white"
                  required
                  disabled={isEditMode}
                />
                <p className="text-xs text-blue-700 mt-1">
                  {uploadedCodes.length > 0
                    ? 'Auto-filled from longest common prefix — you can still edit it.'
                    : <>Format: <span className="font-mono font-medium">{prefix || 'PREFIX'}-XXXXXX</span></>}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-900 mb-2">
                  Promo Code Quantity *
                </label>
                <Input
                  type="number"
                  min={1}
                  max={10000}
                  value={codeCount}
                  onChange={(e) => setCodeCount(Math.max(1, Math.min(10000, Number(e.target.value))))}
                  placeholder="Select a contract first"
                  className="bg-white"
                  required
                  disabled
                  readOnly
                />
                <p className="text-xs text-blue-700 mt-1">
                  {uploadedCodes.length > 0
                    ? 'Locked to the number of imported codes'
                    : 'Locked to the selected contract quantity (not editable)'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* ── STEP 2 : Code Type & Value ──────────────────────────────────── */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-6 h-6 rounded-full bg-[#0f2942] text-white flex items-center justify-center text-xs">2</div>
            <h2 className="text-base">Code Type & Value</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm" style={{ marginBottom: 10 }}>Code Type *</label>
              <select
                value={codeType}
                onChange={(e) => {
                  const t = e.target.value as 'Discount' | 'Free bookings';
                  setCodeType(t);
                  setAmount(t === 'Discount' ? 10 : 1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                required
              >
                <option value="Free bookings">Free Bookings</option>
                <option value="Discount">Discount (%)</option>
              </select>
            </div>

            {codeType === 'Discount' && (
              <div>
                <label className="block text-sm" style={{ marginBottom: 10 }}>Discount Percentage (%) *</label>
                <Input
                  type="number" min={1} max={100}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="e.g. 15"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Percentage discount applied at checkout.</p>
              </div>
            )}

            {codeType === 'Free bookings' && (
              <div>
                <label className="block text-sm" style={{ marginBottom: 10 }}>Number of Free Bookings *</label>
                <Input
                  type="number" min={1}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="e.g. 1"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Complimentary bookings granted per code use.</p>
              </div>
            )}

            <div>
              <label className="block text-sm" style={{ marginBottom: 10 }}>Use Limit per Code *</label>
              <Input
                type="number" min={1}
                value={useLimit}
                onChange={(e) => setUseLimit(Number(e.target.value))}
                placeholder="e.g. 1"
                required
              />
              <p className="text-xs text-gray-500 mt-1">How many times each individual code can be used.</p>
            </div>

            {/* Reusable by Same User — only shown when useLimit > 1 */}
            {showReusableSection && (
              <div>
                <label className="block text-sm" style={{ marginBottom: 10 }}>Reusable by Same User</label>
                <div className="flex items-center gap-6 mt-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="reusable" checked={reusable === true}  onChange={() => setReusable(true)}  className="w-4 h-4" />
                    <span className="text-sm">Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="reusable" checked={reusable === false} onChange={() => setReusable(false)} className="w-4 h-4" />
                    <span className="text-sm">No</span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">Can the same customer use this code more than once?</p>
              </div>
            )}
          </div>
        </Card>

        {/* ── STEP 3 : Validity & Availability ───────────────────────────── */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-6 h-6 rounded-full bg-[#0f2942] text-white flex items-center justify-center text-xs">3</div>
            <h2 className="text-base">Validity Period & Availability</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm" style={{ marginBottom: 10 }}>Start Date *</label>
              <StringDatePicker value={startDate} onChange={setStartDate} required />
            </div>
            <div>
              <label className="block text-sm" style={{ marginBottom: 10 }}>End Date *</label>
              <StringDatePicker value={endDate} onChange={setEndDate} required />
            </div>
            <div>
              <label className="block text-sm" style={{ marginBottom: 10 }}>Availability</label>
              <div className="flex items-center gap-6 mt-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="availability" checked={availability === true}  onChange={() => setAvailability(true)}  className="w-4 h-4" />
                  <span className="text-sm">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="availability" checked={availability === false} onChange={() => setAvailability(false)} className="w-4 h-4" />
                  <span className="text-sm">Inactive</span>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">Enable or disable all codes in this batch.</p>
            </div>
          </div>
        </Card>

        {/* ── STEP 4 : Title (Multilingual) ───────────────────────────────── */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-6 h-6 rounded-full bg-[#0f2942] text-white flex items-center justify-center text-xs">4</div>
            <h2 className="text-base">Title <span className="text-gray-400 text-sm font-normal">(Multilingual — Optional)</span></h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm" style={{ marginBottom: 10 }}>Title (English) <span className="text-gray-400 text-xs">(Optional)</span></label>
              <Input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} placeholder="Enter title in English" />
            </div>
            <div>
              <label className="block text-sm" style={{ marginBottom: 10 }}>Title (Simplified Chinese) <span className="text-gray-400 text-xs">(Optional)</span></label>
              <Input value={titleSimpChi} onChange={(e) => setTitleSimpChi(e.target.value)} placeholder="输入简体中文标题" />
            </div>
            <div>
              <label className="block text-sm" style={{ marginBottom: 10 }}>Title (Traditional Chinese) <span className="text-gray-400 text-xs">(Optional)</span></label>
              <Input value={titleTradChi} onChange={(e) => setTitleTradChi(e.target.value)} placeholder="輸入繁體中文標題" />
            </div>
          </div>
        </Card>

        {/* ── STEP 5 : Description (Multilingual) ────────────────────────── */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-6 h-6 rounded-full bg-[#0f2942] text-white flex items-center justify-center text-xs">5</div>
            <h2 className="text-base">Description <span className="text-gray-400 text-sm font-normal">(Multilingual — Optional)</span></h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm" style={{ marginBottom: 10 }}>Description (English) <span className="text-gray-400 text-xs">(Optional)</span></label>
              <Textarea value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} placeholder="Enter description in English" rows={3} />
            </div>
            <div>
              <label className="block text-sm" style={{ marginBottom: 10 }}>Description (Simplified Chinese) <span className="text-gray-400 text-xs">(Optional)</span></label>
              <Textarea value={descriptionSimpChi} onChange={(e) => setDescriptionSimpChi(e.target.value)} placeholder="输入简体中文描述" rows={3} />
            </div>
            <div>
              <label className="block text-sm" style={{ marginBottom: 10 }}>Description (Traditional Chinese) <span className="text-gray-400 text-xs">(Optional)</span></label>
              <Textarea value={descriptionTradChi} onChange={(e) => setDescriptionTradChi(e.target.value)} placeholder="輸入繁體中文描述" rows={3} />
            </div>
          </div>
        </Card>

        {/* ── Action Buttons ───────────────────────────────────────────────── */}
        <div className="flex gap-3 justify-end pb-4">
          <Button type="button" variant="outline" onClick={onBack}>Cancel</Button>
          <Button type="submit" className="bg-[#0f2942] hover:bg-[#1a3d5c] text-white gap-2">
            <Save className="w-4 h-4" />
            {isEditMode ? 'Update Batch' : 'Save & Generate Codes'}
          </Button>
        </div>
      </form>
    </div>
  );
}