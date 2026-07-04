import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';

export interface OrderCartItem {
  id: number;
  name: string;
  quantity: number;
  remarks: string;
}

export interface CurrentOrderSidebarProps {
  items: OrderCartItem[];
  isSubmitting?: boolean;
  canSubmit?: boolean;
  onQuantityChange: (id: number, quantity: number) => void;
  onRemarksChange: (id: number, remarks: string) => void;
  onRemoveItem: (id: number) => void;
  onSubmitOrder: () => void;
}

export function CurrentOrderSidebar({
  items,
  isSubmitting = false,
  canSubmit = true,
  onQuantityChange,
  onRemarksChange,
  onRemoveItem,
  onSubmitOrder,
}: CurrentOrderSidebarProps) {
  return (
    <aside className="flex w-[340px] shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-5 py-4">
        <h2 className="text-lg font-semibold text-gray-900">Current Order</h2>
        <p className="mt-1 text-sm text-gray-500">{items.length} item{items.length === 1 ? '' : 's'}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-400">
            No items yet. Add menu items from the right.
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="rounded-lg border border-gray-200 bg-gray-50 p-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.id)}
                    className="rounded p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    aria-label={`Remove ${item.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={item.quantity <= 1}
                    onClick={() => onQuantityChange(item.id, item.quantity - 1)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="min-w-[2rem] text-center text-sm font-semibold text-gray-900">
                    {item.quantity}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <label className="mt-3 block">
                  <span className="mb-1 block text-xs font-medium text-gray-500">Remarks</span>
                  <input
                    type="text"
                    value={item.remarks}
                    onChange={(e) => onRemarksChange(item.id, e.target.value)}
                    placeholder="e.g. No ice, Extra hot"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-gray-200 px-4 py-4">
        <Button
          type="button"
          className="w-full bg-blue-600 text-white hover:bg-blue-700"
          disabled={items.length === 0 || isSubmitting || !canSubmit}
          onClick={onSubmitOrder}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Order'}
        </Button>
      </div>
    </aside>
  );
}
