import { useState } from 'react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { toast } from 'sonner';
import { MOCK_ACCOUNTS } from './PurchaseCreate';
import { Building2, Plane, Search, Shuffle, Copy, X, UserPlus } from 'lucide-react';

// ── MOCK companies (isolated — container replaces via props) ──────────────────
const MOCK_COMPANIES = [
  { id: '1', name: 'Cathay Pacific Airways', code: 'CORP-CX-001' },
  { id: '2', name: 'HSBC Holdings',          code: 'CORP-HS-001' },
  { id: '3', name: 'AIA Group',              code: 'CORP-AI-001' },
];

export interface AccountCreationProps {
  type?: 'individual' | 'corporate' | 'travel-agency';
  companies?: typeof MOCK_COMPANIES;
  countries?: { code: string; name: string }[];
  regionCodes?: { code: string; name: string }[];
  onSubmit?: (data: FormData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

interface CorporateSubForm {
  id: number;
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  regionCode: string;
  contactNumber: string;
  paymentMethod: string;
  remarks: string;
}

const emptySubForm = (id: number): CorporateSubForm => ({
  id,
  title: '',
  firstName: '',
  lastName: '',
  email: '',
  regionCode: '852',
  contactNumber: '',
  paymentMethod: 'upfront',
  remarks: '',
});

export function AccountCreation({
  type,
  companies: companiesProp,
  countries,
  regionCodes: regionCodesProp,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: AccountCreationProps = {}) {
  const displayCompanies = companiesProp && companiesProp.length > 0 ? companiesProp : MOCK_COMPANIES;
  const displayRegionCodes = regionCodesProp && regionCodesProp.length > 0 ? regionCodesProp : null;
  const [accountType, setAccountType] = useState<'individual' | 'corporate' | 'travel-agency'>('individual');
  const [selectedCompanyAccount, setSelectedCompanyAccount] = useState<string>('');
  const [companySearch, setCompanySearch] = useState('');

  // ── Corporate bulk sub-forms ─────────────────────────────────────────────
  const [corporateForms, setCorporateForms] = useState<CorporateSubForm[]>([emptySubForm(Date.now())]);

  const addCorporateForm = () =>
    setCorporateForms(prev => [...prev, emptySubForm(Date.now())]);

  const removeCorporateForm = (id: number) =>
    setCorporateForms(prev => prev.length > 1 ? prev.filter(f => f.id !== id) : prev);

  const updateCorporateForm = (id: number, field: keyof Omit<CorporateSubForm, 'id'>, value: string) =>
    setCorporateForms(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));

  // ── Individual / Travel Agency form data ─────────────────────────────────
  const [formData, setFormData] = useState({
    title: '',
    firstName: '',
    lastName: '',
    regionCode: '852',
    contactNumber: '',
    email: '',
    nationality: '',
    passportNumber: '',
    companyId: '',
    companyName: '',
    agencyCode: '',
    paymentMethod: 'upfront',
    membershipPackage: '',
    remarks: '',
  });

  // ── Quick Fill ────────────────────────────────────────────────────────────
  const handleQuickFill = () => {
    if (accountType === 'individual') {
      setFormData({
        ...formData,
        title: 'mr', firstName: 'James', lastName: 'Wong',
        regionCode: '852', contactNumber: '91234567',
        email: 'james.wong@gmail.com', nationality: 'hk',
        passportNumber: 'H123', membershipPackage: 'gold', remarks: '',
        companyId: '', companyName: '', agencyCode: '', paymentMethod: 'upfront',
      });
    } else if (accountType === 'corporate') {
      setCorporateForms([{
        id: Date.now(),
        title: 'mrs', firstName: 'Alice', lastName: 'Lam',
        email: 'alice.lam@cathaypacific.com',
        regionCode: '852', contactNumber: '98765432',
        paymentMethod: 'on-credit', remarks: 'VIP corporate client',
      }]);
      if (filteredCompanyAccounts.length > 0)
        setSelectedCompanyAccount(filteredCompanyAccounts[0].accountNumber);
    } else {
      setFormData({
        ...formData,
        title: 'ms', firstName: 'Fiona', lastName: 'Cheung',
        regionCode: '852', contactNumber: '95556789',
        email: 'fiona@pacificworld.hk', nationality: '', passportNumber: '',
        membershipPackage: '', companyName: 'Pacific World Travel',
        agencyCode: 'TA-PW-001', paymentMethod: 'on-credit',
        remarks: 'New agency partnership', companyId: '',
      });
      if (filteredCompanyAccounts.length > 0)
        setSelectedCompanyAccount(filteredCompanyAccounts[0].accountNumber);
    }
  };

  // ── Company / Agency filtering ────────────────────────────────────────────
  const getFilteredCompanyAccounts = () => {
    if (accountType === 'corporate')     return MOCK_ACCOUNTS.filter(a => a.purchaseCategory === 'Corporate');
    if (accountType === 'travel-agency') return MOCK_ACCOUNTS.filter(a => a.purchaseCategory === 'Travel Agency');
    return [];
  };
  const filteredCompanyAccounts = getFilteredCompanyAccounts().filter(acc =>
    !companySearch ||
    acc.primaryName.toLowerCase().includes(companySearch.toLowerCase()) ||
    acc.accountNumber.toLowerCase().includes(companySearch.toLowerCase()) ||
    (acc.contactPerson && acc.contactPerson.toLowerCase().includes(companySearch.toLowerCase()))
  );
  const selectedAccount = MOCK_ACCOUNTS.find(a => a.accountNumber === selectedCompanyAccount);

  // ── Membership packages ───────────────────────────────────────────────────
  const membershipPackages = [
    { value: 'gold',     label: 'Gold Package',     annualFee: 32000,  loungeEntries: 8,   freeUpgrade: 'NA', color: 'text-yellow-600' },
    { value: 'platinum', label: 'Platinum Package',  annualFee: 45000,  loungeEntries: 12,  freeUpgrade: 'NA', color: 'text-purple-600' },
    { value: 'diamond',  label: 'Diamond Package',   annualFee: 84000,  loungeEntries: 24,  freeUpgrade: '1',  color: 'text-sky-600'    },
    { value: 'sapphire', label: 'Sapphire Package',  annualFee: 325000, loungeEntries: -1,  freeUpgrade: '5',  color: 'text-indigo-600' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accountType === 'individual') {
      toast.success('Application Submitted', {
        description: 'Email verification link has been sent. HKIAL staff will be notified for review.',
      });
    } else {
      const count = accountType === 'corporate' ? corporateForms.length : 1;
      toast.success(count > 1 ? `${count} Accounts Created` : 'Account Created', {
        description: `${count} account${count > 1 ? 's have' : ' has'} been created successfully. Welcome email${count > 1 ? 's' : ''} sent.`,
      });
    }
  };

  // ── Corporate sub-form card ───────────────────────────────────────────────
  const renderCorporateSubForm = (subForm: CorporateSubForm, index: number) => (
    <div key={subForm.id} className="border-2 border-gray-200 rounded-xl overflow-hidden">
      {/* Card header */}
      <div className={`flex items-center justify-between px-4 py-3 ${index === 0 ? 'bg-[#0f2942]' : 'bg-slate-600'}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <span className="text-white text-xs">{index + 1}</span>
          </div>
          <span className="text-white text-sm">Customer #{index + 1}</span>
        </div>
        {index > 0 && (
          <button
            type="button"
            onClick={() => removeCorporateForm(subForm.id)}
            className="flex items-center gap-1 text-white/70 hover:text-white text-xs transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Remove
          </button>
        )}
      </div>

      {/* Card body */}
      <div className="p-5 bg-white grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Title */}
        <div>
          <Label htmlFor={`title-${subForm.id}`} style={{ marginBottom: 10 }}>Title *</Label>
          <Select value={subForm.title} onValueChange={v => updateCorporateForm(subForm.id, 'title', v)}>
            <SelectTrigger id={`title-${subForm.id}`}><SelectValue placeholder="Select title" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mr">Mr.</SelectItem>
              <SelectItem value="mrs">Mrs.</SelectItem>
              <SelectItem value="ms">Ms.</SelectItem>
              <SelectItem value="dr">Dr.</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* First Name */}
        <div>
          <Label htmlFor={`fn-${subForm.id}`} style={{ marginBottom: 10 }}>First Name *</Label>
          <Input id={`fn-${subForm.id}`} value={subForm.firstName}
            onChange={e => updateCorporateForm(subForm.id, 'firstName', e.target.value)}
            placeholder="Enter first name" required />
        </div>

        {/* Last Name */}
        <div>
          <Label htmlFor={`ln-${subForm.id}`} style={{ marginBottom: 10 }}>Last Name *</Label>
          <Input id={`ln-${subForm.id}`} value={subForm.lastName}
            onChange={e => updateCorporateForm(subForm.id, 'lastName', e.target.value)}
            placeholder="Enter last name" required />
        </div>

        {/* Email */}
        <div>
          <Label htmlFor={`em-${subForm.id}`} style={{ marginBottom: 10 }}>Email *</Label>
          <Input id={`em-${subForm.id}`} type="email" value={subForm.email}
            onChange={e => updateCorporateForm(subForm.id, 'email', e.target.value)}
            placeholder="Enter email address" required />
        </div>

        {/* Region Code + Contact Number */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label htmlFor={`rc-${subForm.id}`} style={{ marginBottom: 10 }}>Region Code *</Label>
            {displayRegionCodes ? (
              <Select value={subForm.regionCode} onValueChange={v => updateCorporateForm(subForm.id, 'regionCode', v)}>
                <SelectTrigger id={`rc-${subForm.id}`}><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {displayRegionCodes.map(rc => (
                    <SelectItem key={rc.code} value={rc.code}>{rc.code} — {rc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input id={`rc-${subForm.id}`} value={subForm.regionCode}
                onChange={e => updateCorporateForm(subForm.id, 'regionCode', e.target.value)}
                placeholder="852" required />
            )}
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor={`cn-${subForm.id}`} style={{ marginBottom: 10 }}>Contact Number *</Label>
            <Input id={`cn-${subForm.id}`} value={subForm.contactNumber}
              onChange={e => updateCorporateForm(subForm.id, 'contactNumber', e.target.value)}
              placeholder="Enter contact number" required />
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <Label style={{ marginBottom: 10 }}>Payment Method *</Label>
          <RadioGroup value={subForm.paymentMethod}
            onValueChange={v => updateCorporateForm(subForm.id, 'paymentMethod', v)}
            className="flex flex-wrap gap-4 mt-2">
            {[['upfront', 'Upfront'], ['net-upfront', 'Net Upfront'], ['on-credit', 'On-Credit']].map(([val, lbl]) => (
              <div key={val} className="flex items-center space-x-2">
                <RadioGroupItem value={val} id={`${val}-${subForm.id}`} />
                <Label htmlFor={`${val}-${subForm.id}`} className="cursor-pointer">{lbl}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Remarks */}
        <div className="md:col-span-2">
          <Label htmlFor={`rm-${subForm.id}`} style={{ marginBottom: 10 }}>Remarks</Label>
          <Textarea id={`rm-${subForm.id}`} value={subForm.remarks}
            onChange={e => updateCorporateForm(subForm.id, 'remarks', e.target.value)}
            placeholder="Enter any additional remarks" rows={2} />
        </div>
      </div>
    </div>
  );

  // ── Shared: Company / Agency selector ────────────────────────────────────
  const renderCompanySelector = () => (
    <div>
      <Label style={{ marginBottom: 10 }}>
        {accountType === 'corporate'
          ? <><Building2 className="inline w-4 h-4 mr-1 text-gray-500" />Select Corporate Customer *</>
          : <><Plane className="inline w-4 h-4 mr-1 text-gray-500" />Select Travel Agency *</>}
      </Label>
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder={`Search by name, account number${accountType === 'corporate' ? ' or contact person' : ''}...`}
          value={companySearch}
          onChange={e => setCompanySearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-2 bg-gray-50">
        {filteredCompanyAccounts.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-6">
            No {accountType === 'corporate' ? 'corporate customers' : 'travel agencies'} found.
          </p>
        ) : filteredCompanyAccounts.map(account => {
          const isSel = selectedCompanyAccount === account.accountNumber;
          return (
            <div
              key={account.accountNumber}
              onClick={() => setSelectedCompanyAccount(account.accountNumber)}
              className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${
                isSel ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  isSel ? 'bg-blue-600' : accountType === 'corporate' ? 'bg-blue-100' : 'bg-purple-100'
                }`}>
                  {accountType === 'corporate'
                    ? <Building2 className={`w-4 h-4 ${isSel ? 'text-white' : 'text-blue-600'}`} />
                    : <Plane     className={`w-4 h-4 ${isSel ? 'text-white' : 'text-purple-600'}`} />}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{account.primaryName}</p>
                  <p className="text-xs text-gray-500">
                    {account.accountNumber}{account.contactPerson && ` · ${account.contactPerson}`}
                  </p>
                </div>
              </div>
              {isSel && (
                <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {selectedAccount && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700 mb-1">Selected Account</p>
          <p className="text-sm font-medium text-blue-900">{selectedAccount.primaryName}</p>
          <p className="text-xs text-blue-600">{selectedAccount.accountNumber}</p>
          {selectedAccount.contactPerson && (
            <p className="text-xs text-blue-600 mt-1">Contact: {selectedAccount.contactPerson}</p>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-4 md:p-6">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-gray-900 mb-1">
              {type === 'individual' ? 'Individual Customer Registration' : 'Agent / Corporate Account Creation'}
            </h1>
            <p className="text-sm text-gray-500">
              {type === 'individual'
                ? 'Online registration form for individual customers'
                : 'Create account for corporate or agent customers (Staff Only)'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Bulk Create — visible only for Corporate account type */}
            {accountType === 'corporate' && (
              <Button
                type="button"
                variant="outline"
                onClick={addCorporateForm}
                className="gap-1.5 border-[#0f2942] text-[#0f2942] hover:bg-[#0f2942] hover:text-white transition-all text-sm px-3 h-9"
              >
                <Copy className="w-3.5 h-3.5" />
                Bulk Create
                {corporateForms.length > 1 && (
                  <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-xs">
                    {corporateForms.length}
                  </span>
                )}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={handleQuickFill}
              className="gap-1 bg-gradient-to-r from-yellow-400/20 to-amber-400/20 border-yellow-400/50 text-yellow-700 hover:from-yellow-400/30 hover:to-amber-400/30 hover:border-yellow-500/70 hover:text-yellow-800 transition-all text-[10px] px-2 py-0.5 h-[25px]"
            >
              <Shuffle className="w-3 h-3" />
              Quick Fill Demo
            </Button>
          </div>
        </div>
      </div>

      <Card className="p-4 md:p-6">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Account Type selector */}
          <div>
            <Label style={{ marginBottom: 10 }}>Account Type *</Label>
            <div className="flex flex-wrap gap-2">
              {(['individual', 'corporate', 'travel-agency'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setAccountType(t);
                    setSelectedCompanyAccount('');
                    setCompanySearch('');
                    if (t === 'corporate') setCorporateForms([emptySubForm(Date.now())]);
                  }}
                  className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                    accountType === t
                      ? 'bg-[#0f2942] text-white border-[#0f2942]'
                      : 'text-gray-600 border-gray-300 hover:border-gray-400 bg-white'
                  }`}
                >
                  {t === 'individual' ? 'Individual' : t === 'corporate' ? 'Corporate' : 'Travel Agency'}
                </button>
              ))}
            </div>
          </div>

          {/* ── Corporate ─────────────────────────────────────────────────── */}
          {accountType === 'corporate' && (
            <>
              {/* Shared company selector */}
              {renderCompanySelector()}

              {/* Divider + heading */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-gray-800 flex items-center gap-2">
                    Customer Details
                    {corporateForms.length > 1 && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                        {corporateForms.length} customers
                      </span>
                    )}
                  </h4>
                </div>

                {/* Sub-form cards */}
                <div className="space-y-4">
                  {corporateForms.map((sf, idx) => renderCorporateSubForm(sf, idx))}
                </div>

                {/* Dashed "Add another" row */}
                <button
                  type="button"
                  onClick={addCorporateForm}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-400 hover:border-[#0f2942] hover:text-[#0f2942] transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Another Customer
                </button>
              </div>
            </>
          )}

          {/* ── Individual ────────────────────────────────────────────────── */}
          {accountType === 'individual' && (
            <div>
              <h4 className="text-gray-800 mb-4">Personal Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title" style={{ marginBottom: 10 }}>Title *</Label>
                  <Select value={formData.title} onValueChange={v => setFormData({...formData, title: v})}>
                    <SelectTrigger id="title"><SelectValue placeholder="Select title" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mr">Mr.</SelectItem>
                      <SelectItem value="mrs">Mrs.</SelectItem>
                      <SelectItem value="ms">Ms.</SelectItem>
                      <SelectItem value="dr">Dr.</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="firstName" style={{ marginBottom: 10 }}>First Name *</Label>
                  <Input id="firstName" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} placeholder="Enter first name" required />
                </div>
                <div>
                  <Label htmlFor="lastName" style={{ marginBottom: 10 }}>Last Name *</Label>
                  <Input id="lastName" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} placeholder="Enter last name" required />
                </div>
                <div>
                  <Label htmlFor="email" style={{ marginBottom: 10 }}>Email *</Label>
                  <Input id="email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Enter email address" required />
                </div>
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="regionCode" style={{ marginBottom: 10 }}>Region Code *</Label>
                    {displayRegionCodes ? (
                      <Select value={formData.regionCode} onValueChange={v => setFormData({...formData, regionCode: v})}>
                        <SelectTrigger id="regionCode"><SelectValue placeholder="Select region code" /></SelectTrigger>
                        <SelectContent>
                          {displayRegionCodes.map(rc => (
                            <SelectItem key={rc.code} value={rc.code}>{rc.code} — {rc.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input id="regionCode" value={formData.regionCode} onChange={e => setFormData({...formData, regionCode: e.target.value})} placeholder="852" required />
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="contactNumber" style={{ marginBottom: 10 }}>Contact Number *</Label>
                    <Input id="contactNumber" value={formData.contactNumber} onChange={e => setFormData({...formData, contactNumber: e.target.value})} placeholder="Enter contact number" required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="nationality" style={{ marginBottom: 10 }}>Nationality (optional)</Label>
                  {countries && countries.length > 0 ? (
                    <Select value={formData.nationality} onValueChange={v => setFormData({...formData, nationality: v})}>
                      <SelectTrigger id="nationality"><SelectValue placeholder="Select nationality" /></SelectTrigger>
                      <SelectContent>
                        {countries.map(c => (
                          <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Select value={formData.nationality} onValueChange={v => setFormData({...formData, nationality: v})}>
                      <SelectTrigger id="nationality"><SelectValue placeholder="Select nationality" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hk">Hong Kong</SelectItem>
                        <SelectItem value="cn">China</SelectItem>
                        <SelectItem value="us">United States</SelectItem>
                        <SelectItem value="uk">United Kingdom</SelectItem>
                        <SelectItem value="jp">Japan</SelectItem>
                        <SelectItem value="kr">South Korea</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div>
                  <Label htmlFor="passportNumber" style={{ marginBottom: 10 }}>First 4 digits of Passport Number (optional)</Label>
                  <Input id="passportNumber" value={formData.passportNumber} onChange={e => setFormData({...formData, passportNumber: e.target.value})} placeholder="Enter first 4 digits" maxLength={4} />
                </div>
                
              </div>
            </div>
          )}

          {/* ── Travel Agency ─────────────────────────────────────────────── */}
          {accountType === 'travel-agency' && (
            <>
              {renderCompanySelector()}
              <div className="pt-2">
                <h4 className="text-gray-800 mb-4">Personal Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title" style={{ marginBottom: 10 }}>Title *</Label>
                    <Select value={formData.title} onValueChange={v => setFormData({...formData, title: v})}>
                      <SelectTrigger id="title"><SelectValue placeholder="Select title" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mr">Mr.</SelectItem>
                        <SelectItem value="mrs">Mrs.</SelectItem>
                        <SelectItem value="ms">Ms.</SelectItem>
                        <SelectItem value="dr">Dr.</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="firstName" style={{ marginBottom: 10 }}>First Name *</Label>
                    <Input id="firstName" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} placeholder="Enter first name" required />
                  </div>
                  <div>
                    <Label htmlFor="lastName" style={{ marginBottom: 10 }}>Last Name *</Label>
                    <Input id="lastName" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} placeholder="Enter last name" required />
                  </div>
                  <div>
                    <Label htmlFor="email" style={{ marginBottom: 10 }}>Email *</Label>
                    <Input id="email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Enter email address" required />
                  </div>
                  <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="regionCode" style={{ marginBottom: 10 }}>Region Code *</Label>
                      {displayRegionCodes ? (
                        <Select value={formData.regionCode} onValueChange={v => setFormData({...formData, regionCode: v})}>
                          <SelectTrigger id="regionCode"><SelectValue placeholder="Select region code" /></SelectTrigger>
                          <SelectContent>
                            {displayRegionCodes.map(rc => (
                              <SelectItem key={rc.code} value={rc.code}>{rc.code} — {rc.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input id="regionCode" value={formData.regionCode} onChange={e => setFormData({...formData, regionCode: e.target.value})} placeholder="852" required />
                      )}
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="contactNumber" style={{ marginBottom: 10 }}>Contact Number *</Label>
                      <Input id="contactNumber" value={formData.contactNumber} onChange={e => setFormData({...formData, contactNumber: e.target.value})} placeholder="Enter contact number" required />
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t">
                <h4 className="text-gray-800 mb-4">Additional Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyName" style={{ marginBottom: 10 }}>Company Name *</Label>
                    <Input id="companyName" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} placeholder="Enter company name" required />
                  </div>
                  <div>
                    <Label htmlFor="agencyCode" style={{ marginBottom: 10 }}>Agency / Allotment Code *</Label>
                    <Input id="agencyCode" value={formData.agencyCode} onChange={e => setFormData({...formData, agencyCode: e.target.value})} placeholder="Enter agency / allotment code" required />
                  </div>
                  <div>
                    <Label style={{ marginBottom: 10 }}>Payment Method *</Label>
                    <RadioGroup value={formData.paymentMethod} onValueChange={v => setFormData({...formData, paymentMethod: v})} className="flex flex-wrap gap-4 mt-2">
                      {[['upfront', 'Upfront'], ['net-upfront', 'Net Upfront'], ['on-credit', 'On-Credit']].map(([val, lbl]) => (
                        <div key={val} className="flex items-center space-x-2">
                          <RadioGroupItem value={val} id={val} />
                          <Label htmlFor={val} className="cursor-pointer">{lbl}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="remarks" style={{ marginBottom: 10 }}>Remarks</Label>
                    <Textarea id="remarks" value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} placeholder="Enter any additional remarks" rows={3} />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" className="w-full sm:w-auto">Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
              {accountType === 'individual'
                ? 'Submit Application'
                : accountType === 'corporate' && corporateForms.length > 1
                ? `Create ${corporateForms.length} Accounts`
                : 'Create Account'}
            </Button>
          </div>
        </form>
      </Card>

      {/* API info card */}
      {type === 'corporate' && (
        <Card className="p-4 md:p-6 mt-6 bg-blue-50 border-blue-200">
          <h4 className="text-gray-900 mb-2">API Integration</h4>
          <p className="text-sm text-gray-600 mb-3">Account creation can also be triggered via API endpoint:</p>
          <div className="bg-white p-3 rounded border font-mono text-sm">
            <span className="text-green-600">POST</span> /api/accounts/create
          </div>
          <p className="text-xs text-gray-500 mt-2">System will auto-generate password and send welcome email with account details.</p>
        </Card>
      )}
    </div>
  );
}