import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { GripVertical, Loader2, Save, Building2, MapPin, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import {
  FloorPlanCanvasWorkspace,
  type FloorPlanCanvasApi,
} from './FloorPlanCanvasWorkspace';
import {
  FLOOR_PLAN_DEFAULT_CANVAS_HEIGHT,
  FLOOR_PLAN_DEFAULT_CANVAS_WIDTH,
  FLOOR_PLAN_STATIC_SIZE,
  FLOOR_PLAN_SUITE_HEIGHT,
  FLOOR_PLAN_SUITE_SIZE,
  FLOOR_PLAN_SUITE_WIDTH,
  inferCanvasSizeFromItems,
  layoutNeedsPosNormalization,
  prepareLayoutForEditor,
} from '@/utils/floorPlanLayoutScale';
import { useMsg } from '@/i18n/useMsg';
import { msg } from '@/i18n/msgFallback';

export type LayoutItemType = 'suite' | 'static';

export interface LayoutItem {
  id: string;
  type: LayoutItemType;
  suite_id: number | null;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutSuiteOption {
  id: number;
  suite_name: string;
  kind: 'suite' | 'lounge';
  capacity: number;
  floor: string | null;
  status: string;
  is_active: boolean;
}

const STATIC_ELEMENTS = [
  { label: msg('Reception') },
  { label: msg('Dining Area') },
  { label: msg('Restrooms') },
  { label: msg('Entrance') },
] as const;

const DEFAULT_SUITE_SIZE = FLOOR_PLAN_SUITE_SIZE;
const DEFAULT_STATIC_SIZE = FLOOR_PLAN_STATIC_SIZE;

const DRAG_MIME = 'application/x-hkial-layout-item';

interface DragPayload {
  source: 'palette' | 'canvas';
  type: LayoutItemType;
  suiteId?: number;
  label: string;
  itemId?: string;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
}

export interface LoungeLayoutProps {
  suites?: LayoutSuiteOption[];
  initialItems?: LayoutItem[];
  initialCanvasWidth?: number;
  initialCanvasHeight?: number;
  isLoading?: boolean;
  isSaving?: boolean;
  onSaveLayout?: (payload: {
    items: LayoutItem[];
    canvasWidth: number;
    canvasHeight: number;
  }) => void;
}

function generateItemId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

function staticItemStyle(label: string): string {
  switch (label) {
    case 'Reception':
      return 'bg-blue-50 border-blue-300 text-blue-800';
    case 'Dining Area':
      return 'bg-purple-50 border-purple-300 text-purple-800';
    case 'Restrooms':
      return 'bg-indigo-50 border-indigo-300 text-indigo-800';
    case 'Entrance':
      return 'bg-emerald-50 border-emerald-300 text-emerald-800';
    default:
      return 'bg-gray-50 border-gray-300 text-gray-800';
  }
}

export function LoungeLayout({
  suites = [],
  initialItems = [],
  initialCanvasWidth,
  initialCanvasHeight,
  isLoading = false,
  isSaving = false,
  onSaveLayout,
}: LoungeLayoutProps) {
  const msg = useMsg();
  const [items, setItems] = useState<LayoutItem[]>(initialItems);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(FLOOR_PLAN_DEFAULT_CANVAS_WIDTH);
  const [canvasHeight, setCanvasHeight] = useState(FLOOR_PLAN_DEFAULT_CANVAS_HEIGHT);
  const [draftWidth, setDraftWidth] = useState(FLOOR_PLAN_DEFAULT_CANVAS_WIDTH);
  const [draftHeight, setDraftHeight] = useState(FLOOR_PLAN_DEFAULT_CANVAS_HEIGHT);
  const [needsSaveAfterNormalize, setNeedsSaveAfterNormalize] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  useEffect(() => {
    const prepared = prepareLayoutForEditor(initialItems);
    setItems(prepared);
    setNeedsSaveAfterNormalize(
      initialItems.length > 0 && layoutNeedsPosNormalization(initialItems),
    );

    const resolvedWidth =
      initialCanvasWidth && initialCanvasWidth >= 500
        ? Math.round(initialCanvasWidth)
        : prepared.length > 0
          ? inferCanvasSizeFromItems(prepared).width
          : FLOOR_PLAN_DEFAULT_CANVAS_WIDTH;
    const resolvedHeight =
      initialCanvasHeight && initialCanvasHeight >= 500
        ? Math.round(initialCanvasHeight)
        : prepared.length > 0
          ? inferCanvasSizeFromItems(prepared).height
          : FLOOR_PLAN_DEFAULT_CANVAS_HEIGHT;

    setCanvasWidth(resolvedWidth);
    setCanvasHeight(resolvedHeight);
    setDraftWidth(resolvedWidth);
    setDraftHeight(resolvedHeight);
  }, [initialItems, initialCanvasWidth, initialCanvasHeight]);

  const usedSuiteIds = new Set(
    items.filter((item) => item.type === 'suite' && item.suite_id !== null).map((item) => item.suite_id as number),
  );

  const availableSuites = suites.filter((suite) => suite.is_active && !usedSuiteIds.has(suite.id));

  const setDragPayload = (e: React.DragEvent, payload: DragPayload) => {
    e.dataTransfer.setData(DRAG_MIME, JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handlePaletteDragStart = (
    e: React.DragEvent,
    payload: Pick<DragPayload, 'type' | 'suiteId' | 'label'>,
    size: { width: number; height: number },
  ) => {
    setDragPayload(e, {
      ...payload,
      source: 'palette',
      offsetX: size.width / 2,
      offsetY: size.height / 2,
      width: size.width,
      height: size.height,
    });
  };

  const handleCanvasItemDragStart = (e: React.DragEvent, item: LayoutItem, zoom: number) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDraggingId(item.id);
    setDragPayload(e, {
      source: 'canvas',
      type: item.type,
      suiteId: item.suite_id ?? undefined,
      label: item.label,
      itemId: item.id,
      offsetX: (e.clientX - rect.left) / zoom,
      offsetY: (e.clientY - rect.top) / zoom,
      width: item.width,
      height: item.height,
    });
  };

  const handleDrop = (e: React.DragEvent, api: FloorPlanCanvasApi) => {
    setDraggingId(null);

    const raw = e.dataTransfer.getData(DRAG_MIME);
    if (!raw) return;

    let payload: DragPayload;
    try {
      payload = JSON.parse(raw) as DragPayload;
    } catch {
      return;
    }

    const { x: pointerX, y: pointerY } = api.clientToCanvas(e.clientX, e.clientY);
    const x = clamp(pointerX - payload.offsetX, 0, api.canvasWidth - payload.width);
    const y = clamp(pointerY - payload.offsetY, 0, api.canvasHeight - payload.height);

    if (payload.source === 'canvas' && payload.itemId) {
      setItems((prev) =>
        prev.map((item) => (item.id === payload.itemId ? { ...item, x, y } : item)),
      );
      setSelectedId(payload.itemId);
      return;
    }

    const newItem: LayoutItem = {
      id: generateItemId(payload.type === 'suite' ? 'suite' : 'static'),
      type: payload.type,
      suite_id: payload.type === 'suite' ? (payload.suiteId ?? null) : null,
      label: payload.label,
      x,
      y,
      width: payload.width,
      height: payload.height,
    };

    setItems((prev) => [...prev, newItem]);
    setSelectedId(newItem.id);
  };

  const handleResizeStart = (
    e: React.MouseEvent,
    itemId: string,
    zoom: number,
    maxCanvasWidth: number,
    maxCanvasHeight: number,
  ) => {
    e.stopPropagation();
    e.preventDefault();

    const item = items.find((entry) => entry.id === itemId);
    if (!item) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = item.width;
    const startHeight = item.height;

    const onMove = (ev: MouseEvent) => {
      const maxWidth = maxCanvasWidth - item.x;
      const maxHeight = maxCanvasHeight - item.y;
      const minWidth = item.type === 'suite' ? FLOOR_PLAN_SUITE_WIDTH : 60;
      const minHeight = item.type === 'suite' ? FLOOR_PLAN_SUITE_HEIGHT : 40;
      const nextWidth = clamp(startWidth + (ev.clientX - startX) / zoom, minWidth, maxWidth);
      const nextHeight = clamp(startHeight + (ev.clientY - startY) / zoom, minHeight, maxHeight);

      setItems((prev) =>
        prev.map((entry) =>
          entry.id === itemId ? { ...entry, width: nextWidth, height: nextHeight } : entry,
        ),
      );
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const handleSave = () => {
    const prepared = prepareLayoutForEditor(items);
    const width = Math.max(500, Number(draftWidth) || FLOOR_PLAN_DEFAULT_CANVAS_WIDTH);
    const height = Math.max(500, Number(draftHeight) || FLOOR_PLAN_DEFAULT_CANVAS_HEIGHT);

    setItems(prepared);
    setCanvasWidth(width);
    setCanvasHeight(height);
    setDraftWidth(width);
    setDraftHeight(height);
    setNeedsSaveAfterNormalize(false);
    onSaveLayout?.({
      items: prepared,
      canvasWidth: width,
      canvasHeight: height,
    });
  };

  const handleApplyCanvasSize = () => {
    setCanvasWidth(Math.max(500, Number(draftWidth) || FLOOR_PLAN_DEFAULT_CANVAS_WIDTH));
    setCanvasHeight(Math.max(500, Number(draftHeight) || FLOOR_PLAN_DEFAULT_CANVAS_HEIGHT));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)] text-gray-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        {msg('Loading floor plan...')}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] min-h-[640px] bg-gray-100">
      <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold text-gray-900">{msg('Lounge Floor Plan Builder')}</h1>
            <p className="text-sm text-gray-500">
              Drag suites onto the canvas at POS size ({FLOOR_PLAN_SUITE_WIDTH}×{FLOOR_PLAN_SUITE_HEIGHT}px).
              What you see here matches the POS floor plan.
            </p>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPaletteOpen((open) => !open)}
                className="gap-1.5"
              >
                {isPaletteOpen ? (
                  <PanelLeftClose className="h-4 w-4" />
                ) : (
                  <PanelLeftOpen className="h-4 w-4" />
                )}
                {isPaletteOpen ? 'Hide Palette' : 'Show Palette'}
              </Button>
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{msg('Canvas')}</span>
              <label className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-600">{msg('Width')}</span>
                <input
                  type="number"
                  min={500}
                  value={draftWidth}
                  onChange={(e) => setDraftWidth(Number(e.target.value))}
                  className="w-24 rounded border border-gray-200 px-2 py-1.5 text-sm"
                />
              </label>
              <label className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-600">{msg('Height')}</span>
                <input
                  type="number"
                  min={500}
                  value={draftHeight}
                  onChange={(e) => setDraftHeight(Number(e.target.value))}
                  className="w-24 rounded border border-gray-200 px-2 py-1.5 text-sm"
                />
              </label>
              <Button type="button" size="sm" onClick={handleApplyCanvasSize}>
                {msg('Apply')}
              </Button>
              <span className="text-xs text-gray-400">
                Default {FLOOR_PLAN_DEFAULT_CANVAS_WIDTH}×{FLOOR_PLAN_DEFAULT_CANVAS_HEIGHT}px
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {needsSaveAfterNormalize ? (
              <span className="hidden text-xs text-amber-700 sm:inline">
                {msg('Layout scaled to POS size — save to persist')}
              </span>
            ) : null}
            {selectedId ? (
              <Button
                variant="outline"
                onClick={() => {
                  setItems((prev) => prev.filter((item) => item.id !== selectedId));
                  setSelectedId(null);
                }}
              >
                {msg('Remove Selected')}
              </Button>
            ) : null}
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Layout
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {isPaletteOpen ? (
          <aside className="w-72 shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
            <div className="p-4 space-y-6">
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">{msg('Suites')}</h2>
                <div className="space-y-2">
                  {availableSuites.length === 0 ? (
                    <p className="text-sm text-gray-400">{msg('All suites are already on the canvas.')}</p>
                  ) : (
                    availableSuites.map((suite) => (
                      <div
                        key={suite.id}
                        draggable
                        onDragStart={(e) =>
                          handlePaletteDragStart(
                            e,
                            {
                              type: 'suite',
                              suiteId: suite.id,
                              label: suite.suite_name,
                            },
                            DEFAULT_SUITE_SIZE,
                          )
                        }
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white cursor-grab active:cursor-grabbing hover:border-indigo-300 hover:bg-indigo-50/40"
                      >
                        <GripVertical className="w-4 h-4 text-gray-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{suite.suite_name}</p>
                          <p className="text-xs text-gray-500 capitalize">
                            {suite.kind} · cap {suite.capacity} · {FLOOR_PLAN_SUITE_WIDTH}×{FLOOR_PLAN_SUITE_HEIGHT}px
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">{msg('Static Areas')}</h2>
                <div className="space-y-2">
                  {STATIC_ELEMENTS.map((element) => (
                    <div
                      key={element.label}
                      draggable
                      onDragStart={(e) =>
                        handlePaletteDragStart(
                          e,
                          {
                            type: 'static',
                            label: element.label,
                          },
                          DEFAULT_STATIC_SIZE,
                        )
                      }
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-grab active:cursor-grabbing ${staticItemStyle(element.label)}`}
                    >
                      <MapPin className="w-4 h-4 shrink-0 opacity-70" />
                      <span className="text-sm font-medium">{element.label}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </aside>
        ) : null}

        <div className="flex-1 min-w-0 p-4">
          <FloorPlanCanvasWorkspace
            title={msg('HKIA VIP Lounge — Floor Plan Canvas')}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            onDrop={handleDrop}
            onCanvasClick={() => setSelectedId(null)}
            emptyOverlay={
              items.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 pointer-events-none">
                  <Building2 className="w-10 h-10 mb-2 opacity-40" />
                  <p className="text-sm">{msg('Drag suites or static areas here to begin')}</p>
                </div>
              ) : null
            }
          >
            {(api) =>
              items.map((item) => {
                const isSelected = selectedId === item.id;
                const isDragging = draggingId === item.id;
                const itemClass =
                  item.type === 'suite'
                    ? 'bg-white border-indigo-300 text-indigo-900'
                    : staticItemStyle(item.label);

                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleCanvasItemDragStart(e, item, api.zoom)}
                    onDragEnd={() => setDraggingId(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedId(item.id);
                    }}
                    className={`absolute rounded-lg border-2 flex flex-col items-center justify-center p-2 cursor-move select-none shadow-sm transition-shadow ${
                      itemClass
                    } ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''} ${
                      isDragging ? 'opacity-60' : 'opacity-100'
                    }`}
                    style={{
                      left: item.x,
                      top: item.y,
                      width: item.width,
                      height: item.height,
                    }}
                  >
                    <GripVertical className="w-4 h-4 opacity-40 mb-0.5" />
                    <span className="text-xs sm:text-sm font-medium text-center leading-tight px-1">
                      {item.label}
                    </span>

                    {isSelected ? (
                      <div
                        role="presentation"
                        onMouseDown={(e) =>
                          handleResizeStart(e, item.id, api.zoom, api.canvasWidth, api.canvasHeight)
                        }
                        className="absolute right-0 bottom-0 w-4 h-4 bg-blue-600 rounded-tl-md rounded-br-md cursor-se-resize"
                        title={msg('Resize')}
                      />
                    ) : null}
                  </div>
                );
              })
            }
          </FloorPlanCanvasWorkspace>
        </div>
      </div>
    </div>
  );
}
