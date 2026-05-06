import { useState } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Search, Calendar, Edit2, Trash2, Eye } from 'lucide-react';
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

interface Account {
  id: number;
  accountNumber: string;
  type: 'Individual' | 'Corporate' | 'Travel Agency';
  name: string;
  email: string;
  phone: string;
  internalGrouping: string;
  paymentMethod: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  createdDate: string;
  creditBalance?: number;
  membershipType?: 'Platinum' | 'Gold' | 'Sapphire' | 'Diamond';
  membershipExpiry?: string;
}

const generateMockAccounts = (): Account[] => {
  const accounts: Account[] = [];
  const firstNames = ['John', 'Mary', 'David', 'Sarah', 'Robert', 'Emma', 'Michael', 'Lisa', 'James', 'Sophia', 'William', 'Olivia', 'Richard', 'Emily', 'Thomas'];
  const lastNames = ['Smith', 'Johnson', 'Lee', 'Chen', 'Wang', 'Wilson', 'Brown', 'Taylor', 'Anderson', 'Martinez', 'Wong', 'Chan', 'Lam', 'Ng', 'Cheung'];
  
  // Company/Group names for grouping
  const corporateGroups = ['HSBC', 'Cathay Pacific', 'Standard Chartered', 'Bank of China', 'Swire Group', 'Henderson Land', 'Sun Hung Kai Properties'];
  const travelAgencyGroups = ['EGL Tours', 'Wing On Travel', 'Hong Thai Travel', 'TravelExpert', 'Goldjoy Travel', 'Zuji Travel'];
  const individualGroups = ['Priority Club', 'Executive Circle', 'Platinum Members', 'Diamond Elite', 'President\'s Club', 'Chairman\'s Circle'];

  // Membership expiry dates — mix of future (valid) and past (expired)
  const futureExpiries = ['2026-06-30', '2026-09-30', '2026-12-31', '2027-03-31', '2027-06-30', '2027-12-31', '2026-08-31'];
  const pastExpiries   = ['2025-03-31', '2025-06-30', '2025-09-30', '2025-12-31'];
  
  for (let i = 1; i <= 50; i++) {
    const accountType = i % 3 === 0 ? 'Corporate' : i % 5 === 0 ? 'Travel Agency' : 'Individual';
    const status = i % 7 === 0 ? 'Inactive' : i % 11 === 0 ? 'Suspended' : 'Active';
    const date = new Date(2024, 0, 1 + i);
    
    let internalGrouping = '';
    let creditBalance: number | undefined = undefined;
    let membershipType: Account['membershipType'] = undefined;
    let membershipExpiry: string | undefined = undefined;
    
    if (accountType === 'Corporate') {
      internalGrouping = corporateGroups[i % corporateGroups.length];
      creditBalance = 50000 + (i * 10000) % 200000;
    } else if (accountType === 'Travel Agency') {
      internalGrouping = travelAgencyGroups[i % travelAgencyGroups.length];
      creditBalance = 30000 + (i * 5000) % 100000;
    } else {
      internalGrouping = individualGroups[i % individualGroups.length];
      membershipType = i % 4 === 0 ? 'Diamond' : i % 3 === 0 ? 'Platinum' : i % 5 === 0 ? 'Sapphire' : 'Gold';
      // ~70% have a future (valid) expiry, ~30% have an expired one
      membershipExpiry = i % 10 < 3
        ? pastExpiries[i % pastExpiries.length]
        : futureExpiries[i % futureExpiries.length];
    }
    
    accounts.push({
      id: i,
      accountNumber: `ACC-20${23 + (i % 2)}-${String(1000 + i).slice(-4)}`,
      type: accountType,
      name: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
      email: `${firstNames[i % firstNames.length].toLowerCase()}.${lastNames[i % lastNames.length].toLowerCase()}@email.com`,
      phone: `+852 ${9000 + i * 11}`,
      internalGrouping,
      status,
      createdDate: date.toISOString().split('T')[0],
      membershipType,
      membershipExpiry,
      creditBalance
    });
  }
  return accounts;
};

const mockAccounts: Account[] = generateMockAccounts();

interface AccountListProps {
  onViewDetail?: (accountNumber: string) => void;
}

