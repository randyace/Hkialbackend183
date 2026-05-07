import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Plus, Edit2, Trash2, Search, Calendar } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './ui/pagination';

export interface BookableItemsItem {
  id: number;
  nameEn: string;
  nameSimp: string;
  nameTrad: string;
  category: 'Suite' | 'Transfer Services' | 'Food & Beverage' | 'Shopping';
  price: number;
  discountRate: number;
  descriptionEn: string;
  descriptionSimp: string;
  descriptionTrad: string;
  availability: 'available' | 'limited' | 'unavailable';
  stock?: number;
  createdDate: string;
  priceCalEquation: string;
  priority: number;
}

export interface BookableItemsCategoryCounts {
  total: number;
  suite: number;
  transfer: number;
  food: number;
  shopping: number;
}

export interface BookableItemsProps {
  loading?: boolean;
  error?: string | null;
  items: BookableItemsItem[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  searchTerm: string;
  categoryFilter: string;
  startDate: string;
  endDate: string;
  paginationModel: number[];
  categoryCounts: BookableItemsCategoryCounts;
  deletingItemId?: number | null;
  onSearchTermChange: (value: string) => void;
  onCategoryFilterChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onClearFilters: () => void;
  onPageChange: (page: number) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onEditItem: (itemId: number) => void;
  onCreateItem: () => void;
  onDeleteItem: (itemId: number) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Suite: 'bg-blue-100 text-blue-700',
  'Transfer Services': 'bg-purple-100 text-purple-700',
  'Food & Beverage': 'bg-orange-100 text-orange-700',
  Shopping: 'bg-green-100 text-green-700',
};

const AVAILABILITY_COLORS: Record<string, string> = {
  available: 'bg-green-100 text-green-700',
  limited: 'bg-yellow-100 text-yellow-700',
  unavailable: 'bg-red-100 text-red-700',
};

export function BookableItems({
  loading,
  error,
  items,
  totalCount,
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  searchTerm,
  categoryFilter,
  startDate,
  endDate,
  paginationModel,
  categoryCounts,
  deletingItemId,
  onSearchTermChange,
  onCategoryFilterChange,
  onStartDateChange,
  onEndDateChange,
  onClearFilters,
  onPageChange,
  onPrevPage,
  onNextPage,
  onEditItem,
  onCreateItem,
  onDeleteItem,
}: BookableItemsProps) {
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
          <h1>All Bookable Items</h1>
          <p className="text-gray-600">Manage services, suites, and add-ons available for booking</p>
        </div>
        <Button onClick={onCreateItem}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Item
        </Button>
      </div>

      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or description..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-2">Filter by Category</label>
            <div className="flex flex-wrap gap-2">
              {(['all', 'Suite', 'Transfer Services', 'Food & Beverage', 'Shopping'] as const).map((cat) => (
                <Button
                  key={cat}
                  variant={categoryFilter === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onCategoryFilterChange(cat)}
                >
                  {cat === 'all' ? 'All Categories' : cat}
                </Button>
              ))}
            </div>
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
              ? 'Loading items...'
              : `Showing ${totalCount === 0 ? 0 : startIndex + 1}-${endIndex} of ${totalCount} items`}
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
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Item English Name</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Base Price</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Price Cal Equation</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Discount</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Availability</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Created Date</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{item.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                      onClick={() => onEditItem(item.id)}
                    >
                      {item.nameEn}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={CATEGORY_COLORS[item.category] ?? 'bg-gray-100 text-gray-700'}>
                      {item.category}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                    {item.descriptionEn}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    HK${item.price.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 font-mono">
                    {item.priceCalEquation}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {item.discountRate > 0 ? (
                      <span className="text-green-600">{item.discountRate}%</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {item.stock !== undefined ? item.stock : <span className="text-gray-400">Unlimited</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={AVAILABILITY_COLORS[item.availability] ?? 'bg-gray-100 text-gray-700'}>
                      {item.availability}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {item.createdDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditItem(item.id)}
                        className="h-8 w-8 p-0"
                        title="Edit Item"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={deletingItemId === item.id}
                        onClick={() => onDeleteItem(item.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                        title="Delete Item"
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

        {!loading && items.length === 0 && (
          <div className="text-center py-12 text-gray-500">No items found.</div>
        )}

        {items.length > 0 && (
          <div className="p-4 border-t flex justify-end">{renderPagination()}</div>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Items</p>
          <h2 className="mt-1">{categoryCounts.total}</h2>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Suites</p>
          <h2 className="mt-1">{categoryCounts.suite}</h2>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Transfer Services</p>
          <h2 className="mt-1">{categoryCounts.transfer}</h2>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Food & Beverage</p>
          <h2 className="mt-1">{categoryCounts.food}</h2>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Shopping</p>
          <h2 className="mt-1">{categoryCounts.shopping}</h2>
        </Card>
      </div>
    </div>
  );
}
