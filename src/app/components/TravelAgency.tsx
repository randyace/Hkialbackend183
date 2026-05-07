import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Plus, Edit2, Trash2, Search, Building2, Calendar, Mail, Phone, User,
  DollarSign, Users, UserPlus as UserPlusIcon, CreditCard as CreditCardIcon,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './ui/pagination';

void UserPlusIcon;
void CreditCardIcon;

export type TravelAgencyPaymentMethod = 'Upfront' | 'Net Upfront' | 'On-Credit' | 'Monthly Invoice';
export type TravelAgencyStatus = 'active' | 'inactive' | 'suspended';

export interface TravelAgencyAgency {
  id: number;
  agencyName: string;
  agencyCode: string;
  contactPerson: string;
  email: string;
  phone: string;
  paymentMethod: TravelAgencyPaymentMethod;
  creditLimit: number;
  creditBalance: number;
  discountRate: number;
  memberCount: number;
  totalBookings: number;
  status: TravelAgencyStatus;
  createdDate: string;
}

export interface TravelAgencyProps {
  agencies: TravelAgencyAgency[];
  totalAgencies: number;
  paginatedAgencies: TravelAgencyAgency[];
  startIndex: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
  searchTerm: string;
  statusFilter: string;
  paymentFilter: string;
  startDate: string;
  endDate: string;
  isDialogOpen: boolean;
  editingAgency: TravelAgencyAgency | null;
  onSearchTermChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onPaymentFilterChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onResetFilters: () => void;
  onPageChange: (page: number) => void;
  onCreate: () => void;
  onEdit: (agency: TravelAgencyAgency) => void;
  onDelete: (id: number) => void;
  onDialogOpenChange: (open: boolean) => void;
  onSubmit: () => void;
}

export function TravelAgency({
  agencies,
  totalAgencies,
  paginatedAgencies,
  startIndex,
  itemsPerPage,
  totalPages,
  currentPage,
  searchTerm,
  statusFilter,
  paymentFilter,
  startDate,
  endDate,
  isDialogOpen,
  editingAgency,
  onSearchTermChange,
  onStatusFilterChange,
  onPaymentFilterChange,
  onStartDateChange,
  onEndDateChange,
  onResetFilters,
  onPageChange,
  onCreate,
  onEdit,
  onDelete,
  onDialogOpenChange,
  onSubmit,
}: TravelAgencyProps) {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Travel Agency Management</h1>
          <p className="text-gray-600">Manage travel agency partnerships and credit accounts</p>
        </div>
        <Button onClick={onCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Travel Agency
        </Button>
      </div>

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
              <p className="text-sm text-orange-700">Credit Outstanding</p>
              <p className="text-2xl text-orange-900">
                HKD {agencies.reduce((sum, a) => sum + (a.creditLimit - a.creditBalance), 0).toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-orange-600" />
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by agency name, code, or contact..."
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
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

          <Select value={paymentFilter} onValueChange={onPaymentFilterChange}>
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

          <Button variant="outline" onClick={onResetFilters}>
            Reset Filters
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <Label className="mb-2">Start Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
            />
          </div>
          <div>
            <Label className="mb-2">End Date</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
            />
          </div>
        </div>
      </Card>

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
              {paginatedAgencies.map((agency) => {
                const creditUtilization = ((agency.creditLimit - agency.creditBalance) / agency.creditLimit * 100).toFixed(1);
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
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Limit:</span>
                          <span className="font-semibold">HKD {agency.creditLimit.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Available:</span>
                          <span className={agency.creditBalance < agency.creditLimit * 0.2 ? 'font-semibold text-red-600' : 'font-semibold text-green-600'}>
                            HKD {agency.creditBalance.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div
                            className={`h-2 rounded-full ${
                              Number(creditUtilization) > 80 ? 'bg-red-500' :
                              Number(creditUtilization) > 60 ? 'bg-orange-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${creditUtilization}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 text-right">{creditUtilization}% utilized</p>
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
                        <Button size="sm" variant="outline" onClick={() => onEdit(agency)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50" onClick={() => onDelete(agency.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="border-t p-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {totalAgencies === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + itemsPerPage, totalAgencies)} of {totalAgencies} agencies
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => onPageChange(pageNum)}
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
                  onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={onDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAgency ? 'Edit Travel Agency' : 'Add New Travel Agency'}</DialogTitle>
            <DialogDescription>
              {editingAgency ? 'Update travel agency information' : 'Create a new travel agency partnership'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2">Agency Name</Label>
                <Input placeholder="Enter agency name" defaultValue={editingAgency?.agencyName} />
              </div>
              <div>
                <Label className="mb-2">Agency Code</Label>
                <Input placeholder="TA-XXX-001" defaultValue={editingAgency?.agencyCode} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2">Contact Person</Label>
                <Input placeholder="Enter contact name" defaultValue={editingAgency?.contactPerson} />
              </div>
              <div>
                <Label className="mb-2">Phone Number</Label>
                <Input placeholder="+852 XXXX XXXX" defaultValue={editingAgency?.phone} />
              </div>
            </div>

            <div>
              <Label className="mb-2">Email Address</Label>
              <Input type="email" placeholder="contact@agency.com" defaultValue={editingAgency?.email} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2">Payment Method</Label>
                <Select defaultValue={editingAgency?.paymentMethod || 'Upfront'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Upfront">Upfront</SelectItem>
                    <SelectItem value="Net Upfront">Net Upfront</SelectItem>
                    <SelectItem value="On-Credit">On-Credit</SelectItem>
                    <SelectItem value="Monthly Invoice">Monthly Invoice</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2">Discount Rate (%)</Label>
                <Input type="number" placeholder="0-30" min="0" max="30" defaultValue={editingAgency?.discountRate || 10} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2">Credit Limit (HKD)</Label>
                <Input type="number" placeholder="100000" defaultValue={editingAgency?.creditLimit} />
              </div>
              <div>
                <Label className="mb-2">Status</Label>
                <Select defaultValue={editingAgency?.status || 'active'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="mb-2">Remarks / Notes</Label>
              <Textarea placeholder="Additional information about this agency..." rows={3} />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onDialogOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onSubmit}>
              {editingAgency ? 'Update Agency' : 'Add Agency'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
