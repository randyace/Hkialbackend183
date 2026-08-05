import { useRef, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  ArrowLeft, Search, User, Building2, Plane, Star, Gem, Award, Trophy,
  CheckCircle, TrendingUp, Package, CreditCard, Info, FileText, X,
} from 'lucide-react';

// 2026-07-07 (round 6.2.126 — HK timezone correction) — replace the
// per-site `new Date().toISOString().split('T')[0]` pattern, which
// returns UTC date (off by one day for users in timezones east of
// UTC, e.g. HK at UTC+8 between 00:00–08:00 local time — verified live
// by Sky 2026-07-07 against admin CreateBooking). This helper uses
// LOCAL components (`getFullYear` / `getMonth` / `getDate`) so the
// returned YYYY-MM-DD string matches the user's wall-clock day.
// INV-X18: product calendar day is HKT (not browser-local / UTC).
const localDateStr = (d: Date = new Date()): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Hong_Kong' }).format(d);

// ─── Shared Types (exported for PurchaseManagement) ───────────────────────────

export type PurchaseCategory = 'Individual' | 'Corporate' | 'Agency';
export type Tier = 'Gold' | 'Platinum' | 'Diamond' | 'Sapphire';
export type TierOrNone = Tier | 'None';
export type PaymentMethod = 'Bank Transfer' | 'Branch Transfer' | 'Corporate Account';
export type PurchaseStatus = 'Pending Invoice' | 'Invoice Sent';

export interface GradingPackage {
  kind: 'grading';
  tier: Tier;
  price: number;
  credits: number;
  validityMonths: number;
}

export interface SessionBundle {
  kind: 'bundle';
  id: string;
  label: string;
  sessions: number;
  price: number;
  validityMonths: number;
}

export type PackageChoice = GradingPackage | SessionBundle;

export interface AccountOption {
  // 2026-07-06 round 6.2.111 — `id` is now carried alongside `accountNumber`
  // so the parent wrapper (`hkial-react/src/components/PurchaseManagement.tsx`
  // handlePurchaseComplete) can map the selected dropdown option back to the
  // API `Account.id` for `purchaseService.createPurchase({ account_id })`.
  // Was previously dropped in the `allAccounts.map(...)` step, so every
  // New Contract submission fired the silent "Unable to map selected account
  // to API record" toast since the 6.2.49 split that converted `accounts`
  // from raw `Account[]` to `AccountOption[]`.
  id?: number;
  accountNumber: string;
  primaryName: string;
  email: string;
  purchaseCategory: PurchaseCategory;
  currentTier?: TierOrNone;
  currentCredits?: number;
  currentSessions?: number;
  // 2026-07-14 round 6.2.147 — HKD credit balance for Corporate/Agency.
  // `currentSessions` was historically populated from `acc.credit_balance`
  // for Corp/Agency, rendering e.g. "7777.00 sessions" on the New Contract
  // picker. The "X sessions" label was inherited from the MOCK_ACCOUNTS
  // where Corp accounts had real session counts (5, 18, 12, 7), but the
  // real backend has no session-count column for Corp/Agency — only HKD
  // `credit_balance`. Mirrors the M51 pattern (round 6.2.143 — AccountList,
  // MemberDetail, CreateBooking all show HKD for Corp/Agency). Picker,
  // form summary "Current sessions", and form summary "X → Y after invoice"
  // now read this field for Corp/Agency and render HKD to 2 dp en-HK locale.
  creditBalanceHKD?: number;
  contactPerson?: string;
}

