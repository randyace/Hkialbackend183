import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, QrCode } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import {
  computeFloorPlanViewportScale,
  FLOOR_PLAN_DEFAULT_CANVAS_HEIGHT,
  FLOOR_PLAN_DEFAULT_CANVAS_WIDTH,
  normalizeLayoutForDisplay,
} from '@/utils/floorPlanLayoutScale';
import { useMsg } from '@/i18n/useMsg';
import { msg } from '@/i18n/msgFallback';

export interface PosFloorPlanBooking {
  id: number;
  booking_no: string;
  guest_name: string;
  flight_no: string | null;
  flight_time: string | null;
  flight_type: string;
}

export interface PosFloorPlanSuite {
  id: number;
  suite_name: string;
  kind: 'suite' | 'lounge';
  status: string;
  display_status?: string;
  capacity: number;
  floor: string | null;
  current_booking_id?: number | null;
  booking: PosFloorPlanBooking | null;
  has_upcoming_conflict?: boolean;
}

export interface PosFloorPlanLayoutItem {
  id: string;
  type: 'suite' | 'static';
  suite_id: number | null;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  suite?: PosFloorPlanSuite | null;
}

export interface PosFloorPlanSuiteClick {
  id: number;
  suite_name: string;
  status: string;
}

export interface PosFloorPlanCanvasProps {
  layoutData?: PosFloorPlanLayoutItem[];
  layoutName?: string | null;
  canvasWidth?: number | null;
  canvasHeight?: number | null;
  isLoading?: boolean;
  isMultiAssignMode?: boolean;
  isInteractiveModeActive?: boolean;
  activeBookingId?: number | null;
  selectedSuiteIdsForAssignment?: number[];
  onSuiteClick?: (suite: PosFloorPlanSuiteClick) => void;
  onToggleSuiteSelection?: (suiteId: number) => void;
  onOpenQrScanner?: () => void;
}

type SuiteStatus =
  | 'available'
  | 'occupied'
  | 'reserved'
  | 'food-served'
  | 'cleaning'
  | 'maintenance'
  | string;

function normalizeStatus(status: string): SuiteStatus {
  return status || 'available';
}

function getSuiteDisplayStatus(suite: PosFloorPlanSuite | null | undefined): SuiteStatus {
  return normalizeStatus(suite?.display_status ?? suite?.status ?? 'available');
}

function getSuiteBgColor(status: SuiteStatus): string {
  switch (status) {
    case 'available':
      return 'bg-green-100 border-green-400';
    case 'occupied':
      return 'bg-red-100 border-red-400';
    case 'food-served':
      return 'bg-yellow-100 border-yellow-400';
    case 'cleaning':
      return 'bg-orange-100 border-orange-400';
    case 'reserved':
      return 'bg-indigo-100 border-indigo-400';
    case 'maintenance':
      return 'bg-gray-200 border-gray-400';
    default:
      return 'bg-gray-100 border-gray-400';
  }
}

function suiteBelongsToActiveBooking(
  suite: PosFloorPlanSuite,
  activeBookingId: number | null | undefined,
): boolean {
  if (activeBookingId == null) {
    return false;
  }

  const activeId = Number(activeBookingId);

  if (Number.isNaN(activeId)) {
    return false;
  }

  if (
    suite.current_booking_id != null &&
    Number(suite.current_booking_id) === activeId
  ) {
    return true;
  }

  return suite.booking != null && Number(suite.booking.id) === activeId;
}

function canToggleSuiteInMultiAssign(
  suite: PosFloorPlanSuite,
  rawStatus: SuiteStatus,
  activeBookingId: number | null | undefined,
): boolean {
  return (
    rawStatus === 'available' ||
    suiteBelongsToActiveBooking(suite, activeBookingId)
  );
}

function isSuiteLockedInAssignmentMode(
  suite: PosFloorPlanSuite,
  rawStatus: SuiteStatus,
  activeBookingId: number | null | undefined,
): boolean {
  return (
    rawStatus !== 'available' &&
    !suiteBelongsToActiveBooking(suite, activeBookingId)
  );
}

