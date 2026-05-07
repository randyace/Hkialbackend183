import { ChevronDown, ChevronUp, UtensilsCrossed, Clock, CheckCheck, X, AlertTriangle } from 'lucide-react';

export interface PendingItem {
  name: string;
  qty: number;
  status: 'pending' | 'preparing';
  waitMinutes: number;
}

export interface PendingOrder {
  suiteId: string;
  suiteName: string;
  bookingNo: string;
  guestName: string;
  items: PendingItem[];
}

export interface POSFoodAlertProps {
  pendingOrders: PendingOrder[];
  isExpanded: boolean;
  totalItems: number;
  hasOverdue: boolean;
  overdueThreshold: number;
  onToggleExpanded: () => void;
  onDismiss: () => void;
  onNavigateToBooking: (bookingNo: string) => void;
  onMarkServed: (suiteId: string) => void;
  statusLabel: (item: PendingItem) => string;
  statusClassName: (item: PendingItem) => string;
  waitClassName: (mins: number) => string;
}

export function POSFoodAlert({
  pendingOrders,
  isExpanded,
  totalItems,
  hasOverdue,
  overdueThreshold,
  onToggleExpanded,
  onDismiss,
  onNavigateToBooking,
  onMarkServed,
  statusLabel,
  statusClassName,
  waitClassName,
}: POSFoodAlertProps) {
  if (pendingOrders.length === 0) return null;

  return (
    <div className={`border-b transition-colors ${hasOverdue ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
      <div className="flex items-center gap-3 px-5 py-2.5">
        <div className={`shrink-0 ${hasOverdue ? 'text-red-500' : 'text-amber-500'}`}>
          {hasOverdue
            ? <AlertTriangle className="w-4 h-4" />
            : <UtensilsCrossed className="w-4 h-4" />}
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className={`text-sm font-semibold ${hasOverdue ? 'text-red-700' : 'text-amber-700'}`}>
            {hasOverdue ? 'Overdue Food Orders' : 'Pending Food Orders'}
          </span>
          <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs text-white font-bold ${
            hasOverdue ? 'bg-red-500' : 'bg-amber-500'
          } ${hasOverdue ? 'animate-pulse' : ''}`}>
            {pendingOrders.length}
          </span>
          <span className="text-xs text-gray-500 hidden sm:block">
            {pendingOrders.length} table{pendingOrders.length !== 1 ? 's' : ''} · {totalItems} item{totalItems !== 1 ? 's' : ''} waiting
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onToggleExpanded}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              hasOverdue
                ? 'text-red-600 hover:bg-red-100'
                : 'text-amber-700 hover:bg-amber-100'
            }`}
          >
            {isExpanded ? (
              <><ChevronUp className="w-3.5 h-3.5" /> Collapse</>
            ) : (
              <><ChevronDown className="w-3.5 h-3.5" /> Expand</>
            )}
          </button>
          <button
            onClick={onDismiss}
            title="Dismiss alert"
            className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="px-5 pb-3 space-y-2">
          {[...pendingOrders]
            .sort((a, b) =>
              Math.max(...b.items.map(i => i.waitMinutes)) -
              Math.max(...a.items.map(i => i.waitMinutes))
            )
            .map(order => {
              const maxWait = Math.max(...order.items.map(i => i.waitMinutes));
              const isOverdue = maxWait >= overdueThreshold;

              return (
                <div
                  key={order.suiteId}
                  className={`flex items-start gap-3 px-4 py-3 rounded-lg border ${
                    isOverdue
                      ? 'bg-red-50 border-red-200'
                      : 'bg-white border-amber-200'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-semibold ${isOverdue ? 'text-red-800' : 'text-gray-900'}`}>
                        {order.suiteName}
                      </span>
                      <span className="text-xs text-gray-400">{order.guestName}</span>
                      <button
                        onClick={() => onNavigateToBooking(order.bookingNo)}
                        className="font-mono text-xs text-blue-600 hover:underline"
                      >
                        {order.bookingNo}
                      </button>
                      {isOverdue && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-100 text-red-700 border border-red-200 rounded text-xs">
                          <AlertTriangle className="w-2.5 h-2.5" /> Overdue
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {order.items.map((item, idx) => (
                        <span
                          key={idx}
                          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs border ${
                            item.waitMinutes >= overdueThreshold
                              ? 'bg-red-50 border-red-200 text-red-700'
                              : 'bg-gray-50 border-gray-200 text-gray-700'
                          }`}
                        >
                          <span className={`inline-block px-1.5 py-0.5 rounded text-xs ${statusClassName(item)}`}>
                            {statusLabel(item)}
                          </span>
                          <span>{item.qty > 1 ? `${item.qty}× ` : ''}{item.name}</span>
                          <span className={`flex items-center gap-0.5 ${waitClassName(item.waitMinutes)}`}>
                            <Clock className="w-3 h-3" />
                            {item.waitMinutes} min
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => onMarkServed(order.suiteId)}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-green-600 hover:bg-green-700 text-white transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark Served
                  </button>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
