import { AlertTriangle } from 'lucide-react';

export interface PosOverdueKitchenBannerProps {
  message: string;
  className?: string;
}

export function PosOverdueKitchenBanner({ message, className = '' }: PosOverdueKitchenBannerProps) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-700 ${className}`}
      role="alert"
    >
      <AlertTriangle className="h-5 w-5 shrink-0" />
      <span className="text-sm font-semibold">{message}</span>
    </div>
  );
}
