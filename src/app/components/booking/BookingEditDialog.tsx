import { useState, ReactNode } from 'react';
import { Edit2, Plane, Building2, Tag, MessageSquare, Car, Accessibility, Search, X, Plus, Minus, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { toast } from 'sonner@2.0.3';

interface EditBooking {
  bookingNo: string;
  flightType?: 'Arrival' | 'Departure';
  flightNo: string;
  flightTime: string;
  flightOrigin?: string;
  flightDestination?: string;
  flightClass?: string;
  suite: string;
  dateTime: string;
  numberOfGuests?: number;
  nonFlyingGuests?: number;
  numberOfLuggage?: number;
  services?: string[];
}

interface EditLimoStop { id: number; type: 'Pick-up' | 'Destination'; location: string; }

interface AddonService { key: string; icon: ReactNode; desc: string; defaultPrice: string; }

const ADDON_SERVICES: AddonService[] = [
  { key: 'Lounge Extension',              icon: null, desc: 'Extend lounge access time',              defaultPrice: '500.00'  },
  { key: 'Limousine Service',             icon: null, desc: 'Private car transfer service',           defaultPrice: '800.00'  },
  { key: 'Wheelchair Assistance',         icon: null, desc: 'Mobility & accessibility support',       defaultPrice: '0.00'    },
  { key: 'Security Escort Service',       icon: null, desc: 'Dedicated security escort',              defaultPrice: '1200.00' },
  { key: 'Meet & Greet Service',          icon: null, desc: 'Dedicated greeter at arrival gate',      defaultPrice: '600.00'  },
  { key: 'Fast Track Immigration',        icon: null, desc: 'Priority immigration clearance',         defaultPrice: '400.00'  },
  { key: 'Buggy Transfer Service',        icon: null, desc: 'Electric buggy within terminal',         defaultPrice: '0.00'    },
  { key: 'Baggage Handling',              icon: null, desc: 'Assisted luggage service',               defaultPrice: '150.00'  },
  { key: 'Porter Service',                icon: null, desc: 'On-demand porter assistance',            defaultPrice: '100.00'  },
  { key: 'Shower Service',                icon: null, desc: 'Private shower with amenities',          defaultPrice: '200.00'  },
  { key: 'Day Room (4 hrs)',              icon: null, desc: 'Private suite day-use booking',          defaultPrice: '1800.00' },
  { key: 'Day Room Extension (per hr)',   icon: null, desc: 'Hourly extension of day room',           defaultPrice: '450.00'  },
  { key: 'VIP Escort (Airside)',          icon: null, desc: 'Escorted airside access with staff',     defaultPrice: '1500.00' },
  { key: 'Printing Service',              icon: null, desc: 'Document printing (per page)',           defaultPrice: '20.00'   },
  { key: 'Flight Rebooking Assistance',   icon: null, desc: 'Staff-assisted flight rebooking',        defaultPrice: '0.00'    },
  { key: 'Lounge Access – Extra Adult',   icon: null, desc: 'Additional adult lounge entry',          defaultPrice: '350.00'  },
  { key: 'Lounge Access – Extra Child',   icon: null, desc: 'Additional child entry (2–11 yrs)',      defaultPrice: '180.00'  },
  { key: 'Birthday / Celebration Setup',  icon: null, desc: 'Cake, décor & personalised message',    defaultPrice: '800.00'  },
  { key: 'Video Conference Room',         icon: null, desc: 'Private VC-equipped meeting room',       defaultPrice: '1200.00' },
  { key: 'Private Dining Room',           icon: null, desc: 'Exclusive dining space (up to 8 pax)',   defaultPrice: '2500.00' },
  { key: 'Flower / Gift Arrangement',     icon: null, desc: 'In-lounge gift or floral setup',         defaultPrice: '500.00'  },
  { key: 'Special Meal Request',          icon: null, desc: 'Dietary or custom meal arrangement',     defaultPrice: '0.00'    },
];

interface BookingEditDialogProps {
  open: boolean;
  onClose: () => void;
  booking: EditBooking;
}

export function BookingEditDialog({ open, onClose, booking }: BookingEditDialogProps) {
  const [editFlightType,    setEditFlightType]    = useState<'Arrival' | 'Departure' | 'Transition'>(booking.flightType ?? 'Departure');
  const [editFlightNo,      setEditFlightNo]      = useState(booking.flightNo);
  const [editFlightTime,    setEditFlightTime]    = useState(booking.flightTime);
  const [editFlightOrigin,  setEditFlightOrigin]  = useState(booking.flightOrigin ?? '');
  const [editFlightDest,    setEditFlightDest]    = useState(booking.flightDestination ?? '');
  const [editFlightClass,   setEditFlightClass]   = useState(booking.flightClass ?? '');
  const [editSuite,         setEditSuite]         = useState(booking.suite);
  const [editVisitDate,     setEditVisitDate]     = useState(booking.dateTime.split(' ')[0]);
  const [editVisitTime,     setEditVisitTime]     = useState(booking.dateTime.split(' ')[1]);
  const [editNumGuests,     setEditNumGuests]     = useState(booking.numberOfGuests ?? 1);
  const [editNonFlying,     setEditNonFlying]     = useState(booking.nonFlyingGuests ?? 0);
  const [editNumLuggage,    setEditNumLuggage]    = useState(booking.numberOfLuggage ?? 1);
  const [editSpecialReqs,   setEditSpecialReqs]   = useState('');
  const [editSelectedServices, setEditSelectedServices] = useState<string[]>(booking.services ?? []);
  const [editLimoStops, setEditLimoStops] = useState<EditLimoStop[]>([{ id: 1, type: 'Pick-up', location: '' }]);
  const [editAddonSearch, setEditAddonSearch] = useState('');
  const [showEditAddonDropdown, setShowEditAddonDropdown] = useState(false);

  const addEditLimoStop    = () => setEditLimoStops(prev => [...prev, { id: Date.now(), type: 'Destination', location: '' }]);
  const removeEditLimoStop = (id: number) => setEditLimoStops(prev => prev.length > 1 ? prev.filter(s => s.id !== id) : prev);
  const updateEditLimoStop = (id: number, field: keyof EditLimoStop, value: string) =>
    setEditLimoStops(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));

  const handleEditToggleService = (key: string) => {
    setEditSelectedServices(prev => prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]);
    if (!editSelectedServices.includes(key)) {
      setEditAddonSearch('');
      setShowEditAddonDropdown(false);
    }
  };

  const handleSave = () => {
    if (!editFlightNo.trim()) { toast.error('Flight number is required.'); return; }
    if (!editVisitDate)       { toast.error('Visit date is required.'); return; }
    toast.success('Booking updated successfully!');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="w-5 h-5 text-blue-600" />
            Edit Booking — {booking.bookingNo}
          </DialogTitle>
          <DialogDescription>
            Update the booking details below. Changes will be saved after clicking "Save Changes".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-1">
          {/* Section 1: Flight Details */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3 pb-1 border-b flex items-center gap-1.5">
              <Plane className="w-3.5 h-3.5" /> Flight Details
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Flight Type</label>
                <select value={editFlightType} onChange={e => setEditFlightType(e.target.value as 'Arrival' | 'Departure' | 'Transition')} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white">
                  <option value="Arrival">Arrival</option>
                  <option value="Departure">Departure</option>
                  <option value="Transition">Transition</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Flight Number <span className="text-red-500">*</span></label>
                <input type="text" value={editFlightNo} onChange={e => setEditFlightNo(e.target.value.toUpperCase())} placeholder="e.g. CX880" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm uppercase" />
              </div>
              <div>
                <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Flight Time</label>
                <input type="time" value={editFlightTime} onChange={e => setEditFlightTime(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Flight Class</label>
                <select value={editFlightClass} onChange={e => setEditFlightClass(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white">
                  <option value="">— Select —</option>
                  <option value="Economy Class">Economy Class</option>
                  <option value="Business Class">Business Class</option>
                  <option value="First Class">First Class</option>
                </select>
              </div>
              {editFlightType === 'Departure' ? (
                <div>
                  <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Destination (IATA)</label>
                  <input type="text" value={editFlightDest} onChange={e => setEditFlightDest(e.target.value.toUpperCase())} placeholder="e.g. LHR" maxLength={3} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm uppercase" />
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Origin (IATA)</label>
                  <input type="text" value={editFlightOrigin} onChange={e => setEditFlightOrigin(e.target.value.toUpperCase())} placeholder="e.g. NRT" maxLength={3} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm uppercase" />
                </div>
              )}
              <div>
                <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>No. of Luggage</label>
                <input type="number" value={editNumLuggage} min={0} onChange={e => setEditNumLuggage(Math.max(0, parseInt(e.target.value) || 0))} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
              </div>
            </div>
          </div>

          {/* Section 2: Lounge Details */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3 pb-1 border-b flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> Lounge Details
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Suite / Area <span className="text-red-500">*</span></label>
                <select value={editSuite} onChange={e => setEditSuite(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white">
                  {['VIP Suite A', 'VIP Suite B', 'Executive Suite', 'Business Suite', 'Premier Suite', 'Open Lounge'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Visit Date <span className="text-red-500">*</span></label>
                <input type="date" value={editVisitDate} onChange={e => setEditVisitDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Visit Time</label>
                <input type="time" value={editVisitTime} onChange={e => setEditVisitTime(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>No. of VIP Guests</label>
                <input type="number" value={editNumGuests} min={1} onChange={e => setEditNumGuests(Math.max(1, parseInt(e.target.value) || 1))} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>No. of Non-Flying Guests</label>
                <input type="number" value={editNonFlying} min={0} onChange={e => setEditNonFlying(Math.max(0, parseInt(e.target.value) || 0))} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
              </div>
            </div>
          </div>

          {/* Section 3: Add-on Services */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3 pb-1 border-b flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" /> Add-on Services
            </h4>

            {editSelectedServices.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {editSelectedServices.map(svc => (
                  <div key={svc} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-sm text-blue-800">
                    <span>{svc}</span>
                    <button type="button" onClick={() => setEditSelectedServices(prev => prev.filter(s => s !== svc))} className="ml-0.5 text-blue-400 hover:text-blue-700">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search services to add…"
                  value={editAddonSearch}
                  onChange={e => { setEditAddonSearch(e.target.value); setShowEditAddonDropdown(true); }}
                  onFocus={() => setShowEditAddonDropdown(true)}
                  onBlur={() => setTimeout(() => setShowEditAddonDropdown(false), 150)}
                  className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {editAddonSearch && (
                  <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => { setEditAddonSearch(''); setShowEditAddonDropdown(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {showEditAddonDropdown && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-30 max-h-64 overflow-y-auto">
                  {(() => {
                    const q = editAddonSearch.trim().toLowerCase();
                    const results = q ? ADDON_SERVICES.filter(s => s.key.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q)) : ADDON_SERVICES;
                    if (results.length === 0) return <div className="px-4 py-3 text-sm text-gray-500">No services found.</div>;
                    return results.map(({ key, desc, defaultPrice }) => {
                      const selected = editSelectedServices.includes(key);
                      return (
                        <button key={key} type="button" onMouseDown={e => e.preventDefault()} onClick={() => handleEditToggleService(key)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-blue-50 border-b border-gray-100 last:border-0 transition-colors ${selected ? 'bg-blue-50/60' : ''}`}>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{key}</p>
                            <p className="text-xs text-gray-500">{desc}</p>
                          </div>
                          <span className="text-xs text-gray-400 shrink-0">
                            {parseFloat(defaultPrice) === 0 ? 'Complimentary' : `HK$${parseFloat(defaultPrice).toLocaleString()}`}
                          </span>
                          {selected ? <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" /> : <Plus className="w-4 h-4 text-gray-300 shrink-0" />}
                        </button>
                      );
                    });
                  })()}
                </div>
              )}
            </div>

            {editSelectedServices.includes('Limousine Service') && (
              <div className="mt-3 p-3 rounded-lg border border-purple-200 bg-purple-50/40">
                <div className="flex items-center gap-2 mb-2">
                  <Car className="w-4 h-4 text-purple-600" />
                  <p className="text-xs text-purple-800 font-medium">Limousine Service — Pick-up &amp; Drop-off Stops</p>
                </div>
                <div className="space-y-2">
                  {editLimoStops.map((stop, idx) => (
                    <div key={stop.id} className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs flex items-center justify-center shrink-0">{idx + 1}</span>
                      <select value={stop.type} onChange={e => updateEditLimoStop(stop.id, 'type', e.target.value)} className="px-2 py-1.5 border rounded text-sm bg-white w-36 shrink-0">
                        <option value="Pick-up">Pick-up</option>
                        <option value="Destination">Destination</option>
                      </select>
                      <input type="text" value={stop.location} onChange={e => updateEditLimoStop(stop.id, 'location', e.target.value)} placeholder={stop.type === 'Pick-up' ? 'e.g. Terminal 1' : 'e.g. Four Seasons Hotel'} className="flex-1 px-3 py-1.5 border rounded text-sm" />
                      <button type="button" onClick={() => removeEditLimoStop(stop.id)} disabled={editLimoStops.length === 1} className="p-1.5 rounded border text-gray-400 hover:text-red-500 hover:border-red-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addEditLimoStop} className="mt-2 gap-1 text-purple-700 border-purple-300 hover:bg-purple-50">
                  <Plus className="w-3.5 h-3.5" /> Add Stop
                </Button>
              </div>
            )}

            {editSelectedServices.includes('Wheelchair Assistance') && (
              <div className="mt-3 p-3 rounded-lg border border-blue-200 bg-blue-50/40">
                <div className="flex items-center gap-2 mb-2">
                  <Accessibility className="w-4 h-4 text-blue-600" />
                  <p className="text-xs text-blue-800 font-medium">Wheelchair Assistance — Passenger Details</p>
                </div>
                <input type="text" placeholder="Name of passenger requiring wheelchair assistance" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
              </div>
            )}
          </div>

          {/* Section 4: Special Requests */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3 pb-1 border-b flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" /> Special Requests &amp; Notes
            </h4>
            <textarea
              value={editSpecialReqs}
              onChange={e => setEditSpecialReqs(e.target.value)}
              placeholder="e.g. Birthday celebration, Kosher meal required, Allergy to nuts…"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>
            <CheckCircle className="w-4 h-4 mr-2" />Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
