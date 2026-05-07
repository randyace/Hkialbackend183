import { useState } from 'react';
import {
  POSFoodAlert,
  type PendingItem,
  type PendingOrder,
} from '../../app/components/POSFoodAlert';
import { INITIAL_PENDING, OVERDUE_THRESHOLD } from '../POSFoodAlert.fixture';

interface POSFoodAlertPreviewProps {
  onViewBooking?: (bookingNo: string) => void;
}

export function POSFoodAlertPreview({ onViewBooking }: POSFoodAlertPreviewProps) {
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>(INITIAL_PENDING);
  const [isExpanded, setIsExpanded] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const totalItems = pendingOrders.reduce((sum, order) => sum + order.items.length, 0);
  const hasOverdue = pendingOrders.some((order) =>
    order.items.some((item) => item.waitMinutes >= OVERDUE_THRESHOLD),
  );

  return (
    <POSFoodAlert
      pendingOrders={pendingOrders}
      isExpanded={isExpanded}
      totalItems={totalItems}
      hasOverdue={hasOverdue}
      overdueThreshold={OVERDUE_THRESHOLD}
      onToggleExpanded={() => setIsExpanded((prev) => !prev)}
      onDismiss={() => setDismissed(true)}
      onNavigateToBooking={(bookingNo) => onViewBooking?.(bookingNo)}
      onMarkServed={(suiteId) =>
        setPendingOrders((prev) => prev.filter((o) => o.suiteId !== suiteId))
      }
      statusLabel={(item: PendingItem) =>
        item.status === 'preparing' ? 'Preparing' : 'Pending'
      }
      statusClassName={(item: PendingItem) =>
        item.status === 'preparing'
          ? 'bg-blue-100 text-blue-700'
          : 'bg-yellow-100 text-yellow-700'
      }
      waitClassName={(mins: number) =>
        mins >= OVERDUE_THRESHOLD ? 'text-red-600 font-semibold' : 'text-gray-500'
      }
    />
  );
}
