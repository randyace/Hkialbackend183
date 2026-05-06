import { Users, Calendar, Package, DollarSign, TrendingUp, Clock, AlertCircle, CheckCircle, XCircle, Plane, UserCheck, Eye, ArrowRight } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { useState } from 'react';

export function Dashboard() {
  const stats = [
    { label: 'Total Customers', value: '2,847', icon: Users, change: '+12%', color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { label: "Today's Bookings", value: '48', icon: Calendar, change: '+8%', color: 'text-green-600', bgColor: 'bg-green-50' },
    { label: 'Pending Reviews', value: '15', icon: Clock, change: '-3%', color: 'text-orange-600', bgColor: 'bg-orange-50' },
    { label: 'Revenue (MTD)', value: 'HK$356K', icon: DollarSign, change: '+15%', color: 'text-purple-600', bgColor: 'bg-purple-50' },
  ];

  const bookingStatusStats = [
    { label: 'Pending for Review', value: 8, color: 'text-yellow-700', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
    { label: 'Pending for Approval', value: 7, color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
    { label: 'Awaiting Payment', value: 12, color: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
    { label: 'Confirmed Today', value: 21, color: 'text-green-700', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
  ];

  const recentBookings = [
    { id: 'A-202602-001045', guest: 'John Smith', suite: 'VIP Suite A', time: '14:30', flightNo: 'CX889', status: 'Confirmed', paymentStatus: 'Paid', isAdHoc: false },
    { id: 'A-202602-001046', guest: 'Mary Johnson', suite: 'Executive Suite', time: '15:00', flightNo: 'BA031', status: 'Pending for Review', paymentStatus: 'Pending', isAdHoc: true },
    { id: 'A-202602-001047', guest: 'David Lee', suite: 'VIP Suite B', time: '16:30', flightNo: 'SQ001', status: 'Confirmed', paymentStatus: 'Paid', isAdHoc: false },
    { id: 'A-202602-001048', guest: 'Sarah Chen', suite: 'Business Suite', time: '17:00', flightNo: 'NH859', status: 'Pending for Approval', paymentStatus: 'Pending', isAdHoc: false },
    { id: 'A-202602-001049', guest: 'Robert Wang', suite: 'Premier Suite', time: '18:00', flightNo: 'QF029', status: 'Approved', paymentStatus: 'Payment Link Sent', isAdHoc: false },
  ];

  const pendingApprovals = [
    { 
      id: 'A-202602-001046', 
      name: 'Mary Johnson', 
      type: 'New', 
      bookingType: 'Ad-hoc Booking', 
      suite: 'Executive Suite', 
      submitted: '30 mins ago', 
      priority: 'urgent',
      date: '2026-03-08',
      time: '15:00',
      flightNo: 'BA031',
      flightTime: '18:30',
      pax: 2,
      specialRequests: 'Vegetarian meal required',
      contactPhone: '+852 9123 4567',
      accountType: 'Individual'
    },
    { 
      id: 'A-202602-001052', 
      name: 'David Chen', 
      type: 'Edit', 
      bookingType: 'VIP Suite A', 
      suite: 'Premier Suite', 
      submitted: '1 hour ago', 
      priority: 'normal',
      date: '2026-03-10',
      time: '10:00',
      flightNo: 'CX889',
      flightTime: '13:45',
      pax: 1,
      specialRequests: 'Changed from VIP Suite A to Premier Suite',
      contactPhone: '+852 9234 5678',
      accountType: 'Corporate',
      // Original values before edit
      originalSuite: 'VIP Suite A',
      originalDate: '2026-03-10',
      originalTime: '10:00',
      originalPax: 1,
      originalFlightNo: 'CX889',
      originalFlightTime: '13:45'
    },
    { 
      id: 'A-202602-001038', 
      name: 'Sarah Williams', 
      type: 'Cancel', 
      bookingType: 'Business Suite', 
      suite: 'Business Suite', 
      submitted: '2 hours ago', 
      priority: 'normal',
      date: '2026-03-12',
      time: '14:30',
      flightNo: 'SQ001',
      flightTime: '17:20',
      pax: 3,
      specialRequests: 'Cancellation reason: Travel plans changed',
      contactPhone: '+852 9345 6789',
      accountType: 'Individual'
    },
    { 
      id: 'A-202602-001055', 
      name: 'Michael Lee', 
      type: 'New', 
      bookingType: 'Corporate Booking', 
      suite: 'VIP Suite B', 
      submitted: '3 hours ago', 
      priority: 'normal',
      date: '2026-03-15',
      time: '09:30',
      flightNo: 'NH859',
      flightTime: '12:15',
      pax: 4,
      specialRequests: 'Meeting room setup required',
      contactPhone: '+852 9456 7890',
      accountType: 'Corporate'
    },
    { 
      id: 'A-202602-001043', 
      name: 'Emma Zhang', 
      type: 'Edit', 
      bookingType: 'Premier Suite', 
      suite: 'VIP Suite A', 
      submitted: '5 hours ago', 
      priority: 'urgent',
      date: '2026-03-09',
      time: '16:00',
      flightNo: 'QF029',
      flightTime: '19:45',
      pax: 2,
      specialRequests: 'Changed time from 14:00 to 16:00',
      contactPhone: '+852 9567 8901',
      accountType: 'Travel Agency',
      // Original values before edit
      originalSuite: 'Premier Suite',
      originalDate: '2026-03-09',
      originalTime: '14:00',
      originalPax: 2,
      originalFlightNo: 'QF029',
      originalFlightTime: '19:45'
    },
  ];

  const upcomingArrivals = [
    { time: '14:00-15:00', count: 8, flightCount: 6 },
    { time: '15:00-16:00', count: 12, flightCount: 9 },
    { time: '16:00-17:00', count: 15, flightCount: 11 },
    { time: '17:00-18:00', count: 9, flightCount: 7 },
  ];

  const getBookingStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Confirmed': 'bg-green-100 text-green-700',
      'Pending for Review': 'bg-yellow-100 text-yellow-700',
      'Pending for Approval': 'bg-blue-100 text-blue-700',
      'Approved': 'bg-green-100 text-green-700',
      'Processing': 'bg-purple-100 text-purple-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Paid': 'bg-green-100 text-green-600',
      'Pending': 'bg-yellow-100 text-yellow-600',
      'Payment Link Sent': 'bg-blue-100 text-blue-600',
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  };

  const getBookingTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'New': 'bg-blue-100 text-blue-700',
      'Edit': 'bg-amber-100 text-amber-700',
      'Cancel': 'bg-red-100 text-red-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const [selectedBooking, setSelectedBooking] = useState(null);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1>Dashboard</h1>
        <p className="text-gray-600">Welcome to HKIA VIP Lounge Backend System</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <h2 className="mt-2">{stat.value}</h2>
                <p className={`text-sm mt-1 ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change} from last month
                </p>
              </div>
              <div className={`${stat.bgColor} ${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-8 h-8" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Booking Status Overview */}
      <Card className="p-6">
        <h3 className="mb-4">Booking Status Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {bookingStatusStats.map((stat, index) => (
            <div key={index} className={`p-4 rounded-lg border ${stat.bgColor} ${stat.borderColor}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className={`text-3xl mt-1 ${stat.color}`}>{stat.value}</p>
                </div>
                {index === 0 && <Clock className={`w-8 h-8 ${stat.color}`} />}
                {index === 1 && <UserCheck className={`w-8 h-8 ${stat.color}`} />}
                {index === 2 && <AlertCircle className={`w-8 h-8 ${stat.color}`} />}
                {index === 3 && <CheckCircle className={`w-8 h-8 ${stat.color}`} />}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3>Recent Bookings</h3>
            <button className="text-sm text-blue-600 hover:text-blue-700 hover:underline">View All</button>
          </div>
          <div className="space-y-3">
            {recentBookings.map((booking) => (
              <div key={booking.id} className={`p-3 rounded-lg border ${booking.isAdHoc ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-white'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm">{booking.id}</p>
                      {booking.isAdHoc && (
                        <AlertCircle className="w-3 h-3 text-amber-600" title="Ad-hoc booking" />
                      )}
                    </div>
                    <p className="text-gray-600 text-sm">{booking.guest}</p>
                  </div>
                  <Badge className={getBookingStatusColor(booking.status)}>
                    {booking.status}
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
                      {booking.paymentStatus}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Pending Approvals */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3>Pending Approvals</h3>
            <button className="text-sm text-blue-600 hover:text-blue-700 hover:underline">View All</button>
          </div>
          <div className="space-y-3">
            {pendingApprovals.map((item) => (
              <div key={item.id} className={`p-3 rounded-lg border ${item.priority === 'urgent' ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm">{item.id}</p>
                      {item.priority === 'urgent' && (
                        <AlertCircle className="w-3 h-3 text-red-600" title="Urgent" />
                      )}
                      <Badge className={getBookingTypeColor(item.type)}>
                        {item.type}
                      </Badge>
                    </div>
                    <p className="text-gray-600 text-sm mt-1">{item.name}</p>
                    <p className="text-gray-500 text-xs mt-1">
                      {item.bookingType} • {item.suite} • {item.submitted}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button 
                    onClick={() => setSelectedBooking(item)}
                    className="text-xs px-2 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    <Eye className="w-3 h-3 inline mr-1" />
                    Review
                  </button>
                  <button className="flex-1 text-xs px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                    <CheckCircle className="w-3 h-3 inline mr-1" />
                    Approve
                  </button>
                  <button className="flex-1 text-xs px-3 py-1.5 bg-white border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors">
                    <XCircle className="w-3 h-3 inline mr-1" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Lounge Status & Upcoming Arrivals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Lounge Occupancy */}
        <Card className="p-6">
          <h3 className="mb-4">Current Lounge Status</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="w-12 h-12 bg-green-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm text-gray-600">Available</p>
              <p className="text-2xl text-green-700 mt-1">8</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="w-12 h-12 bg-red-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm text-gray-600">Occupied</p>
              <p className="text-2xl text-red-700 mt-1">12</p>
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

        {/* Upcoming Arrivals */}
        <Card className="p-6">
          <h3 className="mb-4">Upcoming Arrivals (Next 4 Hours)</h3>
          <div className="space-y-3">
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

      {/* Booking Details Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Booking Details - {selectedBooking?.type} Approval</DialogTitle>
            <DialogDescription>
              Review the booking details before making a decision
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4">
              {/* Booking ID and Type Badge */}
              <div className="flex items-center gap-3 pb-3 border-b">
                <div>
                  <p className="text-sm text-gray-600">Booking ID</p>
                  <p className="font-medium">{selectedBooking.id}</p>
                </div>
                <Badge className={getBookingTypeColor(selectedBooking.type)}>
                  {selectedBooking.type} Booking
                </Badge>
                {selectedBooking.priority === 'urgent' && (
                  <Badge className="bg-red-100 text-red-700">
                    <AlertCircle className="w-3 h-3 inline mr-1" />
                    Urgent
                  </Badge>
                )}
              </div>

              {/* Guest Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Guest Name</p>
                  <p className="font-medium">{selectedBooking.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Account Type</p>
                  <p className="font-medium">{selectedBooking.accountType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Contact Phone</p>
                  <p className="font-medium">{selectedBooking.contactPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Number of Guests</p>
                  <p className="font-medium">{selectedBooking.pax} pax</p>
                </div>
              </div>

              {/* Booking Details */}
              {selectedBooking.type === 'Edit' ? (
                <>
                  <div className="pt-3 border-t">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className="bg-amber-100 text-amber-700">Changes Requested</Badge>
                    </div>
                    
                    {/* Suite/Room Comparison */}
                    {selectedBooking.originalSuite !== selectedBooking.suite && (
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

                    {/* Time Comparison */}
                    {selectedBooking.originalTime !== selectedBooking.time && (
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

                    {/* Pax Comparison */}
                    {selectedBooking.originalPax !== selectedBooking.pax && (
                      <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded">
                        <p className="text-sm text-gray-600 mb-2">Number of Guests</p>
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <p className="text-xs text-gray-500">Original</p>
                            <p className="font-medium line-through text-gray-500">{selectedBooking.originalPax} pax</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-amber-600" />
                          <div className="flex-1">
                            <p className="text-xs text-gray-500">New</p>
                            <p className="font-medium text-amber-700">{selectedBooking.pax} pax</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Flight Comparison */}
                    {(selectedBooking.originalFlightNo !== selectedBooking.flightNo || selectedBooking.originalFlightTime !== selectedBooking.flightTime) && (
                      <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded">
                        <p className="text-sm text-gray-600 mb-2">Flight Information</p>
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <p className="text-xs text-gray-500">Original</p>
                            <p className="font-medium line-through text-gray-500 flex items-center gap-1">
                              <Plane className="w-3 h-3" />
                              {selectedBooking.originalFlightNo} @ {selectedBooking.originalFlightTime}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-amber-600" />
                          <div className="flex-1">
                            <p className="text-xs text-gray-500">New</p>
                            <p className="font-medium text-amber-700 flex items-center gap-1">
                              <Plane className="w-3 h-3" />
                              {selectedBooking.flightNo} @ {selectedBooking.flightTime}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Unchanged fields */}
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      {selectedBooking.originalDate === selectedBooking.date && (
                        <div>
                          <p className="text-sm text-gray-600">Booking Date</p>
                          <p className="font-medium">{selectedBooking.date}</p>
                        </div>
                      )}
                      {selectedBooking.originalTime === selectedBooking.time && (
                        <div>
                          <p className="text-sm text-gray-600">Check-in Time</p>
                          <p className="font-medium">{selectedBooking.time}</p>
                        </div>
                      )}
                      {selectedBooking.originalSuite === selectedBooking.suite && (
                        <div>
                          <p className="text-sm text-gray-600">Suite/Room</p>
                          <p className="font-medium">{selectedBooking.suite}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-600">Booking Type</p>
                        <p className="font-medium">{selectedBooking.bookingType}</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
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
                      <p className="text-sm text-gray-600">Booking Type</p>
                      <p className="font-medium">{selectedBooking.bookingType}</p>
                    </div>
                  </div>

                  {/* Flight Information */}
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                    <div>
                      <p className="text-sm text-gray-600">Flight Number</p>
                      <p className="font-medium flex items-center gap-2">
                        <Plane className="w-4 h-4 text-gray-500" />
                        {selectedBooking.flightNo}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Flight Departure Time</p>
                      <p className="font-medium">{selectedBooking.flightTime}</p>
                    </div>
                  </div>
                </>
              )}

              {/* Special Requests */}
              {selectedBooking.specialRequests && (
                <div className="pt-3 border-t">
                  <p className="text-sm text-gray-600">Special Requests / Notes</p>
                  <p className="mt-1 p-3 bg-gray-50 rounded border border-gray-200 text-sm">
                    {selectedBooking.specialRequests}
                  </p>
                </div>
              )}

              {/* Submission Info */}
              <div className="pt-3 border-t">
                <p className="text-sm text-gray-600">Submitted</p>
                <p className="text-sm">{selectedBooking.submitted}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <button 
              onClick={() => setSelectedBooking(null)}
              className="px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            <button className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
              <XCircle className="w-4 h-4 inline mr-1" />
              Reject
            </button>
            <button className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
              <CheckCircle className="w-4 h-4 inline mr-1" />
              Approve
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}