import { Users, Calendar, Package, DollarSign, Clock, AlertCircle, CheckCircle, XCircle, Plane, UserCheck, Eye, ArrowRight } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';

export type DashboardStatIconKey = 'users' | 'calendar' | 'clock' | 'dollar';
export type DashboardColorTone = 'blue' | 'green' | 'orange' | 'purple' | 'yellow' | 'red' | 'gray';

export interface DashboardStat {
  label: string;
  value: string;
  iconKey: DashboardStatIconKey;
  change: string;
  colorTone: DashboardColorTone;
}

export interface DashboardBookingStatusStat {
  label: string;
  value: number;
  colorTone: DashboardColorTone;
}

export interface DashboardRecentBooking {
  id: number;
  bookingNo: string;
  guestName: string;
  suite: string;
  time: string;
  flightNo: string;
  status: string;
  paymentStatus: string;
  isAdHoc: boolean;
}

export interface DashboardPendingApproval {
  id: number;
  bookingNo: string;
  guestName: string;
  type: 'New' | 'Edit' | 'Cancel';
  bookingTypeLabel: string;
  suite: string;
  submitted: string;
  priority: 'urgent' | 'normal';
  date: string;
  time: string;
  flightNo: string;
  flightTime: string;
  pax: number;
  specialRequests?: string;
  contactPhone?: string;
  accountType?: string;
  originalSuite?: string;
  originalDate?: string;
  originalTime?: string;
  originalPax?: number;
  originalFlightNo?: string;
  originalFlightTime?: string;
}

export interface DashboardUpcomingArrival {
  time: string;
  count: number;
  flightCount: number;
}

export interface DashboardProps {
  loading?: boolean;
  stats: DashboardStat[];
  bookingStatusStats: DashboardBookingStatusStat[];
  recentBookings: DashboardRecentBooking[];
  pendingBookings: DashboardPendingApproval[];
  selectedBooking: DashboardPendingApproval | null;
  availableSuites: number;
  occupiedSuites: number;
  upcomingArrivals: DashboardUpcomingArrival[];
  onSelectBooking: (booking: DashboardPendingApproval | null) => void;
  onCloseSelectedBooking: () => void;
  onApprove: (booking: DashboardPendingApproval) => void;
  onReject: (booking: DashboardPendingApproval) => void;
  getStatusDisplay: (status: string) => string;
  getBookingStatusColor: (status: string) => string;
  getPaymentStatusColor: (status: string) => string;
}

const STAT_ICON_MAP = {
  users: Users,
  calendar: Calendar,
  clock: Clock,
  dollar: DollarSign,
} as const;

