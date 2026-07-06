import { useState } from 'react';
import { User, Heart, Eye, Star, AlertCircle, History, MessageSquare, Briefcase, Gem, Trophy, Utensils, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

// 2026-07-07 (round 6.2.126 — HK timezone correction) — replace the
// per-site `new Date().toISOString().split('T')[0]` pattern, which
// returns UTC date (off by one day for users in timezones east of
// UTC, e.g. HK at UTC+8 between 00:00–08:00 local time — verified live
// by Sky 2026-07-07 against admin CreateBooking). This helper uses
// LOCAL components (`getFullYear` / `getMonth` / `getDate`) so the
// returned YYYY-MM-DD string matches the user's wall-clock day.
const localDateStr = (d: Date = new Date()): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// 2026-06-11 — round 6.2.34 UX. Sub-interfaces for the
// customer-profile detail sections. Sourced from the Account's
// `profile_*` JSON columns via the parent wrapper's
// `mapAccountToCustomerProfile` (parent BookingDetail.tsx:34-78).
// Mirrors the shape the staff-edit page
// (`src/components/MemberDetail.tsx`) writes into each column.
// All fields are optional — accounts may have none of these on
// record. The dialog renders an empty state for any section
// that is null / empty.

export interface CustomerSpouse {
  title?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  nationality?: string;
  passportFirst4?: string;
  linkedAccountNo?: string;
}

export interface CustomerVipAppearance {
  ethnicity?: string;
  age?: string;
  height?: string;
  hairColor?: string;
  glasses?: string;
}

export interface CustomerVipWorkInfo {
  industry?: string;
  company?: string;
  position?: string;
  previousWork?: string;
}

export interface CustomerVipObservations {
  handedness?: string;
  preferredLanguage?: string;
  interests?: string;
}

export interface CustomerVipProfile {
  appearance?: CustomerVipAppearance;
  workInfo?: CustomerVipWorkInfo;
  observations?: CustomerVipObservations;
}

export interface CustomerPreference {
  id?: number;
  category?: string;
  preference?: string;
  recordedDate?: string;
  recordedBy?: string;
}

export interface CustomerFoodAllergy {
  id?: number;
  allergen?: string;
  severity?: string;
  notes?: string;
  recordedDate?: string;
}

export interface CustomerDietary {
  id?: number;
  requirement?: string;
  notes?: string;
  recordedDate?: string;
}

export interface CustomerMovement {
  id?: number;
  movementInCharge?: string;
  cicSupport?: string;
  driver?: string;
  orderNo?: string;
  arrDate?: string;
  deptDate?: string;
  flightNo?: string;
  flightTime?: string;
  destinationOrigin?: string;
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

export interface CustomerRemark {
  id?: number;
  remark?: string;
  category?: string;
  createdDate?: string;
  createdBy?: string;
}

export interface CustomerProfile {
  id: number;
  accountNo: string;
  name: string;
  type: string;
  email: string;
  phone: string;
  membershipType?: string;
  membershipExpiry?: string;
  status: string;
  totalBookings: number;
  createdDate: string;
  company?: string;
  // Detail sections — sourced from the Account's profile_*
  // JSON columns via the parent wrapper. All optional;
  // accounts may have none of these on record. When the
  // wrapper cannot fetch the account (`null`) or the booking
  // has no accountId (`undefined`), the view's click handler
  // falls back to a per-booking synthesised profile with
  // only the 12 base fields populated; the dialog renders
  // empty states for the detail sections in that case.
  spouse?: CustomerSpouse | null;
  vipProfile?: CustomerVipProfile | null;
  preferences?: CustomerPreference[];
  allergies?: CustomerFoodAllergy[];
  dietary?: CustomerDietary[];
  movements?: CustomerMovement[];
  remarks?: CustomerRemark[];
  spouseAllergies?: CustomerFoodAllergy[];
  spouseDietary?: CustomerDietary[];
}

interface BookingCustomerProfileProps {
  open: boolean;
  onClose: () => void;
  customer: CustomerProfile | null;
}

const tierIcon = (t?: string) => {
  if (t === 'Sapphire') return <Gem     className="w-4 h-4 text-indigo-500" />;
  if (t === 'Diamond')  return <Gem     className="w-4 h-4 text-sky-500" />;
  if (t === 'Platinum') return <Trophy  className="w-4 h-4 text-purple-500" />;
  if (t === 'Gold')     return <Star    className="w-4 h-4 text-amber-500" />;
  return <User className="w-4 h-4 text-gray-400" />;
};

const severityColor = (s: string) => ({ Mild: 'bg-yellow-100 text-yellow-700', Moderate: 'bg-orange-100 text-orange-700', Severe: 'bg-red-100 text-red-700 border border-red-300' }[s] ?? 'bg-gray-100 text-gray-700');
const remarkCategoryColor = (c: string) => ({ 'VIP Note': 'bg-orange-100 text-orange-700', 'Service Note': 'bg-green-100 text-green-700', 'Special Request': 'bg-purple-100 text-purple-700', 'General': 'bg-blue-100 text-blue-700' }[c] ?? 'bg-gray-100 text-gray-700');
const prefCategoryColor  = (c: string) => ({ 'Seating': 'bg-blue-100 text-blue-700', 'Service': 'bg-purple-100 text-purple-700', 'Beverage': 'bg-amber-100 text-amber-700', 'Temperature': 'bg-cyan-100 text-cyan-700', 'Food': 'bg-green-100 text-green-700' }[c] ?? 'bg-gray-100 text-gray-700');

const TYPE_BADGE: Record<string, string> = {
  Individual: 'bg-blue-100 text-blue-800',
  Corporate: 'bg-purple-100 text-purple-800',
  'Agency': 'bg-orange-100 text-orange-800',
};

export function BookingCustomerProfile({ open, onClose, customer }: BookingCustomerProfileProps) {
  const [tab, setTab] = useState('overview');

  if (!customer) return null;

  const today = localDateStr();
  const isMember = customer.type === 'Individual' && !!customer.membershipExpiry && customer.membershipExpiry >= today;
  const isIndividual = customer.type === 'Individual';

  // 2026-06-11 — round 6.2.34 UX. All detail sections are
  // read from the prop. Defaults: `null` for objects, `[]`
  // for arrays. The wrapper's `mapAccountToCustomerProfile`
  // populates these from the Account's `profile_*` JSON
  // columns; the dev-preview (mock-synthesised) fallback has
  // them all undefined → empty states render correctly.
  const spouse = (isIndividual ? customer.spouse : null) ?? null;
  const vipProfile = customer.vipProfile ?? null;
  const preferences = customer.preferences ?? [];
  const allergies = customer.allergies ?? [];
  const dietary = customer.dietary ?? [];
  const spouseAllergies = isIndividual ? (customer.spouseAllergies ?? []) : [];
  const spouseDietary = isIndividual ? (customer.spouseDietary ?? []) : [];
  const movements = customer.movements ?? [];
  const remarks = customer.remarks ?? [];
  // Spouse tab / Allergies-tab spouse subsection: visible
  // when there's a spouse object OR any spouse allergies /
  // dietary. Pre-6.2.34 the tab was hidden for non-Individual
  // types AND when the synthesised spouse was null; the
  // new logic decouples them so a spouse-allergy row can
  // still render when the spouse object is absent.
  const hasSpouseSection = isIndividual && (!!spouse || spouseAllergies.length > 0 || spouseDietary.length > 0);

  const movCellCls = 'px-3 py-2.5 whitespace-nowrap align-middle text-xs';
  const dash = <span className="text-gray-300">—</span>;

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { setTab('overview'); onClose(); } }}>
      <DialogContent className="min-w-[800px] max-w-[960px] h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogTitle className="sr-only">Customer Profile</DialogTitle>
        <DialogDescription className="sr-only">Full customer profile.</DialogDescription>

        {/* Sticky header */}
        <div className="flex items-center gap-4 px-6 py-4 bg-[#0f2942] shrink-0">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <User className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white leading-tight truncate">{customer.name}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`inline-block px-2 py-0.5 rounded text-xs ${TYPE_BADGE[customer.type] ?? 'bg-gray-100 text-gray-800'}`}>{customer.type}</span>
              {isMember && customer.membershipType && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-800">
                  {tierIcon(customer.membershipType)}{customer.membershipType}
                </span>
              )}
              <span className={`inline-block px-2 py-0.5 rounded text-xs ${customer.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{customer.status}</span>
              <span className="text-white/60 text-xs">{customer.accountNo}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors shrink-0 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab} className="flex flex-col flex-1 overflow-hidden">
          <div className="border-b bg-white shrink-0 px-2 overflow-x-auto">
            <TabsList className="h-auto bg-transparent p-0 gap-0 flex flex-nowrap min-w-max">
              {[
                { value: 'overview',  label: 'Overview',       icon: <User className="w-3.5 h-3.5" /> },
                ...(hasSpouseSection ? [{ value: 'spouse', label: 'Spouse', icon: <Heart className="w-3.5 h-3.5" /> }] : []),
                { value: 'vip',       label: 'VIP Profile',    icon: <Eye className="w-3.5 h-3.5" /> },
                { value: 'prefs',     label: 'Preferences',    icon: <Star className="w-3.5 h-3.5" /> },
                { value: 'allergies', label: 'Food Allergies', icon: <AlertCircle className="w-3.5 h-3.5" /> },
                { value: 'movements', label: 'Movements',      icon: <History className="w-3.5 h-3.5" /> },
                { value: 'remarks',   label: 'Remarks',        icon: <MessageSquare className="w-3.5 h-3.5" /> },
              ].map(t => (
                <TabsTrigger key={t.value} value={t.value}
                  className="flex items-center gap-1.5 px-3 py-3 text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-[#0f2942] data-[state=active]:text-[#0f2942] data-[state=active]:bg-transparent text-gray-500 hover:text-gray-700 transition-colors whitespace-nowrap"
                >
                  {t.icon}{t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Overview */}
            <TabsContent value="overview" className="m-0 p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Account Number', value: customer.accountNo },
                  { label: 'Account Type',   value: customer.type },
                  { label: 'Email',          value: customer.email },
                  { label: 'Phone',          value: customer.phone },
                  { label: 'Member Since',   value: customer.createdDate },
                  { label: 'Total Bookings', value: `${customer.totalBookings}` },
                  ...(customer.company ? [{ label: 'Company', value: customer.company }] : []),
                  { label: 'Status',         value: customer.status },
                ].map(row => (
                  <div key={row.label} className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">{row.label}</p>
                    <p className="text-sm mt-0.5 break-words">{row.value}</p>
                  </div>
                ))}
              </div>
              {isIndividual && customer.membershipType && (
                <div className={`p-4 rounded-lg border ${isMember ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-gray-50'}`}>
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Membership Package</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {tierIcon(customer.membershipType)}
                      <div>
                        <p className="text-sm">{customer.membershipType} Tier</p>
                        <p className="text-xs text-gray-500 mt-0.5">Expiry: {customer.membershipExpiry}</p>
                      </div>
                    </div>
                    {isMember
                      ? <span className="px-3 py-1 rounded-full text-xs bg-amber-100 text-amber-800 border border-amber-200">Active</span>
                      : <span className="px-3 py-1 rounded-full text-xs bg-red-100 text-red-700 border border-red-200">Expired</span>}
                  </div>
                </div>
              )}
              {allergies.some(a => a.severity === 'Severe') && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-800">Severe allergy on record</p>
                    <p className="text-xs text-red-600 mt-0.5">{allergies.filter(a => a.severity === 'Severe').map(a => a.allergen).join(', ')} — see Food Allergies tab.</p>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Spouse */}
            {hasSpouseSection && (
              <TabsContent value="spouse" className="m-0 p-5">
                {spouse ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-pink-50 border border-pink-200 rounded-xl">
                      <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center shrink-0">
                        <Heart className="w-6 h-6 text-pink-500" />
                      </div>
                      <div>
                        <p className="text-sm">{spouse.title} {spouse.firstName} {spouse.lastName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{spouse.email}</p>
                        <p className="text-xs text-gray-500">{spouse.phone}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Full Name',          value: `${spouse.title} ${spouse.firstName} ${spouse.lastName}` },
                        { label: 'Email',              value: spouse.email },
                        { label: 'Phone',              value: spouse.phone },
                        { label: 'Nationality',        value: spouse.nationality },
                        { label: 'Passport (first 4)', value: spouse.passportFirst4 },
                        { label: 'Linked Account',     value: spouse.linkedAccountNo || '—' },
                      ].map(row => (
                        <div key={row.label} className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500">{row.label}</p>
                          <p className="text-sm mt-0.5 break-words">{row.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-14 text-center">
                    <Heart className="w-10 h-10 text-gray-200 mb-3" />
                    <p className="text-sm text-gray-400">No spouse / partner on record.</p>
                  </div>
                )}
              </TabsContent>
            )}

            {/* VIP Profile */}
            <TabsContent value="vip" className="m-0 p-5 space-y-5">
              {vipProfile ? (
                <>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-3 flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" />Appearance</p>
                    <div className="grid grid-cols-3 gap-3">
                      {vipProfile.appearance && Object.entries(vipProfile.appearance).map(([k, v]) => (
                        <div key={k} className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 capitalize">{k.replace(/([A-Z])/g, ' $1')}</p>
                          <p className="text-sm mt-0.5">{v}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-3 flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" />Work Information</p>
                    <div className="grid grid-cols-2 gap-3">
                      {vipProfile.workInfo && Object.entries(vipProfile.workInfo).map(([k, v]) => (
                        <div key={k} className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 capitalize">{k.replace(/([A-Z])/g, ' $1')}</p>
                          <p className="text-sm mt-0.5">{v}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-3 flex items-center gap-1.5"><User className="w-3.5 h-3.5" />Observations</p>
                    <div className="grid grid-cols-3 gap-3">
                      {vipProfile.observations && Object.entries(vipProfile.observations).map(([k, v]) => (
                        <div key={k} className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 capitalize">{k.replace(/([A-Z])/g, ' $1')}</p>
                          <p className="text-sm mt-0.5">{v}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <Eye className="w-10 h-10 text-gray-200 mb-3" />
                  <p className="text-sm text-gray-400">No VIP profile on record.</p>
                </div>
              )}
            </TabsContent>

            {/* Preferences */}
            <TabsContent value="prefs" className="m-0 p-5 space-y-3">
              {preferences.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <Star className="w-10 h-10 text-gray-200 mb-3" />
                  <p className="text-sm text-gray-400">No preferences on record.</p>
                </div>
              ) : (
                preferences.map(pref => (
                  <div key={pref.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${prefCategoryColor(pref.category)}`}>{pref.category}</span>
                      <span className="text-xs text-gray-400">Recorded {pref.recordedDate} by {pref.recordedBy}</span>
                    </div>
                    <p className="text-sm text-gray-800">{pref.preference}</p>
                  </div>
                ))
              )}
            </TabsContent>

            {/* Food Allergies */}
            <TabsContent value="allergies" className="m-0 p-5 space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <p className="text-sm text-gray-700">{customer.name}</p>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Customer</span>
                </div>
                {allergies.length === 0 ? (
                  <p className="text-sm text-gray-400 py-3 text-center border-2 border-dashed rounded-lg">No allergies recorded.</p>
                ) : (
                  <div className="space-y-2">
                    {allergies.map(a => (
                      <div key={a.id} className={`p-3 border rounded-lg ${a.severity === 'Severe' ? 'bg-red-50 border-red-300' : 'bg-yellow-50 border-yellow-200'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm">{a.allergen}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${severityColor(a.severity)}`}>{a.severity}</span>
                        </div>
                        <p className="text-xs text-gray-600">{a.notes}</p>
                        <p className="text-xs text-gray-400 mt-1">Recorded {a.recordedDate}</p>
                      </div>
                    ))}
                  </div>
                )}
                {dietary.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1 mb-2"><Utensils className="w-3 h-3" />Dietary Requirements</p>
                    {dietary.map(d => (
                      <div key={d.id} className="p-3 border border-gray-200 rounded-lg bg-green-50">
                        <p className="text-sm">{d.requirement}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{d.notes}</p>
                        <p className="text-xs text-gray-400 mt-1">Recorded {d.recordedDate}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {hasSpouseSection && (
                <>
                  <div className="border-t border-gray-200" />
                  <div>
                    {spouse && (
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-full bg-pink-100 flex items-center justify-center">
                          <Heart className="w-3.5 h-3.5 text-pink-500" />
                        </div>
                        <p className="text-sm text-gray-700">{spouse.title} {spouse.firstName} {spouse.lastName}</p>
                        <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">Spouse</span>
                      </div>
                    )}
                    {spouseAllergies.length === 0 ? (
                      <p className="text-sm text-gray-400 py-3 text-center border-2 border-dashed rounded-lg">No allergies recorded for spouse.</p>
                    ) : (
                      <div className="space-y-2">
                        {spouseAllergies.map(a => (
                          <div key={a.id} className={`p-3 border rounded-lg ${a.severity === 'Severe' ? 'bg-red-50 border-red-300' : 'bg-yellow-50 border-yellow-200'}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm">{a.allergen}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${severityColor(a.severity)}`}>{a.severity}</span>
                            </div>
                            <p className="text-xs text-gray-600">{a.notes}</p>
                            <p className="text-xs text-gray-400 mt-1">Recorded {a.recordedDate}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {spouseDietary.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1 mb-2"><Utensils className="w-3 h-3" />Dietary Requirements</p>
                        {spouseDietary.map(d => (
                          <div key={d.id} className="p-3 border border-gray-200 rounded-lg bg-green-50">
                            <p className="text-sm">{d.requirement}</p>
                            <p className="text-xs text-gray-600 mt-0.5">{d.notes}</p>
                            <p className="text-xs text-gray-400 mt-1">Recorded {d.recordedDate}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </TabsContent>

            {/* Movements */}
            <TabsContent value="movements" className="m-0 p-3">
              {movements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <History className="w-10 h-10 text-gray-200 mb-3" />
                  <p className="text-sm text-gray-400">No movements on record.</p>
                </div>
              ) : (
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
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {movements.map((m, idx) => {
                      const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60';
                      return (
                        <tr key={m.id} className={`${rowBg} hover:bg-blue-50/40 transition-colors`}>
                          <td className={`${movCellCls} sticky left-0 z-10 ${rowBg} border-r border-gray-200 text-center`}>
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#0f2942]/10 text-[#0f2942]">{m.id}</span>
                          </td>
                          <td className={movCellCls}>{m.movementInCharge || dash}</td>
                          <td className={movCellCls}>{m.cicSupport || dash}</td>
                          <td className={movCellCls}>{m.driver || dash}</td>
                          <td className={`${movCellCls} bg-blue-50/30`}><span className="font-mono text-[11px] text-blue-800">{m.orderNo}</span></td>
                          <td className={`${movCellCls} bg-blue-50/30`}>{m.deptDate || dash}</td>
                          <td className={`${movCellCls} bg-blue-50/30`}>{m.arrDate || dash}</td>
                          <td className={`${movCellCls} bg-blue-50/30 font-medium`}>{m.flightNo}</td>
                          <td className={`${movCellCls} bg-blue-50/30`}>{m.flightTime}</td>
                          <td className={`${movCellCls} bg-blue-50/30`}><span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px]">{m.destinationOrigin}</span></td>
                          <td className={movCellCls}>{m.lobbySuite || dash}</td>
                          <td className={`${movCellCls} text-center`}>{m.noOfPax ?? dash}</td>
                          <td className={movCellCls}>{m.title || dash}</td>
                          <td className={movCellCls}>{m.firstName || dash}</td>
                          <td className={movCellCls}>{m.lastName || dash}</td>
                          <td className={`${movCellCls} text-center`}>{m.noOfCIBaggage ?? dash}</td>
                          <td className={`${movCellCls} max-w-[140px]`}><span className="block truncate" title={m.remarks}>{m.remarks || dash}</span></td>
                          <td className={movCellCls}>{m.nationality || dash}</td>
                          <td className={`${movCellCls} bg-teal-50/30`}>{m.arrTimeNonFlyingGuests || dash}</td>
                          <td className={`${movCellCls} bg-teal-50/30`}>{m.timeMetVIPAtGate || dash}</td>
                          <td className={`${movCellCls} bg-teal-50/30`}>{m.timeBackToHKIAL || dash}</td>
                          <td className={`${movCellCls} bg-teal-50/30`}>{m.baggageRetrievalStart || dash}</td>
                          <td className={`${movCellCls} bg-teal-50/30`}>{m.baggageRetrievalEnd || dash}</td>
                          <td className={`${movCellCls} bg-teal-50/30`}>{m.baggageArrivalAtHKIAL || dash}</td>
                          <td className={`${movCellCls} bg-teal-50/30`}>{m.timeLeftHKIAL || dash}</td>
                          <td className={`${movCellCls} bg-teal-50/30`}>{m.totalProcessingTime ? <span className="px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 text-[10px]">{m.totalProcessingTime}</span> : dash}</td>
                          <td className={`${movCellCls} max-w-[140px]`}><span className="block truncate text-orange-700" title={m.remarksAdminIssue}>{m.remarksAdminIssue || dash}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              )}
            </TabsContent>

            {/* Remarks */}
            <TabsContent value="remarks" className="m-0 p-5 space-y-3">
              {remarks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <MessageSquare className="w-10 h-10 text-gray-200 mb-3" />
                  <p className="text-sm text-gray-400">No remarks on record.</p>
                </div>
              ) : (
                remarks.map(r => (
                  <div key={r.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${remarkCategoryColor(r.category)}`}>{r.category}</span>
                      <span className="text-xs text-gray-400">{r.createdDate} by {r.createdBy}</span>
                    </div>
                    <p className="text-sm text-gray-800">{r.remark}</p>
                  </div>
                ))
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
