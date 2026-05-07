import { useMemo, useState } from 'react';
import { TravelAgency, type TravelAgencyAgency } from '../../app/components/TravelAgency';
import { mockTravelAgencies } from '../TravelAgency.fixture';

const ITEMS_PER_PAGE = 10;

interface TravelAgencyPreviewProps {
  onEditAgency?: (agencyId: number) => void;
}

export function TravelAgencyPreview({ onEditAgency }: TravelAgencyPreviewProps) {
  const [agencies] = useState<TravelAgencyAgency[]>(mockTravelAgencies);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAgency, setEditingAgency] = useState<TravelAgencyAgency | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredAgencies = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return agencies.filter((agency) => {
      const matchesSearch =
        agency.agencyName.toLowerCase().includes(search) ||
        agency.agencyCode.toLowerCase().includes(search) ||
        agency.contactPerson.toLowerCase().includes(search);
      const matchesStatus = statusFilter === 'all' || agency.status === statusFilter;
      const matchesPayment = paymentFilter === 'all' || agency.paymentMethod === paymentFilter;

      let matchesDate = true;
      if (startDate && endDate) {
        const agencyDate = new Date(agency.createdDate);
        matchesDate = agencyDate >= new Date(startDate) && agencyDate <= new Date(endDate);
      }
      return matchesSearch && matchesStatus && matchesPayment && matchesDate;
    });
  }, [agencies, searchTerm, statusFilter, paymentFilter, startDate, endDate]);

  const totalAgencies = filteredAgencies.length;
  const totalPages = Math.max(1, Math.ceil(totalAgencies / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const paginatedAgencies = filteredAgencies.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPaymentFilter('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  return (
    <TravelAgency
      agencies={agencies}
      totalAgencies={totalAgencies}
      paginatedAgencies={paginatedAgencies}
      startIndex={startIndex}
      itemsPerPage={ITEMS_PER_PAGE}
      totalPages={totalPages}
      currentPage={safePage}
      searchTerm={searchTerm}
      statusFilter={statusFilter}
      paymentFilter={paymentFilter}
      startDate={startDate}
      endDate={endDate}
      isDialogOpen={isDialogOpen}
      editingAgency={editingAgency}
      onSearchTermChange={(v) => { setSearchTerm(v); setCurrentPage(1); }}
      onStatusFilterChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}
      onPaymentFilterChange={(v) => { setPaymentFilter(v); setCurrentPage(1); }}
      onStartDateChange={(v) => { setStartDate(v); setCurrentPage(1); }}
      onEndDateChange={(v) => { setEndDate(v); setCurrentPage(1); }}
      onResetFilters={handleResetFilters}
      onPageChange={setCurrentPage}
      onCreate={() => { setEditingAgency(null); setIsDialogOpen(true); }}
      onEdit={(agency) => onEditAgency?.(agency.id)}
      onDelete={(id) => {
        if (window.confirm('Are you sure you want to delete this travel agency?')) {
          console.log('Deleting agency:', id);
        }
      }}
      onDialogOpenChange={setIsDialogOpen}
      onSubmit={() => {
        setIsDialogOpen(false);
        setEditingAgency(null);
      }}
    />
  );
}
