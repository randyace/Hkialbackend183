import { useMemo, useState } from 'react';
import {
  AccountList,
  type AccountListAccount,
} from '../../app/components/AccountList';
import { mockAccounts } from '../AccountList.fixture';

const ITEMS_PER_PAGE = 10;
const TODAY = new Date().toISOString().slice(0, 10);

interface AccountListPreviewProps {
  onViewDetail?: (accountNumber: string) => void;
}

const isMember = (account: AccountListAccount) =>
  account.type === 'Individual' && !!account.membership_expiry && account.membership_expiry >= TODAY;

const getStatusTone = (status: string) => {
  const tones: Record<string, string> = {
    Active: 'green',
    Inactive: 'gray',
    Suspended: 'red',
  };
  return tones[status] || 'gray';
};

const getTypeTone = (type: string) => {
  const tones: Record<string, string> = {
    Individual: 'blue',
    Corporate: 'purple',
    TravelAgency: 'orange',
  };
  return tones[type] || 'gray';
};

const getTypeDisplay = (type: string) => (type === 'TravelAgency' ? 'Travel Agency' : type);

function buildPagination(currentPage: number, totalPages: number): number[] {
  const pages: number[] = [];
  const maxVisiblePages = 5;
  if (totalPages <= maxVisiblePages) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else if (currentPage <= 3) {
    pages.push(1, 2, 3, 4, -1, totalPages);
  } else if (currentPage >= totalPages - 2) {
    pages.push(1, -1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
  } else {
    pages.push(1, -1, currentPage - 1, currentPage, currentPage + 1, -2, totalPages);
  }
  return pages;
}

export function AccountListPreview({ onViewDetail }: AccountListPreviewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    return mockAccounts
      .filter((account) => {
        const matchesSearch =
          account.account_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          account.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType =
          typeFilter === 'all' ||
          (typeFilter === 'Member' ? isMember(account) : account.type === typeFilter);
        const matchesStartDate = !startDate || new Date(account.created_date) >= new Date(startDate);
        const matchesEndDate = !endDate || new Date(account.created_date) <= new Date(endDate);
        return matchesSearch && matchesType && matchesStartDate && matchesEndDate;
      })
      .sort((a, b) => b.id - a.id);
  }, [searchTerm, typeFilter, startDate, endDate]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageAccounts = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const endIndex = startIndex + pageAccounts.length;

  return (
    <AccountList
      loading={false}
      error={null}
      accounts={pageAccounts}
      total={total}
      itemsPerPage={ITEMS_PER_PAGE}
      currentPage={currentPage}
      totalPages={totalPages}
      startIndex={startIndex}
      endIndex={endIndex}
      searchTerm={searchTerm}
      typeFilter={typeFilter}
      startDate={startDate}
      endDate={endDate}
      paginationModel={buildPagination(currentPage, totalPages)}
      onSearchTermChange={(value) => {
        setSearchTerm(value);
        setCurrentPage(1);
      }}
      onTypeFilterChange={(value) => {
        setTypeFilter(value);
        setCurrentPage(1);
      }}
      onStartDateChange={(value) => {
        setStartDate(value);
        setCurrentPage(1);
      }}
      onEndDateChange={(value) => {
        setEndDate(value);
        setCurrentPage(1);
      }}
      onClearFilters={() => {
        setSearchTerm('');
        setTypeFilter('all');
        setStartDate('');
        setEndDate('');
        setCurrentPage(1);
      }}
      onPageChange={setCurrentPage}
      onPrevPage={() => setCurrentPage(Math.max(1, currentPage - 1))}
      onNextPage={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
      onViewDetail={(accountNumber) => onViewDetail?.(accountNumber)}
      onDelete={() => undefined}
      isMember={isMember}
      getTypeTone={getTypeTone}
      getTypeDisplay={getTypeDisplay}
      getStatusTone={getStatusTone}
      deletingAccountId={null}
    />
  );
}
