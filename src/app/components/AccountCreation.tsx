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
  const displayCountries = countries && countries.length > 0 ? countries : null;
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
    }
  };

  // ── Company selector logic ──────────────────────────────────────────────
  const filteredCompanyAccounts = MOCK_ACCOUNTS.filter(a =>
    a.type === 'Corporate' &&
    (a.name.toLowerCase().includes(companySearch.toLowerCase()) ||
     a.accountNumber.toLowerCase().includes(companySearch.toLowerCase()))
  ).slice(0, 5);

  const renderCompanySelector = () => (
    <div className="mb-6">
      <Label style={{ marginBottom: 10 }}>Select Company Account *</Label>
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
        <Input
          placeholder="Search company by name or account number..."
          value={companySearch}
          onChange={(e) => setCompanySearch(e.target.value)}
          className="pl-10"
        />
      </div>
      {companySearch && (
        <div className="mt-2 border rounded-md bg-white shadow-lg max-h-48 overflow-y-auto">
          {filteredCompanyAccounts.length === 0 ? (
            <div className="p-3 text-gray-500 text-sm">No matching accounts found</div>
          ) : (
            filteredCompanyAccounts.map(company => (
              <div
                key={company.accountNumber}
                className={`p-3 cursor-pointer hover:bg-blue-50 border-b last:border-b-0 ${
                  selectedCompanyAccount === company.accountNumber ? 'bg-blue-50' : ''
                }`}
                onClick={() => {
                  setSelectedCompanyAccount(company.accountNumber);
                  setCompanySearch('');
                }}
              >
                <div className="font-medium">{company.name}</div>
                <div className="text-xs text-gray-500">{company.accountNumber}</div>
              </div>
            ))
          )}
        </div>
      )}
      {selectedCompanyAccount && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded flex items-center justify-between">
          <span className="text-sm text-green-700">
            Selected: <span className="font-medium">{selectedCompanyAccount}</span>
          </span>
          <button
            type="button"
            onClick={() => setSelectedCompanyAccount('')}
            className="text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );

  // ── Form submission ─────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (accountType === 'corporate' && !selectedCompanyAccount) {
      toast.error('Please select a company account');
      return;
    }

    const payload = {
      type: accountType,
      companyAccountNumber: selectedCompanyAccount,
      ...(accountType === 'corporate'
        ? { contacts: corporateForms }
        : { ...formData }),
    };

    toast.success('Account creation form submitted (check console for payload)');
    console.log('Form payload:', payload);
    onSubmit?.(payload);
  };

  return (
    <Card className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Create New Account</h2>
          <p className="text-gray-600">Fill in the details below to create a new account</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleQuickFill}>
          <Shuffle className="w-4 h-4 mr-2" />
          Quick Fill
        </Button>
      </div>

      {/* Account Type Toggle */}
      <div className="mb-6">
        <Label style={{ marginBottom: 10 }}>Account Type *</Label>
        <div className="flex flex-wrap gap-4">
          {(['individual', 'corporate', 'travel-agency'] as const).map(typeOption => (
            <div key={typeOption} className="flex items-center space-x-2">
              <input
                type="radio"
                id={typeOption}
                checked={accountType === typeOption}
                onChange={() => setAccountType(typeOption)}
                className="w-4 h-4"
              />
              <Label htmlFor={typeOption} className="cursor-pointer flex items-center gap-1">
                {typeOption === 'individual' && <><UserPlus className="w-4 h-4" /> Individual</>}
                {typeOption === 'corporate' && <><Building2 className="w-4 h-4" /> Corporate</>}
                {typeOption === 'travel-agency' && <><Plane className="w-4 h-4" /> Agency</>}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Corporate Account Form */}
        {accountType === 'corporate' && (
          <>
            {renderCompanySelector()}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-gray-800">Corporate Contacts ({corporateForms.length})</h4>
                <Button type="button" variant="outline" size="sm" onClick={addCorporateForm}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Contact
                </Button>
              </div>

              {corporateForms.map((subForm, index) => (
                <div key={subForm.id} className="mb-6 p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="font-medium text-gray-700">Contact #{index + 1}</h5>
                    {corporateForms.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCorporateForm(subForm.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <SelectTrigger id={`rc-${subForm.id}`}><SelectValue placeholder="Select region code" /></SelectTrigger>
                            <SelectContent>
                              {displayRegionCodes.map(rc => (
                                <SelectItem key={rc.code} value={rc.code}>{rc.code} - {rc.name}</SelectItem>
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
                            <RadioGroupItem value={val} id={`pm-${subForm.id}-${val}`} />
                            <Label htmlFor={`pm-${subForm.id}-${val}`} className="cursor-pointer">{lbl}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    {/* Remarks */}
                    <div>
                      <Label htmlFor={`rm-${subForm.id}`} style={{ marginBottom: 10 }}>Remarks</Label>
                      <Input id={`rm-${subForm.id}`} value={subForm.remarks}
                        onChange={e => updateCorporateForm(subForm.id, 'remarks', e.target.value)}
                        placeholder="Optional remarks" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Individual / Travel Agency Form */}
        {accountType !== 'corporate' && (
          <>
            {accountType === 'travel-agency' && (
              <>
                {renderCompanySelector()}
                <div className="pt-4 border-t">
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
                                <SelectItem key={rc.code} value={rc.code}>{rc.code} - {rc.name}</SelectItem>
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
                      {displayCountries ? (
                        <Select value={formData.nationality} onValueChange={v => setFormData({...formData, nationality: v})}>
                          <SelectTrigger id="nationality"><SelectValue placeholder="Select nationality" /></SelectTrigger>
                          <SelectContent>
                            {displayCountries.map(c => (
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
              </>
            )}

            {accountType === 'individual' && (
              <>
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
                                <SelectItem key={rc.code} value={rc.code}>{rc.code} - {rc.name}</SelectItem>
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
                      {displayCountries ? (
                        <Select value={formData.nationality} onValueChange={v => setFormData({...formData, nationality: v})}>
                          <SelectTrigger id="nationality"><SelectValue placeholder="Select nationality" /></SelectTrigger>
                          <SelectContent>
                            {displayCountries.map(c => (
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
              </>
            )}

            {accountType === 'travel-agency' && (
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
            )}
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

      {/* API info card */}
      {type === 'corporate' && (
        <Card className="p-4 md:p-6 mt-6 bg-blue-50 border-blue-200">
          <h4 className="text-gray-900 mb-2">API Integration</h4>
          <p className="text-sm text-gray-600 mb-3">Account creation can also be triggered via API endpoint:</p>
          <div className="bg-white p-3 rounded border font-mono text-sm">
            <div className="text-gray-500 text-xs mb-1">POST /api/accounts/corporate/create-bulk</div>
            <div className="text-blue-600">/api/v1/corporate/bulk-accounts</div>
          </div>
        </Card>
      )}
    </Card>
  );
}