import { useMemo } from 'react';

/** Fallback for Figma standalone preview when no sections/categories prop is provided. */
export const MOCK_POS_CATEGORIES: PosCategoryOption[] = [
  { id: 1, name: 'Coffee' },
  { id: 2, name: 'Tea' },
  { id: 3, name: 'Beverages' },
  { id: 4, name: 'Breakfast' },
  { id: 5, name: 'Main Course' },
  { id: 6, name: 'Appetizer' },
  { id: 7, name: 'Dessert' },
];

export interface PosCategoryOption {
  id: number;
  name: string;
}

export interface PosCategoryTabsProps {
  /**
   * Active menu sections (or legacy catalog categories) from the API
   * (id + name, already sort-ordered). Tabs render as All + each name.
   */
  categories?: PosCategoryOption[];
  selectedTab: string;
  onSelectTab: (tabName: string) => void;
}

export function PosCategoryTabs({
  categories,
  selectedTab,
  onSelectTab,
}: PosCategoryTabsProps) {
  const displayCategories = categories ?? MOCK_POS_CATEGORIES;

  const tabNames = useMemo(
    () => ['All', ...displayCategories.map((category) => category.name)],
    [displayCategories],
  );

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {tabNames.map((tabName) => {
        const isActive = selectedTab === tabName;

        return (
          <button
            key={tabName}
            type="button"
            onClick={() => onSelectTab(tabName)}
            className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:py-2 sm:text-sm ${
              isActive
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tabName}
          </button>
        );
      })}
    </div>
  );
}

export function resolveCategoryIdForTab(
  tabName: string,
  categories: PosCategoryOption[],
): number | null {
  if (tabName === 'All') return null;
  return categories.find((category) => category.name === tabName)?.id ?? null;
}
