import { useMemo } from 'react';
import { AlertTriangle, ImageOff } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';

export interface MenuCardItem {
  id: number;
  nameEn: string;
  nameZh?: string | null;
  categoryName: string;
  imageUrl?: string | null;
  availability: 'available' | 'unavailable';
}

export interface MenuCardProps {
  item: MenuCardItem;
  customerAllergies: string[];
  itemAllergens: string[];
  onAddToCart?: (item: MenuCardItem, quantity: number) => void;
}

function matchAllergenNames(customerAllergies: string[], itemAllergens: string[]): string[] {
  const customerTerms = customerAllergies
    .map((name) => name.toLowerCase().trim())
    .filter(Boolean);

  if (customerTerms.length === 0 || itemAllergens.length === 0) {
    return [];
  }

  const matched: string[] = [];

  for (const allergen of itemAllergens) {
    const itemName = allergen.toLowerCase().trim();
    if (!itemName) continue;

    const hasMatch = customerTerms.some(
      (customerTerm) =>
        customerTerm === itemName
        || customerTerm.includes(itemName)
        || itemName.includes(customerTerm),
    );

    if (hasMatch) {
      matched.push(allergen);
    }
  }

  return [...new Set(matched)];
}

export function MenuCard({
  item,
  customerAllergies,
  itemAllergens,
  onAddToCart,
}: MenuCardProps) {
  const isSoldOut = item.availability === 'unavailable';

  const matchedAllergens = useMemo(
    () => matchAllergenNames(customerAllergies, itemAllergens),
    [customerAllergies, itemAllergens],
  );

  const hasMatchingAllergen = matchedAllergens.length > 0;
  const hasItemAllergens = itemAllergens.length > 0;
  const displayedAllergens = hasItemAllergens ? itemAllergens.join(', ') : '';

  const handleAdd = () => {
    if (isSoldOut) return;
    onAddToCart?.(item, 1);
  };

  return (
    <div
      className={cn(
        'relative flex h-full flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md',
        hasMatchingAllergen ? 'border-2 border-red-400 bg-red-50' : 'border-gray-100',
      )}
    >
      <div className={cn('flex flex-1 flex-col', isSoldOut && 'opacity-50')}>
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-gray-100">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.nameEn}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-gray-400">
              <ImageOff className="h-8 w-8" />
              <span className="text-xs">No image</span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-3">
          <div className="mb-2 min-w-0">
            <h4 className="truncate text-sm font-semibold text-gray-900">{item.nameEn}</h4>
            {item.nameZh ? (
              <p className="truncate text-xs text-gray-500">{item.nameZh}</p>
            ) : null}
            <Badge
              variant="outline"
              className="mt-2 border-gray-200 bg-gray-50 text-[11px] font-medium text-gray-600"
            >
              {item.categoryName}
            </Badge>
          </div>

          {hasItemAllergens ? (
            <div
              className={cn(
                'mb-3 rounded-md border px-2.5 py-2',
                hasMatchingAllergen
                  ? 'border-red-300 bg-red-100'
                  : 'border-orange-200 bg-orange-50',
              )}
            >
              <div className="mb-1 flex items-center gap-1">
                <AlertTriangle
                  className={cn(
                    'h-3.5 w-3.5 shrink-0',
                    hasMatchingAllergen ? 'text-red-600' : 'text-orange-600',
                  )}
                />
                <p
                  className={cn(
                    'text-xs font-semibold',
                    hasMatchingAllergen ? 'text-red-700' : 'text-orange-700',
                  )}
                >
                  {hasMatchingAllergen ? 'ALLERGEN WARNING' : 'Contains:'}
                </p>
              </div>
              <p
                className={cn(
                  'text-xs',
                  hasMatchingAllergen ? 'font-medium text-red-600' : 'text-orange-600',
                )}
              >
                {displayedAllergens}
              </p>
            </div>
          ) : null}

          <div className="mt-auto pt-1">
            <Button
              type="button"
              className={cn(
                'w-full text-white',
                hasMatchingAllergen
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700',
              )}
              disabled={isSoldOut}
              onClick={handleAdd}
            >
              {hasMatchingAllergen ? 'Add with Caution' : 'Add to Cart'}
            </Button>
          </div>
        </div>
      </div>

      {isSoldOut ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <span className="rounded-full bg-gray-900/85 px-4 py-1.5 text-sm font-semibold tracking-wide text-white shadow-md">
            Sold Out
          </span>
        </div>
      ) : null}
    </div>
  );
}
