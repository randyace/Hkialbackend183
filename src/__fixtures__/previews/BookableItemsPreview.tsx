import { useMemo, useState } from 'react';
import { BookableItems } from '../../app/components/BookableItems';
import { mockBookableItems } from '../BookableItems.fixture';

const ITEMS_PER_PAGE = 10;

interface BookableItemsPreviewProps {
  onEditItem?: (itemId: number) => void;
  onCreateItem?: () => void;
}

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

export function BookableItemsPreview({ onEditItem, onCreateItem }: BookableItemsPreviewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    return mockBookableItems
      .filter((item) => {
        const matchesSearch =
          item.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.descriptionEn.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
        const matchesStart = !startDate || new Date(item.createdDate) >= new Date(startDate);
        const matchesEnd = !endDate || new Date(item.createdDate) <= new Date(endDate);
        return matchesSearch && matchesCategory && matchesStart && matchesEnd;
      })
      .sort((a, b) => b.id - a.id);
  }, [searchTerm, categoryFilter, startDate, endDate]);

  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageItems = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const endIndex = startIndex + pageItems.length;

  const categoryCounts = useMemo(() => ({
    total: filtered.length,
    suite: filtered.filter((i) => i.category === 'Suite').length,
    transfer: filtered.filter((i) => i.category === 'Transfer Services').length,
    food: filtered.filter((i) => i.category === 'Food & Beverage').length,
    shopping: filtered.filter((i) => i.category === 'Shopping').length,
  }), [filtered]);

  return (
    <BookableItems
      items={pageItems}
      totalCount={totalCount}
      currentPage={currentPage}
      totalPages={totalPages}
      startIndex={startIndex}
      endIndex={endIndex}
      searchTerm={searchTerm}
      categoryFilter={categoryFilter}
      startDate={startDate}
      endDate={endDate}
      paginationModel={buildPagination(currentPage, totalPages)}
      categoryCounts={categoryCounts}
      onSearchTermChange={(value) => {
        setSearchTerm(value);
        setCurrentPage(1);
      }}
      onCategoryFilterChange={(value) => {
        setCategoryFilter(value);
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
        setCategoryFilter('all');
        setStartDate('');
        setEndDate('');
        setCurrentPage(1);
      }}
      onPageChange={setCurrentPage}
      onPrevPage={() => setCurrentPage(Math.max(1, currentPage - 1))}
      onNextPage={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
      onEditItem={(id) => onEditItem?.(id)}
      onCreateItem={() => onCreateItem?.()}
      onDeleteItem={() => undefined}
    />
  );
}