function getAssignmentModeClasses(
  isLockedInAssignmentMode: boolean,
  isAssignmentModeActive: boolean,
  isSelectedForAssignment: boolean,
): string {
  if (!isAssignmentModeActive) {
    return '';
  }

  if (isLockedInAssignmentMode) {
    return 'opacity-40 grayscale pointer-events-none';
  }

  if (isSelectedForAssignment) {
    return 'border-green-600 bg-green-500 text-white shadow-lg ring-4 ring-green-300 scale-105 transition-all cursor-pointer';
  }

  return 'ring-4 ring-green-400 ring-offset-2 animate-pulse cursor-pointer hover:scale-105 transition-all';
}

function getSuiteCardClasses(
  displayStatus: SuiteStatus,
  isLockedInAssignmentMode: boolean,
  isAssignmentModeActive: boolean,
  isSelectedForAssignment: boolean,
  hasUpcomingConflict: boolean,
): string {
  const base =
    'absolute flex flex-col items-center justify-center rounded-md border-2 p-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1';

  if (isAssignmentModeActive) {
    const assignmentClasses = getAssignmentModeClasses(
      isLockedInAssignmentMode,
      isAssignmentModeActive,
      isSelectedForAssignment,
    );

    return `${base} ${isSelectedForAssignment ? assignmentClasses : `${getSuiteBgColor(displayStatus)} ${assignmentClasses}`}`;
  }

  const conflictClasses = hasUpcomingConflict ? 'ring-2 ring-red-500 border-red-400' : '';

  return `${base} text-gray-700 cursor-pointer transition-all hover:border-blue-400 hover:shadow-md ${getSuiteBgColor(displayStatus)} ${conflictClasses}`;
}

function staticItemStyles(label: string): string {
  switch (label) {
    case 'Reception':
      return 'border-blue-200 bg-blue-50 text-blue-700';
    case 'Dining Area':
      return 'border-purple-200 bg-purple-50 text-purple-700';
    case 'Restrooms':
      return 'border-indigo-200 bg-indigo-50 text-indigo-700';
    case 'Entrance':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    default:
      return 'border-gray-300 bg-white/70 text-gray-700';
  }
}

const LEGEND_ITEMS = [
  { key: 'available', bg: 'bg-green-100 border-green-400', dot: 'bg-green-500', label: msg('Available') },
  { key: 'reserved', bg: 'bg-indigo-100 border-indigo-400', dot: 'bg-indigo-500', label: msg('Reserved (booking assigned)') },
  { key: 'occupied', bg: 'bg-red-100 border-red-400', dot: 'bg-red-500', label: msg('Occupied') },
  { key: 'food-served', bg: 'bg-yellow-100 border-yellow-400', dot: 'bg-yellow-500', label: msg('Food Served') },
  { key: 'cleaning', bg: 'bg-orange-100 border-orange-400', dot: 'bg-orange-500', label: msg('Cleaning') },
] as const;