const STAT_COLOR_MAP: Record<DashboardColorTone, { color: string; bgColor: string; borderColor: string }> = {
  blue: { color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  green: { color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
  orange: { color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
  purple: { color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
  yellow: { color: 'text-yellow-700', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
  red: { color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  gray: { color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' },
};

const BOOKING_TYPE_BADGE: Record<DashboardPendingApproval['type'], string> = {
  New: 'bg-blue-100 text-blue-700',
  Edit: 'bg-amber-100 text-amber-700',
  Cancel: 'bg-red-100 text-red-700',
};

export function Dashboard({
  loading,
  stats,
  bookingStatusStats,
  recentBookings,
  pendingBookings,
  selectedBooking,
  availableSuites,
  occupiedSuites,
  upcomingArrivals,
  onSelectBooking,
  onCloseSelectedBooking,
  onApprove,
  onReject,
  getStatusDisplay,
  getBookingStatusColor,
  getPaymentStatusColor,
}: DashboardProps) {
  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1>Dashboard</h1>
        <p className="text-gray-600">Welcome to HKIA VIP Lounge Backend System</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = STAT_ICON_MAP[stat.iconKey];
          const palette = STAT_COLOR_MAP[stat.colorTone];
          return (
            <Card key={index} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <h2 className="mt-2">{stat.value}</h2>
                  <p className={`text-sm mt-1 ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change} from last month
                  </p>
                </div>
                <div className={`${palette.bgColor} ${palette.color} p-3 rounded-lg`}>
                  <Icon className="w-8 h-8" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-6">
        <h3 className="mb-4">Booking Status Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {bookingStatusStats.map((stat, index) => {
            const palette = STAT_COLOR_MAP[stat.colorTone];
            return (
              <div key={index} className={`p-4 rounded-lg border ${palette.bgColor} ${palette.borderColor}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className={`text-3xl mt-1 ${palette.color}`}>{stat.value}</p>
                  </div>
                  {index === 0 && <Clock className={`w-8 h-8 ${palette.color}`} />}
                  {index === 1 && <UserCheck className={`w-8 h-8 ${palette.color}`} />}
                  {index === 2 && <AlertCircle className={`w-8 h-8 ${palette.color}`} />}
                  {index === 3 && <CheckCircle className={`w-8 h-8 ${palette.color}`} />}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3>Recent Bookings</h3>
            <button className="text-sm text-blue-600 hover:text-blue-700 hover:underline">View All</button>
          </div>
          <div className="space-y-3">
            {recentBookings.length === 0 && (
              <p className="text-sm text-gray-500">No recent bookings.</p>
            )}
            {recentBookings.map((booking) => (
              <div key={booking.id} className={`p-3 rounded-lg border ${booking.isAdHoc ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-white'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm">{booking.bookingNo}</p>
                      {booking.isAdHoc && (
                        <AlertCircle className="w-3 h-3 text-amber-600" />
                      )}
                    </div>
                    <p className="text-gray-600 text-sm">{booking.guestName}</p>
                  </div>
                  <Badge className={getBookingStatusColor(booking.status)}>
                    {getStatusDisplay(booking.status)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <div className="flex items-center gap-3">
                    <span>{booking.suite}</span>
                    <span className="flex items-center gap-1">
                      <Plane className="w-3 h-3" />
                      {booking.flightNo}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{booking.time}</span>
                    <Badge className={getPaymentStatusColor(booking.paymentStatus)}>
                      {getStatusDisplay(booking.paymentStatus)}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3>Pending Approvals</h3>
            <button className="text-sm text-blue-600 hover:text-blue-700 hover:underline">View All</button>
          </div>
          <div className="space-y-3">
            {pendingBookings.length === 0 && (
              <p className="text-sm text-gray-500">No pending approvals.</p>
            )}
            {pendingBookings.map((item) => (
              <div key={item.id} className={`p-3 rounded-lg border ${item.priority === 'urgent' ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm">{item.bookingNo}</p>
                      {item.priority === 'urgent' && (
                        <AlertCircle className="w-3 h-3 text-red-600" />
                      )}
                      <Badge className={BOOKING_TYPE_BADGE[item.type]}>
                        {item.type}
                      </Badge>
                    </div>
                    <p className="text-gray-600 text-sm mt-1">{item.guestName}</p>
                    <p className="text-gray-500 text-xs mt-1">
                      {item.bookingTypeLabel} • {item.suite} • {item.submitted}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => onSelectBooking(item)}
                    className="text-xs px-2 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    <Eye className="w-3 h-3 inline mr-1" />
                    Review
                  </button>
                  <button
                    onClick={() => onApprove(item)}
                    className="flex-1 text-xs px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="w-3 h-3 inline mr-1" />
                    Approve
                  </button>
                  <button
                    onClick={() => onReject(item)}
                    className="flex-1 text-xs px-3 py-1.5 bg-white border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors"
                  >
                    <XCircle className="w-3 h-3 inline mr-1" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="mb-4">Current Lounge Status</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="w-12 h-12 bg-green-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm text-gray-600">Available</p>
              <p className="text-2xl text-green-700 mt-1">{availableSuites}</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="w-12 h-12 bg-red-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm text-gray-600">Occupied</p>
              <p className="text-2xl text-red-700 mt-1">{occupiedSuites}</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="w-12 h-12 bg-yellow-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm text-gray-600">Food Served</p>
              <p className="text-2xl text-yellow-700 mt-1">5</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="w-12 h-12 bg-orange-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm text-gray-600">Cleaning</p>
              <p className="text-2xl text-orange-700 mt-1">3</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4">Upcoming Arrivals (Next 4 Hours)</h3>
          <div className="space-y-3">
            {upcomingArrivals.length === 0 && (
              <p className="text-sm text-gray-500">No upcoming arrivals.</p>
            )}
            {upcomingArrivals.map((arrival, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm">{arrival.time}</p>
                    <p className="text-xs text-gray-500">{arrival.flightCount} flights</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl text-blue-600">{arrival.count}</p>
                  <p className="text-xs text-gray-500">guests</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && onCloseSelectedBooking()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Booking Details - {selectedBooking?.type} Approval</DialogTitle>
            <DialogDescription>
              Review the booking details before making a decision
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b">
                <div>
                  <p className="text-sm text-gray-600">Booking ID</p>
                  <p className="font-medium">{selectedBooking.bookingNo}</p>
                </div>
                <Badge className={BOOKING_TYPE_BADGE[selectedBooking.type]}>
                  {selectedBooking.type} Booking
                </Badge>
                {selectedBooking.priority === 'urgent' && (
                  <Badge className="bg-red-100 text-red-700">
                    <AlertCircle className="w-3 h-3 inline mr-1" />
                    Urgent
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Guest Name</p>
                  <p className="font-medium">{selectedBooking.guestName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Account Type</p>
                  <p className="font-medium">{selectedBooking.accountType ?? '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Contact Phone</p>
                  <p className="font-medium">{selectedBooking.contactPhone ?? '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Number of Guests</p>
                  <p className="font-medium">{selectedBooking.pax} pax</p>
                </div>
              </div>

              {selectedBooking.type === 'Edit' ? (
                <div className="pt-3 border-t">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className="bg-amber-100 text-amber-700">Changes Requested</Badge>
                  </div>

                  {selectedBooking.originalSuite && selectedBooking.originalSuite !== selectedBooking.suite && (
                    <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded">
                      <p className="text-sm text-gray-600 mb-2">Suite/Room</p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">Original</p>
                          <p className="font-medium line-through text-gray-500">{selectedBooking.originalSuite}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-amber-600" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">New</p>
                          <p className="font-medium text-amber-700">{selectedBooking.suite}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedBooking.originalTime && selectedBooking.originalTime !== selectedBooking.time && (
                    <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded">
                      <p className="text-sm text-gray-600 mb-2">Check-in Time</p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">Original</p>
                          <p className="font-medium line-through text-gray-500">{selectedBooking.originalTime}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-amber-600" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">New</p>
                          <p className="font-medium text-amber-700">{selectedBooking.time}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                  <div>
                    <p className="text-sm text-gray-600">Booking Date</p>
                    <p className="font-medium">{selectedBooking.date}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Check-in Time</p>
                    <p className="font-medium">{selectedBooking.time}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Suite/Room</p>
                    <p className="font-medium">{selectedBooking.suite}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Flight</p>
                    <p className="font-medium flex items-center gap-2">
                      <Plane className="w-4 h-4 text-gray-500" />
                      {selectedBooking.flightNo} @ {selectedBooking.flightTime}
                    </p>
                  </div>
                </div>
              )}

              {selectedBooking.specialRequests && (
                <div className="pt-3 border-t">
                  <p className="text-sm text-gray-600">Special Requests / Notes</p>
                  <p className="mt-1 p-3 bg-gray-50 rounded border border-gray-200 text-sm">
                    {selectedBooking.specialRequests}
                  </p>
                </div>
              )}

              <div className="pt-3 border-t">
                <p className="text-sm text-gray-600">Submitted</p>
                <p className="text-sm">{selectedBooking.submitted}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <button
              onClick={onCloseSelectedBooking}
              className="px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => selectedBooking && onReject(selectedBooking)}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              <XCircle className="w-4 h-4 inline mr-1" />
              Reject
            </button>
            <button
              onClick={() => selectedBooking && onApprove(selectedBooking)}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              <CheckCircle className="w-4 h-4 inline mr-1" />
              Approve
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
