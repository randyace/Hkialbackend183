import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft, Building2, Mail, Phone, Save, FileText, Calendar, Edit2, AlertTriangle, CheckCircle, XCircle, Plus, Trash2 } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { StringDatePicker } from '../../../../ui/CustomDatePicker';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

// ── MOCK constant (isolated — container replaces via props) ───────────────────
const MOCK_COMPANY: Company = {
  id: 1,
  companyName: 'Cathay Pacific Airways',
  companyCode: 'CORP-CX-001',
  contactPerson: 'Sarah Wong',
  email: 'sarah.wong@cathaypacific.com',
  phone: '+852 2123 4567',
  paymentMethod: 'On-Credit',
  discountRate: 15,
  status: 'active',
};

export interface CompanyEditProps {
  companyId?: number | null;
  /** Pass full company from CI4; when null falls back to MOCK_COMPANY for demo */
  initialData?: Company | null;
  /** Linked accounts from GET /companies/{id} — empty when none / create mode. */
  members?: Member[] | null;
  /** Normalized contracts from GET /companies/{id} — empty when none / create mode. */
  contracts?: Contract[] | null;
  onSave?: (data: Company) => void;
  onBack: () => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

interface Company {
  id: number;
  companyName: string;
  companyCode: string;
  contactPerson: string;
  email: string;
  phone: string;
  /** Full Contact Persons list; when present, preferred over primary scalars. */
  contacts?: Array<{ name: string; email: string; phone: string }>;
  paymentMethod: 'Upfront' | 'Net Upfront' | 'On-Credit' | 'Bulk Purchase';
  discountRate: number;
  status: 'active' | 'inactive';
  address?: string;
  remarks?: string;
}

interface ContactPerson {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface Contract {
  id: string;
  contractNumber: string;
  offerName: string;
  purchaseDate: string;
  startDate: string;
  expiryDate: string;
  sessionsTotal: number;
  sessionsUsed: number;
  status: 'Active' | 'Expiring Soon' | 'Expired';
  notes?: string;
}

interface Member {
  id: number;
  accountNumber: string;
  name: string;
  email: string;
  phone: string;
  department?: string;
  role?: string;
  status: 'active' | 'inactive' | 'suspended';
  joinDate: string;
  lastLogin?: string;
}

type BalanceStatus = 'critical' | 'low' | 'ok' | 'full' | 'depleted';

function getBalanceStatus(used: number, total: number): BalanceStatus {
  const remaining = total - used;
  const pct = total > 0 ? ((total - used) / total) * 100 : 0;
  if (remaining === 0) return 'depleted';
  if (pct <= 10) return 'critical';
  if (pct <= 30) return 'low';
  if (used === 0) return 'full';
  return 'ok';
}

const STATUS_CONFIG: Record<BalanceStatus, { label: string; barColor: string; textColor: string; bg: string; icon: React.ReactNode }> = {
  full:     { label: 'Full',     barColor: 'bg-blue-500',   textColor: 'text-blue-700',  bg: 'bg-blue-50',   icon: <CheckCircle className="w-3.5 h-3.5" /> },
  ok:       { label: 'OK',       barColor: 'bg-green-500',  textColor: 'text-green-700', bg: 'bg-green-50',  icon: <CheckCircle className="w-3.5 h-3.5" /> },
  low:      { label: 'Low',      barColor: 'bg-amber-500',  textColor: 'text-amber-700', bg: 'bg-amber-50',  icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  critical: { label: 'Critical', barColor: 'bg-red-500',    textColor: 'text-red-700',   bg: 'bg-red-50',    icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  depleted: { label: 'Depleted', barColor: 'bg-gray-300',   textColor: 'text-gray-500',  bg: 'bg-gray-50',   icon: <XCircle className="w-3.5 h-3.5" /> },
};

function SessionBar({ used, total }: { used: number; total: number }) {
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  const status = getBalanceStatus(used, total);
  const remaining = total - used;
  return (
    <div className="min-w-[140px]">
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs ${STATUS_CONFIG[status].textColor}`}>
          {remaining}/{total} remaining
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`h-2 rounded-full transition-all ${STATUS_CONFIG[status].barColor}`}
          style={{ width: `${100 - pct}%` }} />
      </div>
    </div>
  );
}

function ContractStatusBadge({ status }: { status: Contract['status'] }) {
  const colors = {
    'Active': 'bg-green-100 text-green-800',
    'Expiring Soon': 'bg-amber-100 text-amber-800',
    'Expired': 'bg-red-100 text-red-800'
  };
  return <Badge className={colors[status]}>{status}</Badge>;
}

function BalanceBadge({ used, total }: { used: number; total: number }) {
  const status = getBalanceStatus(used, total);
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${cfg.bg} ${cfg.textColor}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

export function CompanyEdit({
  companyId,
  initialData,
  members,
  contracts,
  onSave,
  onBack,
  onCancel,
  isSubmitting = false,
}: CompanyEditProps) {
  // ── Form field state (controlled inputs) ──────────────────────────────────
  const [formCompanyName, setFormCompanyName] = useState('');
  const [formCompanyCode, setFormCompanyCode] = useState('');
  const [formPaymentMethod, setFormPaymentMethod] = useState<'Upfront' | 'Net Upfront' | 'On-Credit' | 'Bulk Purchase'>('Upfront');
  const [formDiscountRate, setFormDiscountRate] = useState(0);
  const [formBillingAddress, setFormBillingAddress] = useState('');
  const [formRemarks, setFormRemarks] = useState('');

  // ── Core company state ───────────────────────────────────────────────────
  // companyId: null = create mode (no mock), undefined = edit mode (no data yet), number = edit with data
  const [company, setCompany] = useState<Company | null>(
    initialData !== undefined ? initialData : companyId ? MOCK_COMPANY : undefined,
  );

  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [editForm, setEditForm] = useState({ expiryDate: '', sessionsTotal: 0, sessionsUsed: 0 });
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [contactPersons, setContactPersons] = useState<ContactPerson[]>([
    { id: '1', name: company?.contactPerson || '', email: company?.email || '', phone: company?.phone || '' }
  ]);
  const [companyStatus, setCompanyStatus] = useState<boolean>(company?.status === 'active');

  // Hydrate once per company id — do not re-bind on every parent object
  // identity change (that made Contact email/phone feel locked while typing).
  useEffect(() => {
    if (initialData === undefined || initialData === null) {
      return;
    }
    setCompany(initialData);
    setFormCompanyName(initialData.companyName || '');
    setFormCompanyCode(initialData.companyCode || '');
    setFormPaymentMethod(initialData.paymentMethod || 'Upfront');
    setFormDiscountRate(initialData.discountRate ?? 0);
    setFormBillingAddress(initialData.address || '');
    setFormRemarks(initialData.remarks || '');
    setCompanyStatus(initialData.status === 'active');
    // Prefer full contact_persons list from API; fall back to primary scalars.
    const loadedContacts = (initialData.contacts ?? [])
      .map((c, index) => ({
        id: String(index + 1),
        name: c.name || '',
        email: c.email || '',
        phone: c.phone || '',
      }))
      .filter((c) => c.name || c.email || c.phone);
    setContactPersons(
      loadedContacts.length > 0
        ? loadedContacts
        : [{
            id: '1',
            name: initialData.contactPerson || '',
            email: initialData.email || '',
            phone: initialData.phone || '',
          }],
    );
  }, [initialData?.id, companyId]);

  const isEditMode = companyId !== null;

  const handleAddContactPerson = () => {
    const newId = (contactPersons.length + 1).toString();
    setContactPersons([...contactPersons, { id: newId, name: '', email: '', phone: '' }]);
  };

  const handleRemoveContactPerson = (id: string) => {
    if (contactPersons.length > 1) {
      setContactPersons(contactPersons.filter(cp => cp.id !== id));
    }
  };

  const handleUpdateContactPerson = (id: string, field: keyof Omit<ContactPerson, 'id'>, value: string) => {
    setContactPersons(contactPersons.map(cp => 
      cp.id === id ? { ...cp, [field]: value } : cp
    ));
  };

  const handleEditContract = (contract: Contract) => {
    setEditingContract(contract);
    setEditForm({
      expiryDate: contract.expiryDate,
      sessionsTotal: contract.sessionsTotal,
      sessionsUsed: contract.sessionsUsed
    });
  };

  const handleSaveContract = () => {
    console.log('Saving contract:', editingContract?.contractNumber, editForm);
    setEditingContract(null);
  };

  const daysUntilExpiry = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const displayMembers = members ?? [];
  const displayContracts = contracts ?? [];
  const totalSessions = displayContracts.reduce((sum, c) => sum + c.sessionsTotal, 0);
  const usedSessions = displayContracts.reduce((sum, c) => sum + c.sessionsUsed, 0);
  const remainingSessions = totalSessions - usedSessions;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1>{isEditMode ? 'Edit Company' : 'Create New Company'}</h1>
          <p className="text-gray-600">
            {isEditMode ? 'Edit the details of the company' : 'Enter the details of the new company'}
          </p>
        </div>
      </div>

      {/* Main Form Card */}
      <Card className="p-6">
<form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            // Build final Company object from form state + contact persons
            // In create mode (company === undefined), build payload directly from form fields
            const contacts = contactPersons.map((c) => ({
              name: c.name || '',
              email: c.email || '',
              phone: c.phone || '',
            }));
            const primaryContact = contacts[0];
            const payload: Company = company
              ? {
                  ...company,
                  companyName: formCompanyName,
                  companyCode: formCompanyCode,
                  paymentMethod: formPaymentMethod,
                  discountRate: formDiscountRate,
                  status: companyStatus ? 'active' : 'inactive',
                  address: formBillingAddress,
                  remarks: formRemarks,
                  contactPerson: primaryContact?.name || '',
                  email: primaryContact?.email || '',
                  phone: primaryContact?.phone || '',
                  contacts,
                }
              : {
                  id: 0,
                  companyName: formCompanyName,
                  companyCode: formCompanyCode,
                  paymentMethod: formPaymentMethod,
                  discountRate: formDiscountRate,
                  status: companyStatus ? 'active' : 'inactive',
                  address: formBillingAddress,
                  remarks: formRemarks,
                  contactPerson: primaryContact?.name || '',
                  email: primaryContact?.email || '',
                  phone: primaryContact?.phone || '',
                  contacts,
                };
            onSave?.(payload);
          }}
        >
          {/* Company Information Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 border-b pb-2">Company Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label>Company Name</label>
                <input
                  type="text"
                  value={formCompanyName}
                  onChange={(e) => setFormCompanyName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Cathay Pacific Airways"
                />
              </div>
              <div>
                <label>Company Code</label>
                <input
                  type="text"
                  value={formCompanyCode}
                  onChange={(e) => setFormCompanyCode(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., CORP-CX-001"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label>Payment Method</label>
                <select
                  value={formPaymentMethod}
                  onChange={(e) => setFormPaymentMethod(e.target.value as typeof formPaymentMethod)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                >
                  <option value="Upfront">Upfront Payment</option>
                  <option value="Net Upfront">Net Upfront</option>
                  <option value="On-Credit">On Credit</option>
                  <option value="Bulk Purchase">Bulk Purchase</option>
                </select>
              </div>
              <div>
                <label>Discount Rate (%)</label>
                <input
                  type="number"
                  value={formDiscountRate}
                  onChange={(e) => setFormDiscountRate(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  placeholder="0"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label>Status</label>
                <div className="flex items-center gap-3 pt-2">
                  <Switch
                    checked={companyStatus}
                    onCheckedChange={setCompanyStatus}
                  />
                  <span className="text-sm text-gray-700">
                    {companyStatus ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Persons Section */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-700">Contact Persons</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddContactPerson}
                  className="h-8"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Contact Person
                </Button>
              </div>

              {contactPersons.map((contact, index) => (
                <div key={contact.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h5 className="text-sm font-medium text-gray-700">Contact Person {index + 1}</h5>
                    {contactPersons.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveContactPerson(contact.id)}
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs">Name</label>
                      <Input
                        type="text"
                        value={contact.name}
                        onChange={(e) => handleUpdateContactPerson(contact.id, 'name', e.target.value)}
                        placeholder="Full name"
                        className="h-9"
                      />
                    </div>
                    <div>
                      <label className="text-xs">Email Address</label>
                      <Input
                        type="email"
                        value={contact.email}
                        onChange={(e) => handleUpdateContactPerson(contact.id, 'email', e.target.value)}
                        placeholder="email@company.com"
                        className="h-9"
                        autoComplete="off"
                      />
                    </div>
                    <div>
                      <label className="text-xs">Phone Number</label>
                      <Input
                        type="tel"
                        value={contact.phone}
                        onChange={(e) => handleUpdateContactPerson(contact.id, 'phone', e.target.value)}
                        placeholder="+852 1234 5678"
                        className="h-9"
                        autoComplete="off"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label>Billing Address</label>
              <Textarea
                value={formBillingAddress}
                onChange={(e) => setFormBillingAddress(e.target.value)}
                placeholder="Enter company billing address..."
                rows={3}
              />
            </div>

            <div>
              <label>Remarks / Notes</label>
              <Textarea
                value={formRemarks}
                onChange={(e) => setFormRemarks(e.target.value)}
                placeholder="Any additional notes about this company..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={onBack}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update Company' : 'Create Company'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Company Members Section (Only show when editing) */}
      {isEditMode && company && (
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Company Members</h2>
            <p className="text-sm text-gray-600">All customer accounts associated with this company</p>
          </div>

          {/* Members Summary */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card className="p-4 bg-blue-50 border-blue-200">
              <p className="text-xs text-blue-700 mb-1">Total Members</p>
              <p className="text-2xl font-semibold text-blue-900">{displayMembers.length}</p>
            </Card>
            <Card className="p-4 bg-green-50 border-green-200">
              <p className="text-xs text-green-700 mb-1">Active</p>
              <p className="text-2xl font-semibold text-green-900">{displayMembers.filter(m => m.status === 'active').length}</p>
            </Card>
            <Card className="p-4 bg-gray-50 border-gray-200">
              <p className="text-xs text-gray-700 mb-1">Inactive</p>
              <p className="text-2xl font-semibold text-gray-900">{displayMembers.filter(m => m.status === 'inactive').length}</p>
            </Card>
            <Card className="p-4 bg-red-50 border-red-200">
              <p className="text-xs text-red-700 mb-1">Suspended</p>
              <p className="text-2xl font-semibold text-red-900">{displayMembers.filter(m => m.status === 'suspended').length}</p>
            </Card>
          </div>

          {/* Members Table */}
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayMembers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-sm text-center text-gray-500">
                      No linked customer accounts. Link accounts via Customer Management.
                    </td>
                  </tr>
                ) : null}
                {displayMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{member.accountNumber}</td>
                    <td className="px-4 py-3">
                      <button 
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        onClick={() => setSelectedMember(member)}
                      >
                        {member.name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{member.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{member.phone}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{member.department}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">{member.role}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={
                        member.status === 'active' ? 'bg-green-100 text-green-800' :
                        member.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }>
                        {member.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {member.lastLogin ? new Date(member.lastLogin).toLocaleDateString() : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Contracts Section (Only show when editing) */}
      {isEditMode && company && (
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Active Contracts</h2>
            <p className="text-sm text-gray-600">View and manage all contracts for this company</p>
          </div>

          {/* Contract Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="p-4 bg-blue-50 border-blue-200">
              <p className="text-xs text-blue-700 mb-1">Total Contracts</p>
              <p className="text-2xl font-semibold text-blue-900">{displayContracts.length}</p>
            </Card>
            <Card className="p-4 bg-green-50 border-green-200">
              <p className="text-xs text-green-700 mb-1">Total Sessions</p>
              <p className="text-2xl font-semibold text-green-900">{totalSessions}</p>
              <p className="text-xs text-green-600 mt-1">{remainingSessions} remaining</p>
            </Card>
            <Card className="p-4 bg-gray-50 border-gray-200">
              <p className="text-xs text-gray-700 mb-1">Overall Balance</p>
              <div className="mt-2">
                <BalanceBadge used={usedSessions} total={totalSessions} />
              </div>
            </Card>
          </div>

          {/* Contracts List */}
          <div className="space-y-4">
            {displayContracts.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">No contracts found for linked accounts.</p>
            ) : null}
            {displayContracts.map((contract) => {
              const days = daysUntilExpiry(contract.expiryDate);
              const expiryColor = days < 30 ? 'text-red-600' : days < 90 ? 'text-amber-600' : 'text-gray-600';
              
              return (
                <Card key={contract.id} className="p-4 bg-gray-50/50 border-gray-200">
                  <div className="grid grid-cols-12 gap-4 items-start">
                    {/* Contract Info */}
                    <div className="col-span-3">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <p className="text-sm font-medium text-gray-900">{contract.contractNumber}</p>
                      </div>
                      <p className="text-xs text-gray-600 ml-6">{contract.offerName}</p>
                    </div>

                    {/* Dates */}
                    <div className="col-span-3">
                      <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">Start: {contract.startDate}</p>
                          <p className={`text-xs ${expiryColor}`}>Expiry: {contract.expiryDate}</p>
                          <p className={`text-xs ${expiryColor} font-medium`}>
                            {days < 0 ? 'Expired' : `${days} days left`}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Balance */}
                    <div className="col-span-3">
                      <p className="text-xs text-gray-500 mb-1">Session Balance</p>
                      <SessionBar used={contract.sessionsUsed} total={contract.sessionsTotal} />
                    </div>

                    {/* Status & Actions */}
                    <div className="col-span-3">
                      <div className="flex items-center gap-2 mb-2">
                        <ContractStatusBadge status={contract.status} />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 ml-auto"
                          onClick={() => handleEditContract(contract)}
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                      </div>
                      {contract.notes && (
                        <p className="text-xs text-gray-500 italic">{contract.notes}</p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </Card>
      )}

      {/* Edit Contract Dialog */}
      <Dialog open={!!editingContract} onOpenChange={() => setEditingContract(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Contract</DialogTitle>
            <DialogDescription>
              Update contract details for {editingContract?.contractNumber}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <Label className="mb-[10px] block">Expiry Date *</Label>
              <StringDatePicker
                value={editForm.expiryDate}
                onChange={(value) => setEditForm({ ...editForm, expiryDate: value })}
              />
            </div>

            <div>
              <Label className="mb-[10px] block">Total Sessions *</Label>
              <Input
                type="number"
                value={editForm.sessionsTotal}
                onChange={(e) => setEditForm({ ...editForm, sessionsTotal: Number(e.target.value) })}
              />
            </div>

            <div>
              <Label className="mb-[10px] block">Used Sessions *</Label>
              <Input
                type="number"
                value={editForm.sessionsUsed}
                onChange={(e) => setEditForm({ ...editForm, sessionsUsed: Number(e.target.value) })}
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setEditingContract(null)}>
                Cancel
              </Button>
              <Button className="bg-[#0f2942] hover:bg-[#1a3d5c]" onClick={handleSaveContract}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Member Details Dialog */}
      <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Member Details</DialogTitle>
            <DialogDescription>
              View detailed information for {selectedMember?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedMember && (
            <div className="space-y-6 mt-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-500">Account Number</Label>
                    <p className="text-sm font-medium text-gray-900">{selectedMember.accountNumber}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Full Name</Label>
                    <p className="text-sm font-medium text-gray-900">{selectedMember.name}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Email Address</Label>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-gray-900">{selectedMember.email}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Phone Number</Label>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-gray-900">{selectedMember.phone}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Department</Label>
                    <p className="text-sm text-gray-900">{selectedMember.department || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Role</Label>
                    <Badge variant="outline" className="text-xs">{selectedMember.role}</Badge>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Status</Label>
                    <Badge className={
                      selectedMember.status === 'active' ? 'bg-green-100 text-green-800' :
                      selectedMember.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }>
                      {selectedMember.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Join Date</Label>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-gray-900">
                        {new Date(selectedMember.joinDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Activity</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-500">Last Login</Label>
                    <p className="text-sm text-gray-900">
                      {selectedMember.lastLogin ? new Date(selectedMember.lastLogin).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Member Since</Label>
                    <p className="text-sm text-gray-900">
                      {Math.floor((Date.now() - new Date(selectedMember.joinDate).getTime()) / (1000 * 60 * 60 * 24))} days
                    </p>
                  </div>
                </div>
              </div>

              {/* Company Information */}
              {company && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Company Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500">Company Name</Label>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <p className="text-sm text-gray-900">{company.companyName}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Company Code</Label>
                      <p className="text-sm text-gray-900">{company.companyCode}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedMember(null)}>
                  Close
                </Button>
                <Button className="bg-[#0f2942] hover:bg-[#1a3d5c]">
                  View Full Profile
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}