export function PosFloorPlanCanvas({
  layoutData = [],
  layoutName,
  canvasWidth,
  canvasHeight,
  isLoading = false,
  isMultiAssignMode = false,
  isInteractiveModeActive = false,
  activeBookingId = null,
  selectedSuiteIdsForAssignment = [],
  onSuiteClick,
  onToggleSuiteSelection,
  onOpenQrScanner,
}: PosFloorPlanCanvasProps) {
  const msg = useMsg();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new ResizeObserver(([entry]) => {
      setContainerSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const suiteItems = useMemo(
    () => layoutData.filter((item) => item.type === 'suite'),
    [layoutData],
  );

  const statusCounts = useMemo(() => {
    const counts = {
      available: 0,
      reserved: 0,
      occupied: 0,
      foodServed: 0,
      cleaning: 0,
    };

    for (const item of suiteItems) {
      const status = getSuiteDisplayStatus(item.suite ?? undefined);
      if (status === 'available') counts.available += 1;
      else if (status === 'reserved') counts.reserved += 1;
      else if (status === 'occupied') counts.occupied += 1;
      else if (status === 'food-served') counts.foodServed += 1;
      else if (status === 'cleaning') counts.cleaning += 1;
    }

    return counts;
  }, [suiteItems]);

  const resolvedCanvas = useMemo(() => {
    if (canvasWidth && canvasWidth >= 500 && canvasHeight && canvasHeight >= 500) {
      return {
        width: Math.round(canvasWidth),
        height: Math.round(canvasHeight),
      };
    }

    return {
      width: FLOOR_PLAN_DEFAULT_CANVAS_WIDTH,
      height: FLOOR_PLAN_DEFAULT_CANVAS_HEIGHT,
    };
  }, [canvasHeight, canvasWidth]);

  const normalizedLayout = useMemo(
    () =>
      normalizeLayoutForDisplay(layoutData, {
        canvasWidth: resolvedCanvas.width,
        canvasHeight: resolvedCanvas.height,
      }),
    [layoutData, resolvedCanvas.height, resolvedCanvas.width],
  );

  const scale = useMemo(
    () => computeFloorPlanViewportScale(normalizedLayout, containerSize),
    [containerSize, normalizedLayout],
  );

  const scaledWidth = normalizedLayout.width * scale;
  const scaledHeight = normalizedLayout.height * scale;

  const handleSuiteClick = (suite: PosFloorPlanSuiteClick) => {
    onSuiteClick?.(suite);
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 py-20 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        {msg('Loading floor plan...')}
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">{msg('POS Floor Plan')}</h1>
          <p className="text-sm text-gray-600 sm:text-base">
            {msg('Real-time suite status and guest management')}
          </p>
        </div>
        {onOpenQrScanner ? (
          <Button
            className="shrink-0 gap-2 bg-[#0f2942] text-white hover:bg-[#1a3d5c]"
            onClick={onOpenQrScanner}
          >
            <QrCode className="h-4 w-4" />
            {msg('Scan QR for Entry')}
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="border-green-200 bg-green-50 px-3 py-2">
          <div className="text-lg font-semibold leading-tight text-green-700">{statusCounts.available}</div>
          <div className="text-xs text-green-600">{msg('Available')}</div>
        </Card>
        <Card className="border-indigo-200 bg-indigo-50 px-3 py-2">
          <div className="text-lg font-semibold leading-tight text-indigo-700">{statusCounts.reserved}</div>
          <div className="text-xs text-indigo-600">{msg('Reserved')}</div>
        </Card>
        <Card className="border-red-200 bg-red-50 px-3 py-2">
          <div className="text-lg font-semibold leading-tight text-red-700">{statusCounts.occupied}</div>
          <div className="text-xs text-red-600">{msg('Occupied')}</div>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50 px-3 py-2">
          <div className="text-lg font-semibold leading-tight text-yellow-700">{statusCounts.foodServed}</div>
          <div className="text-xs text-yellow-600">{msg('Food Served')}</div>
        </Card>
        <Card className="col-span-2 border-orange-200 bg-orange-50 px-3 py-2 sm:col-span-1">
          <div className="text-lg font-semibold leading-tight text-orange-700">{statusCounts.cleaning}</div>
          <div className="text-xs text-orange-600">{msg('Cleaning')}</div>
        </Card>
      </div>

      <Card className="p-3 sm:p-6">
        <div
          ref={containerRef}
          className="relative min-h-[360px] w-full overflow-auto rounded-lg bg-gray-50 sm:min-h-[440px] lg:min-h-[500px]"
        >
          {layoutData.length === 0 ? (
            <div className="flex min-h-[320px] items-center justify-center px-6 text-center text-sm text-gray-400">
              {msg('No floor plan layout configured. Set up the layout in Lounge Management first.')}
            </div>
          ) : (
            <div className="flex min-h-full justify-center p-4 pt-10">
              <div
                className="relative shrink-0"
                style={{
                  width: scaledWidth,
                  height: scaledHeight,
                }}
              >
                <div className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap text-sm font-medium text-gray-600 sm:text-base">
                  {layoutName ? `${layoutName} — Floor Plan` : 'HKIA VIP Lounge — Floor Plan'}
                </div>

                <div
                  className="absolute left-0 top-0 bg-[#f8fafc]"
                  style={{
                    width: normalizedLayout.width,
                    height: normalizedLayout.height,
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                  }}
                >
                  {normalizedLayout.items.map((item) => {
                  if (item.type === 'static') {
                    return (
                      <div
                        key={item.id}
                        className={`absolute flex items-center justify-center rounded border-2 border-dashed px-2 text-center text-xs font-medium pointer-events-none sm:text-sm ${staticItemStyles(item.label)}`}
                        style={{
                          left: item.x,
                          top: item.y,
                          width: item.width,
                          height: item.height,
                        }}
                      >
                        {item.label}
                      </div>
                    );
                  }

                  const suite = item.suite;
                  const displayStatus = getSuiteDisplayStatus(suite ?? undefined);
                  const rawStatus = normalizeStatus(suite?.status ?? 'available');
                  const suiteName = suite?.suite_name ?? item.label;
                  const booking = suite?.booking ?? null;
                  const hasBooking = Boolean(booking);
                  const hasUpcomingConflict = Boolean(suite?.has_upcoming_conflict);
                  const isAssignmentModeActive = isInteractiveModeActive || isMultiAssignMode;
                  const isSelectedForAssignment =
                    isMultiAssignMode &&
                    suite != null &&
                    selectedSuiteIdsForAssignment.some((selectedId) =>
                      Number(selectedId) === Number(suite.id));
                  const isLockedInAssignmentMode =
                    isAssignmentModeActive &&
                    suite != null &&
                    isSuiteLockedInAssignmentMode(suite, rawStatus, activeBookingId);

                  const cardClasses = getSuiteCardClasses(
                    displayStatus,
                    isLockedInAssignmentMode,
                    isAssignmentModeActive,
                    isSelectedForAssignment,
                    hasUpcomingConflict,
                  );

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (!suite) return;

                        if (isMultiAssignMode) {
                          if (!canToggleSuiteInMultiAssign(suite, rawStatus, activeBookingId)) {
                            return;
                          }

                          onToggleSuiteSelection?.(Number(suite.id));
                          return;
                        }

                        if (isInteractiveModeActive && rawStatus !== 'available') {
                          return;
                        }

                        handleSuiteClick({
                          id: suite.id,
                          suite_name: suiteName,
                          status: displayStatus,
                        });
                      }}
                      className={cardClasses}
                      style={{
                        left: item.x,
                        top: item.y,
                        width: item.width,
                        height: item.height,
                      }}
                    >
                      {isSelectedForAssignment ? (
                        <span
                          className="absolute right-1 top-1 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold leading-none text-green-600 shadow"
                          aria-hidden
                        >
                          ✓
                        </span>
                      ) : null}
                      {hasUpcomingConflict ? (
                        <span
                          className="absolute -right-1.5 -top-1.5 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold leading-none text-white shadow"
                          title={msg('Upcoming booking conflict')}
                        >
                          !
                        </span>
                      ) : null}
                      <div
                        className={`line-clamp-2 w-full px-0.5 text-center text-[11px] font-medium leading-tight ${isSelectedForAssignment ? 'text-white' : ''}`}
                      >
                        {suiteName}
                      </div>

                      {hasBooking ? (
                        <div className="mt-1 flex w-full min-h-0 flex-1 flex-col items-center justify-center gap-0.5">
                          <div
                            className={`line-clamp-1 w-full px-0.5 text-center text-[10px] ${isSelectedForAssignment ? 'text-white/90' : 'text-gray-600'}`}
                          >
                            {booking!.guest_name}
                          </div>
                          <div className="flex flex-nowrap items-center justify-center gap-1 px-0.5">
                            <span
                              className={`shrink-0 rounded px-1 py-0.5 text-[10px] ${isSelectedForAssignment ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'}`}
                            >
                              {booking!.flight_type}
                            </span>
                            {booking!.flight_time ? (
                              <span
                                className={`shrink-0 text-[10px] ${isSelectedForAssignment ? 'text-white/90' : 'text-blue-600'}`}
                              >
                                {booking!.flight_time}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      ) : displayStatus === 'available' || displayStatus === 'cleaning' ? (
                        <div
                          className={`mt-1 text-[10px] uppercase tracking-wide ${isSelectedForAssignment ? 'text-white/90' : 'opacity-70'}`}
                        >
                          {displayStatus === 'cleaning' ? 'Cleaning' : 'Available'}
                        </div>
                      ) : null}
                    </button>
                  );
                })}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      <div className="flex flex-wrap gap-2 text-xs sm:gap-3">
        {LEGEND_ITEMS.map((item) => (
          <span
            key={item.key}
            className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 text-gray-700 sm:px-2.5 ${item.bg}`}
          >
            <span className={`h-2 w-2 rounded-full ${item.dot}`} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
