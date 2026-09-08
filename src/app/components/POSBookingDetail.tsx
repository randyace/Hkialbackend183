import { ArrowLeft, User, CreditCard, Utensils, MapPin, AlertCircle, X, Loader2, ChevronDown, PanelLeftClose, PanelLeftOpen, Pencil, Flame, Zap, CheckSquare, Square, CheckCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { useTranslation } from '../lib/useTranslation';

interface OrderItem {
  id: string;
  posOrderItemId?: number;
  name: string;
  category: string;
  quantity: number;
  remarks?: string;
  unitPrice: number;
  total: number;
  status: 'pending' | 'preparing' | 'served' | 'cancelled' | 'unserved';
  orderTime: string;
  servedTime?: string;
  cancelledAt?: string | null;
  isNew?: boolean;
  isExpedited?: boolean;
}

interface FoodAllergy {
  id: number;
  allergen: string;
  severity: 'Mild' | 'Moderate' | 'Severe';
  notes: string;
}

interface DietaryRequirement {
  id: number;
  requirement: string;
  notes: string;
}

interface GuestProfile {
  guestId: number;
  name: string;
  relation: 'Main Member' | 'Spouse' | 'Child' | 'Companion' | 'Guest';
  foodAllergies: FoodAllergy[];
  dietaryRequirements: DietaryRequirement[];
}

interface POSBooking {
  bookingNo: string;
  suiteId: string;
  suiteName: string;
  
  // Member Details
  memberName: string;
  accountNo: string;
  accountType: 'Individual' | 'Corporate' | 'Agency';
  membershipTier: 'Gold' | 'Platinum' | 'Diamond' | 'Sapphire';
  email: string;
  phone: string;
  companyName?: string;
  
  // Food Allergies & Dietary
  foodAllergies: FoodAllergy[];
  dietaryRequirements: DietaryRequirement[];
  guestProfiles: GuestProfile[];
  guests: GuestProfile[];
  
  // Booking Info
  checkInTime: string;
  flightNo: string;
  flightTime: string;
  flightDestination: string;
  numberOfGuests: number;
  
  // Order Details
  orders: OrderItem[];
  
  // Payment Info
  paymentMode: 'Upfront' | 'On-Credit';
  paymentStatus: 'Pending' | 'Paid' | 'Billed to Account';
  totalAmount: number;
  creditBalance?: number;
}

interface POSBookingDetailProps {
  bookingNo: string;
  onBack: () => void;
}

const generateMockBooking = (bookingNo: string): POSBooking => {
  const orders: OrderItem[] = [
    {
      id: 'ORD-001',
      name: 'Premium Breakfast Set',
      category: 'Breakfast',
      quantity: 2,
      unitPrice: 280,
      total: 560,
      status: 'served',
      orderTime: '14:35',
      servedTime: '14:50'
    },
    {
      id: 'ORD-002',
      name: 'Dim Sum Platter',
      category: 'Main Course',
      quantity: 1,
      unitPrice: 380,
      total: 380,
      status: 'served',
      orderTime: '15:00',
      servedTime: '15:20'
    },
    {
      id: 'ORD-003',
      name: 'Fresh Fruit Juice',
      category: 'Beverages',
      quantity: 3,
      unitPrice: 60,
      total: 180,
      status: 'served',
      orderTime: '14:35',
      servedTime: '14:45'
    },
    {
      id: 'ORD-004',
      name: 'Coffee (Latte)',
      category: 'Beverages',
      quantity: 2,
      unitPrice: 50,
      total: 100,
      status: 'served',
      orderTime: '15:30',
      servedTime: '15:35'
    },
    {
      id: 'ORD-005',
      name: 'Caesar Salad',
      category: 'Appetizer',
      quantity: 1,
      unitPrice: 120,
      total: 120,
      status: 'preparing',
      orderTime: '16:00'
    },
    {
      id: 'ORD-006',
      name: 'Dessert Trio',
      category: 'Dessert',
      quantity: 2,
      unitPrice: 95,
      total: 190,
      status: 'pending',
      orderTime: '16:15'
    }
  ];

  const guestProfiles: GuestProfile[] = [
    {
      guestId: 1,
      name: 'John Smith',
      relation: 'Main Member',
      foodAllergies: [
        {
          id: 1,
          allergen: 'Shellfish',
          severity: 'Severe',
          notes: 'Avoid all shellfish products.'
        }
      ],
      dietaryRequirements: [
        {
          id: 1,
          requirement: 'Vegetarian',
          notes: 'No meat or fish.'
        }
      ]
    },
    {
      guestId: 2,
      name: 'Mary Smith',
      relation: 'Spouse',
      foodAllergies: [
        {
          id: 2,
          allergen: 'Nuts',
          severity: 'Severe',
          notes: 'Severe tree nut allergy — carries EpiPen.'
        },
        {
          id: 3,
          allergen: 'Dairy',
          severity: 'Mild',
          notes: 'Mild lactose sensitivity.'
        }
      ],
      dietaryRequirements: [
        {
          id: 2,
          requirement: 'Gluten-Free',
          notes: 'Coeliac disease — strict gluten-free required.'
        }
      ]
    }
  ];

  return {
    bookingNo: bookingNo,
    suiteId: 'vip-a1',
    suiteName: 'VIP Suite A1',
    
    // Member Details
    memberName: 'John Smith',
    accountNo: 'ACC-2024-1001',
    accountType: 'Corporate',
    membershipTier: 'Platinum',
    email: 'john.smith@company.com',
    phone: '+852 9123 4567',
    companyName: 'Tech Solutions Ltd.',
    
    // Food Allergies & Dietary
    foodAllergies: [
      {
        id: 1,
        allergen: 'Shellfish',
        severity: 'Severe',
        notes: 'Avoid all shellfish products.'
      }
    ],
    dietaryRequirements: [
      {
        id: 1,
        requirement: 'Vegetarian',
        notes: 'No meat or fish.'
      }
    ],
    guestProfiles,
    guests: guestProfiles,
    
    // Booking Info
    checkInTime: '14:30',
    flightNo: 'CX888',
    flightTime: '17:30',
    flightDestination: 'London (LHR)',
    numberOfGuests: 2,
    
    // Order Details
    orders: orders,
    
    // Payment Info
    paymentMode: 'On-Credit',
    paymentStatus: 'Billed to Account',
    totalAmount: orders.reduce((sum, item) => sum + item.total, 0),
    creditBalance: 15000
  };
};

// ── MOCK constant + updated Props ────────────────────────────────────────────
const MOCK_BOOKING_DETAIL: POSBooking = generateMockBooking('A-202603-000001');

type TicketItemDialog = 'remarks' | 'quantity' | null;

type BatchMode = 'none' | 'expedite' | 'served';

function isOrderItemExpediteStatusEligible(order: OrderItem): boolean {
  if (
    order.cancelledAt
    || order.status === 'cancelled'
    || order.status === 'unserved'
    || order.status === 'served'
  ) {
    return false;
  }
  return order.isNew === true || order.status === 'pending' || order.status === 'preparing';
}

/** Pending/Preparing (or new cart) items that are not already expedited — selectable in batch expedite mode. */
function isOrderItemExpediteSelectable(order: OrderItem): boolean {
  return isOrderItemExpediteStatusEligible(order) && !order.isExpedited;
}

/** Submitted Pending/Preparing items — selectable in batch served mode. */
function isOrderItemServedSelectable(order: OrderItem): boolean {
  if (
    order.cancelledAt
    || order.status === 'cancelled'
    || order.status === 'unserved'
    || order.status === 'served'
    || order.isNew
  ) {
    return false;
  }
  return (
    (order.status === 'pending' || order.status === 'preparing') &&
    Boolean(order.posOrderItemId)
  );
}

function TicketOrderItemRow({
  order,
  isCancelled,
  statusBadgeClass,
  statusLabel,
  selectionMode = false,
  selectionPurpose = 'expedite',
  isSelected = false,
  onToggleSelect,
  onCancelOrderItem,
  cancellingOrderItemId,
  onUpdateNewItem,
  onRemoveNewItem,
  onToggleExpedite,
  isTogglingExpedite = false,
  onMarkServed,
  isMarkingServed = false,
}: {
  order: OrderItem;
  isCancelled: boolean;
  statusBadgeClass: string;
  statusLabel: string;
  selectionMode?: boolean;
  selectionPurpose?: 'expedite' | 'served';
  isSelected?: boolean;
  onToggleSelect?: (orderId: string) => void;
  onCancelOrderItem?: (posOrderItemId: number) => void | Promise<void>;
  cancellingOrderItemId?: number | null;
  onUpdateNewItem?: (
    itemId: string,
    payload: { quantity?: number; remarks?: string | null },
  ) => void;
  onRemoveNewItem?: (itemId: string) => void;
  onToggleExpedite?: (order: OrderItem) => void | Promise<void>;
  isTogglingExpedite?: boolean;
  onMarkServed?: (posOrderItemId: number) => void | Promise<void>;
  isMarkingServed?: boolean;
}) {
  const { t } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [openDialog, setOpenDialog] = useState<TicketItemDialog>(null);
  const [draftRemarks, setDraftRemarks] = useState(order.remarks ?? '');
  const [draftQuantity, setDraftQuantity] = useState(String(order.quantity));
  const trimmedRemarks = (order.remarks ?? '').trim();
  const isNewItem = Boolean(order.isNew);
  const isExpedited = Boolean(order.isExpedited);
  const isSubmittedItem = !isNewItem && !isCancelled && Boolean(order.posOrderItemId);
  const isExpediteStatusEligible = isOrderItemExpediteStatusEligible(order);
  const isServedSelectable = isOrderItemServedSelectable(order);
  const canToggleExpedite = isExpediteStatusEligible;
  const canMarkServed =
    !selectionMode &&
    isSubmittedItem &&
    Boolean(onMarkServed) &&
    (order.status === 'pending' || order.status === 'preparing');
  const canOpenMenu =
    !selectionMode &&
    ((isNewItem && Boolean(onUpdateNewItem || onRemoveNewItem)) ||
      (isSubmittedItem && Boolean(onCancelOrderItem || onMarkServed)));
  const isCancellingSubmitted =
    isSubmittedItem && cancellingOrderItemId === order.posOrderItemId;
  const isBusy = Boolean(isCancellingSubmitted || isMarkingServed);

  useEffect(() => {
    if (openDialog === 'remarks') {
      setDraftRemarks(order.remarks ?? '');
    }
    if (openDialog === 'quantity') {
      setDraftQuantity(String(order.quantity));
    }
  }, [openDialog, order.remarks, order.quantity]);

  const handleSaveRemarks = () => {
    if (!isNewItem || !onUpdateNewItem) {
      return;
    }
    const nextRemarks = draftRemarks.trim();
    onUpdateNewItem(order.id, {
      remarks: nextRemarks === '' ? null : nextRemarks,
    });
    setOpenDialog(null);
  };

  const handleSaveQuantity = () => {
    if (!isNewItem || !onUpdateNewItem) {
      return;
    }
    const nextQuantity = Number.parseInt(draftQuantity, 10);
    if (!Number.isFinite(nextQuantity) || nextQuantity < 1) {
      return;
    }
    onUpdateNewItem(order.id, { quantity: nextQuantity });
    setOpenDialog(null);
  };

  const handleCancelFromMenu = () => {
    setIsDropdownOpen(false);
    if (isNewItem) {
      onRemoveNewItem?.(order.id);
      return;
    }
    if (order.posOrderItemId && onCancelOrderItem) {
      void onCancelOrderItem(order.posOrderItemId);
    }
  };

  const handleMarkServedFromMenu = () => {
    setIsDropdownOpen(false);
    if (order.posOrderItemId && onMarkServed) {
      void onMarkServed(order.posOrderItemId);
    }
  };

  const statusBadge = isNewItem ? (
    <Badge className="shrink-0 text-xs bg-blue-100 text-blue-800 border border-blue-200">
      {t('pos.new', 'New')}
    </Badge>
  ) : canMarkServed ? (
    <button
      type="button"
      className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${statusBadgeClass}`}
      disabled={isMarkingServed}
      title={t('pos.mark_served', 'Mark as Served')}
      aria-label={t('pos.mark_served', 'Mark as Served')}
      onClick={(event) => {
        event.stopPropagation();
        if (order.posOrderItemId && onMarkServed) {
          void onMarkServed(order.posOrderItemId);
        }
      }}
    >
      {isMarkingServed ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
      {statusLabel}
    </button>
  ) : (
    <Badge className={`shrink-0 text-xs ${statusBadgeClass}`}>
      {statusLabel}
    </Badge>
  );

  const rowBody = (
    <>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className={`text-sm font-semibold truncate ${isCancelled ? 'line-through text-gray-400' : 'text-gray-900'}`}>
            {order.name}
          </p>
          {isExpedited && !isCancelled ? (
            <span className="inline-flex items-center gap-0.5 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              <Flame className="h-3 w-3" aria-hidden />
              {t('pos.expedited', 'Expedited')}
            </span>
          ) : null}
        </div>
        {trimmedRemarks ? (
          <div className="mt-1.5 flex">
            <span
              className={`inline-flex max-w-full items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20 ${
                isCancelled ? 'opacity-60' : ''
              }`}
            >
              <Pencil className="h-3 w-3 shrink-0" strokeWidth={2.5} aria-hidden />
              <span className={`line-clamp-2 ${isCancelled ? 'line-through' : ''}`}>
                {trimmedRemarks}
              </span>
            </span>
          </div>
        ) : order.id ? (
          <p className={`text-xs text-gray-400 truncate ${isCancelled ? 'line-through' : ''}`}>
            {order.id}
          </p>
        ) : null}
      </div>
      <span className={`text-sm tabular-nums shrink-0 ${isCancelled ? 'line-through text-gray-400' : 'text-gray-700'}`}>
        x{order.quantity}
      </span>
    </>
  );

  const borderClass = isCancelled
    ? 'border-gray-200 bg-gray-50'
    : isExpedited
      ? 'border-2 border-red-500 bg-red-50'
      : 'border-gray-200 bg-white';

  if (selectionMode) {
    const isVisibleInSelection =
      selectionPurpose === 'served' ? isServedSelectable : isExpediteStatusEligible;

    if (!isVisibleInSelection) {
      return null;
    }

    if (selectionPurpose === 'expedite' && isExpedited) {
      return (
        <div
          className={`flex w-full items-center gap-2 rounded-lg border py-2 px-3 text-left opacity-60 ${borderClass}`}
          aria-disabled="true"
          title={t('pos.already_expedited', 'Already Expedited')}
        >
          <Square className="h-5 w-5 shrink-0 text-gray-300" aria-hidden />
          {rowBody}
          {statusBadge}
        </div>
      );
    }

    return (
      <button
        type="button"
        className={`flex w-full items-center gap-2 rounded-lg border py-2 px-3 text-left ${borderClass}`}
        onClick={() => onToggleSelect?.(order.id)}
      >
        {isSelected ? (
          <CheckSquare
            className={`h-5 w-5 shrink-0 ${
              selectionPurpose === 'served' ? 'text-green-600' : 'text-red-600'
            }`}
          />
        ) : (
          <Square className="h-5 w-5 shrink-0 text-gray-400" />
        )}
        {rowBody}
        {statusBadge}
      </button>
    );
  }

  if (!canOpenMenu) {
    return (
      <div className={`flex items-center gap-2 rounded-lg border py-2 px-3 ${borderClass}`}>
        {rowBody}
        {statusBadge}
        {canToggleExpedite && onToggleExpedite ? (
          <button
            type="button"
            onClick={() => void onToggleExpedite(order)}
            disabled={isTogglingExpedite}
            className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-md transition-colors disabled:opacity-50 ${
              isExpedited
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-white text-red-500 ring-1 ring-red-200 hover:bg-red-50'
            }`}
            aria-pressed={isExpedited}
            aria-label={t('pos.expedite', 'Expedite')}
            title={t('pos.expedite', 'Expedite')}
          >
            {isTogglingExpedite ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Zap className="h-3.5 w-3.5" fill={isExpedited ? 'currentColor' : 'none'} />
            )}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <div className={`flex items-center gap-2 rounded-lg border py-2 px-3 ${borderClass}`}>
        <DropdownMenu modal={false} open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-2 text-left"
              onClick={(event) => {
                event.stopPropagation();
                setIsDropdownOpen(true);
              }}
              aria-label={t('pos.actions_for', 'Actions for {{name}}', { name: order.name })}
              disabled={isBusy}
            >
              {rowBody}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-44 z-[100]"
            style={{ zIndex: 99999 }}
          >
            {isNewItem ? (
              <>
                <DropdownMenuItem
                  onSelect={() => {
                    setIsDropdownOpen(false);
                    setOpenDialog('remarks');
                  }}
                >
                  {t('pos.custom_request', 'Custom Request')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    setIsDropdownOpen(false);
                    setOpenDialog('quantity');
                  }}
                >
                  {t('pos.change_quantity', 'Change Quantity')}
                </DropdownMenuItem>
              </>
            ) : null}
            {canMarkServed ? (
              <DropdownMenuItem
                className="text-green-600 focus:bg-green-50 focus:text-green-700"
                disabled={isMarkingServed}
                onSelect={handleMarkServedFromMenu}
              >
                <CheckCheck className="mr-2 h-3.5 w-3.5" />
                {t('pos.mark_served', 'Mark Served')}
              </DropdownMenuItem>
            ) : null}
            {isSubmittedItem && onCancelOrderItem ? (
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onSelect={handleCancelFromMenu}
              >
                {t('pos.cancel_item', 'Cancel Item')}
              </DropdownMenuItem>
            ) : isNewItem ? (
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onSelect={handleCancelFromMenu}
              >
                {t('pos.cancel_item', 'Cancel Item')}
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>

        {statusBadge}

        {canToggleExpedite && onToggleExpedite ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              void onToggleExpedite(order);
            }}
            disabled={isTogglingExpedite}
            className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-md transition-colors disabled:opacity-50 ${
              isExpedited
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-white text-red-500 ring-1 ring-red-200 hover:bg-red-50'
            }`}
            aria-pressed={isExpedited}
            aria-label={t('pos.expedite', 'Expedite')}
            title={t('pos.expedite', 'Expedite')}
          >
            {isTogglingExpedite ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Zap className="h-3.5 w-3.5" fill={isExpedited ? 'currentColor' : 'none'} />
            )}
          </button>
        ) : null}

        {isNewItem && onRemoveNewItem ? (
          <button
            type="button"
            aria-label={t('pos.cancel_item', 'Cancel Item')}
            className="shrink-0 p-2 rounded-md text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
            onClick={(event) => {
              event.stopPropagation();
              onRemoveNewItem(order.id);
            }}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}

        {isSubmittedItem && onCancelOrderItem ? (
          <button
            type="button"
            aria-label={t('pos.cancel_item', 'Cancel Item')}
            className="shrink-0 p-2 rounded-md text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            disabled={Boolean(isCancellingSubmitted)}
            onClick={(event) => {
              event.stopPropagation();
              void onCancelOrderItem(order.posOrderItemId!);
            }}
          >
            {isCancellingSubmitted ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </button>
        ) : null}
      </div>

      {isNewItem ? (
        <>
          <Dialog
            open={openDialog === 'remarks'}
            onOpenChange={(open) => setOpenDialog(open ? 'remarks' : null)}
          >
            <DialogContent className="sm:max-w-md" style={{ zIndex: 100000 }}>
              <DialogHeader>
                <DialogTitle>{t('pos.custom_request', 'Custom Request')}</DialogTitle>
                <DialogDescription>
                  {t('pos.update_custom_request_for', 'Update the custom request for {{name}}.', {
                    name: order.name,
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
                    name: order.name,
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
      ) : null}
    </>
  );
}

export interface POSBookingDetailFullProps extends POSBookingDetailProps {
  /** Pass fully-loaded booking from CI4; when null falls back to MOCK_BOOKING_DETAIL */
  booking?: POSBooking | null;
  isWalkIn?: boolean;
  onCheckout?: (paymentData: { method: string }) => void;
  onCheckoutClick?: () => void;
  onClearWalkIn?: () => void | Promise<void>;
  isClearingWalkIn?: boolean;
  isLoading?: boolean;
  heldPreorderItems?: Array<{
    id?: number;
    pos_menu_item_id?: number;
    name_en?: string | null;
    quantity: number;
    remarks?: string | null;
  }>;
  selectedHeldItems?: number[];
  onToggleHeldItem?: (itemId: number, checked: boolean) => void;
  onFireHeldPreorders?: () => void;
  isFiringHeldPreorders?: boolean;
  onCancelOrderItem?: (posOrderItemId: number) => void | Promise<void>;
  cancellingOrderItemId?: number | null;
  onUpdateNewItem?: (
    itemId: string,
    payload: { quantity?: number; remarks?: string | null },
  ) => void;
  onRemoveNewItem?: (itemId: string) => void;
  onSubmitPendingOrder?: () => void | Promise<void>;
  hasPendingOrderItems?: boolean;
  isSubmittingPendingOrder?: boolean;
  onToggleExpedite?: (order: OrderItem) => void | Promise<void>;
  onConfirmBatchExpedite?: (orders: OrderItem[]) => void | Promise<void>;
  onConfirmBatchServed?: (orders: OrderItem[]) => void | Promise<void>;
  togglingExpediteOrderId?: string | null;
  isConfirmingBatchExpedite?: boolean;
  isConfirmingBatchServed?: boolean;
  onMarkServed?: (posOrderItemId: number) => void | Promise<void>;
  markingServedItemId?: number | null;
  menuContent?: ReactNode;
}

export function POSBookingDetail({
  bookingNo,
  onBack,
  booking: bookingProp,
  isWalkIn = false,
  onCheckoutClick,
  onClearWalkIn,
  isClearingWalkIn = false,
  isLoading = false,
  heldPreorderItems = [],
  selectedHeldItems = [],
  onToggleHeldItem,
  onFireHeldPreorders,
  isFiringHeldPreorders = false,
  onCancelOrderItem,
  cancellingOrderItemId = null,
  onUpdateNewItem,
  onRemoveNewItem,
  onSubmitPendingOrder,
  hasPendingOrderItems = false,
  isSubmittingPendingOrder = false,
  onToggleExpedite,
  onConfirmBatchExpedite,
  onConfirmBatchServed,
  togglingExpediteOrderId = null,
  isConfirmingBatchExpedite = false,
  isConfirmingBatchServed = false,
  onMarkServed,
  markingServedItemId = null,
  menuContent = null,
}: POSBookingDetailFullProps) {
  const { t } = useTranslation();
  const booking = bookingProp ?? generateMockBooking(bookingNo ?? 'A-202603-000001');
  const guests = booking.guests?.length > 0 ? booking.guests : booking.guestProfiles;

  const ticketTotal = useMemo(() => {
    return booking.orders.reduce((sum, order) => {
      if (order.cancelledAt || order.status === 'cancelled' || order.status === 'unserved') {
        return sum;
      }

      if (Number.isFinite(order.total) && order.total > 0) {
        return sum + order.total;
      }

      return sum + Number(order.unitPrice ?? 0) * Number(order.quantity ?? 0);
    }, 0);
  }, [booking.orders]);

  const formattedTicketTotal = `HK$${ticketTotal.toFixed(2)}`;

  const getOrderStatusColor = (status: OrderItem['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'preparing':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'served':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-600 border border-gray-200';
      case 'unserved':
        return 'bg-amber-100 text-amber-800 border border-amber-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMembershipColor = (tier: string) => {
    switch (tier) {
      case 'Gold':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      case 'Platinum':
        return 'bg-slate-100 text-slate-800 border border-slate-300';
      case 'Diamond':
        return 'bg-blue-100 text-blue-800 border border-blue-300';
      case 'Sapphire':
        return 'bg-indigo-100 text-indigo-800 border border-indigo-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getGuestRelationBadgeClass = (relation: GuestProfile['relation']): string => {
    const relationColors: Record<GuestProfile['relation'], string> = {
      'Main Member': 'bg-blue-100 text-blue-800 border border-blue-300',
      'Spouse': 'bg-pink-100 text-pink-800 border border-pink-300',
      'Child': 'bg-green-100 text-green-800 border border-green-300',
      'Companion': 'bg-purple-100 text-purple-800 border border-purple-300',
      'Guest': 'bg-gray-100 text-gray-800 border border-gray-300',
    };
    return relationColors[relation];
  };

  const getAllergyBadgeClass = (severity: FoodAllergy['severity']): string => {
    switch (severity) {
      case 'Severe':
        return 'bg-red-100 text-red-800 border border-red-300';
      case 'Moderate':
        return 'bg-orange-100 text-orange-800 border border-orange-300';
      default:
        return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
    }
  };

  const pendingOrders = booking.orders.filter(o => o.status === 'pending' && !o.isNew).length;
  const preparingOrders = booking.orders.filter(o => o.status === 'preparing').length;
  const servedOrders = booking.orders.filter(o => o.status === 'served').length;

  const formatOrderStatusLabel = (status: OrderItem['status']): string => {
    if (status === 'cancelled') return 'Cancelled';
    if (status === 'unserved') return 'Unserved';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const guestsWithDietaryRecords = guests.filter(
    (guest) => guest.foodAllergies.length > 0 || guest.dietaryRequirements.length > 0,
  );
  const [isContextDetailsOpen, setIsContextDetailsOpen] = useState(false);
  const [isTicketSidebarVisible, setIsTicketSidebarVisible] = useState(true);
  const [mobilePanel, setMobilePanel] = useState<'menu' | 'ticket'>('menu');
  const [batchMode, setBatchMode] = useState<BatchMode>('none');
  const [selectedBatchIds, setSelectedBatchIds] = useState<Set<string>>(new Set());
  const activeOrderCount = booking.orders.filter((order) => !order.cancelledAt).length;
  const ticketItemCount = booking.orders.length;
  const showCancelWalkIn =
    isWalkIn && activeOrderCount === 0 && !hasPendingOrderItems && Boolean(onClearWalkIn);
  const showTicketBottomBarOnMobile = mobilePanel === 'menu';
  const showTicketBottomBarOnDesktop = !isTicketSidebarVisible;
  const isBatchSelectionActive = batchMode !== 'none';

  const expediteEligibleOrders = useMemo(
    () => booking.orders.filter((order) => isOrderItemExpediteSelectable(order)),
    [booking.orders],
  );

  const servedEligibleOrders = useMemo(
    () => booking.orders.filter((order) => isOrderItemServedSelectable(order)),
    [booking.orders],
  );

  const batchEligibleOrders =
    batchMode === 'served' ? servedEligibleOrders : expediteEligibleOrders;

  const showBatchActions =
    (expediteEligibleOrders.length > 0 && Boolean(onConfirmBatchExpedite)) ||
    (servedEligibleOrders.length > 0 && Boolean(onConfirmBatchServed));

  const exitBatchMode = () => {
    setBatchMode('none');
    setSelectedBatchIds(new Set());
  };

  const toggleBatchSelection = (orderId: string) => {
    setSelectedBatchIds((previous) => {
      const next = new Set(previous);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const selectAllEligibleForBatch = () => {
    setSelectedBatchIds(new Set(batchEligibleOrders.map((order) => order.id)));
  };

  const handleConfirmBatchExpedite = async () => {
    const selected = expediteEligibleOrders.filter((order) => selectedBatchIds.has(order.id));
    if (selected.length === 0 || !onConfirmBatchExpedite) {
      return;
    }
    await onConfirmBatchExpedite(selected);
    exitBatchMode();
  };

  const handleConfirmBatchServed = async () => {
    const selected = servedEligibleOrders.filter((order) => selectedBatchIds.has(order.id));
    if (selected.length === 0 || !onConfirmBatchServed) {
      return;
    }
    await onConfirmBatchServed(selected);
    exitBatchMode();
  };

  const openTicketPanel = () => {
    setIsTicketSidebarVisible(true);
    setMobilePanel('ticket');
  };

  const ticketPanelBody = (
    <>
      <div className="p-3 border-b border-gray-200 shrink-0">
        <div className="grid grid-cols-3 gap-1.5 mb-2">
          <div className="rounded border border-green-200 bg-green-50 px-2 py-1">
            <p className="text-[10px] font-medium text-green-700 leading-tight">Served</p>
            <p className="text-base font-semibold text-green-900 leading-tight">{servedOrders}</p>
          </div>
          <div className="rounded border border-blue-200 bg-blue-50 px-2 py-1">
            <p className="text-[10px] font-medium text-blue-700 leading-tight">Preparing</p>
            <p className="text-base font-semibold text-blue-900 leading-tight">{preparingOrders}</p>
          </div>
          <div className="rounded border border-yellow-200 bg-yellow-50 px-2 py-1">
            <p className="text-[10px] font-medium text-yellow-700 leading-tight">Pending</p>
            <p className="text-base font-semibold text-yellow-900 leading-tight">{pendingOrders}</p>
          </div>
        </div>
        <div className="mb-1 flex flex-col gap-3">
          <div className="flex min-w-0 flex-col">
            <h2 className="truncate text-base font-semibold text-gray-900">{booking.suiteName}</h2>
            <p className="truncate text-sm text-gray-600">{booking.memberName}</p>
            <p className="text-xs text-gray-500">{booking.numberOfGuests} pax</p>
          </div>

          {showBatchActions ? (
            isBatchSelectionActive ? (
              <div className="flex w-full flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex w-full items-center justify-center"
                  onClick={exitBatchMode}
                >
                  {t('pos.cancel', 'Cancel')}
                </Button>
                <div className="flex w-full flex-row gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="flex flex-1 items-center justify-center"
                    onClick={selectAllEligibleForBatch}
                  >
                    {t('pos.select_all_pending', 'Select All Pending')}
                  </Button>
                  {batchMode === 'expedite' ? (
                    <Button
                      type="button"
                      size="sm"
                      className="flex flex-1 items-center justify-center bg-red-600 text-white hover:bg-red-700"
                      disabled={selectedBatchIds.size === 0 || isConfirmingBatchExpedite}
                      onClick={() => void handleConfirmBatchExpedite()}
                    >
                      {isConfirmingBatchExpedite ? (
                        <Loader2 className="mr-1 h-3.5 w-3.5 shrink-0 animate-spin" />
                      ) : (
                        <Flame className="mr-1 h-3.5 w-3.5 shrink-0" />
                      )}
                      <span className="truncate">
                        {t('pos.confirm_expedite', 'Confirm Expedite')}
                        {selectedBatchIds.size > 0 ? ` (${selectedBatchIds.size})` : ''}
                      </span>
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      className="flex flex-1 items-center justify-center bg-green-600 text-white hover:bg-green-700"
                      disabled={selectedBatchIds.size === 0 || isConfirmingBatchServed}
                      onClick={() => void handleConfirmBatchServed()}
                    >
                      {isConfirmingBatchServed ? (
                        <Loader2 className="mr-1 h-3.5 w-3.5 shrink-0 animate-spin" />
                      ) : (
                        <CheckCheck className="mr-1 h-3.5 w-3.5 shrink-0" />
                      )}
                      <span className="truncate">
                        {t('pos.confirm_served', 'Confirm Served')}
                        {selectedBatchIds.size > 0 ? ` (${selectedBatchIds.size})` : ''}
                      </span>
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex w-full flex-row gap-2">
                {expediteEligibleOrders.length > 0 && onConfirmBatchExpedite ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex flex-1 items-center justify-center border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                    onClick={() => {
                      setSelectedBatchIds(new Set());
                      setBatchMode('expedite');
                    }}
                  >
                    <Zap className="mr-1 h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{t('pos.batch_expedite', 'Batch Expedite')}</span>
                  </Button>
                ) : null}
                {servedEligibleOrders.length > 0 && onConfirmBatchServed ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex flex-1 items-center justify-center border-green-600 bg-green-50 text-green-700 hover:bg-green-100"
                    onClick={() => {
                      setSelectedBatchIds(new Set());
                      setBatchMode('served');
                    }}
                  >
                    <CheckCheck className="mr-1 h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{t('pos.batch_served', 'Batch Served')}</span>
                  </Button>
                ) : null}
              </div>
            )
          ) : null}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {!isWalkIn && heldPreorderItems.length > 0 ? (
          <Card className="border border-yellow-200 bg-yellow-50 p-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-yellow-900">
              Held Pre-orders (Guest not yet arrived / Ready to fire)
            </h3>
            <ul className="mt-2 space-y-1">
              {heldPreorderItems.map((item, index) => {
                const trimmedRemarks = (item.remarks ?? '').trim();
                const itemId = item.id ?? item.pos_menu_item_id;
                const isSelectable = typeof itemId === 'number';
                const isChecked = isSelectable && selectedHeldItems.includes(itemId);

                return (
                  <li
                    key={`${item.name_en ?? 'item'}-${item.remarks ?? ''}-${index}`}
                    className="flex items-start justify-between gap-3 rounded-md border border-yellow-200 bg-white/70 px-2 py-1.5 text-xs"
                  >
                    <Checkbox
                      className="mt-0.5"
                      checked={isChecked}
                      disabled={isFiringHeldPreorders}
                      onCheckedChange={(checked) => {
                        if (!isSelectable) {
                          return;
                        }
                        onToggleHeldItem?.(itemId, checked === true);
                      }}
                      aria-label={`Select held item ${item.name_en ?? 'item'}`}
                    />
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-gray-900">{item.name_en ?? '—'}</span>
                      {trimmedRemarks ? (
                        <div className="mt-1.5 flex">
                          <span className="inline-flex max-w-full items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">
                            <Pencil className="h-3 w-3 shrink-0" strokeWidth={2.5} aria-hidden />
                            <span className="line-clamp-2">{trimmedRemarks}</span>
                          </span>
                        </div>
                      ) : null}
                    </div>
                    <span className="shrink-0 text-gray-600">x{item.quantity}</span>
                  </li>
                );
              })}
            </ul>
            <Button
              type="button"
              size="sm"
              className="mt-2 w-full bg-amber-600 text-white hover:bg-amber-700"
              onClick={onFireHeldPreorders}
              disabled={isFiringHeldPreorders || !onFireHeldPreorders || selectedHeldItems.length === 0}
            >
              {isFiringHeldPreorders ? 'Sending to kitchen...' : 'Send Held Pre-orders to Kitchen'}
            </Button>
          </Card>
        ) : null}

        {booking.orders.length === 0 && (isWalkIn || heldPreorderItems.length === 0) ? (
          <p className="text-sm text-gray-400 text-center py-6">No order items yet.</p>
        ) : (
          booking.orders.map((order) => {
            const isCancelled = Boolean(order.cancelledAt)
              || order.status === 'cancelled'
              || order.status === 'unserved';

            return (
              <TicketOrderItemRow
                key={order.id}
                order={order}
                isCancelled={isCancelled}
                statusBadgeClass={getOrderStatusColor(order.status)}
                statusLabel={formatOrderStatusLabel(order.status)}
                selectionMode={isBatchSelectionActive}
                selectionPurpose={batchMode === 'served' ? 'served' : 'expedite'}
                isSelected={selectedBatchIds.has(order.id)}
                onToggleSelect={toggleBatchSelection}
                onCancelOrderItem={onCancelOrderItem}
                cancellingOrderItemId={cancellingOrderItemId}
                onUpdateNewItem={onUpdateNewItem}
                onRemoveNewItem={onRemoveNewItem}
                onToggleExpedite={onToggleExpedite}
                isTogglingExpedite={togglingExpediteOrderId === order.id}
                onMarkServed={onMarkServed}
                isMarkingServed={markingServedItemId === order.posOrderItemId}
              />
            );
          })
        )}
      </div>

      <div className="border-t border-gray-200 p-3 shrink-0 bg-white space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Total Amount</span>
          <span className="text-xl font-bold text-purple-700">
            {formattedTicketTotal}
          </span>
        </div>
        <div className="mt-2 flex w-full flex-col gap-2">
          <Button type="button" variant="outline" className="w-full border-gray-300 text-gray-700">
            Print Bill
          </Button>
          {hasPendingOrderItems && onSubmitPendingOrder ? (
            <Button
              type="button"
              className="w-full bg-green-600 py-3 text-base font-bold text-white shadow hover:bg-green-700"
              disabled={isSubmittingPendingOrder}
              onClick={() => void onSubmitPendingOrder()}
            >
              {isSubmittingPendingOrder ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Utensils className="mr-1.5 h-4 w-4" />
                  Send to Kitchen
                </>
              )}
            </Button>
          ) : null}
        </div>
      </div>
    </>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-gray-100">
      <div className="shrink-0 border-b border-gray-200 bg-gray-100 px-2 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="outline" onClick={onBack} size="sm" className="w-fit shrink-0">
                <ArrowLeft className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex items-center gap-1 rounded-full border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 shadow-sm hover:bg-purple-100"
                onClick={() => {
                  if (isTicketSidebarVisible) {
                    setIsTicketSidebarVisible(false);
                    setMobilePanel('menu');
                  } else {
                    openTicketPanel();
                  }
                }}
                aria-pressed={isTicketSidebarVisible}
              >
                {isTicketSidebarVisible ? (
                  <>
                    <PanelLeftClose className="h-4 w-4" />
                    <span>Hide Ticket</span>
                  </>
                ) : (
                  <>
                    <PanelLeftOpen className="h-4 w-4" />
                    <span>View Ticket</span>
                  </>
                )}
              </Button>
            </div>
            <h1 className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900 sm:text-base">
              <span className="lg:hidden">{booking.bookingNo}</span>
              <span className="hidden lg:inline">POS Booking Details {booking.bookingNo}</span>
            </h1>
          </div>
          {showCancelWalkIn ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
              onClick={() => void onClearWalkIn?.()}
              disabled={isClearingWalkIn}
            >
              {isClearingWalkIn ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Clearing...
                </>
              ) : (
                'Cancel Walk-in'
              )}
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              className="shrink-0 bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-700"
              onClick={onCheckoutClick}
            >
              Checkout
            </Button>
          )}
        </div>
      </div>

      <div
        className={`flex flex-1 min-h-0 overflow-hidden flex-col lg:flex-row ${
          showTicketBottomBarOnMobile ? 'pb-24 lg:pb-0' : ''
        } ${showTicketBottomBarOnDesktop ? 'lg:pb-24' : ''}`}
      >
        {!isTicketSidebarVisible ? null : (
          <div className="hidden lg:flex w-[350px] flex-shrink-0 flex-col bg-white border-r">
            {ticketPanelBody}
          </div>
        )}

        <div
          className={`${mobilePanel === 'ticket' ? 'flex' : 'hidden'} lg:hidden flex-1 min-h-0 flex-col bg-white border-r`}
        >
          {ticketPanelBody}
        </div>

        <div
          className={`${mobilePanel === 'menu' ? 'flex' : 'hidden'} lg:flex flex-1 flex-col min-h-0 overflow-hidden bg-gray-50 min-w-0`}
        >
          <div className="shrink-0 p-3 flex flex-col gap-3">

          {!isWalkIn && guestsWithDietaryRecords.length > 0 ? (
            <div className="bg-red-50 border-l-4 border-red-500 px-3 py-2 shadow-sm rounded-r-lg shrink-0">
              <div className="flex items-center gap-1.5 mb-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <h3 className="text-xs font-semibold text-red-800 uppercase tracking-wide">
                  Food Allergies &amp; Dietary
                </h3>
              </div>
              <div className="space-y-2">
                {guestsWithDietaryRecords.map((guest) => (
                  <div
                    key={guest.guestId}
                    className="grid grid-cols-1 md:grid-cols-[minmax(110px,1fr)_1fr_1fr] gap-2 md:gap-3 py-2 border-b border-red-100 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">{guest.name}</p>
                      <Badge className={`mt-1 text-xs ${getGuestRelationBadgeClass(guest.relation)}`}>
                        {guest.relation}
                      </Badge>
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">
                        Food Allergies
                      </p>
                      {guest.foodAllergies.length > 0 ? (
                        <>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {guest.foodAllergies.map((allergy) => (
                              <span
                                key={allergy.id}
                                className={`inline-flex items-center rounded-full text-xs px-2 py-0.5 font-medium ${getAllergyBadgeClass(allergy.severity)}`}
                              >
                                {allergy.allergen}
                                {allergy.severity === 'Severe' ? ' ⚠' : ''}
                              </span>
                            ))}
                          </div>
                          <div className="mt-1 space-y-0.5">
                            {guest.foodAllergies
                              .filter((allergy) => allergy.notes)
                              .map((allergy) => (
                                <p key={`note-${allergy.id}`} className="text-xs text-gray-500 italic">
                                  {allergy.allergen}: {allergy.notes}
                                </p>
                              ))}
                          </div>
                        </>
                      ) : (
                        <p className="mt-1 text-xs text-gray-400">None recorded</p>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                        Dietary Requirements
                      </p>
                      {guest.dietaryRequirements.length > 0 ? (
                        <>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {guest.dietaryRequirements.map((dietary) => (
                              <span
                                key={dietary.id}
                                className="inline-flex items-center rounded-full bg-green-100 text-green-800 border border-green-300 text-xs px-2 py-0.5 font-medium"
                              >
                                {dietary.requirement}
                              </span>
                            ))}
                          </div>
                          <div className="mt-1 space-y-0.5">
                            {guest.dietaryRequirements
                              .filter((dietary) => dietary.notes)
                              .map((dietary) => (
                                <p key={`note-${dietary.id}`} className="text-xs text-gray-500 italic">
                                  {dietary.requirement}: {dietary.notes}
                                </p>
                              ))}
                          </div>
                        </>
                      ) : (
                        <p className="mt-1 text-xs text-gray-400">None recorded</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setIsContextDetailsOpen((open) => !open)}
            className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-left shadow-sm hover:bg-gray-50 transition-colors"
            aria-expanded={isContextDetailsOpen}
          >
            <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">
              Member, Booking &amp; Payment Details
            </span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${isContextDetailsOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {isContextDetailsOpen ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {!isWalkIn ? (
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="flex items-center gap-1.5 mb-1.5">
                <User className="w-3.5 h-3.5 text-gray-400" />
                <h3 className="text-xs uppercase tracking-wide text-gray-500 font-medium">Member</h3>
              </div>
              <dl className="space-y-1">
                <div>
                  <dt className="text-xs text-gray-500">Name</dt>
                  <dd className="text-sm font-medium text-gray-900">{booking.memberName}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Account Number</dt>
                  <dd className="text-sm font-medium text-gray-900">{booking.accountNo}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Account Type</dt>
                  <dd className="text-sm font-medium text-gray-900">{booking.accountType}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Membership Tier</dt>
                  <dd>
                    <Badge className={`text-xs px-1.5 py-0 ${getMembershipColor(booking.membershipTier)}`}>
                      {booking.membershipTier}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Company</dt>
                  <dd className="text-sm font-medium text-gray-900">{booking.companyName || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Email</dt>
                  <dd className="text-sm font-medium text-gray-900 truncate">{booking.email}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Phone</dt>
                  <dd className="text-sm font-medium text-gray-900">{booking.phone}</dd>
                </div>
              </dl>
            </div>
            ) : (
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="flex items-center gap-1.5 mb-1.5">
                <User className="w-3.5 h-3.5 text-gray-400" />
                <h3 className="text-xs uppercase tracking-wide text-gray-500 font-medium">Walk-in Guest</h3>
              </div>
              <dl className="space-y-1">
                <div>
                  <dt className="text-xs text-gray-500">Label</dt>
                  <dd className="text-sm font-medium text-gray-900">{booking.memberName}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Number of Guests</dt>
                  <dd className="text-sm font-medium text-gray-900">{booking.numberOfGuests} pax</dd>
                </div>
              </dl>
            </div>
            )}

            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="flex items-center gap-1.5 mb-1.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                <h3 className="text-xs uppercase tracking-wide text-gray-500 font-medium">
                  {isWalkIn ? 'Walk-in Session' : 'Booking'}
                </h3>
              </div>
              <dl className="space-y-1">
                <div>
                  <dt className="text-xs text-gray-500">Suite</dt>
                  <dd className="text-sm font-medium text-gray-900">{booking.suiteName}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Check-in Time</dt>
                  <dd className="text-sm font-medium text-gray-900">{booking.checkInTime || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Number of Guests</dt>
                  <dd className="text-sm font-medium text-gray-900">{booking.numberOfGuests} pax</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Flight Number</dt>
                  <dd className="text-sm font-medium text-gray-900">{booking.flightNo || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Flight Time</dt>
                  <dd className="text-sm font-medium text-gray-900">{booking.flightTime || '—'}</dd>
                </div>
                {!isWalkIn ? (
                <div>
                  <dt className="text-xs text-gray-500">Destination</dt>
                  <dd className="text-sm font-medium text-gray-900">{booking.flightDestination}</dd>
                </div>
                ) : null}
              </dl>
            </div>

            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="flex items-center gap-1.5 mb-1.5">
                <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                <h3 className="text-xs uppercase tracking-wide text-gray-500 font-medium">Payment</h3>
              </div>
              <dl className="space-y-1">
                <div>
                  <dt className="text-xs text-gray-500">Payment Mode</dt>
                  <dd className="text-sm font-medium text-gray-900">{booking.paymentMode || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Payment Status</dt>
                  <dd>
                    <Badge className="bg-green-100 text-green-800 border border-green-200 text-xs px-1.5 py-0">
                      {booking.paymentStatus || '—'}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Total Amount</dt>
                  <dd className="text-sm font-medium text-gray-900">{formattedTicketTotal}</dd>
                </div>
                {!isWalkIn ? (
                <div>
                  <dt className="text-xs text-gray-500">Credit Balance</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {booking.creditBalance !== undefined
                      ? `HK$${booking.creditBalance.toLocaleString()}`
                      : '—'}
                  </dd>
                </div>
                ) : null}
              </dl>
            </div>
          </div>
          ) : null}
          </div>

          {menuContent ? (
            <div className="flex-1 min-h-0 overflow-y-auto border-t border-gray-200 bg-white px-3 py-3">
              {menuContent}
            </div>
          ) : null}
        </div>
      </div>

      {(showTicketBottomBarOnMobile || showTicketBottomBarOnDesktop) ? (
        <div
          className={`fixed bottom-[52px] left-0 right-0 z-40 flex items-center justify-between border-t border-gray-200 bg-white px-6 py-4 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] lg:bottom-0 ${
            showTicketBottomBarOnMobile ? 'flex' : 'hidden'
          } ${showTicketBottomBarOnDesktop ? 'lg:flex' : 'lg:hidden'}`}
        >
          <button
            type="button"
            onClick={openTicketPanel}
            className="rounded-lg bg-gray-100 px-4 py-2 font-semibold text-gray-800 shadow-sm"
          >
            🛒 View Ticket ({ticketItemCount} items)
          </button>
          <div className="flex items-center">
            <span className="mr-6 text-2xl font-bold text-purple-700">
              {formattedTicketTotal}
            </span>
            <button
              type="button"
              onClick={showCancelWalkIn ? () => void onClearWalkIn?.() : onCheckoutClick}
              disabled={showCancelWalkIn && isClearingWalkIn}
              className={`rounded-lg px-8 py-3 text-lg font-bold text-white shadow-md ${
                showCancelWalkIn
                  ? 'bg-red-600 hover:bg-red-700 disabled:opacity-50'
                  : 'bg-purple-700 hover:bg-purple-800'
              }`}
            >
              {showCancelWalkIn
                ? (isClearingWalkIn ? 'Clearing...' : 'Cancel Walk-in')
                : 'Checkout'}
            </button>
          </div>
        </div>
      ) : null}

      <nav className="shrink-0 border-t border-gray-200 bg-white lg:hidden" aria-label="POS panels">
        <div className="grid grid-cols-2">
          <button
            type="button"
            onClick={() => setMobilePanel('menu')}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-2.5 text-xs font-medium transition-colors ${
              mobilePanel === 'menu'
                ? 'bg-purple-50 text-purple-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            aria-current={mobilePanel === 'menu' ? 'page' : undefined}
          >
            <Utensils className="h-5 w-5" />
            Menu
          </button>
          <button
            type="button"
            onClick={() => setMobilePanel('ticket')}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-2.5 text-xs font-medium transition-colors ${
              mobilePanel === 'ticket'
                ? 'bg-purple-50 text-purple-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            aria-current={mobilePanel === 'ticket' ? 'page' : undefined}
          >
            <PanelLeftOpen className="h-5 w-5" />
            <span className="flex items-center gap-1.5">
              Ticket
              {activeOrderCount > 0 ? (
                <span className="rounded-full bg-purple-700 px-1.5 py-0.5 text-[10px] font-semibold text-white tabular-nums">
                  {activeOrderCount}
                </span>
              ) : null}
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
}