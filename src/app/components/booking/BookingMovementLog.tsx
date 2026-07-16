import { useEffect, useState } from 'react';
import { History, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { toast } from 'sonner@2.0.3';

// 2026-06-18 (round 6.2.48) — prop-driven Movement Log dialog.
// Pre-refactor: this component used a hard-coded `INITIAL_MOVEMENTS`
// mock array + local-only state, with Add/Delete buttons firing
// `toast.success` (no API). Post-refactor: the parent wrapper
// passes real movements + CRUD callbacks; the component is a
// pure presentational shell that wires the figma-ui Dialog + table
// to those callbacks. The `INITIAL_MOVEMENTS` constant is gone.
//
// 2026-07-16 — Add Movement form moved to parent-owned
// `SharedMovementLogModal` (Booking Detail + Customer Detail share
// the same grid modal). This table dialog only opens that modal
// via `onOpenAddMovement`.

export interface MovementEntry {
  id: number;
  source?: 'manual' | 'qr_scan' | string;
  movementInCharge?: string;
  cicSupport?: string;
  driver?: string;
  orderNo: string;
  deptDate?: string;
  arrDate?: string;
  movementDate?: string;
  timeIn?: string;
  timeOut?: string;
  location?: string;
  flightNo: string;
  flightTime: string;
  destinationOrigin: string;
  lobbySuite?: string;
  noOfPax?: number;
  title?: string;
  firstName?: string;
  lastName?: string;
  noOfCIBaggage?: number;
  remarks?: string;
  nationality?: string;
  arrTimeNonFlyingGuests?: string;
  timeMetVIPAtGate?: string;
  timeBackToHKIAL?: string;
  baggageRetrievalStart?: string;
  baggageRetrievalEnd?: string;
  baggageArrivalAtHKIAL?: string;
  timeLeftHKIAL?: string;
  totalProcessingTime?: string;
  remarksAdminIssue?: string;
}

interface LogBooking {
  id?: number;
  accountId?: number;
  bookingNo: string;
  flightNo: string;
  flightTime: string;
  flightType?: string;
  arrivalDate?: string;
  flightOrigin?: string;
  flightDestination?: string;
  suite: string;
  numberOfGuests?: number;
  numberOfLuggage?: number;
}

// Kept for parent wrapper / BookingDetail type imports.
export type MovementForm = Partial<MovementEntry>;

interface BookingMovementLogProps {
  open: boolean;
  onClose: () => void;
  booking: LogBooking;
  /** Real movement entries from `GET /api/bookings/{id}/movements`. */
  movements?: MovementEntry[];
  /**
   * Opens the shared Add Movement modal (parent owns SharedMovementLogModal).
   * Required for Add — the form UI lives outside this table dialog.
   */
  onOpenAddMovement?: () => void;
  /** @deprecated Prefer onOpenAddMovement + SharedMovementLogModal. */
  onAddMovement?: (form: MovementForm) => Promise<void>;
  /** Called when the user clicks the per-row delete button (manual entries only). */
  onDeleteMovement?: (id: number) => Promise<void>;
  /** Disable Add button while the parent's POST is in flight. */
  isAddingMovement?: boolean;
  /** Disable Delete button while the parent's DELETE is in flight. */
  isDeletingMovement?: boolean;
}

export function BookingMovementLog({
  open,
  onClose,
  booking,
  movements: movementsProp = [],
  onOpenAddMovement,
  onDeleteMovement,
  isAddingMovement = false,
  isDeletingMovement = false,
}: BookingMovementLogProps) {
  // Sync parent-driven movements into local state so the table
  // re-renders on prop change. Without this, the wrapper's
  // refetch-after-add would update the prop but the table would
  // not refresh until a force remount.
  const [bookingMovements, setBookingMovements] = useState<MovementEntry[]>(movementsProp);
  useEffect(() => {
    setBookingMovements(movementsProp);
  }, [movementsProp]);

  const dash = <span className="text-gray-300">—</span>;
  const cell = 'px-3 py-2.5 whitespace-nowrap align-middle';

  const handleDelete = async (id: number) => {
    if (!onDeleteMovement) {
      toast.error('Delete is not wired — please configure the parent wrapper.');
      return;
    }
    if (!window.confirm('Delete this movement entry? This cannot be undone.')) return;
    try {
      await onDeleteMovement(id);
      setBookingMovements(prev => prev.filter(x => x.id !== id));
      toast.success('Movement record deleted.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete movement record.';
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[96vw] w-[96vw] min-w-[1000px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            Movement Log — {booking.bookingNo}
          </DialogTitle>
          <DialogDescription>
            Full movement details for this booking. Booking reference fields are pre-filled from the booking record.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between mt-2 mb-3">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <p>{bookingMovements.length} record{bookingMovements.length !== 1 ? 's' : ''}</p>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-blue-100 border border-blue-200"></span> Booking ref columns</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-teal-100 border border-teal-200"></span> Time columns</span>
          </div>
          <Button
            size="sm"
            onClick={() => onOpenAddMovement?.()}
            disabled={!onOpenAddMovement || isAddingMovement}
          >
            <Plus className="w-4 h-4 mr-1.5" />Add Movement
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="text-xs border-collapse" style={{ minWidth: '3200px' }}>
            <thead>
              <tr className="bg-[#0f2942] text-white">
                <th className="px-3 py-2.5 text-left whitespace-nowrap sticky left-0 z-20 bg-[#0f2942] border-r border-white/20 min-w-[60px]">Gp No.</th>
                <th className="px-3 py-2.5 text-left whitespace-nowrap min-w-[130px]">Movement IC</th>
                <th className="px-3 py-2.5 text-left whitespace-nowrap min-w-[130px]">CIC &amp; Support</th>
                <th className="px-3 py-2.5 text-left whitespace-nowrap min-w-[110px]">Driver</th>
                <th className="px-3 py-2.5 text-left whitespace-nowrap min-w-[170px] bg-[#163a5e]">Order No.</th>
                <th className="px-3 py-2.5 text-left whitespace-nowrap min-w-[100px] bg-[#163a5e]">Dept Date</th>
                <th className="px-3 py-2.5 text-left whitespace-nowrap min-w-[100px] bg-[#163a5e]">Arr Date</th>
                <th className="px-3 py-2.5 text-left whitespace-nowrap min-w-[90px] bg-[#163a5e]">Flt No.</th>
                <th className="px-3 py-2.5 text-left whitespace-nowrap min-w-[90px] bg-[#163a5e]">Flt Time</th>
                <th className="px-3 py-2.5 text-left whitespace-nowrap min-w-[110px] bg-[#163a5e]">Dest / Origin</th>
                <th className="px-3 py-2.5 text-left whitespace-nowrap min-w-[120px]">Lobby / Suite</th>
                <th className="px-3 py-2.5 text-left whitespace-nowrap min-w-[60px]">Pax</th>
                <th className="px-3 py-2.5 text-left whitespace-nowrap min-w-[70px]">Title</th>
                <th className="px-3 py-2.5 text-left whitespace-nowrap min-w-[100px]">First Name</th>
                <th className="px-3 py-2.5 text-left whitespace-nowrap min-w-[100px]">Last Name</th>
                <th className="px-3 py-2.5 text-left whitespace-nowrap min-w-[75px]">C/I Bag.</th>
                <th className="px-3 py-2.5 text-left whitespace-nowrap min-w-[140px]">Remarks</th>
                <th className="px-3 py-2.5 text-left whitespace-nowrap min-w-[110px]">Nationality</th>
                <th className="px-3 py-2.5 text-left whitespace-nowrap min-w-[110px] bg-[#163a5e]">Non-fly Arr.</th>
                <th className="px-3 py-2.5 text-left whitespace-nowrap min-w-[110px] bg-[#163a5e]">Met VIP at Gate</th>
                <th className="px-3 py-2.5 text-left whitespace-nowrap min-w-[110px] bg-[#163a5e]">Back to HKIAL</th>
                <th className="px-3 py-2.5 text-left whitespace-nowrap min-w-[110px] bg-[#163a5e]">Bag. Retr. Start</th>
                <th className="px-3 py-2.5 text-left whitespace-nowrap min-w-[110px] bg-[#163a5e]">Bag. Retr. End</th>
                <th className="px-3 py-2.5 text-left whitespace-nowrap min-w-[110px] bg-[#163a5e]">Bag. Arr. HKIAL</th>
                <th className="px-3 py-2.5 text-left whitespace-nowrap min-w-[110px] bg-[#163a5e]">Left HKIAL</th>
                <th className="px-3 py-2.5 text-left whitespace-nowrap min-w-[110px] bg-[#163a5e]">Process Time</th>
                <th className="px-3 py-2.5 text-left whitespace-nowrap min-w-[140px]">Admin Remarks</th>
                <th className="px-3 py-2.5 text-center whitespace-nowrap sticky right-0 z-20 bg-[#0f2942] border-l border-white/20 min-w-[60px]">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {bookingMovements.length === 0 ? (
                <tr>
                  <td colSpan={28} className="px-6 py-10 text-center text-gray-400 text-sm">
                    No movement records yet. Click &quot;Add Movement&quot; to create the first entry.
                  </td>
                </tr>
              ) : bookingMovements.map((m, idx) => {
                const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60';
                // `source='qr_scan'` entries are READ-ONLY on the
                // backend (audit trail). The UI reflects that by
                // disabling the delete button. Manual entries can
                // be deleted.
                const canDelete = m.source !== 'qr_scan' && !!onDeleteMovement;
                return (
                  <tr key={m.id} className={`${rowBg} hover:bg-blue-50/40 transition-colors`}>
                    <td className={`${cell} sticky left-0 z-10 ${rowBg} border-r border-gray-200 text-center`}>
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#0f2942]/10 text-[#0f2942]">{m.id}</span>
                    </td>
                    <td className={cell}>{m.movementInCharge || dash}</td>
                    <td className={cell}>{m.cicSupport || dash}</td>
                    <td className={cell}>{m.driver || dash}</td>
                    <td className={`${cell} bg-blue-50/30`}><span className="font-mono text-[11px] text-blue-800">{m.orderNo}</span></td>
                    <td className={`${cell} bg-blue-50/30`}>{m.deptDate || dash}</td>
                    <td className={`${cell} bg-blue-50/30`}>{m.arrDate || dash}</td>
                    <td className={`${cell} bg-blue-50/30 font-medium`}>{m.flightNo}</td>
                    <td className={`${cell} bg-blue-50/30`}>{m.flightTime}</td>
                    <td className={`${cell} bg-blue-50/30`}>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px]">{m.destinationOrigin}</span>
                    </td>
                    <td className={cell}>{m.lobbySuite || dash}</td>
                    <td className={`${cell} text-center`}>{m.noOfPax ?? dash}</td>
                    <td className={cell}>{m.title || dash}</td>
                    <td className={cell}>{m.firstName || dash}</td>
                    <td className={cell}>{m.lastName || dash}</td>
                    <td className={`${cell} text-center`}>{m.noOfCIBaggage ?? dash}</td>
                    <td className={`${cell} max-w-[140px]`}><span className="block truncate" title={m.remarks}>{m.remarks || dash}</span></td>
                    <td className={cell}>{m.nationality || dash}</td>
                    <td className={`${cell} bg-teal-50/30`}>{m.arrTimeNonFlyingGuests || dash}</td>
                    <td className={`${cell} bg-teal-50/30`}>{m.timeMetVIPAtGate || dash}</td>
                    <td className={`${cell} bg-teal-50/30`}>{m.timeBackToHKIAL || dash}</td>
                    <td className={`${cell} bg-teal-50/30`}>{m.baggageRetrievalStart || dash}</td>
                    <td className={`${cell} bg-teal-50/30`}>{m.baggageRetrievalEnd || dash}</td>
                    <td className={`${cell} bg-teal-50/30`}>{m.baggageArrivalAtHKIAL || dash}</td>
                    <td className={`${cell} bg-teal-50/30`}>{m.timeLeftHKIAL || dash}</td>
                    <td className={`${cell} bg-teal-50/30`}>
                      {m.totalProcessingTime
                        ? <span className="px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 text-[10px]">{m.totalProcessingTime}</span>
                        : dash}
                    </td>
                    <td className={`${cell} max-w-[140px]`}>
                      <span className="block truncate text-orange-700" title={m.remarksAdminIssue}>{m.remarksAdminIssue || dash}</span>
                    </td>
                    <td className={`${cell} text-center sticky right-0 z-10 ${rowBg} border-l border-gray-200`}>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed"
                        onClick={() => handleDelete(m.id)}
                        disabled={!canDelete || isDeletingMovement}
                        title={m.source === 'qr_scan' ? 'QR-scan entries are read-only (audit trail)' : 'Delete this entry'}>
                        {isDeletingMovement ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
