/** Fixed POS ordering tab labels — layout is built for these exact names. */
export const POS_ORDERING_CATEGORY_TABS = [
  'All',
  'Coffee',
  'Tea',
  'Beverages',
  'Breakfast',
  'Main Course',
  'Appetizer',
  'Dessert',
] as const;

export type PosOrderingCategoryTab = (typeof POS_ORDERING_CATEGORY_TABS)[number];

export interface PosCategoryOption {
  id: number;
  name: string;
}

export interface PosCategoryTabsProps {
  categories: PosCategoryOption[];
  selectedTab: PosOrderingCategoryTab | string;
  onSelectTab: (tabName: PosOrderingCategoryTab | string) => void;
}

export function PosCategoryTabs({ categories, selectedTab, onSelectTab }: PosCategoryTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {POS_ORDERING_CATEGORY_TABS.map((tabName) => {
        const isActive = selectedTab === tabName;
        const categoryExists = tabName === 'All' || categories.some((c) => c.name === tabName);

        return (
          <button
            key={tabName}
            type="button"
            onClick={() => onSelectTab(tabName)}
            className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:py-2 sm:text-sm ${
              isActive
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } ${!categoryExists && tabName !== 'All' ? 'opacity-60' : ''}`}
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
