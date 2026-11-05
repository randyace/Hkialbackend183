import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Plus, Edit2, Trash2, Search, Building2, Calendar, Mail, Phone, User, DollarSign, Users, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { StringDatePicker } from '../../../../ui/CustomDatePicker';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './ui/pagination';
import { t } from '../../../../../lib/i18n/t';

interface TravelAgency {
  id: number;
  agencyName: string;
  agencyCode: string;
  contactPerson: string;
  email: string;
  phone: string;
  paymentMethod: 'Upfront' | 'Net Upfront' | 'On-Credit' | 'Monthly Invoice';
  creditLimit: number;
  creditBalance: number;
  discountRate: number;
  memberCount: number;
  totalBookings: number;
  status: 'active' | 'inactive' | 'suspended';
  createdDate: string;
}

export interface TravelAgencyProps {
  agencies?: TravelAgency[];
  isLoading?: boolean;
  /** Navigates to dedicated Edit Agency page (container). */
  onEditAgency?: (agencyId: number) => void;
  /** Navigates to dedicated Create Agency page (container). */
  onCreateAgency?: () => void;
  onDelete?: (id: number) => void;
}

export function TravelAgency({
  agencies: agenciesProp,
  onEditAgency,
  onCreateAgency,
  onDelete,
  isLoading = false,
}: TravelAgencyProps = {}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const agencies: TravelAgency[] = agenciesProp ?? [];

  const filteredAgencies = agencies.filter(agency => {
    const matchesSearch = agency.agencyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agency.agencyCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agency.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || agency.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || agency.paymentMethod === paymentFilter;
    
    let matchesDate = true;
    if (startDate && endDate) {
      const agencyDate = new Date(agency.createdDate);
      matchesDate = agencyDate >= new Date(startDate) && agencyDate <= new Date(endDate);
    }
    
    return matchesSearch && matchesStatus && matchesPayment && matchesDate;
  });

  const totalPages = Math.ceil(filteredAgencies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAgencies = filteredAgencies.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredAgencies.length / itemsPerPage));
    setCurrentPage((p) => (p > maxPage ? maxPage : p));
  }, [filteredAgencies.length, itemsPerPage]);

  const handleEdit = (agency: TravelAgency) => {
    onEditAgency?.(agency.id);
  };

  const handleOpenCreate = () => {
    onCreateAgency?.();
  };

  const handleDelete = (id: number) => {
    if (onDelete) {
      onDelete(id);
    } else if (confirm('Are you sure you want to delete this travel agency?')) {
      console.log('Deleting agency:', id);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Agency Management</h1>
          <p className="text-gray-600">Manage agency partnerships and credit accounts</p>
        </div>
        <Button type="button" onClick={handleOpenCreate}>
          <Plus className="w-4 h-4 mr-2" />
          {t('agency.add_agency')}
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700">Active Agencies</p>
              <p className="text-2xl text-green-900">{agencies.filter(a => a.status === 'active').length}</p>
            </div>
            <Building2 className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700">Total Members</p>
              <p className="text-2xl text-blue-900">{agencies.reduce((sum, a) => sum + a.memberCount, 0)}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-4 bg-purple-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700">Total Bookings</p>
              <p className="text-2xl text-purple-900">{agencies.reduce((sum, a) => sum + a.totalBookings, 0)}</p>
            </div>
            <Calendar className="w-8 h-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-4 bg-orange-50 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700">Overdraft In Use</p>
              <p className="text-2xl text-orange-900">
                HKD {agencies.reduce((sum, a) => sum + Math.max(0, -a.creditBalance), 0).toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-orange-600" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by agency name, code, or contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>

          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Payment Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payment Methods</SelectItem>
              <SelectItem value="Upfront">Upfront</SelectItem>
              <SelectItem value="Net Upfront">Net Upfront</SelectItem>
              <SelectItem value="On-Credit">On-Credit</SelectItem>
              <SelectItem value="Monthly Invoice">Monthly Invoice</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => {
            setSearchTerm('');
            setStatusFilter('all');
            setPaymentFilter('all');
            setStartDate('');
            setEndDate('');
          }}>
            Reset Filters
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <Label className="mb-2">Start Date</Label>
            <StringDatePicker
              value={startDate}
              onChange={setStartDate}
            />
          </div>
          <div>
            <Label className="mb-2">End Date</Label>
            <StringDatePicker
              value={endDate}
              onChange={setEndDate}
            />
          </div>
        </div>
      </Card>

      {/* Agency List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agency Info</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credit Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statistics</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-gray-600">
                    <Loader2 className="w-8 h-8 animate-spin inline-block text-gray-400" aria-hidden />
                    <p className="mt-3 text-sm">Loading agencies…</p>
                  </td>
                </tr>
              ) : paginatedAgencies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-600 text-sm">
                    No agencies found. {agencies.length === 0 ? 'Add an agency to get started.' : 'Try adjusting your filters.'}
                  </td>
                </tr>
              ) : paginatedAgencies.map((agency) => {
                // accounts.credit_balance (wallet) + accounts.credit_limit (overdraft cap)
                // = OnCredit available to spend.
                // Bar: when overdraft exists, show overdraft usage; when only
                // prepaid wallet, show remaining wallet as a full/empty cue via
                // available (balance is the remaining prepaid credit after spends).
                const balance = Number(agency.creditBalance) || 0;
                const overdraftLimit = Math.max(0, Number(agency.creditLimit) || 0);
                const availableToSpend = balance + overdraftLimit;
                const overdraftUsed = Math.max(0, -balance);
                // Prepaid remaining fill: when no overdraft facility, treat a
                // positive balance as "remaining credit" (bar full when wallet
                // has funds). Overdraft path still tracks facility usage %.
                const overdraftPct =
                  overdraftLimit > 0
                    ? Math.min(100, (overdraftUsed / overdraftLimit) * 100)
                    : 0;
                const walletRemainingPct = balance > 0 ? 100 : 0;
                const barPct = overdraftLimit > 0 ? overdraftPct : walletRemainingPct;
                const overdraftPctLabel =
                  overdraftLimit > 0
                    ? ((overdraftUsed / overdraftLimit) * 100).toFixed(1)
                    : '0';
                const money = (n: number) =>
                  n.toLocaleString(undefined, { maximumFractionDigits: 0 });
                const availableClass =
                  availableToSpend <= 0
                    ? 'font-semibold text-red-600'
                    : availableToSpend < Math.max(overdraftLimit, balance) * 0.2
                      ? 'font-semibold text-amber-600'
                      : 'font-semibold text-green-600';
                const barClass =
                  overdraftLimit > 0
                    ? (overdraftPct >= 100
                      ? 'bg-red-600'
                      : overdraftPct > 80
                        ? 'bg-red-500'
                        : overdraftPct > 60
                          ? 'bg-orange-500'
                          : overdraftUsed > 0
                            ? 'bg-amber-500'
                            : 'bg-green-500')
                    : (balance > 0 ? 'bg-green-500' : 'bg-red-500');
                return (
                  <tr key={agency.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-orange-600" />
                          <p className="font-semibold text-gray-900">{agency.agencyName}</p>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{agency.agencyCode}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Created: {new Date(agency.createdDate).toLocaleDateString()}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-3 h-3 text-gray-400" />
                          <span>{agency.contactPerson}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span className="truncate max-w-[200px]">{agency.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span>{agency.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={
                        agency.paymentMethod === 'On-Credit' ? 'default' : 
                        agency.paymentMethod === 'Monthly Invoice' ? 'secondary' : 
                        'outline'
                      }>
                        {agency.paymentMethod}
                      </Badge>
                      <p className="text-xs text-gray-600 mt-2">Discount: {agency.discountRate}%</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1 min-w-[160px]">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Available to spend:</span>
                          <span className={availableClass}>
                            HKD {money(availableToSpend)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>Balance:</span>
                          <span className={balance < 0 ? 'font-medium text-red-600' : 'font-medium text-gray-800'}>
                            HKD {money(balance)}
                            {balance < 0 ? ' (overdrawn)' : ''}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>Overdraft limit:</span>
                          <span className="font-medium text-gray-800">HKD {money(overdraftLimit)}</span>
                        </div>
                        <div
                          className="w-full bg-gray-200 rounded-full h-2 mt-2"
                          title={
                            overdraftLimit > 0
                              ? `Overdraft used HKD ${money(overdraftUsed)} of ${money(overdraftLimit)}`
                              : `Wallet remaining HKD ${money(Math.max(0, balance))}`
                          }
                        >
                          <div
                            className={`h-2 rounded-full transition-all ${barClass}`}
                            style={{
                              width: `${overdraftLimit > 0 ? barPct : (balance > 0 ? 100 : 0)}%`,
                            }}
                          />
                        </div>
                        <p className={`text-xs text-right ${overdraftUsed > 0 || balance <= 0 ? 'text-red-600' : 'text-gray-500'}`}>
                          {overdraftLimit > 0
                            ? (overdraftUsed > 0
                              ? `Overdraft ${money(overdraftUsed)} / ${money(overdraftLimit)} (${overdraftPctLabel}%)`
                              : 'Overdraft unused')
                            : (balance > 0
                              ? `Wallet HKD ${money(balance)} remaining`
                              : 'No credit remaining')}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-3 h-3 text-gray-400" />
                          <span>{agency.memberCount} members</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span>{agency.totalBookings} bookings</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={
                        agency.status === 'active' ? 'default' : 
                        agency.status === 'suspended' ? 'destructive' : 
                        'secondary'
                      }>
                        {agency.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleEdit(agency); }}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        {onDelete && (
                          <Button type="button" size="sm" variant="outline" className="text-red-600 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); handleDelete(agency.id); }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t p-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {isLoading
              ? 'Loading agencies…'
              : filteredAgencies.length === 0
                ? 'No agencies match your filters.'
                : `Showing ${startIndex + 1} to ${Math.min(startIndex + itemsPerPage, filteredAgencies.length)} of ${filteredAgencies.length} agencies`}
          </p>
          {!isLoading && filteredAgencies.length > 0 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => setCurrentPage(pageNum)}
                      isActive={currentPage === pageNum}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              {totalPages > 5 && <PaginationEllipsis />}
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(p => Math.min(Math.max(1, totalPages), p + 1))}
                  className={currentPage === totalPages || totalPages === 0 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
          )}
        </div>
      </Card>
    </div>
  );
}