export function AccountList({ onViewDetail }: AccountListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [accounts] = useState<Account[]>(mockAccounts);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const today = new Date().toISOString().split('T')[0];

  const isMember = (account: Account) =>
    account.type === 'Individual' &&
    !!account.membershipExpiry &&
    account.membershipExpiry >= today;

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.accountNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'Member' ? isMember(account) : account.type === typeFilter);
    const matchesStartDate = !startDate || new Date(account.createdDate) >= new Date(startDate);
    const matchesEndDate = !endDate || new Date(account.createdDate) <= new Date(endDate);
    return matchesSearch && matchesType && matchesStartDate && matchesEndDate;
  }).sort((a, b) => b.id - a.id);

  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAccounts = filteredAccounts.slice(startIndex, endIndex);

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, -1, totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, -1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, -1, currentPage - 1, currentPage, currentPage + 1, -2, totalPages);
      }
    }

    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>
          {pages.map((page, index) => {
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
                  onClick={() => setCurrentPage(page)}
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
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      'Active': 'bg-green-100 text-green-800',
      'Inactive': 'bg-gray-100 text-gray-800',
      'Suspended': 'bg-red-100 text-red-800'
    };
    return (
      <Badge className={`${colors[status as keyof typeof colors]} hover:${colors[status as keyof typeof colors]}`}>
        {status}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      'Individual': 'bg-blue-100 text-blue-800',
      'Corporate': 'bg-purple-100 text-purple-800',
      'Travel Agency': 'bg-orange-100 text-orange-800'
    };
    return (
      <Badge className={`${colors[type as keyof typeof colors]} hover:${colors[type as keyof typeof colors]}`}>
        {type}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1>All Customers</h1>
        <p className="text-gray-600">View and manage all customer accounts</p>
      </div>

      {/* Filters */}
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
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Individual">Individual</SelectItem>
                <SelectItem value="Member">Member</SelectItem>
                <SelectItem value="Corporate">Corporate</SelectItem>
                <SelectItem value="Travel Agency">Travel Agency</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label>Start Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
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
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                />
                <Calendar className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setTypeFilter('all');
                  setSearchTerm('');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Accounts Table */}
      <Card>
        <div className="p-4 border-b flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredAccounts.length)} of {filteredAccounts.length} accounts
          </div>
          <div>
            {renderPagination()}
          </div>
        </div>
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
              {paginatedAccounts.map((account) => (
                <TableRow key={account.accountNumber} className="hover:bg-gray-50">
                  <TableCell>{account.id}</TableCell>
                  <TableCell>{account.accountNumber}</TableCell>
                  <TableCell>
                    {isMember(account) ? (
                      <div className="flex flex-col gap-1">
                        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 w-fit">Member</Badge>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-gray-500">{account.membershipType}</span>
                          <span className="text-xs text-amber-700">Exp: {account.membershipExpiry}</span>
                        </div>
                      </div>
                    ) : account.type === 'Individual' && account.membershipExpiry ? (
                      <div className="flex flex-col gap-1">
                        {getTypeBadge(account.type)}
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-gray-500">{account.membershipType}</span>
                          <span className="text-xs text-red-500">Exp: {account.membershipExpiry}</span>
                        </div>
                      </div>
                    ) : (
                      getTypeBadge(account.type)
                    )}
                  </TableCell>
                  <TableCell>
                    <button 
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                      onClick={() => onViewDetail?.(account.accountNumber)}
                    >
                      {account.name}
                    </button>
                  </TableCell>
                  <TableCell>{account.email}</TableCell>
                  <TableCell>{account.phone}</TableCell>
                  <TableCell>{account.internalGrouping}</TableCell>
                  <TableCell>{account.paymentMethod}</TableCell>
                  <TableCell>
                    {account.creditBalance !== undefined ? (
                      <span className="text-green-600">HK${account.creditBalance.toLocaleString()}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(account.status)}</TableCell>
                  <TableCell>{account.createdDate}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetail?.(account.accountNumber)}
                        className="h-8 w-8 p-0"
                        title="View/Edit Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => console.log('Delete account:', account.accountNumber)}
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

        {filteredAccounts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No accounts found matching your search criteria
          </div>
        )}

        {filteredAccounts.length > 0 && (
          <div className="p-4 border-t flex justify-end">
            {renderPagination()}
          </div>
        )}
      </Card>
    </div>
  );
}