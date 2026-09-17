import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import {
  PosCategoryTabs,
  resolveCategoryIdForTab,
  type PosCategoryOption,
} from './PosCategoryTabs';
import { MenuCard, type MenuCardItem } from './MenuCard';

export interface PosOrderingMenuItem extends MenuCardItem {
  /** Active-menu section id used for tab filtering. */
  categoryId: number;
  itemAllergens: string[];
  /** Mapped option groups for Add-to-Cart intercept. */
  optionGroups?: Array<{
    id: number;
    name: string;
    minSelect: number;
    maxSelect: number;
    options: Array<{ id: number; name: string }>;
  }>;
}

export interface PosOrderingMenuProps {
  /**
   * Active menu sections (tabs). Prefer this over legacy `categories`.
   * "All" still aggregates every item across these sections.
   */
  sections?: PosCategoryOption[];
  /** @deprecated Use `sections` — kept for older call sites / Figma previews. */
  categories?: PosCategoryOption[];
  menuItems: PosOrderingMenuItem[];
  /** Active seasonal menu name (optional header hint). */
  menuName?: string | null;
  customerAllergies?: string[];
  isLoading?: boolean;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  onAddToCart?: (item: PosOrderingMenuItem, quantity: number) => void;
}

export function PosOrderingMenu({
  sections,
  categories,
  menuItems,
  menuName = null,
  customerAllergies = [],
  isLoading = false,
  searchQuery: controlledSearch,
  onSearchChange,
  onAddToCart,
}: PosOrderingMenuProps) {
  const [selectedTab, setSelectedTab] = useState<string>('All');
  const [internalSearch, setInternalSearch] = useState('');
  const searchQuery = controlledSearch ?? internalSearch;

  const filterTabs = sections ?? categories ?? [];

  const handleSearchChange = (value: string) => {
    if (onSearchChange) onSearchChange(value);
    else setInternalSearch(value);
  };

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return menuItems
      .filter((item) => {
        if (selectedTab === 'All') return true;
        const sectionId = resolveCategoryIdForTab(selectedTab, filterTabs);
        if (sectionId !== null) return item.categoryId === sectionId;
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
  }, [menuItems, selectedTab, filterTabs, searchQuery]);

  return (
    <div className="flex h-full flex-col">
      {menuName ? (
        <p className="mb-2 text-xs font-medium text-gray-500 truncate">
          Menu: {menuName}
        </p>
      ) : null}

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 text-sm"
          />
        </div>
      </div>

      <PosCategoryTabs
        categories={filterTabs}
        selectedTab={selectedTab}
        onSelectTab={setSelectedTab}
      />

      <div className="mt-4 flex-1 overflow-y-auto">
        {isLoading ? (
          <p className="py-10 text-center text-sm text-gray-500">Loading menu...</p>
        ) : !menuName && filterTabs.length === 0 && menuItems.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500">
            No active menu is available for ordering.
          </p>
        ) : filteredItems.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500">
            No menu items in this section.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
            {filteredItems.map((item) => (
              <MenuCard
                key={`${item.categoryId}-${item.id}`}
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
