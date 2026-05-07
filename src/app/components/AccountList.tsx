import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Search, Calendar, Trash2, Eye } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './ui/pagination';

export interface AccountListAccount {
  id: number;
  account_number: string;
  type: 'Individual' | 'Corporate' | 'TravelAgency';
  name: string;
  email: string;
  phone: string;
  internal_grouping?: string;
  payment_method?: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  credit_balance?: number;
  membership_type?: 'Diamond' | 'Platinum' | 'Gold' | 'Sapphire';
  membership_expiry?: string;
  created_date: string;
}

export type AccountTone = 'green' | 'gray' | 'red' | 'blue' | 'purple' | 'orange' | 'amber';

const TONE_BADGE: Record<AccountTone, string> = {
  green: 'bg-green-100 text-green-800',
  gray: 'bg-gray-100 text-gray-800',
  red: 'bg-red-100 text-red-800',
  blue: 'bg-blue-100 text-blue-800',
  purple: 'bg-purple-100 text-purple-800',
  orange: 'bg-orange-100 text-orange-800',
  amber: 'bg-amber-100 text-amber-800',
};

export interface AccountListProps {
  loading: boolean;
  error: string | null;
  accounts: AccountListAccount[];
  total: number;
  itemsPerPage: number;
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  searchTerm: string;
  typeFilter: string;
  startDate: string;
  endDate: string;
  paginationModel: number[];
  onSearchTermChange: (value: string) => void;
  onTypeFilterChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onClearFilters: () => void;
  onPageChange: (page: number) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onViewDetail: (accountNumber: string) => void;
  onDelete: (id: number) => void;
  isMember: (account: AccountListAccount) => boolean;
  getTypeTone: (type: string) => string;
  getTypeDisplay: (type: string) => string;
  getStatusTone: (status: string) => string;
  deletingAccountId: number | null;
}

function toneClass(tone: string): string {
  if (tone in TONE_BADGE) {
    return TONE_BADGE[tone as AccountTone];
  }
  return TONE_BADGE.gray;
}

export function AccountList({
  loading,
  error,
  accounts,
  total,
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  searchTerm,
  typeFilter,
  startDate,
  endDate,
  paginationModel,
  onSearchTermChange,
  onTypeFilterChange,
  onStartDateChange,
  onEndDateChange,
  onClearFilters,
  onPageChange,
  onPrevPage,
  onNextPage,
  onViewDetail,
  onDelete,
  isMember,
  getTypeTone,
  getTypeDisplay,
  getStatusTone,
  deletingAccountId,
}: AccountListProps) {
  const renderPagination = () => (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={onPrevPage}
            className={currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
          />
        </PaginationItem>
        {paginationModel.map((page, index) => {
          if (page === -1 || page === -2) {
            return (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            );
          }
          return (
            <PaginationItem key={page}>
              <PaginationLink
                onClick={() => onPageChange(page)}
                isActive={currentPage === page}
                className="cursor-pointer"
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          );
        })}
        <PaginationItem>
          <PaginationNext
            onClick={onNextPage}
            className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1>All Customers</h1>
        <p className="text-gray-600">View and manage all customer accounts</p>
      </div>

      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by account number, name, or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={onTypeFilterChange}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Individual">Individual</SelectItem>
                <SelectItem value="Member">Member</SelectItem>
                <SelectItem value="Corporate">Corporate</SelectItem>
                <SelectItem value="TravelAgency">Travel Agency</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label>Start Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => onStartDateChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                />
                <Calendar className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="flex-1">
              <label>End Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => onEndDateChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                />
                <Calendar className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={onClearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-4 border-b flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {loading
              ? 'Loading accounts...'
              : `Showing ${total === 0 ? 0 : startIndex + 1}-${endIndex} of ${total} accounts`}
          </div>
          <div>{renderPagination()}</div>
        </div>

        {error && (
          <div className="p-4 text-sm text-red-600 bg-red-50 border-b border-red-200">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Account Number</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Grouping</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Credit Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.account_number} className="hover:bg-gray-50">
                  <TableCell>{account.id}</TableCell>
                  <TableCell>{account.account_number}</TableCell>
                  <TableCell>
                    {isMember(account) ? (
                      <div className="flex flex-col gap-1">
                        <Badge className={`${toneClass('amber')} hover:${toneClass('amber')} w-fit`}>Member</Badge>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-gray-500">{account.membership_type}</span>
                          <span className="text-xs text-amber-700">Exp: {account.membership_expiry}</span>
                        </div>
                      </div>
                    ) : account.type === 'Individual' && account.membership_expiry ? (
                      <div className="flex flex-col gap-1">
                        <Badge className={toneClass(getTypeTone(account.type))}>
                          {getTypeDisplay(account.type)}
                        </Badge>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-gray-500">{account.membership_type}</span>
                          <span className="text-xs text-red-500">Exp: {account.membership_expiry}</span>
                        </div>
                      </div>
                    ) : (
                      <Badge className={toneClass(getTypeTone(account.type))}>
                        {getTypeDisplay(account.type)}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <button
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                      onClick={() => onViewDetail(account.account_number)}
                    >
                      {account.name}
                    </button>
                  </TableCell>
                  <TableCell>{account.email}</TableCell>
                  <TableCell>{account.phone}</TableCell>
                  <TableCell>{account.internal_grouping ?? '—'}</TableCell>
                  <TableCell>{account.payment_method ?? '—'}</TableCell>
                  <TableCell>
                    {account.credit_balance !== undefined && account.credit_balance !== null ? (
                      <span className="text-green-600">HK${account.credit_balance.toLocaleString()}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={toneClass(getStatusTone(account.status))}>
                      {account.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{account.created_date}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetail(account.account_number)}
                        className="h-8 w-8 p-0"
                        title="View/Edit Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(account.id)}
                        disabled={deletingAccountId === account.id}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                        title="Delete Account"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {!loading && accounts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No accounts found matching your search criteria
          </div>
        )}

        {accounts.length > 0 && (
          <div className="p-4 border-t flex justify-end">{renderPagination()}</div>
        )}
      </Card>
    </div>
  );
}