export interface PurchaseRecord {
  id: number;
  purchaseRef: string;
  purchaseDate: string;
  purchaseCategory: PurchaseCategory;
  accountNumber: string;
  primaryName: string;
  primaryEmail: string;
  previousTier?: TierOrNone;
  newTier?: Tier;
  creditsAdded?: number;
  totalCreditsAfter?: number;
  bundleLabel?: string;
  sessionsAdded?: number;
  totalSessionsAfter?: number;
  packagePrice: number;
  paymentMethod: PaymentMethod;
  transactionRef: string;
  processedBy: string;
  notes: string;
  expiryDate: string;
  status: PurchaseStatus;
  invoiceSentDate?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const GRADING_PACKAGES: GradingPackage[] = [
  { kind: 'grading', tier: 'Gold',     price: 32000,  credits: 8,  validityMonths: 12 },
  { kind: 'grading', tier: 'Platinum', price: 45000,  credits: 12, validityMonths: 12 },
  { kind: 'grading', tier: 'Diamond',  price: 84000,  credits: 24, validityMonths: 12 },
  { kind: 'grading', tier: 'Sapphire', price: 325000, credits: -1, validityMonths: 12 },
];

export const SESSION_BUNDLES: SessionBundle[] = [
  { kind: 'bundle', id: 'basic',      label: 'Basic Bundle',      sessions: 10,  price: 3800,  validityMonths: 6  },
  { kind: 'bundle', id: 'standard',   label: 'Standard Bundle',   sessions: 20,  price: 7000,  validityMonths: 12 },
  { kind: 'bundle', id: 'business',   label: 'Business Bundle',   sessions: 50,  price: 16000, validityMonths: 12 },
  { kind: 'bundle', id: 'enterprise', label: 'Enterprise Bundle', sessions: 100, price: 28000, validityMonths: 24 },
];

export const MOCK_ACCOUNTS: AccountOption[] = [
  { accountNumber: 'ACC-2024-1001', primaryName: 'John Smith',            email: 'john.smith@email.com',         purchaseCategory: 'Individual',    currentTier: 'Gold',     currentCredits: 3   },
  { accountNumber: 'ACC-2024-1002', primaryName: 'Mary Johnson',          email: 'mary.johnson@email.com',       purchaseCategory: 'Individual',    currentTier: 'None',     currentCredits: 0   },
  { accountNumber: 'ACC-2024-1003', primaryName: 'David Lee',             email: 'david.lee@email.com',          purchaseCategory: 'Individual',    currentTier: 'Gold',     currentCredits: 8   },
  { accountNumber: 'ACC-2024-1005', primaryName: 'Sarah Chen',            email: 'sarah.chen@email.com',         purchaseCategory: 'Individual',    currentTier: 'None',     currentCredits: 0   },
  { accountNumber: 'ACC-2024-1006', primaryName: 'Robert Wang',           email: 'robert.wang@email.com',        purchaseCategory: 'Individual',    currentTier: 'Platinum', currentCredits: 15  },
  { accountNumber: 'ACC-2024-1007', primaryName: 'Emma Wilson',           email: 'emma.wilson@email.com',        purchaseCategory: 'Individual',    currentTier: 'Diamond',  currentCredits: 42  },
  { accountNumber: 'ACC-2024-1009', primaryName: 'James Brown',           email: 'james.brown@email.com',        purchaseCategory: 'Individual',    currentTier: 'Gold',     currentCredits: 1   },
  { accountNumber: 'ACC-2024-1011', primaryName: 'Sophia Taylor',         email: 'sophia.taylor@email.com',      purchaseCategory: 'Individual',    currentTier: 'None',     currentCredits: 0   },
  { accountNumber: 'CORP-2024-0001', primaryName: 'Cathay Pacific Airways', email: 'alice.lam@cathaypacific.com', purchaseCategory: 'Corporate',     contactPerson: 'Alice Lam',    currentSessions: 5  },
  { accountNumber: 'CORP-2024-0002', primaryName: 'HSBC Hong Kong',         email: 'brian.wong@hsbc.com',         purchaseCategory: 'Corporate',     contactPerson: 'Brian Wong',   currentSessions: 0  },
  { accountNumber: 'CORP-2024-0003', primaryName: 'Jardine Matheson',        email: 'carol.chan@jardine.com',      purchaseCategory: 'Corporate',     contactPerson: 'Carol Chan',   currentSessions: 18 },
  { accountNumber: 'CORP-2024-0004', primaryName: 'AIA Group',               email: 'david.ho@aia.com',            purchaseCategory: 'Corporate',     contactPerson: 'David Ho',     currentSessions: 3  },
  { accountNumber: 'TA-2024-0001',   primaryName: 'Wings Travel Agency',     email: 'eric.ng@wingstravel.hk',      purchaseCategory: 'Agency', contactPerson: 'Eric Ng',      currentSessions: 12 },
  { accountNumber: 'TA-2024-0002',   primaryName: 'Pacific World Travel',    email: 'fiona@pacificworld.hk',       purchaseCategory: 'Agency', contactPerson: 'Fiona Cheung', currentSessions: 0  },
  { accountNumber: 'TA-2024-0003',   primaryName: 'Fortune Travel Group',    email: 'gary.tsang@fortunetravel.com',purchaseCategory: 'Agency', contactPerson: 'Gary Tsang',   currentSessions: 7  },
];

export const INITIAL_RECORDS: PurchaseRecord[] = [
  { id: 1,   purchaseRef: 'PKG-2024-00001',  purchaseDate: '2024-11-15', purchaseCategory: 'Individual',    accountNumber: 'ACC-2024-1001',  primaryName: 'John Smith',            primaryEmail: 'john.smith@email.com',        previousTier: 'None',    newTier: 'Gold',     creditsAdded: 8,   totalCreditsAfter: 8,   packagePrice: 32000, paymentMethod: 'Credit Card',      transactionRef: 'TXN-CC-98741',  processedBy: 'HKIAL Staff', notes: 'Initial package purchase.',         expiryDate: '2025-11-15', status: 'Invoice Sent', invoiceSentDate: '2024-11-15' },
  { id: 2,   purchaseRef: 'PKG-2024-00002',  purchaseDate: '2024-10-20', purchaseCategory: 'Individual',    accountNumber: 'ACC-2024-1003',  primaryName: 'David Lee',             primaryEmail: 'david.lee@email.com',         previousTier: 'Gold',    newTier: 'Platinum', creditsAdded: 12,  totalCreditsAfter: 14,  packagePrice: 45000, paymentMethod: 'Bank Transfer',    transactionRef: 'TXN-BT-55312',  processedBy: 'HKIAL Staff', notes: 'Upgrade from Gold.',              expiryDate: '2025-10-20', status: 'Invoice Sent', invoiceSentDate: '2024-10-20' },
  { id: 3,   purchaseRef: 'PKG-2024-00003',  purchaseDate: '2024-09-05', purchaseCategory: 'Individual',    accountNumber: 'ACC-2024-1006',  primaryName: 'Robert Wang',           primaryEmail: 'robert.wang@email.com',       previousTier: 'Gold',    newTier: 'Platinum', creditsAdded: 25,  totalCreditsAfter: 31,  packagePrice: 3500,  paymentMethod: 'Corporate Account',transactionRef: 'TXN-CA-10023',  processedBy: 'HKIAL Staff', notes: 'Corporate-sponsored upgrade.',      expiryDate: '2025-09-05', status: 'Invoice Sent', invoiceSentDate: '2024-09-05' },
  { id: 4,   purchaseRef: 'PKG-2024-00004',  purchaseDate: '2024-08-18', purchaseCategory: 'Individual',    accountNumber: 'ACC-2024-1007',  primaryName: 'Emma Wilson',           primaryEmail: 'emma.wilson@email.com',       previousTier: 'Platinum',newTier: 'Diamond',  creditsAdded: 55,  totalCreditsAfter: 60,  packagePrice: 6800,  paymentMethod: 'Credit Card',      transactionRef: 'TXN-CC-77820',  processedBy: 'HKIAL Staff', notes: 'VIP upgrade requested.',            expiryDate: '2025-08-18', status: 'Invoice Sent', invoiceSentDate: '2024-08-18' },
  { id: 5,   purchaseRef: 'PKG-2024-00005',  purchaseDate: '2024-12-01', purchaseCategory: 'Individual',    accountNumber: 'ACC-2024-1009',  primaryName: 'James Brown',           primaryEmail: 'james.brown@email.com',       previousTier: 'None',    newTier: 'Gold',     creditsAdded: 8,   totalCreditsAfter: 8,   packagePrice: 32000, paymentMethod: 'Cash',             transactionRef: 'TXN-CASH-0312', processedBy: 'HKIAL Staff', notes: '',                                  expiryDate: '2025-12-01', status: 'Pending Invoice' },
  { id: 101, purchaseRef: 'BULK-2024-00001', purchaseDate: '2024-11-10', purchaseCategory: 'Corporate',     accountNumber: 'CORP-2024-0001', primaryName: 'Cathay Pacific Airways', primaryEmail: 'alice.lam@cathaypacific.com', bundleLabel: 'Standard Bundle',  sessionsAdded: 20,  totalSessionsAfter: 20,  packagePrice: 7000,  paymentMethod: 'Corporate Account',transactionRef: 'TXN-CA-10011',  processedBy: 'HKIAL Staff', notes: 'Annual corporate package.',         expiryDate: '2025-11-10', status: 'Invoice Sent', invoiceSentDate: '2024-11-10' },
  { id: 102, purchaseRef: 'BULK-2024-00002', purchaseDate: '2024-10-05', purchaseCategory: 'Agency', accountNumber: 'TA-2024-0001',   primaryName: 'Wings Travel Agency',   primaryEmail: 'eric.ng@wingstravel.hk',      bundleLabel: 'Business Bundle',  sessionsAdded: 50,  totalSessionsAfter: 50,  packagePrice: 16000, paymentMethod: 'Bank Transfer',    transactionRef: 'TXN-BT-20045',  processedBy: 'HKIAL Staff', notes: '',                                  expiryDate: '2025-10-05', status: 'Invoice Sent', invoiceSentDate: '2024-10-05' },
  { id: 103, purchaseRef: 'BULK-2024-00003', purchaseDate: '2024-09-20', purchaseCategory: 'Corporate',     accountNumber: 'CORP-2024-0003', primaryName: 'Jardine Matheson',       primaryEmail: 'carol.chan@jardine.com',       bundleLabel: 'Enterprise Bundle', sessionsAdded: 100, totalSessionsAfter: 100, packagePrice: 28000, paymentMethod: 'Bank Transfer',    transactionRef: 'TXN-BT-19900',  processedBy: 'HKIAL Staff', notes: 'Enterprise deal — 2-year validity.',expiryDate: '2026-09-20', status: 'Invoice Sent', invoiceSentDate: '2024-09-21' },
  { id: 104, purchaseRef: 'BULK-2025-00004', purchaseDate: '2025-02-20', purchaseCategory: 'Corporate',     accountNumber: 'CORP-2024-0002', primaryName: 'HSBC Hong Kong',         primaryEmail: 'brian.wong@hsbc.com',          bundleLabel: 'Basic Bundle',     sessionsAdded: 10,  totalSessionsAfter: 10,  packagePrice: 3800,  paymentMethod: 'Corporate Account',transactionRef: 'TXN-CA-30012',  processedBy: 'HKIAL Staff', notes: '',                                  expiryDate: '2025-08-20', status: 'Pending Invoice' },
  { id: 105, purchaseRef: 'BULK-2025-00005', purchaseDate: '2025-02-22', purchaseCategory: 'Agency', accountNumber: 'TA-2024-0002',   primaryName: 'Pacific World Travel',  primaryEmail: 'fiona@pacificworld.hk',        bundleLabel: 'Standard Bundle',  sessionsAdded: 20,  totalSessionsAfter: 20,  packagePrice: 7000,  paymentMethod: 'Bank Transfer',    transactionRef: 'TXN-BT-50023',  processedBy: 'HKIAL Staff', notes: 'New agency onboarding bundle.',     expiryDate: '2026-02-22', status: 'Pending Invoice' },
];

// ─── Shared UI Helpers (exported) ─────────────────────────────────────────────

export interface TierMeta {
  color: string; bg: string; badgeBg: string; borderColor: string;
  iconName: 'user' | 'award' | 'star' | 'trophy' | 'gem';
}

export const TIER_META: Record<TierOrNone, TierMeta> = {
  None:     { color: 'text-gray-500',   bg: 'bg-gray-50',   badgeBg: 'bg-gray-100 text-gray-600',     borderColor: 'border-gray-200',   iconName: 'user'   },
  Gold:     { color: 'text-amber-600',  bg: 'bg-amber-50',  badgeBg: 'bg-amber-100 text-amber-700',   borderColor: 'border-amber-300',  iconName: 'star'   },
  Platinum: { color: 'text-purple-600', bg: 'bg-purple-50', badgeBg: 'bg-purple-100 text-purple-700', borderColor: 'border-purple-300', iconName: 'trophy' },
  Diamond:  { color: 'text-sky-600',    bg: 'bg-sky-50',    badgeBg: 'bg-sky-100 text-sky-700',       borderColor: 'border-sky-300',    iconName: 'gem'    },
  Sapphire: { color: 'text-indigo-600', bg: 'bg-indigo-50', badgeBg: 'bg-indigo-100 text-indigo-700', borderColor: 'border-indigo-300', iconName: 'gem'    },
};

export const BUNDLE_COLORS: Record<string, string> = {
  'Basic Bundle':      'bg-slate-100 text-slate-700',
  'Standard Bundle':   'bg-blue-100 text-blue-700',
  'Business Bundle':   'bg-purple-100 text-purple-700',
  'Enterprise Bundle': 'bg-amber-100 text-amber-700',
};

export function TierIcon({ name, className }: { name: TierMeta['iconName']; className?: string }) {
  const cls = className ?? 'w-4 h-4';
  if (name === 'award')  return <Award  className={cls} />;
  if (name === 'star')   return <Star   className={cls} />;
  if (name === 'trophy') return <Trophy className={cls} />;
  if (name === 'gem')    return <Gem    className={cls} />;
  return <User className={cls} />;
}

export function TierBadge({ tier }: { tier: TierOrNone }) {
  const meta = TIER_META[tier];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${meta.badgeBg}`}>
      <TierIcon name={meta.iconName} className="w-3 h-3" />{tier}
    </span>
  );
}

export function CategoryBadge({ cat }: { cat: PurchaseCategory }) {
  if (cat === 'Individual')
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700"><User className="w-3 h-3" />Individual</span>;
  if (cat === 'Corporate')
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700"><Building2 className="w-3 h-3" />Corporate</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700"><Plane className="w-3 h-3" />Agency</span>;
}

export function StatusBadge({ status }: { status: PurchaseStatus }) {
  return status === 'Pending Invoice'
    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700">Pending Invoice</span>
    : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700"><CheckCircle className="w-3 h-3" />Invoice Sent</span>;
}

// ─── Section header helper ───────────────────────────────────────────────────

function SectionHeader({ num, title, done }: { num: number; title: string; done: boolean }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 font-medium ${
        done ? 'bg-green-500 text-white' : 'bg-[#0f2942] text-white'
      }`}>
        {done ? <CheckCircle className="w-4 h-4" /> : num}
      </div>
      <h2 className="text-gray-900">{title}</h2>
    </div>
  );
}

