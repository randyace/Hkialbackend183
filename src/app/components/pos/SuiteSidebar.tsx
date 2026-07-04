import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Armchair,
  Building2,
  Clock,
  Heart,
  Loader2,
  Plane,
  ShoppingCart,
  User,
  Users,
  X,
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  posBookingService,
  type PosOccupiedDetails,
  type PosOccupiedGuest,
  type PosReservedDetails,
  type PosSiblingSuite,
  type PosUnassignedBooking,
} from '@/services/posBookingService';
import { MergeCheckoutModal } from '@/components/common/MergeCheckoutModal';
import { getApiErrorMessage } from '@/lib/api/errors';
import { toast } from 'sonner';

type SidebarView =
  | 'LIST'
  | 'PREORDER_CONFIRM'
  | 'ASSIGN_CONFIRM'
  | 'MULTI_ASSIGN_VIEW'
  | 'OCCUPIED_VIEW'
  | 'RESERVED_VIEW'
  | 'CLEANING_VIEW';

export interface SuiteSidebarProps {
  suiteId: number;
  suiteName: string;
  suiteStatus: string;
  onClose: () => void;
  onStatusChange?: () => void;
  selectedSuiteIdsForAssignment?: number[];
  suiteNamesById?: Map<number, string>;
  onStartMultiAssign?: () => void;
  onExitMultiAssign?: () => void;
  onMultiAssignComplete?: () => void | Promise<void>;
}

