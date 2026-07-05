import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { PosAllergenWarningBanner } from './PosAllergenWarningBanner';

export interface PosMenuItemCardData {
  id: number;
  categoryId: number;
  name: string;
  nameZh?: string;
  categoryName: string;
  availability: 'available' | 'unavailable';
  imageUrl?: string | null;
  allergens?: Array<{ id?: number; name: string; type?: string }>;
}

export interface PosMenuItemCardProps {
  item: PosMenuItemCardData;
  matchingAllergenNames?: string[];
  onAddToCart?: (item: PosMenuItemCardData, quantity: number) => void;
}

export function PosMenuItemCard({
  item,
  matchingAllergenNames = [],
  onAddToCart,
}: PosMenuItemCardProps) {
  const [quantity, setQuantity] = useState(1);
  const isSoldOut = item.availability === 'unavailable';

  const handleAdd = () => {
    if (isSoldOut) return;
    onAddToCart?.(item, quantity);
    setQuantity(1);
  };

  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="font-medium text-gray-900">{item.name}</h4>
          {item.nameZh ? <p className="text-xs text-gray-500">{item.nameZh}</p> : null}
          <p className="mt-1 text-xs text-gray-500">{item.categoryName}</p>
        </div>
        {isSoldOut ? (
          <Badge className="shrink-0 bg-gray-200 text-gray-700 hover:bg-gray-200">Sold Out</Badge>
        ) : null}
      </div>

      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt={item.name}
          className="mb-3 h-28 w-full rounded-md object-cover border border-gray-200"
        />
      ) : null}

      <PosAllergenWarningBanner matchingAllergenNames={matchingAllergenNames} />

      <div className="mt-auto space-y-3 pt-4">
        <div className="flex items-center justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={isSoldOut || quantity <= 1}
            onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="min-w-[2rem] text-center text-sm font-semibold text-gray-900">
            {quantity}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={isSoldOut}
            onClick={() => setQuantity((prev) => prev + 1)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <Button
          type="button"
          className="w-full bg-green-600 hover:bg-green-700"
          disabled={isSoldOut}
          onClick={handleAdd}
        >
          Add to Cart
        </Button>
      </div>
    </Card>
  );
}