// ─── PurchaseCreate Component ──────────────────────────────────────────────────

export interface PurchaseCreateProps {
  packages?: GradingPackage[];
  sessionBundles?: SessionBundle[];
  accounts?: AccountOption[];
  // 2026-07-05 round 6.2.109 — pre-fills the selected account when
  // "Create Contract" is launched from an account row on the
  // account-centric /purchase page. When `null`/omitted the form
  // opens with no account selected (header "New Contract" path).
  initialAccount?: AccountOption | null;
  onSubmit?: (
    record: Omit<PurchaseRecord, 'id' | 'purchaseRef' | 'purchaseDate' | 'transactionRef' | 'processedBy' | 'status'>,
    // 2026-07-02 — payment proof file is collected in the view (UI
    // lives here) but the upload-to-Azure call is owned by the
    // parent wrapper (it owns the apiClient). The wrapper receives
    // the raw `File` and uploads it before posting the purchase.
    paymentProofFile?: File | null,
  ) => void | Promise<void>;
  onBack?: () => void;
  // 2026-06-30 (round 6.2.74) — hide the "VIP Accounts to Create"
  // input from the Corporate form. Default true keeps the figma Make
  // base compatible; the production admin wrapper passes false.
  showVipAccounts?: boolean;
  // 2026-07-12 round 6.2.134 — when provided, parent owns account
  // search (GET /accounts?search=…). Local name filter is skipped so
  // older accounts outside the initial page (e.g. YUEN SSKY) appear.
  onAccountSearch?: (query: string) => void;
  isAccountSearching?: boolean;
}

