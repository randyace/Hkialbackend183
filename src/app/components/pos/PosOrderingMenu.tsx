import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import {
  PosCategoryTabs,
  resolveCategoryIdForTab,
  type PosCategoryOption,
} from './PosCategoryTabs';
import { MenuCard, type MenuCardItem } from './MenuCard';
import { useMsg } from '@/i18n/useMsg';

export interface PosOrderingMenuItem extends MenuCardItem {
  categoryId: number;
  itemAllergens: string[];
}

export interface PosOrderingMenuProps {
  categories: PosCategoryOption[];
  menuItems: PosOrderingMenuItem[];
  customerAllergies?: string[];
  isLoading?: boolean;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  onAddToCart?: (item: PosOrderingMenuItem, quantity: number) => void;
}

export function PosOrderingMenu({
  categories,
  menuItems,
  customerAllergies = [],
  isLoading = false,
  searchQuery: controlledSearch,
  onSearchChange,
  onAddToCart,
}: PosOrderingMenuProps) {
  const msg = useMsg();
  const [selectedTab, setSelectedTab] = useState<string>('All');
  const [internalSearch, setInternalSearch] = useState('');
  const searchQuery = controlledSearch ?? internalSearch;

  const handleSearchChange = (value: string) => {
    if (onSearchChange) onSearchChange(value);
    else setInternalSearch(value);
  };

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return menuItems
      .filter((item) => {
        if (selectedTab === 'All') return true;
        const categoryId = resolveCategoryIdForTab(selectedTab, categories);
        if (categoryId !== null) return item.categoryId === categoryId;
        return item.categoryName === selectedTab;
      })
      .filter((item) => {
        if (!q) return true;
        return (
          item.nameEn.toLowerCase().includes(q)
          || (item.nameZh?.toLowerCase().includes(q) ?? false)
          || item.categoryName.toLowerCase().includes(q)
        );
      });
  }, [menuItems, selectedTab, categories, searchQuery]);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={msg('Search menu items...')}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 text-sm"
          />
        </div>
      </div>

      <PosCategoryTabs
        categories={categories}
        selectedTab={selectedTab}
        onSelectTab={setSelectedTab}
      />

      <div className="mt-4 flex-1 overflow-y-auto">
        {isLoading ? (
          <p className="py-10 text-center text-sm text-gray-500">{msg('Loading menu...')}</p>
        ) : filteredItems.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500">{msg('No menu items in this category.')}</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
            {filteredItems.map((item) => (
              <MenuCard
                key={item.id}
                item={item}
                customerAllergies={customerAllergies}
                itemAllergens={item.itemAllergens}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