function formatCheckInTime(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function getAllergyLabel(allergy: { allergen?: string }): string {
  return allergy.allergen?.trim() || '—';
}

function getDietaryLabel(dietary: { requirement?: string }): string {
  return dietary.requirement?.trim() || '—';
}

function getGuestRoleBadge(guest: PosOccupiedGuest, index: number, guests: PosOccupiedGuest[]): string | null {
  if (guest.is_main_member) return 'Main Member';
  const mainIndex = guests.findIndex((g) => g.is_main_member);
  if (mainIndex >= 0 && index === mainIndex + 1) return 'Spouse';
  return null;
}

function formatResourceCount(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function renderBookingResourceCounts(booking: Pick<PosUnassignedBooking, 'suite_count' | 'lounge_count'>) {
  const items: Array<{ key: string; icon: typeof Building2; label: string }> = [];

  if (booking.suite_count > 0) {
    items.push({
      key: 'suite',
      icon: Building2,
      label: formatResourceCount(booking.suite_count, 'suite', 'suites'),
    });
  }

  if (booking.lounge_count > 0) {
    items.push({
      key: 'lounge',
      icon: Armchair,
      label: formatResourceCount(booking.lounge_count, 'lounge', 'lounges'),
    });
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
      {items.map(({ key, icon: Icon, label }) => (
        <span key={key} className="inline-flex items-center gap-1">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </span>
      ))}
    </div>
  );
}

function bookingRequiresMultipleAssignments(booking: PosUnassignedBooking): boolean {
  return booking.suite_count + booking.lounge_count > 1;
}

export function SuiteSidebar({
  suiteId,
  suiteName,
  suiteStatus,
  onClose,
  onStatusChange,
  selectedSuiteIdsForAssignment = [],
  suiteNamesById = new Map(),
  onStartMultiAssign,
  onExitMultiAssign,
  onMultiAssignComplete,
}: SuiteSidebarProps) {
  const navigate = useNavigate();
  const [view, setView] = useState<SidebarView>('LIST');
  const [selectedBooking, setSelectedBooking] = useState<PosUnassignedBooking | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isFinishingCleaning, setIsFinishingCleaning] = useState(false);
  const [occupiedDetails, setOccupiedDetails] = useState<PosOccupiedDetails | null>(null);
  const [isLoadingOccupied, setIsLoadingOccupied] = useState(false);
  const [occupiedError, setOccupiedError] = useState(false);
  const [reservedDetails, setReservedDetails] = useState<PosReservedDetails | null>(null);
  const [isLoadingReserved, setIsLoadingReserved] = useState(false);
  const [reservedError, setReservedError] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [siblingSuitesData, setSiblingSuitesData] = useState<PosSiblingSuite[]>([]);

  const isOccupied = suiteStatus === 'occupied';
  const isReserved = suiteStatus === 'reserved';
  const isCleaning = suiteStatus === 'cleaning';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['pos-unassigned-bookings'],
    queryFn: () => posBookingService.getUnassignedToday(),
    enabled: !isOccupied && !isReserved && !isCleaning,
  });

  const unassignedBookings = data?.data ?? [];

  useEffect(() => {
    setSelectedBooking(null);
    setServiceSearch('');
    setOccupiedDetails(null);
    setOccupiedError(false);
    setReservedDetails(null);
    setReservedError(false);

    if (suiteStatus === 'occupied') {
      setView('OCCUPIED_VIEW');
    } else if (suiteStatus === 'reserved') {
      setView('RESERVED_VIEW');
    } else if (suiteStatus === 'cleaning') {
      setView('CLEANING_VIEW');
    } else {
      setView('LIST');
    }
  }, [suiteId, suiteStatus]);

  useEffect(() => {
    if (suiteStatus !== 'reserved') {
      return;
    }

    let cancelled = false;
    setIsLoadingReserved(true);
    setReservedError(false);

    posBookingService
      .getReservedDetails(suiteId)
      .then((response) => {
        if (!cancelled) {
          setReservedDetails(response.data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setReservedError(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingReserved(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [suiteId, suiteStatus]);

  useEffect(() => {
    if (suiteStatus !== 'occupied') {
      return;
    }

    let cancelled = false;
    setIsLoadingOccupied(true);
    setOccupiedError(false);

    posBookingService
      .getOccupiedDetails(suiteId)
      .then((response) => {
        if (!cancelled) {
          setOccupiedDetails(response.data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOccupiedError(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingOccupied(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [suiteId, suiteStatus]);

  const goToOrder = (bookingId?: number) => {
    const path = bookingId
      ? `/pos/order/${suiteId}?booking_id=${bookingId}`
      : `/pos/order/${suiteId}`;
    navigate(path);
  };

  const handleBookingClick = (booking: PosUnassignedBooking) => {
    setSelectedBooking(booking);

    if (bookingRequiresMultipleAssignments(booking)) {
      onStartMultiAssign?.();
      setView('MULTI_ASSIGN_VIEW');
      return;
    }

    setView(booking.has_preorder ? 'PREORDER_CONFIRM' : 'ASSIGN_CONFIRM');
  };

  const handleSendToKitchen = async () => {
    if (!selectedBooking) return;
    console.log('Print job sent');
    setIsAssigning(true);
    try {
      await posBookingService.assignBookingToSuite(selectedBooking.id, suiteId);
      goToOrder(selectedBooking.id);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleAssignBooking = async () => {
    if (!selectedBooking) return;
    setIsAssigning(true);
    try {
      await posBookingService.assignBookingToSuite(selectedBooking.id, suiteId);
      goToOrder(selectedBooking.id);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleConfirmMultiAssign = async () => {
    if (!selectedBooking || selectedSuiteIdsForAssignment.length === 0) return;
    setIsAssigning(true);
    try {
      await posBookingService.assignMultipleSuites(
        selectedBooking.id,
        selectedSuiteIdsForAssignment,
      );
      await onMultiAssignComplete?.();
    } finally {
      setIsAssigning(false);
    }
  };

  const handleCancelMultiAssign = () => {
    onExitMultiAssign?.();
    setView('LIST');
  };

  const handleCreateBooking = async () => {
    setIsAssigning(true);
    try {
      await posBookingService.markSuiteOccupied(suiteId);
      goToOrder();
    } finally {
      setIsAssigning(false);
    }
  };

  const handleCheckout = async () => {
    try {
      const response = await posBookingService.getSiblingSuites(suiteId);
      const siblings = response.data ?? [];

      if (siblings.length === 0) {
        navigate(`/pos/checkout/${suiteId}?merge=false`);
        return;
      }

      setSiblingSuitesData(siblings);
      setIsMergeModalOpen(true);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to check suite assignments.'));
    }
  };

  const handleCloseMergeModal = () => {
    setIsMergeModalOpen(false);
  };

  const handleSelectSingleCheckout = () => {
    setIsMergeModalOpen(false);
    navigate(`/pos/checkout/${suiteId}?merge=false`);
  };

  const handleSelectMergeCheckout = () => {
    setIsMergeModalOpen(false);
    navigate(`/pos/checkout/${suiteId}?merge=true`);
  };

  const handleFinishCleaning = async () => {
    setIsFinishingCleaning(true);
    try {
      await posBookingService.finishCleaning(suiteId);
      onStatusChange?.();
    } finally {
      setIsFinishingCleaning(false);
    }
  };

  const handleCheckIn = async () => {
    setIsCheckingIn(true);
    try {
      await posBookingService.processCheckIn(suiteId);
      navigate(`/pos/order/${suiteId}`);
    } finally {
      setIsCheckingIn(false);
    }
  };

  const displaySuiteName = occupiedDetails?.suite?.name ?? reservedDetails?.suite?.name ?? suiteName;
  const booking = occupiedDetails?.booking;
  const reservedBooking = reservedDetails?.booking;
  const guests = occupiedDetails?.guests ?? reservedDetails?.guests ?? [];
  const orderItems = occupiedDetails?.current_order?.items ?? [];
  const mainGuestName =
    guests.find((guest) => guest.is_main_member)?.guest_name ??
    guests[0]?.guest_name ??
    '—';

  const renderGuestAllergiesSection = (sectionGuests: PosOccupiedGuest[]) => (
    <div className="space-y-3">
      <h3 className="text-sm uppercase tracking-wide text-gray-500">
        Food Allergies &amp; Dietary
      </h3>
      {sectionGuests.length === 0 ? (
        <p className="text-sm text-gray-400">No guest information available.</p>
      ) : (
        <div className="space-y-3">
          {sectionGuests.map((guest, index) => {
            const roleBadge = getGuestRoleBadge(guest, index, sectionGuests);
            const allergies = guest.food_allergies ?? [];
            const dietary = guest.dietary_requirements ?? [];

            return (
              <div
                key={`${guest.guest_name}-${index}`}
                className="rounded-lg border border-gray-200 bg-gray-50/40 p-3"
              >
                <div className="mb-2 flex items-center gap-2">
                  <User className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                  <span className="flex-1 text-sm font-medium text-gray-900">
                    {guest.guest_name}
                  </span>
                  {roleBadge ? (
                    <Badge
                      className={
                        roleBadge === 'Main Member'
                          ? 'border-blue-200 bg-blue-100 text-blue-700 hover:bg-blue-100'
                          : 'border-pink-200 bg-pink-100 text-pink-700 hover:bg-pink-100'
                      }
                    >
                      {roleBadge}
                    </Badge>
                  ) : null}
                </div>

                {allergies.length > 0 ? (
                  <div className="mb-2">
                    <p className="mb-1.5 flex items-center gap-1 text-xs text-gray-500">
                      <AlertTriangle className="h-3 w-3 text-red-500" />
                      Allergies
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {allergies.map((allergy, allergyIndex) => (
                        <span
                          key={`${getAllergyLabel(allergy)}-${allergyIndex}`}
                          className="rounded-full border border-red-200 bg-red-100 px-2 py-0.5 text-xs text-red-800"
                        >
                          {getAllergyLabel(allergy)}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {dietary.length > 0 ? (
                  <div>
                    <p className="mb-1.5 flex items-center gap-1 text-xs text-gray-500">
                      <Heart className="h-3 w-3 text-green-500" />
                      Dietary
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {dietary.map((item, dietaryIndex) => (
                        <span
                          key={`${getDietaryLabel(item)}-${dietaryIndex}`}
                          className="rounded-full border border-green-200 bg-green-100 px-2 py-0.5 text-xs text-green-800"
                        >
                          {getDietaryLabel(item)}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderGuestInformationSection = (
    bookingNumber: string | null | undefined,
    guestName: string,
    checkInTime: string | null | undefined,
    flightNumber: string | null | undefined,
    flightDepartureTime: string | null | undefined,
  ) => (
    <div className="space-y-4">
      <h3 className="text-sm uppercase tracking-wide text-gray-500">Guest Information</h3>
      <div className="space-y-3">
        <div>
          <label className="mb-2 block text-sm text-gray-600">Booking Number</label>
          <p className="text-lg text-gray-900">{bookingNumber ?? '—'}</p>
        </div>
        <div>
          <label className="mb-2 block text-sm text-gray-600">Guest Name</label>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400" />
            <p className="text-lg text-gray-900">{guestName}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm text-gray-600">Check-in Time</label>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <p className="text-sm text-gray-900">{formatCheckInTime(checkInTime)}</p>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm text-gray-600">Flight Number</label>
            <div className="flex items-center gap-2">
              <Plane className="h-4 w-4 text-gray-400" />
              <p className="text-sm text-gray-900">{flightNumber ?? '—'}</p>
            </div>
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm text-gray-600">Flight Departure Time</label>
          <p className="text-lg text-blue-600">{flightDepartureTime ?? '—'}</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
    <aside className="fixed bottom-0 right-0 top-14 z-30 flex w-[380px] flex-col border-l border-gray-200 bg-white shadow-lg">
      <div className="shrink-0 border-b border-gray-200 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {view === 'OCCUPIED_VIEW' ? (
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-lg font-semibold text-gray-900">{displaySuiteName}</h2>
                <Badge className="border-red-200 bg-red-100 text-red-800 hover:bg-red-100">
                  Occupied
                </Badge>
              </div>
            ) : view === 'CLEANING_VIEW' ? (
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-lg font-semibold text-gray-900">{suiteName}</h2>
                <Badge className="border-orange-200 bg-orange-100 text-orange-800 hover:bg-orange-100">
                  Cleaning
                </Badge>
              </div>
            ) : view === 'RESERVED_VIEW' ? (
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-lg font-semibold text-gray-900">
                  {reservedDetails?.suite?.name ?? suiteName}
                </h2>
                <Badge className="border-blue-200 bg-blue-100 text-blue-700 hover:bg-blue-100">
                  Reserved
                </Badge>
              </div>
            ) : view === 'LIST' ? (
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-lg font-semibold text-gray-900">{suiteName}</h2>
                <Badge className="border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                  Available
                </Badge>
              </div>
            ) : view === 'PREORDER_CONFIRM' ? (
              <h2 className="text-lg font-semibold text-gray-900">Send Pre-order to Kitchen?</h2>
            ) : view === 'MULTI_ASSIGN_VIEW' ? (
              <h2 className="text-lg font-semibold text-gray-900">Assign Multiple Suites</h2>
            ) : (
              <h2 className="text-lg font-semibold text-gray-900">Assign Booking to Suite</h2>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {view === 'CLEANING_VIEW' ? (
          <p className="text-sm leading-relaxed text-gray-600">
            This suite is being cleaned. Mark it as finished when it is ready for the next guest.
          </p>
        ) : null}

        {view === 'OCCUPIED_VIEW' && (
          <>
            {isLoadingOccupied ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading suite details...
              </div>
            ) : occupiedError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-700">
                Failed to load occupied suite details.
              </div>
            ) : (
              <>
                {renderGuestInformationSection(
                  booking?.booking_number,
                  mainGuestName,
                  booking?.check_in_time,
                  booking?.flight_number,
                  booking?.flight_departure_time,
                )}

                <div className="mt-6 border-t border-gray-200 pt-5">
                  {renderGuestAllergiesSection(guests)}
                </div>

                <div className="mt-6 space-y-3 border-t border-gray-200 pt-6">
                  <div className="mb-1 flex items-center justify-between">
                    <h3 className="text-sm uppercase tracking-wide text-gray-500">Ordered Items</h3>
                    <ShoppingCart className="h-5 w-5 text-gray-400" />
                  </div>

                  {orderItems.length === 0 ? (
                    <p className="text-sm text-gray-400">No items ordered yet.</p>
                  ) : (
                    orderItems.map((item, index) => (
                      <div
                        key={`${item.item_name}-${index}`}
                        className="flex items-center justify-between rounded bg-gray-50 p-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.item_name}</p>
                          <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        </div>
                      </div>
                    ))
                  )}

                  <Input
                    type="text"
                    placeholder="e.g. Latte, Massage, Fast Track"
                    value={serviceSearch}
                    onChange={(event) => setServiceSearch(event.target.value)}
                    className="mt-4"
                  />
                </div>
              </>
            )}
          </>
        )}

        {view === 'RESERVED_VIEW' && (
          <>
            {isLoadingReserved ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading reserved suite details...
              </div>
            ) : reservedError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-700">
                Failed to load reserved suite details.
              </div>
            ) : (
              <>
                {renderGuestInformationSection(
                  reservedBooking?.booking_number,
                  mainGuestName,
                  reservedBooking?.check_in_time,
                  reservedBooking?.flight_number,
                  reservedBooking?.flight_departure_time,
                )}

                <div className="mt-6 border-t border-gray-200 pt-5">
                  {renderGuestAllergiesSection(guests)}
                </div>
              </>
            )}
          </>
        )}

        {view === 'LIST' && (
          <>
            <p className="text-sm leading-relaxed text-gray-600">
              Is there any assigned booking? Select a booking below to assign it to this suite, or
              click Create Booking to proceed without one.
            </p>

            <div className="mt-4">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading bookings...
                </div>
              ) : isError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-700">
                  Failed to load unassigned bookings.
                </div>
              ) : unassignedBookings.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-400">
                  No unassigned bookings for today.
                </div>
              ) : (
                <ul className="space-y-3">
                  {unassignedBookings.map((bookingItem) => (
                    <li key={bookingItem.id}>
                      <button
                        type="button"
                        onClick={() => handleBookingClick(bookingItem)}
                        className="w-full rounded-lg border border-gray-200 bg-white p-4 text-left transition-all hover:border-blue-300 hover:bg-blue-50/40 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {bookingItem.guest_name}
                          </p>
                          {bookingItem.has_preorder ? (
                            <Badge className="shrink-0 border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                              Pre-order
                            </Badge>
                          ) : null}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {bookingItem.pax} pax
                          </span>
                          {bookingItem.flight_number ? (
                            <span className="inline-flex items-center gap-1">
                              <Plane className="h-3.5 w-3.5" />
                              {bookingItem.flight_number}
                            </span>
                          ) : null}
                          {bookingItem.flight_time ? (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {bookingItem.flight_time}
                            </span>
                          ) : null}
                        </div>
                        {renderBookingResourceCounts(bookingItem)}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        {view === 'PREORDER_CONFIRM' && selectedBooking ? (
          <ul className="space-y-2">
            {(selectedBooking.preorder_items ?? []).map((item, index) => (
              <li
                key={`${item.name_en}-${index}`}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
              >
                <span className="text-sm font-medium text-gray-900">{item.name_en ?? '—'}</span>
                <span className="text-sm text-gray-600">×{item.quantity}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {view === 'ASSIGN_CONFIRM' && selectedBooking ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-base font-semibold text-gray-900">{selectedBooking.guest_name}</p>
            <div className="mt-3 space-y-2 text-sm text-gray-600">
              <p className="inline-flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-400" />
                {selectedBooking.pax} pax
              </p>
              {selectedBooking.flight_number ? (
                <p className="inline-flex items-center gap-2">
                  <Plane className="h-4 w-4 text-gray-400" />
                  {selectedBooking.flight_number}
                </p>
              ) : null}
              {selectedBooking.flight_time ? (
                <p className="inline-flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  {selectedBooking.flight_time}
                </p>
              ) : null}
            </div>
            {renderBookingResourceCounts(selectedBooking)}
          </div>
        ) : null}

        {view === 'MULTI_ASSIGN_VIEW' && selectedBooking ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-base font-semibold text-gray-900">{selectedBooking.guest_name}</p>
              {renderBookingResourceCounts(selectedBooking)}
            </div>
            <p className="text-sm leading-relaxed text-gray-600">
              Please select suites from the floor plan.
            </p>
            <div>
              <h3 className="mb-2 text-sm font-medium text-gray-700">Selected Suites</h3>
              {selectedSuiteIdsForAssignment.length === 0 ? (
                <p className="rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-400">
                  No suites selected yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {selectedSuiteIdsForAssignment.map((id) => (
                    <li
                      key={id}
                      className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-gray-900"
                    >
                      {suiteNamesById.get(id) ?? `Suite #${id}`}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-gray-200 bg-white px-5 py-4">
        {view === 'CLEANING_VIEW' ? (
          <Button
            className="w-full bg-orange-600 text-white hover:bg-orange-700"
            onClick={handleFinishCleaning}
            disabled={isFinishingCleaning}
          >
            {isFinishingCleaning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Finished Cleaning'
            )}
          </Button>
        ) : null}

        {view === 'OCCUPIED_VIEW' && !isLoadingOccupied && !occupiedError ? (
          <div className="flex gap-3">
            <Button
              className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => goToOrder()}
            >
              View Full Details
            </Button>
            <Button
              className="flex-1 bg-green-600 text-white hover:bg-green-700"
              onClick={handleCheckout}
            >
              Checkout
            </Button>
          </div>
        ) : null}

        {view === 'RESERVED_VIEW' && !isLoadingReserved && !reservedError ? (
          <Button
            className="w-full bg-green-600 text-white hover:bg-green-700"
            onClick={handleCheckIn}
            disabled={isCheckingIn}
          >
            {isCheckingIn ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking in...
              </>
            ) : (
              'Check-in & Order'
            )}
          </Button>
        ) : null}

        {view === 'LIST' && (
          <Button
            className="w-full bg-[#0f2942] text-white hover:bg-[#1a3d5c]"
            onClick={handleCreateBooking}
            disabled={isAssigning}
          >
            {isAssigning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Booking'
            )}
          </Button>
        )}

        {view === 'PREORDER_CONFIRM' && selectedBooking ? (
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setView('LIST')}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={handleSendToKitchen}
              disabled={isAssigning}
            >
              {isAssigning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Yes, Send to Kitchen'
              )}
            </Button>
          </div>
        ) : null}

        {view === 'ASSIGN_CONFIRM' && selectedBooking ? (
          <Button
            className="w-full bg-blue-600 text-white hover:bg-blue-700"
            disabled={isAssigning}
            onClick={handleAssignBooking}
          >
            {isAssigning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              'Assign Booking'
            )}
          </Button>
        ) : null}

        {view === 'MULTI_ASSIGN_VIEW' && selectedBooking ? (
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleCancelMultiAssign}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
              disabled={isAssigning || selectedSuiteIdsForAssignment.length === 0}
              onClick={handleConfirmMultiAssign}
            >
              {isAssigning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                'Confirm Assignment'
              )}
            </Button>
          </div>
        ) : null}
      </div>
    </aside>

    <MergeCheckoutModal
      isOpen={isMergeModalOpen}
      onClose={handleCloseMergeModal}
      onSelectSingle={handleSelectSingleCheckout}
      onSelectMerge={handleSelectMergeCheckout}
      currentSuiteName={displaySuiteName}
      siblingSuites={siblingSuitesData}
    />
    </>
  );
}
