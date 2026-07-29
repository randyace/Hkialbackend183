import { useEffect, useState } from 'react';
import { CheckSquare, Flame, Pencil, Square, Zap } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { useTranslation } from '../../lib/useTranslation';

export interface OrderCartItem {
  /** Stable cart-row identity (not the menu item id). */
  cartLineId: string;
  /** POS menu item id used when submitting the order. */
  id: number;
  name: string;
  quantity: number;
  remarks: string;
  isExpedited?: boolean;
}

export interface CurrentOrderSidebarProps {
  items: OrderCartItem[];
  isSubmitting?: boolean;
  canSubmit?: boolean;
  onQuantityChange: (cartLineId: string, quantity: number) => void;
  onRemarksChange: (cartLineId: string, remarks: string) => void;
  onRemoveItem: (cartLineId: string) => void;
  onToggleExpedite?: (cartLineId: string) => void;
  onBatchExpedite?: (cartLineIds: string[]) => void;
  onSubmitOrder: () => void;
}

type CartItemDialog = 'remarks' | 'quantity' | null;

export function OrderCartItemRow({
  item,
  selectionMode = false,
  isSelected = false,
  onToggleSelect,
  onQuantityChange,
  onRemarksChange,
  onRemoveItem,
  onToggleExpedite,
}: {
  item: OrderCartItem;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (cartLineId: string) => void;
  onQuantityChange: (cartLineId: string, quantity: number) => void;
  onRemarksChange: (cartLineId: string, remarks: string) => void;
  onRemoveItem: (cartLineId: string) => void;
  onToggleExpedite?: (cartLineId: string) => void;
}) {
  const { t } = useTranslation();
  const [openDialog, setOpenDialog] = useState<CartItemDialog>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [draftRemarks, setDraftRemarks] = useState(item.remarks);
  const [draftQuantity, setDraftQuantity] = useState(String(item.quantity));
  const trimmedRemarks = item.remarks.trim();
  const isExpedited = Boolean(item.isExpedited);

  useEffect(() => {
    if (openDialog === 'remarks') {
      setDraftRemarks(item.remarks);
    }
    if (openDialog === 'quantity') {
      setDraftQuantity(String(item.quantity));
    }
  }, [openDialog, item.remarks, item.quantity]);

  const handleSaveRemarks = () => {
    onRemarksChange(item.cartLineId, draftRemarks.trim());
    setOpenDialog(null);
  };

  const handleSaveQuantity = () => {
    const nextQuantity = Number.parseInt(draftQuantity, 10);
    if (!Number.isFinite(nextQuantity) || nextQuantity < 1) {
      return;
    }
    onQuantityChange(item.cartLineId, nextQuantity);
    setOpenDialog(null);
  };

  const borderClass = isExpedited
    ? 'border-2 border-red-500 bg-red-50 shadow-sm'
    : 'border border-gray-200 bg-gray-50 shadow-sm';

  if (selectionMode && isExpedited) {
    return (
      <div
        className={`rounded-lg opacity-60 ${borderClass}`}
        aria-disabled="true"
        title={t('pos.already_expedited', 'Already Expedited')}
      >
        <div className="flex items-stretch gap-1">
          <div className="flex items-center px-2 text-gray-300" aria-hidden>
            <Square className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1 rounded-lg p-3 text-left">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                  <span className="inline-flex items-center gap-0.5 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    <Flame className="h-3 w-3" aria-hidden />
                    {t('pos.expedited', 'Expedited')}
                  </span>
                </div>
                {trimmedRemarks ? (
                  <div className="mt-1.5 flex">
                    <span className="inline-flex max-w-full items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">
                      <Pencil className="h-3 w-3 shrink-0" strokeWidth={2.5} aria-hidden />
                      <span className="line-clamp-2">{trimmedRemarks}</span>
                    </span>
                  </div>
                ) : null}
              </div>
              <span className="shrink-0 rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-gray-700 ring-1 ring-gray-200">
                ×{item.quantity}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`rounded-lg ${borderClass}`}>
        <div className="flex items-stretch gap-1">
          {selectionMode ? (
            <button
              type="button"
              className="flex items-center px-2 text-red-600"
              onClick={() => onToggleSelect?.(item.cartLineId)}
              aria-label={t('pos.select_item', 'Select {{name}}', { name: item.name })}
            >
              {isSelected ? (
                <CheckSquare className="h-5 w-5" />
              ) : (
                <Square className="h-5 w-5 text-gray-400" />
              )}
            </button>
          ) : null}

          <DropdownMenu modal={false} open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (selectionMode) {
                    onToggleSelect?.(item.cartLineId);
                    return;
                  }
                  setIsDropdownOpen(true);
                }}
                className="min-w-0 flex-1 rounded-lg p-3 text-left transition-colors hover:bg-gray-100/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label={t('pos.actions_for', 'Actions for {{name}}', { name: item.name })}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                      {isExpedited ? (
                        <span className="inline-flex items-center gap-0.5 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                          <Flame className="h-3 w-3" aria-hidden />
                          {t('pos.expedited', 'Expedited')}
                        </span>
                      ) : null}
                    </div>
                    {trimmedRemarks ? (
                      <div className="mt-1.5 flex">
                        <span className="inline-flex max-w-full items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">
                          <Pencil className="h-3 w-3 shrink-0" strokeWidth={2.5} aria-hidden />
                          <span className="line-clamp-2">{trimmedRemarks}</span>
                        </span>
                      </div>
                    ) : null}
                  </div>
                  <span className="shrink-0 rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-gray-700 ring-1 ring-gray-200">
                    ×{item.quantity}
                  </span>
                </div>
              </button>
            </DropdownMenuTrigger>
            {!selectionMode ? (
              <DropdownMenuContent
                align="start"
                className="w-44 z-[100]"
                style={{ zIndex: 99999 }}
              >
                <DropdownMenuItem onSelect={() => setOpenDialog('remarks')}>
                  {t('pos.custom_request', 'Custom Request')}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setOpenDialog('quantity')}>
                  {t('pos.change_quantity', 'Change Quantity')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onSelect={() => onRemoveItem(item.cartLineId)}
                >
                  {t('pos.cancel_item', 'Cancel Item')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            ) : null}
          </DropdownMenu>

          {!selectionMode && onToggleExpedite ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onToggleExpedite(item.cartLineId);
              }}
              className={`m-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors ${
                isExpedited
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-white text-red-500 ring-1 ring-red-200 hover:bg-red-50'
              }`}
              aria-pressed={isExpedited}
              aria-label={
                isExpedited
                  ? t('pos.clear_expedite', 'Clear expedite for {{name}}', { name: item.name })
                  : t('pos.expedite_item', 'Expedite {{name}}', { name: item.name })
              }
              title={t('pos.expedite', 'Expedite')}
            >
              <Zap className="h-4 w-4" fill={isExpedited ? 'currentColor' : 'none'} />
            </button>
          ) : null}
        </div>
      </div>

      <Dialog
        open={openDialog === 'remarks'}
        onOpenChange={(open) => setOpenDialog(open ? 'remarks' : null)}
      >
        <DialogContent className="sm:max-w-md" style={{ zIndex: 100000 }}>
          <DialogHeader>
            <DialogTitle>{t('pos.custom_request', 'Custom Request')}</DialogTitle>
            <DialogDescription>
              {t('pos.update_custom_request_for', 'Update the custom request for {{name}}.', {
                name: item.name,
              })}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={draftRemarks}
            onChange={(event) => setDraftRemarks(event.target.value)}
            placeholder={t('pos.custom_request_placeholder', 'e.g. Less ice, Extra hot')}
            rows={4}
            autoFocus
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpenDialog(null)}>
              {t('pos.cancel', 'Cancel')}
            </Button>
            <Button type="button" onClick={handleSaveRemarks}>
              {t('pos.save', 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={openDialog === 'quantity'}
        onOpenChange={(open) => setOpenDialog(open ? 'quantity' : null)}
      >
        <DialogContent className="sm:max-w-sm" style={{ zIndex: 100000 }}>
          <DialogHeader>
            <DialogTitle>{t('pos.change_quantity', 'Change Quantity')}</DialogTitle>
            <DialogDescription>
              {t('pos.update_quantity_for', 'Update quantity for {{name}}.', {
                name: item.name,
              })}
            </DialogDescription>
          </DialogHeader>
          <Input
            type="number"
            min={1}
            step={1}
            value={draftQuantity}
            onChange={(event) => setDraftQuantity(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleSaveQuantity();
              }
            }}
            autoFocus
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpenDialog(null)}>
              {t('pos.cancel', 'Cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleSaveQuantity}
              disabled={
                !Number.isFinite(Number.parseInt(draftQuantity, 10)) ||
                Number.parseInt(draftQuantity, 10) < 1
              }
            >
              {t('pos.save', 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function CurrentOrderSidebar({
  items,
  isSubmitting = false,
  canSubmit = true,
  onQuantityChange,
  onRemarksChange,
  onRemoveItem,
  onToggleExpedite,
  onSubmitOrder,
}: CurrentOrderSidebarProps) {
  const { t } = useTranslation();

  return (
    <aside className="flex w-[340px] shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-5 py-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Current Order</h2>
            <p className="mt-1 text-sm text-gray-500">
              {items.length} item{items.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-400">
            No items yet. Add menu items from the right.
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.cartLineId}>
                <OrderCartItemRow
                  item={item}
                  onQuantityChange={onQuantityChange}
                  onRemarksChange={onRemarksChange}
                  onRemoveItem={onRemoveItem}
                  onToggleExpedite={onToggleExpedite}
                />
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
