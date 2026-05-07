import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Plus, Edit2, Trash2, Search, Building2, Calendar } from 'lucide-react';
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

export interface MemberCompanyCompany {
  id: number;
  companyName: string;
  companyCode: string;
  contactPerson: string;
  email: string;
  phone: string;
  paymentMethod: 'Upfront' | 'Net Upfront' | 'On-Credit' | 'Bulk Purchase';
  discountRate: number;
  customerCount: number;
  status: 'active' | 'inactive';
  createdDate: string;
}

export interface MemberCompanyProps {
  loading?: boolean;
  error?: string | null;
  companies: MemberCompanyCompany[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  searchTerm: string;
  statusFilter: string;
  startDate: string;
  endDate: string;
  paginationModel: number[];
  deletingCompanyId?: number | null;
  onSearchTermChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onClearFilters: () => void;
  onPageChange: (page: number) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onEditCompany: (companyId: number) => void;
  onCreateCompany: () => void;
  onDeleteCompany: (companyId: number) => void;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-700',
};

const PAYMENT_COLORS: Record<MemberCompanyCompany['paymentMethod'], string> = {
  Upfront: 'bg-blue-100 text-blue-700',
  'Net Upfront': 'bg-cyan-100 text-cyan-700',
  'On-Credit': 'bg-purple-100 text-purple-700',
  'Bulk Purchase': 'bg-orange-100 text-orange-700',
};

export function MemberCompany({
  loading,
  error,
  companies,
  totalCount,
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  searchTerm,
  statusFilter,
  startDate,
  endDate,
  paginationModel,
  deletingCompanyId,
  onSearchTermChange,
  onStatusFilterChange,
  onStartDateChange,
  onEndDateChange,
  onClearFilters,
  onPageChange,
  onPrevPage,
  onNextPage,
  onEditCompany,
  onCreateCompany,
  onDeleteCompany,
}: MemberCompanyProps) {
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
      <div className="flex items-center justify-between">
        <div>
          <h1>Customer Company Management</h1>
          <p className="text-gray-600">Manage corporate and agency accounts</p>
        </div>
        <Button onClick={onCreateCompany}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Company
        </Button>
      </div>

      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by company name, code, or contact person..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
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
              ? 'Loading companies...'
              : `Showing ${totalCount === 0 ? 0 : startIndex + 1}-${endIndex} of ${totalCount} companies`}
          </div>
          <div>{renderPagination()}</div>
        </div>

        {error && (
          <div className="p-4 text-sm text-red-600 bg-red-50 border-b border-red-200">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Company Name</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Company Code</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Contact Person</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Contact Info</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Payment Method</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Discount</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Customers</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {companies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{company.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <button
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        onClick={() => onEditCompany(company.id)}
                      >
                        {company.companyName}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{company.companyCode}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{company.contactPerson}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div>{company.email}</div>
                    <div className="text-gray-600">{company.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={PAYMENT_COLORS[company.paymentMethod] ?? 'bg-gray-100 text-gray-700'}>
                      {company.paymentMethod}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                    {company.discountRate}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{company.customerCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={STATUS_COLORS[company.status] ?? 'bg-gray-100 text-gray-700'}>
                      {company.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditCompany(company.id)}
                        className="h-8 w-8 p-0"
                        title="Edit Company"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={deletingCompanyId === company.id}
                        onClick={() => onDeleteCompany(company.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                        title="Delete Company"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && companies.length === 0 && (
          <div className="text-center py-12 text-gray-500">No companies match your filters.</div>
        )}

        {companies.length > 0 && (
          <div className="p-4 border-t flex justify-end">{renderPagination()}</div>
        )}
      </Card>
    </div>
  );
}
