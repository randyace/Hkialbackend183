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

export interface MovementEntry {
  id: number;
  source?: 'manual' | 'qr_scan' | string;
  movementInCharge?: string;
  cicSupport?: string;
  driver?: string;
  orderNo: string;
  deptDate?: string;
  arrDate?: string;
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

// `form` is intentionally `Partial<MovementEntry>` — entries are
// log-style observations, staff fill only what they observe. The
// only required fields per the backend validator are `orderNo`,
// `flightNo`, `flightTime`, `destinationOrigin`, but the UI does
// not enforce that here (server-side validator does).
export type MovementForm = Partial<MovementEntry>;

interface BookingMovementLogProps {
  open: boolean;
  onClose: () => void;
  booking: LogBooking;
  /** Real movement entries from `GET /api/bookings/{id}/movements`. */
  movements?: MovementEntry[];
  /** Called with the captured form state when the user clicks "Add Movement". */
  onAddMovement?: (form: MovementForm) => Promise<void>;
  /** Called when the user clicks the per-row delete button (manual entries only). */
  onDeleteMovement?: (id: number) => Promise<void>;
  /** Disable Add button while the parent's POST is in flight. */
  isAddingMovement?: boolean;
  /** Disable Delete button while the parent's DELETE is in flight. */
  isDeletingMovement?: boolean;
}

const EMPTY_FORM: MovementForm = {
  movementInCharge: '',
  cicSupport: '',
  driver: '',
  orderNo: '',
  deptDate: '',
  arrDate: '',
  flightNo: '',
  flightTime: '',
  destinationOrigin: '',
  lobbySuite: '',
  noOfPax: undefined,
  title: '',
  firstName: '',
  lastName: '',
  noOfCIBaggage: undefined,
  remarks: '',
  nationality: '',
  arrTimeNonFlyingGuests: '',
  timeMetVIPAtGate: '',
  timeBackToHKIAL: '',
  baggageRetrievalStart: '',
  baggageRetrievalEnd: '',
  baggageArrivalAtHKIAL: '',
  timeLeftHKIAL: '',
  totalProcessingTime: '',
  remarksAdminIssue: '',
};

export function BookingMovementLog({
  open,
  onClose,
  booking,
  movements: movementsProp = [],
  onAddMovement,
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

  const [isAddMovementOpen, setIsAddMovementOpen] = useState(false);
  const [form, setForm] = useState<MovementForm>(EMPTY_FORM);

  const dash = <span className="text-gray-300">—</span>;
  const cell = 'px-3 py-2.5 whitespace-nowrap align-middle';

  const resetForm = () => setForm(EMPTY_FORM);

  const openAddDialog = () => {
    // Pre-fill booking-reference fields from the parent booking.
    setForm({
      ...EMPTY_FORM,
      orderNo: booking.bookingNo,
      arrDate: booking.flightType === 'Arrival' ? (booking.arrivalDate ?? '') : '',
      deptDate: booking.flightType === 'Departure' ? (booking.arrivalDate ?? '') : '',
      flightNo: booking.flightNo ?? '',
      flightTime: booking.flightTime ?? '',
      destinationOrigin: booking.flightOrigin ?? booking.flightDestination ?? '',
      lobbySuite: booking.suite ?? '',
      noOfPax: booking.numberOfGuests,
      noOfCIBaggage: booking.numberOfLuggage,
    });
    setIsAddMovementOpen(true);
  };

  const handleSubmitAdd = async () => {
    if (!onAddMovement) {
      toast.error('Add Movement is not wired — please configure the parent wrapper.');
      return;
    }
    try {
      await onAddMovement(form);
      toast.success('Movement record added successfully.');
      setIsAddMovementOpen(false);
      resetForm();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add movement record.';
      toast.error(message);
    }
  };

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
    <>
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
            <Button size="sm" onClick={openAddDialog} disabled={!onAddMovement || isAddingMovement}>
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
                      No movement records yet. Click "Add Movement" to create the first entry.
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

      {/* Add Movement Sub-Dialog */}
      <Dialog open={isAddMovementOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsAddMovementOpen(open); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600" />Add Movement Record
            </DialogTitle>
            <DialogDescription>
              Fields marked * are required. Booking reference fields are pre-filled from the booking — edit if needed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 pt-1">
            <div>
              <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-3 pb-1 border-b">Assignment</h4>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Movement In Charge</label>
                  <input type="text" placeholder="Staff name" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={form.movementInCharge ?? ''} onChange={e => setForm(f => ({ ...f, movementInCharge: e.target.value }))} /></div>
                <div><label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>CIC &amp; Support</label>
                  <input type="text" placeholder="Staff name(s)" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={form.cicSupport ?? ''} onChange={e => setForm(f => ({ ...f, cicSupport: e.target.value }))} /></div>
                <div><label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Driver</label>
                  <input type="text" placeholder="Driver name" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={form.driver ?? ''} onChange={e => setForm(f => ({ ...f, driver: e.target.value }))} /></div>
              </div>
            </div>

            <div>
              <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-3 pb-1 border-b">
                Booking Reference <span className="ml-2 normal-case text-blue-500">(pre-filled from booking)</span>
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-3 md:col-span-1">
                  <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Order No. (Booking No.) <span className="text-red-500">*</span></label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono bg-blue-50"
                    value={form.orderNo ?? ''} onChange={e => setForm(f => ({ ...f, orderNo: e.target.value }))} />
                </div>
                <div><label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Dept Date</label>
                  <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-blue-50"
                    value={form.deptDate ?? ''} onChange={e => setForm(f => ({ ...f, deptDate: e.target.value }))} /></div>
                <div><label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Arr Date</label>
                  <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-blue-50"
                    value={form.arrDate ?? ''} onChange={e => setForm(f => ({ ...f, arrDate: e.target.value }))} /></div>
                <div><label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Flight No. <span className="text-red-500">*</span></label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm uppercase bg-blue-50"
                    value={form.flightNo ?? ''} onChange={e => setForm(f => ({ ...f, flightNo: e.target.value.toUpperCase() }))} /></div>
                <div><label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Flight Time <span className="text-red-500">*</span></label>
                  <input type="time" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-blue-50"
                    value={form.flightTime ?? ''} onChange={e => setForm(f => ({ ...f, flightTime: e.target.value }))} /></div>
                <div><label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Destination / Origin <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="IATA code" maxLength={3} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm uppercase bg-blue-50"
                    value={form.destinationOrigin ?? ''} onChange={e => setForm(f => ({ ...f, destinationOrigin: e.target.value.toUpperCase() }))} /></div>
              </div>
            </div>

            <div>
              <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-3 pb-1 border-b">Lounge &amp; Guest Details</h4>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Lobby / Suite</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={form.lobbySuite ?? ''} onChange={e => setForm(f => ({ ...f, lobbySuite: e.target.value }))} /></div>
                <div><label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>No. of Pax</label>
                  <input type="number" min={1} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={form.noOfPax ?? ''} onChange={e => setForm(f => ({ ...f, noOfPax: e.target.value === '' ? undefined : Number(e.target.value) }))} /></div>
                <div><label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>No. of C/I Baggage</label>
                  <input type="number" min={0} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={form.noOfCIBaggage ?? ''} onChange={e => setForm(f => ({ ...f, noOfCIBaggage: e.target.value === '' ? undefined : Number(e.target.value) }))} /></div>
                <div><label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Title</label>
                  <input type="text" placeholder="Mr. / Mrs. / Ms." className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={form.title ?? ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
                <div><label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>First Name</label>
                  <input type="text" placeholder="First name" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={form.firstName ?? ''} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} /></div>
                <div><label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Last Name</label>
                  <input type="text" placeholder="Last name" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={form.lastName ?? ''} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} /></div>
                <div><label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Nationality of Guests</label>
                  <input type="text" placeholder="e.g. United Kingdom" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={form.nationality ?? ''} onChange={e => setForm(f => ({ ...f, nationality: e.target.value }))} /></div>
                <div className="col-span-2"><label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Remarks</label>
                  <textarea rows={2} placeholder="General remarks..." className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
                    value={form.remarks ?? ''} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} /></div>
              </div>
            </div>

            <div>
              <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-3 pb-1 border-b">Movement Times</h4>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Arrival Time of Non-Flying Guests at HKIAL</label>
                  <input type="time" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={form.arrTimeNonFlyingGuests ?? ''} onChange={e => setForm(f => ({ ...f, arrTimeNonFlyingGuests: e.target.value }))} /></div>
                <div><label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Time Met VIP at Gate / VIP Arrive at HKIAL</label>
                  <input type="time" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={form.timeMetVIPAtGate ?? ''} onChange={e => setForm(f => ({ ...f, timeMetVIPAtGate: e.target.value }))} /></div>
                <div><label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Time Back to HKIAL</label>
                  <input type="time" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={form.timeBackToHKIAL ?? ''} onChange={e => setForm(f => ({ ...f, timeBackToHKIAL: e.target.value }))} /></div>
                <div><label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Baggage Retrieval (Start Time)</label>
                  <input type="time" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={form.baggageRetrievalStart ?? ''} onChange={e => setForm(f => ({ ...f, baggageRetrievalStart: e.target.value }))} /></div>
                <div><label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Baggage Retrieval (End Time)</label>
                  <input type="time" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={form.baggageRetrievalEnd ?? ''} onChange={e => setForm(f => ({ ...f, baggageRetrievalEnd: e.target.value }))} /></div>
                <div><label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Baggage Arrival at HKIAL</label>
                  <input type="time" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={form.baggageArrivalAtHKIAL ?? ''} onChange={e => setForm(f => ({ ...f, baggageArrivalAtHKIAL: e.target.value }))} /></div>
                <div><label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Time Left HKIAL / At Boarding Gate</label>
                  <input type="time" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={form.timeLeftHKIAL ?? ''} onChange={e => setForm(f => ({ ...f, timeLeftHKIAL: e.target.value }))} /></div>
                <div><label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Total Processing Time</label>
                  <input type="text" placeholder="e.g. 1h 30m" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={form.totalProcessingTime ?? ''} onChange={e => setForm(f => ({ ...f, totalProcessingTime: e.target.value }))} /></div>
                <div><label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Remarks for Admin Issue</label>
                  <textarea rows={2} placeholder="Admin issue details..." className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
                    value={form.remarksAdminIssue ?? ''} onChange={e => setForm(f => ({ ...f, remarksAdminIssue: e.target.value }))} /></div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-2 border-t">
            <Button variant="outline" onClick={() => { setIsAddMovementOpen(false); resetForm(); }} disabled={isAddingMovement}>Cancel</Button>
            <Button onClick={handleSubmitAdd} disabled={isAddingMovement}>
              {isAddingMovement
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Adding...</>
                : <><Plus className="w-4 h-4 mr-2" />Add Movement</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}