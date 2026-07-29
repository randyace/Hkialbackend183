import { useRef, useState, type ReactNode } from 'react';
import { Button } from './ui/button';

import {
  FLOOR_PLAN_DEFAULT_CANVAS_HEIGHT,
  FLOOR_PLAN_DEFAULT_CANVAS_WIDTH,
} from '@/utils/floorPlanLayoutScale';
import { useMsg } from '@/i18n/useMsg';

export const DEFAULT_CANVAS_WIDTH = FLOOR_PLAN_DEFAULT_CANVAS_WIDTH;
export const DEFAULT_CANVAS_HEIGHT = FLOOR_PLAN_DEFAULT_CANVAS_HEIGHT;

export interface FloorPlanCanvasApi {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  zoom: number;
  canvasWidth: number;
  canvasHeight: number;
  clientToCanvas: (clientX: number, clientY: number) => { x: number; y: number };
}

export interface FloorPlanCanvasWorkspaceProps {
  title?: string;
  canvasWidth?: number;
  canvasHeight?: number;
  topRightControls?: ReactNode;
  emptyOverlay?: ReactNode;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, api: FloorPlanCanvasApi) => void;
  onCanvasClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  children: ReactNode | ((api: FloorPlanCanvasApi) => ReactNode);
}

export function FloorPlanCanvasWorkspace({
  title,
  canvasWidth = DEFAULT_CANVAS_WIDTH,
  canvasHeight = DEFAULT_CANVAS_HEIGHT,
  topRightControls,
  emptyOverlay,
  onDragOver,
  onDrop,
  onCanvasClick,
  children,
}: FloorPlanCanvasWorkspaceProps) {
  const msg = useMsg();
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);

  const clientToCanvas = (clientX: number, clientY: number) => {
    if (!canvasRef.current) {
      return { x: 0, y: 0 };
    }

    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / zoom,
      y: (clientY - rect.top) / zoom,
    };
  };

  const api: FloorPlanCanvasApi = {
    canvasRef,
    zoom,
    canvasWidth,
    canvasHeight,
    clientToCanvas,
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    onDragOver?.(e);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDrop?.(e, api);
  };

  const renderedChildren = typeof children === 'function' ? children(api) : children;

  return (
    <div className="relative h-full min-h-[480px] w-full overflow-auto rounded-xl bg-gray-100">
      {topRightControls ? (
        <div className="absolute top-4 right-4 z-20">{topRightControls}</div>
      ) : null}

      <div
        className="relative"
        style={{
          width: canvasWidth * zoom,
          height: canvasHeight * zoom,
        }}
      >
        <div
          ref={canvasRef}
          onDragOver={onDragOver || onDrop ? handleDragOver : undefined}
          onDrop={onDrop ? handleDrop : undefined}
          onClick={onCanvasClick}
          className="absolute top-0 left-0 bg-[#f8fafc]"
          style={{
            width: `${canvasWidth}px`,
            height: `${canvasHeight}px`,
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
          }}
        >
          {title ? (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-sm font-medium text-gray-500 pointer-events-none z-10">
              {title}
            </div>
          ) : null}

          {emptyOverlay}

          {renderedChildren}
        </div>
      </div>

      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 rounded-lg border border-gray-200 bg-white/95 p-2 shadow-md backdrop-blur-sm">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setZoom((value) => Math.min(2, Number((value + 0.1).toFixed(1))))}
          disabled={zoom >= 2}
        >
          {msg('Zoom In (+)')}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setZoom((value) => Math.max(0.5, Number((value - 0.1).toFixed(1))))}
          disabled={zoom <= 0.5}
        >
          {msg('Zoom Out (-)')}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setZoom(1)}>
          {msg('Reset (100%)')}
        </Button>
      </div>
    </div>
  );
}
