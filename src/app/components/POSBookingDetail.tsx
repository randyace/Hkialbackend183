import { ArrowLeft, User, CreditCard, Utensils, MapPin, AlertCircle, X, Loader2, ChevronDown, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface OrderItem {
  id: string;
  posOrderItemId?: number;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  total: number;
  status: 'pending' | 'preparing' | 'served' | 'cancelled';
  orderTime: string;
  servedTime?: string;
  cancelledAt?: string | null;
  isNew?: boolean;
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

export interface POSBookingDetailFullProps extends POSBookingDetailProps {
  /** Pass fully-loaded booking from CI4; when null falls back to MOCK_BOOKING_DETAIL */
  booking?: POSBooking | null;
  onCheckout?: (paymentData: { method: string }) => void;
  onCheckoutClick?: () => void;
  isLoading?: boolean;
  heldPreorderItems?: Array<{
    name_en?: string | null;
    quantity: number;
  }>;
  onFireHeldPreorders?: () => void;
  isFiringHeldPreorders?: boolean;
  onCancelOrderItem?: (posOrderItemId: number) => void | Promise<void>;
  cancellingOrderItemId?: number | null;
  onRemoveNewItem?: (itemId: string) => void;
  onSubmitPendingOrder?: () => void | Promise<void>;
  hasPendingOrderItems?: boolean;
  isSubmittingPendingOrder?: boolean;
  menuContent?: ReactNode;
}

export function POSBookingDetail({
  bookingNo,
  onBack,
  booking: bookingProp,
  onCheckoutClick,
  isLoading = false,
  heldPreorderItems = [],
  onFireHeldPreorders,
  isFiringHeldPreorders = false,
  onCancelOrderItem,
  cancellingOrderItemId = null,
  onRemoveNewItem,
  onSubmitPendingOrder,
  hasPendingOrderItems = false,
  isSubmittingPendingOrder = false,
  menuContent = null,
}: POSBookingDetailFullProps) {
  const booking = bookingProp ?? generateMockBooking(bookingNo ?? 'A-202603-000001');
  const guests = booking.guests?.length > 0 ? booking.guests : booking.guestProfiles;

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
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const guestsWithDietaryRecords = guests.filter(
    (guest) => guest.foodAllergies.length > 0 || guest.dietaryRequirements.length > 0,
  );
  const [isContextDetailsOpen, setIsContextDetailsOpen] = useState(false);
  const [isTicketSidebarVisible, setIsTicketSidebarVisible] = useState(true);
  const [mobilePanel, setMobilePanel] = useState<'menu' | 'ticket'>('menu');
  const activeOrderCount = booking.orders.filter((order) => !order.cancelledAt).length;
  const ticketItemCount = booking.orders.length;
  const showTicketBottomBarOnMobile = mobilePanel === 'menu';
  const showTicketBottomBarOnDesktop = !isTicketSidebarVisible;

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
        <h2 className="text-base font-semibold text-gray-900">{booking.suiteName}</h2>
        <p className="text-sm text-gray-600">{booking.memberName}</p>
        <p className="text-xs text-gray-500">{booking.numberOfGuests} pax</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {booking.orders.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No order items yet.</p>
        ) : (
          booking.orders.map((order) => {
            const isCancelled = Boolean(order.cancelledAt);

            return (
              <div
                key={order.id}
                className={`flex items-center gap-2 rounded-lg border py-2 px-3 ${
                  isCancelled ? 'border-gray-200 bg-gray-50' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${isCancelled ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                    {order.name}
                  </p>
                  {order.id ? (
                    <p className={`text-xs text-gray-400 truncate ${isCancelled ? 'line-through' : ''}`}>
                      {order.id}
                    </p>
                  ) : null}
                </div>
                <span className={`text-sm tabular-nums shrink-0 ${isCancelled ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                  x{order.quantity}
                </span>
                {order.isNew ? (
                  <Badge className="shrink-0 text-xs bg-blue-100 text-blue-800 border border-blue-200">
                    New
                  </Badge>
                ) : (
                  <Badge className={`shrink-0 text-xs ${getOrderStatusColor(order.status)}`}>
                    {formatOrderStatusLabel(order.status)}
                  </Badge>
                )}
                {order.isNew && onRemoveNewItem ? (
                  <button
                    type="button"
                    aria-label={`Remove ${order.name}`}
                    className="shrink-0 p-2 rounded-md text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                    onClick={() => onRemoveNewItem(order.id)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : !isCancelled && order.posOrderItemId && onCancelOrderItem ? (
                  <button
                    type="button"
                    aria-label={`Cancel ${order.name}`}
                    className="shrink-0 p-2 rounded-md text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={cancellingOrderItemId === order.posOrderItemId}
                    onClick={() => void onCancelOrderItem(order.posOrderItemId!)}
                  >
                    {cancellingOrderItemId === order.posOrderItemId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </button>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-gray-200 p-3 shrink-0 bg-white space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Total Amount</span>
          <span className="text-xl font-bold text-purple-700">
            HK${booking.totalAmount.toLocaleString()}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasPendingOrderItems && onSubmitPendingOrder ? (
            <Button
              className="inline-flex items-center px-4 py-2 text-sm bg-green-600 text-white rounded-md shadow hover:bg-green-700"
              disabled={isSubmittingPendingOrder}
              onClick={() => void onSubmitPendingOrder()}
            >
              {isSubmittingPendingOrder ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Utensils className="w-4 h-4 mr-1.5" />
                  Send to Kitchen
                </>
              )}
            </Button>
          ) : null}
          <Button variant="outline" className="flex-1 min-w-[90px]">
            Print Bill
          </Button>
          <Button className="flex-1 min-w-[90px] bg-purple-700 hover:bg-purple-800 text-white" onClick={onCheckoutClick}>
            Checkout
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-gray-100">
      <div className="shrink-0 border-b border-gray-200 bg-gray-100 px-2 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" onClick={onBack} size="sm" className="w-fit shrink-0">
              <ArrowLeft className="w-4 h-4 sm:mr-1" />
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
          <h1 className="min-w-0 flex-1 text-sm font-semibold text-gray-900 truncate text-right sm:text-base sm:text-left">
            <span className="lg:hidden">{booking.bookingNo}</span>
            <span className="hidden lg:inline">POS Booking Details {booking.bookingNo}</span>
          </h1>
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

          {guestsWithDietaryRecords.length > 0 ? (
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

          {heldPreorderItems.length > 0 ? (
            <Card className="border border-yellow-200 bg-yellow-50 p-3 shrink-0">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-yellow-900">
                Held Pre-orders (Guest not yet arrived / Ready to fire)
              </h3>
              <ul className="mt-2 space-y-1">
                {heldPreorderItems.map((item, index) => (
                  <li
                    key={`${item.name_en ?? 'item'}-${index}`}
                    className="flex items-center justify-between rounded-md border border-yellow-200 bg-white/70 px-2 py-1.5 text-xs"
                  >
                    <span className="font-medium text-gray-900">{item.name_en ?? '—'}</span>
                    <span className="text-gray-600">x{item.quantity}</span>
                  </li>
                ))}
              </ul>
              <Button
                type="button"
                size="sm"
                className="mt-2 w-full bg-amber-600 text-white hover:bg-amber-700"
                onClick={onFireHeldPreorders}
                disabled={isFiringHeldPreorders || !onFireHeldPreorders}
              >
                {isFiringHeldPreorders ? 'Sending to kitchen...' : 'Send Held Pre-orders to Kitchen'}
              </Button>
            </Card>
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
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

            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="flex items-center gap-1.5 mb-1.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                <h3 className="text-xs uppercase tracking-wide text-gray-500 font-medium">Booking</h3>
              </div>
              <dl className="space-y-1">
                <div>
                  <dt className="text-xs text-gray-500">Suite</dt>
                  <dd className="text-sm font-medium text-gray-900">{booking.suiteName}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Check-in Time</dt>
                  <dd className="text-sm font-medium text-gray-900">{booking.checkInTime}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Number of Guests</dt>
                  <dd className="text-sm font-medium text-gray-900">{booking.numberOfGuests} pax</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Flight Number</dt>
                  <dd className="text-sm font-medium text-gray-900">{booking.flightNo}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Flight Time</dt>
                  <dd className="text-sm font-medium text-gray-900">{booking.flightTime}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Destination</dt>
                  <dd className="text-sm font-medium text-gray-900">{booking.flightDestination}</dd>
                </div>
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
                  <dd className="text-sm font-medium text-gray-900">{booking.paymentMode}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Payment Status</dt>
                  <dd>
                    <Badge className="bg-green-100 text-green-800 border border-green-200 text-xs px-1.5 py-0">
                      {booking.paymentStatus}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Total Amount</dt>
                  <dd className="text-sm font-medium text-gray-900">HK${booking.totalAmount.toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Credit Balance</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {booking.creditBalance !== undefined
                      ? `HK$${booking.creditBalance.toLocaleString()}`
                      : '—'}
                  </dd>
                </div>
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
              HK${booking.totalAmount.toLocaleString()}
            </span>
            <button
              type="button"
              onClick={onCheckoutClick}
              className="rounded-lg bg-purple-700 px-8 py-3 text-lg font-bold text-white shadow-md hover:bg-purple-800"
            >
              Checkout
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