export function PurchaseCreate({
  packages: packagesProp,
  sessionBundles: sessionBundlesProp,
  accounts: accountsProp,
  initialAccount,
  onSubmit,
  onBack,
  showVipAccounts = true,
  onAccountSearch,
  isAccountSearching = false,
}: PurchaseCreateProps = {}) {
  // Defined empty arrays are authoritative (container loading/empty) — mock only when omitted.
  const availablePackages  = packagesProp !== undefined ? packagesProp : GRADING_PACKAGES;
  const availableBundles   = sessionBundlesProp !== undefined ? sessionBundlesProp : SESSION_BUNDLES;
  const availableAccounts  = accountsProp !== undefined ? accountsProp : MOCK_ACCOUNTS;

  // 2026-07-05 round 6.2.106 (revive of 6.2.83 sec2-binds-to-pill items 1+2) —
  // catFilter is now a real PurchaseCategory (no 'all' union member). Default
  // = 'Individual' so the grading-package grid renders on first load without
  // the user having to click a pill.
  const [catFilter, setCatFilter]           = useState<PurchaseCategory>('Individual');
  const [acctSearch, setAcctSearch]         = useState('');
  const [selectedAccount, setSelectedAccount] = useState<AccountOption | null>(initialAccount ?? null);
  const [selectedPackage, setSelectedPackage] = useState<PackageChoice | null>(null);
  const [paymentMethod, setPaymentMethod]   = useState<PaymentMethod>('Bank Transfer');
  const [transactionRef, setTransactionRef] = useState('');
  const [purchaseNotes, setPurchaseNotes]   = useState('');
  // 2026-07-02 — payment proof (image/PDF) attached at Payment Details.
  // The view collects the file; the parent wrapper uploads it to Azure
  // Blob before POSTing the purchase.
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofError, setPaymentProofError] = useState<string | null>(null);
  
  // For Corporate / Travel Agency custom contract
  const [promoCodeName, setPromoCodeName]       = useState('');
  const [promoCodeQuantity, setPromoCodeQuantity] = useState('');
  const [vipAccountQuantity, setVipAccountQuantity] = useState(''); // New field for Corporate VIP account creation
  const [creditBalance, setCreditBalance]       = useState('');
  const [totalPrice, setTotalPrice]             = useState('');

  const isIndividual = selectedAccount?.purchaseCategory === 'Individual';
  const isTravelAgency = selectedAccount?.purchaseCategory === 'Agency';
  const isCorporate = selectedAccount?.purchaseCategory === 'Corporate';

  // 2026-07-05 round 6.2.106 (revive of 6.2.83 sec2-binds-to-pill item 3) —
  // pill-driven booleans drive Section 2 form visibility. The account-derived
  // booleans (isIndividual / isCorporate / isTravelAgency) are kept intact
  // because canConfirm / handleConfirm / Order Summary still need them.
  const showIndividualPackages = catFilter === 'Individual';
  const showCorporateForm      = catFilter === 'Corporate';
  const showAgencyForm         = catFilter === 'Agency';
  
  const canConfirm = selectedAccount 
    ? (isIndividual 
        ? !!selectedPackage 
        : isTravelAgency
        ? (!!creditBalance && !!totalPrice)
        : isCorporate
        ? (!!promoCodeQuantity && !!totalPrice)
        : false)
    : false;

  // ── Filtered account list ───────────────────────────────────────────────────

  const filteredAccounts = availableAccounts.filter(a => {
    // 2026-07-05 round 6.2.106 — 'all' removed from catFilter union (T3-A);
    // per-category match only. The dead `catFilter === 'all'` branch was
    // dropped here because TypeScript flags the comparison as noOverlap.
    const matchCat = a.purchaseCategory === catFilter;
    // 2026-07-12 round 6.2.134 — when parent owns search via onAccountSearch,
    // skip local name filter (accounts prop is already the API result page).
    // Standalone figma Make path keeps client-side filter; tokenize so
    // "ssky yuen" matches reversed "YUEN SSKY".
    if (onAccountSearch) return matchCat;
    const tokens = acctSearch.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const matchSearch = tokens.length === 0 || tokens.every(t =>
      a.primaryName.toLowerCase().includes(t) ||
      a.accountNumber.toLowerCase().includes(t) ||
      a.email.toLowerCase().includes(t),
    );
    return matchCat && matchSearch;
  });

  const handleSelectAccount = (a: AccountOption) => {
    setSelectedAccount(a);
    setSelectedPackage(null); // reset package when account changes
  };

  // ── Confirm handler ──────────────────────────────────────────────────────────

  // 2026-07-14 — re-entrancy guard: rapid double/triple clicks on
  // "Confirm Purchase" previously fired multiple createPurchase calls
  // and created duplicate contracts. Lock until the parent async
  // onSubmit settles (or fails).
  const submittingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!selectedAccount) return;
    if (submittingRef.current || isSubmitting) return;
    
    // For Individual: need selectedPackage
    if (isIndividual && !selectedPackage) return;
    
    // For Corporate: need quantity and price
    if (isCorporate && (!promoCodeQuantity || !totalPrice)) return;
    
    // For Travel Agency: need credit balance and price
    if (isTravelAgency && (!creditBalance || !totalPrice)) return;

    submittingRef.current = true;
    setIsSubmitting(true);
    
    const newId      = Math.max(...INITIAL_RECORDS.map(r => r.id), 0) + 1;
    const today      = localDateStr();
    const expiry     = new Date();
    
    let record: PurchaseRecord;

    if (isIndividual && selectedPackage) {
      // Individual package purchase
      expiry.setMonth(expiry.getMonth() + selectedPackage.validityMonths);
      const expiryDate = localDateStr(expiry);
      
      if (selectedPackage.kind === 'grading') {
        record = {
          id: newId,
          purchaseRef: `PKG-2025-${String(newId).padStart(5, '0')}`,
          purchaseDate: today,
          purchaseCategory: 'Individual',
          accountNumber: selectedAccount.accountNumber,
          primaryName: selectedAccount.primaryName,
          primaryEmail: selectedAccount.email,
          previousTier: selectedAccount.currentTier ?? 'None',
          newTier: selectedPackage.tier,
          creditsAdded: selectedPackage.credits,
          totalCreditsAfter: selectedPackage.credits === -1 ? -1 : (selectedAccount.currentCredits ?? 0) + selectedPackage.credits,
          packagePrice: selectedPackage.price,
          paymentMethod,
          transactionRef: transactionRef || `TXN-AUTO-${newId}`,
          processedBy: 'HKIAL Staff',
          notes: purchaseNotes,
          expiryDate,
          status: 'Pending Invoice',
        };
      } else {
        record = {
          id: newId,
          purchaseRef: `BULK-2025-${String(newId).padStart(5, '0')}`,
          purchaseDate: today,
          purchaseCategory: selectedAccount.purchaseCategory,
          accountNumber: selectedAccount.accountNumber,
          primaryName: selectedAccount.primaryName,
          primaryEmail: selectedAccount.email,
          bundleLabel: selectedPackage.label,
          sessionsAdded: selectedPackage.sessions,
          totalSessionsAfter: (selectedAccount.currentSessions ?? 0) + selectedPackage.sessions,
          packagePrice: selectedPackage.price,
          paymentMethod,
          transactionRef: transactionRef || `TXN-AUTO-${newId}`,
          processedBy: 'HKIAL Staff',
          notes: purchaseNotes,
          expiryDate,
          status: 'Pending Invoice',
        };
      }
    } else if (isTravelAgency) {
      // Travel Agency custom contract
      expiry.setFullYear(expiry.getFullYear() + 1); // 12 months default
      const expiryDate = localDateStr(expiry);
      const balance = parseFloat(creditBalance);
      const price = parseFloat(totalPrice);
      
      record = {
        id: newId,
        purchaseRef: `BULK-2025-${String(newId).padStart(5, '0')}`,
        purchaseDate: today,
        purchaseCategory: 'Agency',
        accountNumber: selectedAccount.accountNumber,
        primaryName: selectedAccount.primaryName,
        primaryEmail: selectedAccount.email,
        bundleLabel: 'Credit Balance Contract',
        sessionsAdded: balance, // Using sessionsAdded to store credit balance
        totalSessionsAfter: (selectedAccount.currentSessions ?? 0) + balance,
        packagePrice: price,
        paymentMethod,
        transactionRef: transactionRef || `TXN-AUTO-${newId}`,
        processedBy: 'HKIAL Staff',
        notes: purchaseNotes,
        expiryDate,
        status: 'Pending Invoice',
      };
    } else {
      // Corporate custom contract
      expiry.setFullYear(expiry.getFullYear() + 1); // 12 months default
      const expiryDate = localDateStr(expiry);
      const qty = parseInt(promoCodeQuantity);
      const price = parseFloat(totalPrice);
      
      record = {
        id: newId,
        purchaseRef: `BULK-2025-${String(newId).padStart(5, '0')}`,
        purchaseDate: today,
        purchaseCategory: 'Corporate',
        accountNumber: selectedAccount.accountNumber,
        primaryName: selectedAccount.primaryName,
        primaryEmail: selectedAccount.email,
        bundleLabel: promoCodeName || 'Custom Contract',
        sessionsAdded: qty,
        totalSessionsAfter: (selectedAccount.currentSessions ?? 0) + qty,
        packagePrice: price,
        paymentMethod,
        transactionRef: transactionRef || `TXN-AUTO-${newId}`,
        processedBy: 'HKIAL Staff',
        notes: purchaseNotes,
        expiryDate,
        status: 'Pending Invoice',
      };
    }

    try {
      await onSubmit?.({
        purchaseRef: record.purchaseRef,
        purchaseDate: record.purchaseDate,
        purchaseCategory: record.purchaseCategory,
        accountNumber: record.accountNumber,
        primaryName: record.primaryName,
        primaryEmail: record.primaryEmail,
        previousTier: record.previousTier,
        newTier: record.newTier,
        creditsAdded: record.creditsAdded,
        totalCreditsAfter: record.totalCreditsAfter,
        bundleLabel: record.bundleLabel,
        sessionsAdded: record.sessionsAdded,
        totalSessionsAfter: record.totalSessionsAfter,
        packagePrice: record.packagePrice,
        paymentMethod: record.paymentMethod,
        transactionRef: record.transactionRef,
        processedBy: record.processedBy,
        notes: record.notes,
        expiryDate: record.expiryDate,
        status: record.status,
        invoiceSentDate: record.invoiceSentDate,
      }, paymentProofFile);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-6">

      {/* Page header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#0f2942] transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Contract Management
        </button>
        <h1 className="text-gray-900 mb-1">New Contract</h1>
        <p className="text-sm text-gray-500">
          Select an account, choose a package, fill in payment details, then confirm.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left column: three sections ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* ── Section 1: Select Account ── */}
          <Card className="p-6">
            <SectionHeader num={1} title="Select Account" done={!!selectedAccount} />

            {/* ── 2026-07-05 round 6.2.105 ── drop 'All Types' pill per Sky directive.
                 2026-07-05 round 6.2.106 ── default catFilter narrowed from 'all'
                 to 'Individual' (T3-A); pill onClick extends reset per T3-C ── */}
            <div className="flex flex-wrap gap-2 mb-4">
              {/* ── 2026-07-05 round 6.2.106 (revive of 6.2.83 sec2-binds-to-pill item 4) ──
                   Switching pill clears the per-category form fields so a stale "50000"
                   or "100" never bleeds into the wrong form. selectedPackage reset ensures
                   the right-column Order Summary badge drops cleanly. ── */}
              {(['Individual', 'Corporate', 'Agency'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    setCatFilter(cat);
                    setSelectedPackage(null);
                    setPromoCodeName('');
                    setPromoCodeQuantity('');
                    setVipAccountQuantity('');
                    setCreditBalance('');
                    setTotalPrice('');
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                    catFilter === cat
                      ? 'bg-[#0f2942] text-white border-[#0f2942]'
                      : 'text-gray-600 border-gray-300 hover:border-gray-400 bg-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, account number or email..."
                value={acctSearch}
                onChange={e => {
                  const value = e.target.value;
                  setAcctSearch(value);
                  onAccountSearch?.(value);
                }}
                className="pl-9"
              />
              {isAccountSearching && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  Searching…
                </span>
              )}
            </div>

            {/* Account list */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {filteredAccounts.map(a => {
                const isSel = selectedAccount?.accountNumber === a.accountNumber;
                return (
                  <div
                    key={a.accountNumber}
                    onClick={() => handleSelectAccount(a)}
                    className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      isSel
                        ? 'border-[#0f2942] bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isSel ? 'bg-[#0f2942]' : 'bg-gray-100'}`}>
                        {a.purchaseCategory === 'Individual'
                          ? <User      className={`w-4 h-4 ${isSel ? 'text-white' : 'text-gray-500'}`} />
                          : a.purchaseCategory === 'Corporate'
                          ? <Building2 className={`w-4 h-4 ${isSel ? 'text-white' : 'text-blue-500'}`} />
                          : <Plane     className={`w-4 h-4 ${isSel ? 'text-white' : 'text-purple-500'}`} />}
                      </div>
                      <div>
                        <p className="text-sm text-gray-900">{a.primaryName}</p>
                        <p className="text-xs text-gray-500">
                          {a.accountNumber}
                          {a.purchaseCategory !== 'Individual' && a.contactPerson
                            ? ` · ${a.contactPerson}`
                            : ` · ${a.email}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <CategoryBadge cat={a.purchaseCategory} />
                      {a.purchaseCategory === 'Individual' ? (
                        <div className="flex flex-col items-end gap-0.5">
                          <TierBadge tier={a.currentTier ?? 'None'} />
                          <p className="text-xs text-gray-400">{(a.currentCredits ?? 0) === -1 ? 'Unlimited' : `${a.currentCredits ?? 0} credits`}</p>
                        </div>
                      ) : (
                        // 2026-07-14 round 6.2.147 — H3 smell fix. For Corp/Agency,
                        // `currentSessions` is undefined (no backend session-count
                        // column). Render the HKD credit balance (M51 pattern).
                        <p className="text-xs text-gray-400">
                          HKD {(a.creditBalanceHKD ?? 0).toLocaleString('en-HK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              {filteredAccounts.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-6">No accounts found.</p>
              )}
            </div>
          </Card>

          {/* ── Section 2: Select Package ── */}
          <Card className="p-6">
            <SectionHeader num={2} title="Select Package" done={!!selectedPackage} />

            {/* Individual → Grading packages (2-column grid) */}
            {showIndividualPackages && (
              <>
                <p className="text-sm text-gray-500 mb-4">
                  Grading packages include booking credits valid for 12 months.
                  Credits and tier upgrade activate after the invoice is sent.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {availablePackages.map(pkg => {
                    const meta = TIER_META[pkg.tier];
                    const isSel = selectedPackage?.kind === 'grading' && (selectedPackage as GradingPackage).tier === pkg.tier;
                    return (
                      <div
                        key={pkg.tier}
                        onClick={() => setSelectedPackage(pkg)}
                        className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          isSel ? `border-[#0f2942] ${meta.bg}` : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {isSel && (
                          <div className="absolute top-2 right-2">
                            <CheckCircle className="w-4 h-4 text-[#0f2942]" />
                          </div>
                        )}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-3 border ${meta.borderColor} ${meta.bg}`}>
                          <span className={meta.color}><TierIcon name={meta.iconName} className="w-4 h-4" /></span>
                        </div>
                        <p className="text-sm text-gray-900 mb-0.5">{pkg.tier}</p>
                        <p className="text-xs text-gray-400 mb-2">{pkg.credits === -1 ? 'Unlimited' : `${pkg.credits} credits`} · {pkg.validityMonths}mo</p>
                        <p className={`text-sm ${meta.color}`}>HKD {pkg.price.toLocaleString()}</p>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Corporate → Promo Code fields */}
            {showCorporateForm && (
              <>
                <p className="text-sm text-gray-500 mb-4">
                  Enter contract details for Corporate account.
                </p>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="promoCodeName" className="mb-[10px] block">
                      Promo Code Name <span className="text-gray-400 text-xs">(optional)</span>
                    </Label>
                    <Input
                      id="promoCodeName"
                      placeholder="e.g. SUMMER2025"
                      value={promoCodeName}
                      onChange={e => setPromoCodeName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="promoCodeQty" className="mb-[10px] block">
                      Promo Code Quantity <span className="text-red-500">*</span>
                    </Label>
                    {/* 2026-07-05 round 6.2.110 — sibling fix to Total Price
                        hardening: same three-layered treatment (spinner hide /
                        integer strip / onWheel blur). See the Total Price
                        input above for the full rationale. */}
                    <Input
                      id="promoCodeQty"
                      type="number"
                      min="1"
                      step="1"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="e.g. 100"
                      value={promoCodeQuantity}
                      onChange={e => setPromoCodeQuantity(e.target.value.replace(/[^0-9]/g, ''))}
                      onWheel={e => e.currentTarget.blur()}
                      className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                  </div>
                  {showVipAccounts && (
                    <div>
                      <Label htmlFor="vipAccountQty" className="mb-[10px] block">
                        VIP Accounts to Create <span className="text-gray-400 text-xs">(optional)</span>
                      </Label>
                      {/* 2026-07-05 round 6.2.110 — sibling fix (same three-layered
                          treatment as Total Price). Currently feature-flagged off
                          in production (`showVipAccounts={false}` per 6.2.74) but
                          hardened now for symmetry so it stays consistent if
                          re-enabled. */}
                      <Input
                        id="vipAccountQty"
                        type="number"
                        min="0"
                        step="1"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="e.g. 10"
                        value={vipAccountQuantity}
                        onChange={e => setVipAccountQuantity(e.target.value.replace(/[^0-9]/g, ''))}
                        onWheel={e => e.currentTarget.blur()}
                        className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Number of new VIP accounts to be created for this corporate customer.
                      </p>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="totalPrice" className="mb-[10px] block">
                      Billing Amount (HKD) <span className="text-red-500">*</span>
                    </Label>
                    {/* 2026-07-05 round 6.2.110 — Total Price hardening:
                        (a) hide native number-input spinner (Tailwind arbitrary
                            variants target webkit inner+outer spin buttons + 
                            Firefox appearance:textfield),
                        (b) force integer-only via step=1 + inputMode/pattern +
                            onChange regex that strips any non-digit characters
                            (typing "15000.50" leaves "15000"; pasting "abc" 
                            leaves ""),
                        (c) onWheel=blur() so mouse-wheel scroll over the input
                            does NOT increment/decrement the value (per Sky:
                            "disable scrolling on it"). */}
                    <Input
                      id="totalPrice"
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="e.g. 50000"
                      value={totalPrice}
                      onChange={e => setTotalPrice(e.target.value.replace(/[^0-9]/g, ''))}
                      onWheel={e => e.currentTarget.blur()}
                      className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Travel Agency → Credit balance fields */}
            {showAgencyForm && (
              <>
                <p className="text-sm text-gray-500 mb-4">
                  Enter contract details for Agency account.
                </p>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="creditBalance" className="mb-[10px] block">
                      Credit Balance Charging (HKD) <span className="text-red-500">*</span>
                    </Label>
                    {/* 2026-07-05 round 6.2.110 — sibling fix to Total Price
                        hardening: same three-layered treatment (spinner hide /
                        integer strip / onWheel blur). Travel Agency branch
                        mirrors the Corporate Total Price fix. */}
                    <Input
                      id="creditBalance"
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="e.g. 50000"
                      value={creditBalance}
                      onChange={e => setCreditBalance(e.target.value.replace(/[^0-9]/g, ''))}
                      onWheel={e => e.currentTarget.blur()}
                      className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                  </div>
                  <div>
                    <Label htmlFor="totalPriceTA" className="mb-[10px] block">
                      Billing Amount (HKD) <span className="text-red-500">*</span>
                    </Label>
                    {/* 2026-07-05 round 6.2.110 — Total Price hardening (Travel
                        Agency branch; mirrors the Corporate branch above). See
                        the inline comment on the Corporate Total Price input
                        for the three-change rationale (spinner hide / integer
                        strip / onWheel blur). */}
                    <Input
                      id="totalPriceTA"
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="e.g. 50000"
                      value={totalPrice}
                      onChange={e => setTotalPrice(e.target.value.replace(/[^0-9]/g, ''))}
                      onWheel={e => e.currentTarget.blur()}
                      className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                  </div>
                </div>
              </>
            )}
          </Card>

          {/* ── Section 3: Payment Details ── */}
          <Card className="p-6">
            <SectionHeader num={3} title="Payment Details" done={false} />

            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <Label htmlFor="pm" className="mb-[10px] block">
                    Payment Method <span className="text-red-500">*</span>
                  </Label>
                  <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                    <SelectTrigger id="pm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Branch Transfer">Branch Transfer</SelectItem>
                      <SelectItem value="Corporate Account">Corporate Account</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="txn" className="mb-[10px] block">Transaction Reference</Label>
                  <Input
                    id="txn"
                    placeholder="e.g. TXN-CC-12345 (auto-generated if blank)"
                    value={transactionRef}
                    onChange={e => setTransactionRef(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes" className="mb-[10px] block">Notes / Remarks</Label>
                <Textarea
                  id="notes"
                  rows={3}
                  placeholder="Add any notes about this purchase..."
                  value={purchaseNotes}
                  onChange={e => setPurchaseNotes(e.target.value)}
                />
              </div>

              {/* ── 2026-07-02 — payment proof upload (image / PDF) ── */}
              <div>
                <Label htmlFor="paymentProof" className="mb-[10px] block">
                  Payment Proof <span className="text-gray-400 font-normal">(image or PDF, optional)</span>
                </Label>
                {paymentProofFile ? (
                  <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">{paymentProofFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(paymentProofFile.size / 1024).toFixed(1)} KB · {paymentProofFile.type || 'unknown'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setPaymentProofFile(null); setPaymentProofError(null); }}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      aria-label="Remove payment proof"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <Input
                    id="paymentProof"
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                    onChange={e => {
                      const file = e.target.files?.[0] ?? null;
                      setPaymentProofError(null);
                      if (file && file.size > 10 * 1024 * 1024) {
                        setPaymentProofError('File too large (max 10 MB).');
                        setPaymentProofFile(null);
                        e.target.value = '';
                        return;
                      }
                      setPaymentProofFile(file);
                    }}
                    className="cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-[#0f2942] file:text-white file:text-sm file:cursor-pointer"
                  />
                )}
                {paymentProofError && (
                  <p className="text-xs text-red-600 mt-1">{paymentProofError}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Uploaded to Azure Blob Storage after you confirm the purchase.
                </p>
              </div>

              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  <span className="font-medium">Pending Invoice:</span>{' '}
                  {selectedPackage?.kind === 'grading'
                    ? 'Booking credits and tier upgrade are applied only after the invoice is generated and sent.'
                    : selectedPackage?.kind === 'bundle'
                    ? 'Sessions are credited to the account only after the invoice is generated and sent.'
                    : 'Credits or sessions will be applied only after the invoice is generated and sent.'}
                </p>
              </div>
            </div>
          </Card>

          {/* ── Action buttons ── */}
          <div className="flex items-center justify-between pb-6">
            <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Cancel
            </Button>
            <Button
              className="bg-[#0f2942] hover:bg-[#1a3d5c] text-white disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!canConfirm || isSubmitting}
              onClick={handleConfirm}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Saving…' : 'Confirm Purchase'}
            </Button>
          </div>
        </div>

        {/* ── Right column: sticky order summary ── */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <Card className="p-5">
              <h3 className="text-gray-900 mb-4">Order Summary</h3>

              {!selectedAccount ? (
                <div className="flex flex-col items-center justify-center text-center py-8 px-2">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <Info className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-400">Select an account and package to preview the order.</p>
                </div>
              ) : (
                <div className="space-y-4">

                  {/* Account */}
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Account</p>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center shrink-0">
                        {selectedAccount.purchaseCategory === 'Individual'
                          ? <User      className="w-3.5 h-3.5 text-gray-500" />
                          : selectedAccount.purchaseCategory === 'Corporate'
                          ? <Building2 className="w-3.5 h-3.5 text-blue-500" />
                          : <Plane     className="w-3.5 h-3.5 text-purple-500" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-gray-900 truncate">{selectedAccount.primaryName}</p>
                        <p className="text-xs text-gray-500">{selectedAccount.accountNumber}</p>
                      </div>
                    </div>
                    {selectedAccount.purchaseCategory === 'Individual' ? (
                      <div className="flex items-center justify-between mt-2 px-1">
                        <span className="text-xs text-gray-400">Current tier</span>
                        <TierBadge tier={selectedAccount.currentTier ?? 'None'} />
                      </div>
                    ) : (
                      // 2026-07-14 round 6.2.147 — H3 smell fix. For Corp/Agency,
                      // show HKD credit balance (M51 pattern) instead of bogus
                      // "Current sessions" derived from `credit_balance`.
                      <div className="flex items-center justify-between mt-2 px-1">
                        <span className="text-xs text-gray-400">Credit balance</span>
                        <span className="text-xs text-gray-600">
                          HKD {(selectedAccount.creditBalanceHKD ?? 0).toLocaleString('en-HK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Package or Custom Contract */}
                  {isIndividual && selectedPackage ? (
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                        {selectedPackage.kind === 'grading' ? 'Grading Package' : 'Session Bundle'}
                      </p>
                      {selectedPackage.kind === 'grading' ? (
                        <div className={`p-3 rounded-lg border-2 ${TIER_META[selectedPackage.tier].borderColor} ${TIER_META[selectedPackage.tier].bg}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={TIER_META[selectedPackage.tier].color}>
                              <TierIcon name={TIER_META[selectedPackage.tier].iconName} className="w-4 h-4" />
                            </span>
                            <span className="text-sm text-gray-900">{selectedPackage.tier} Package</span>
                          </div>
                          <div className="flex items-center gap-1 flex-wrap mb-1">
                            <TierBadge tier={selectedAccount.currentTier ?? 'None'} />
                            <TrendingUp className="w-3 h-3 text-gray-400" />
                            <TierBadge tier={selectedPackage.tier} />
                          </div>
                          <p className="text-xs text-gray-500">{selectedPackage.credits === -1 ? 'Unlimited credits' : `+${selectedPackage.credits} credits`} · {selectedPackage.validityMonths} months</p>
                        </div>
                      ) : (
                        <div className="p-3 rounded-lg border-2 border-blue-200 bg-blue-50">
                          <div className="flex items-center gap-2 mb-1">
                            <Package className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-gray-900">{selectedPackage.label}</span>
                          </div>
                          <p className="text-xs text-gray-500">{selectedPackage.sessions} sessions · {selectedPackage.validityMonths} months</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {selectedAccount.currentSessions ?? 0} → {(selectedAccount.currentSessions ?? 0) + selectedPackage.sessions} after invoice
                          </p>
                        </div>
                      )}
                    </div>
                  ) : isCorporate && (promoCodeQuantity || totalPrice) ? (
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Custom Contract</p>
                      <div className="p-3 rounded-lg border-2 border-blue-200 bg-blue-50">
                        {promoCodeName && (
                          <div className="flex items-center gap-2 mb-2">
                            <Package className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-gray-900">{promoCodeName}</span>
                          </div>
                        )}
                        {promoCodeQuantity && (
                          <p className="text-xs text-gray-500">Quantity: {promoCodeQuantity}</p>
                        )}
                        {totalPrice && (
                          <p className="text-xs text-gray-500 mt-1">Contract Value: HKD {parseFloat(totalPrice).toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  ) : isTravelAgency && (creditBalance || totalPrice) ? (
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Credit Balance Contract</p>
                      <div className="p-3 rounded-lg border-2 border-purple-200 bg-purple-50">
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="w-4 h-4 text-purple-600" />
                          <span className="text-sm text-gray-900">Credit Balance</span>
                        </div>
                        {creditBalance && (
                          <p className="text-xs text-gray-500">Amount: HKD {parseFloat(creditBalance).toLocaleString()}</p>
                        )}
                        {totalPrice && (
                          <p className="text-xs text-gray-500 mt-1">Contract Value: HKD {parseFloat(totalPrice).toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 rounded-xl border-2 border-dashed border-gray-200 text-center">
                      <p className="text-xs text-gray-400">
                        {isIndividual ? 'No package selected yet' : 'Enter contract details'}
                      </p>
                    </div>
                  )}

                  {/* Price */}
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">{isIndividual ? 'Package price' : 'Contract price'}</span>
                      <span className="text-gray-900">
                        {isIndividual && selectedPackage 
                          ? `HKD ${selectedPackage.price.toLocaleString()}`
                          : !isIndividual && totalPrice
                          ? `HKD ${parseFloat(totalPrice).toLocaleString()}`
                          : '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t pt-2">
                      <span className="text-sm text-gray-900">Total</span>
                      <span className="text-gray-900">
                        {isIndividual && selectedPackage 
                          ? `HKD ${selectedPackage.price.toLocaleString()}`
                          : !isIndividual && totalPrice
                          ? `HKD ${parseFloat(totalPrice).toLocaleString()}`
                          : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Payment method */}
                  <div className="border-t pt-3">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Payment</p>
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-sm text-gray-700">{paymentMethod}</span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>

      </div>

    </div>
  );
}