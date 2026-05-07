import type { BookingManagementBooking } from '../app/components/BookingManagement';

export const TRAVEL_AGENCY_DATA = [
  { name: 'Wings Travel Agency', code: 'TA-WG-001', discountRate: 15 },
  { name: 'EGL Tours', code: 'TA-EG-001', discountRate: 20 },
  { name: 'Hong Thai Travel', code: 'TA-HT-001', discountRate: 10 },
  { name: 'Wing On Travel', code: 'TA-WO-001', discountRate: 12 },
  { name: 'Klook Travel', code: 'TA-KL-001', discountRate: 8 },
  { name: 'CTrip Hong Kong', code: 'TA-CT-001', discountRate: 18 },
  { name: 'Jetour Holidays', code: 'TA-JT-001', discountRate: 5 },
];

export function generateMockBookings(): BookingManagementBooking[] {
  const names = ['John Smith', 'Mary Johnson', 'David Lee', 'Sarah Chen', 'Robert Wang', 'Emma Wilson', 'Michael Brown', 'Lisa Taylor', 'James Anderson', 'Sophia Martinez'];
  const suites = ['VIP Suite A', 'VIP Suite B', 'Executive Suite', 'Business Suite', 'Premier Suite', 'Open Lounge'];
  const statuses: BookingManagementBooking['status'][] = ['Pending for Review', 'Pending for Approval', 'Approved', 'Confirmed', 'Rejected', 'Cancelled', 'No-show'];
  const airlines = ['CX', 'BA', 'NH', 'SQ', 'QF', 'EK', 'LH'];
  const origins = ['LHR', 'NRT', 'SIN', 'SYD', 'LAX', 'DXB', 'FRA'];
  const destinations = ['TPE', 'ICN', 'BKK', 'SIN', 'NRT', 'PVG', 'KIX'];
  const accountTypes: BookingManagementBooking['accountType'][] = ['Individual', 'Corporate', 'Travel Agency'];
  const paymentModes: BookingManagementBooking['paymentMode'][] = ['Upfront', 'On-Credit'];
  const flightTypes: BookingManagementBooking['flightType'][] = ['Arrival', 'Departure', 'Transit'];

  const bookings: BookingManagementBooking[] = [];

  for (let i = 1; i <= 48; i++) {
    const date = new Date(2024, 9, 25 + Math.floor(i / 10));
    const hour = 8 + (i % 12);
    const status = statuses[i % statuses.length];
    const paymentMode = paymentModes[i % paymentModes.length];
    const accountType = accountTypes[i % accountTypes.length];
    const flightType = flightTypes[i % flightTypes.length];

    const prefix = flightType === 'Arrival' ? 'A' : flightType === 'Departure' ? 'D' : 'T';
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const bookingNo = `${prefix}-${dateStr}-${String(i + 1).padStart(6, '0')}`;

    let bookingCategory: BookingManagementBooking['bookingCategory'];
    if (accountType === 'Travel Agency') bookingCategory = 'Agent Booking';
    else if (accountType === 'Corporate') bookingCategory = 'Corporate Booking';
    else {
      const mod = i % 5;
      if (mod === 0 || mod === 1) bookingCategory = 'Individual Booking';
      else if (mod === 2 || mod === 3) bookingCategory = 'Membership Booking';
      else bookingCategory = 'AA Booking';
    }

    let flightOrigin: string | undefined;
    let flightDestination: string | undefined;
    if (flightType === 'Arrival') {
      flightOrigin = origins[i % origins.length];
      flightDestination = 'HKG';
    } else if (flightType === 'Departure') {
      flightOrigin = 'HKG';
      flightDestination = destinations[i % destinations.length];
    } else {
      flightOrigin = origins[i % origins.length];
      flightDestination = destinations[(i + 2) % destinations.length];
    }

    let paymentStatus: BookingManagementBooking['paymentStatus'] = 'Not Required';
    if (paymentMode === 'Upfront') {
      if (status === 'Confirmed') paymentStatus = 'Paid';
      else if (status === 'Approved') paymentStatus = i % 3 === 0 ? 'Payment Link Sent' : 'Pending';
      else if (status === 'Cancelled') {
        if (i % 4 === 0) paymentStatus = 'Refunded';
        else if (i % 3 === 0) paymentStatus = 'Paid';
        else if (i % 5 === 0) paymentStatus = 'Payment Link Sent';
        else paymentStatus = 'Pending';
      } else if (status === 'Pending for Approval') paymentStatus = 'Pending';
    }

    const services: string[] = [];
    if (i % 3 === 0) services.push('Limousine Transfer');
    if (i % 4 === 0) services.push('In-lounge Shopping');
    if (i % 7 === 0) services.push('Wheelchair Assistance');
    if (i % 9 === 0) services.push('Private Sales');

    const baseAmount = 2500 + (i * 123) % 5000;
    let amount: BookingManagementBooking['amount'];
    let agencyName: string | undefined;
    let agencyDiscountRate: number | undefined;
    let originalAmountValue: number | undefined;
    let finalAmountValue: number | undefined;

    if (i % 13 === 0) amount = 'Pending Calculation';
    else if (i % 17 === 0) amount = 'Re-calculation';
    else if (i % 19 === 0) amount = 'Manual Adjustment';
    else {
      if (accountType === 'Travel Agency') {
        const agency = TRAVEL_AGENCY_DATA[i % TRAVEL_AGENCY_DATA.length];
        agencyName = agency.name;
        agencyDiscountRate = agency.discountRate;
        originalAmountValue = baseAmount;
        finalAmountValue = Math.round(baseAmount * (1 - agency.discountRate / 100));
        amount = `HK$${finalAmountValue.toLocaleString()}`;
      } else {
        amount = `HK$${baseAmount.toLocaleString()}`;
      }
    }

    bookings.push({
      id: i,
      bookingNo,
      bookingCategory,
      flightType,
      guestName: names[i % names.length],
      accountNo: `ACC-20${23 + (i % 2)}-${String(1000 + i).slice(-4)}`,
      suite: suites[i % suites.length],
      dateTime: `${date.toISOString().split('T')[0]} ${String(hour).padStart(2, '0')}:${i % 2 === 0 ? '30' : '00'}`,
      flightNo: `${airlines[i % airlines.length]}${String(100 + i * 17).slice(-3)}`,
      flightTime: `${String(hour + 3).padStart(2, '0')}:${i % 2 === 0 ? '45' : '15'}`,
      flightOrigin,
      flightDestination,
      status,
      paymentStatus,
      services,
      amount,
      numberOfGuests: 1 + (i % 4),
      nonFlyingGuests: i % 5 === 0 ? 1 + (i % 2) : 0,
      isAdHoc: i % 8 === 0,
      hasLimousine: i % 3 === 0,
      hasShopping: i % 4 === 0,
      cutoffHours: i % 8 === 0 ? (12 + (i % 36)) : undefined,
      accountType,
      paymentMode,
      rejectionReason: status === 'Rejected' ? 'Suite not available for requested time slot' : undefined,
      bookingType: i % 2 === 0 ? 'Online' : 'Email/Call to HKIAL',
      agencyName,
      agencyDiscountRate,
      originalAmountValue,
      finalAmountValue,
    });
  }

  bookings.push(
    {
      id: 55, bookingNo: 'D-20261015-000055', guestName: 'Catherine Wong', accountNo: 'ACC-2024-0055',
      suite: 'VIP Suite A', dateTime: '2026-10-15 10:30', flightNo: 'CX101', flightTime: '13:45',
      flightOrigin: 'HKG', flightDestination: 'NRT', flightType: 'Departure',
      bookingCategory: 'Individual Booking', status: 'Confirmed', paymentStatus: 'Paid',
      services: ['Limousine Transfer'], amount: 'HK$5,400', numberOfGuests: 3, nonFlyingGuests: 0,
      isAdHoc: false, hasLimousine: true, hasShopping: false, accountType: 'Individual',
      paymentMode: 'Upfront', bookingType: 'Online', originalAmountValue: 5400, finalAmountValue: 5400,
    },
    {
      id: 54, bookingNo: 'A-20261014-000054', guestName: 'Thomas Hughes', accountNo: 'ACC-2023-0054',
      suite: 'Executive Suite', dateTime: '2026-10-14 09:00', flightNo: 'BA027', flightTime: '12:15',
      flightOrigin: 'LHR', flightDestination: 'HKG', flightType: 'Arrival',
      bookingCategory: 'Membership Booking', status: 'Confirmed', paymentStatus: 'Paid',
      services: ['In-lounge Shopping'], amount: 'HK$3,800', numberOfGuests: 2, nonFlyingGuests: 0,
      isAdHoc: false, hasLimousine: false, hasShopping: true, accountType: 'Individual',
      paymentMode: 'Upfront', bookingType: 'Online', originalAmountValue: 3800, finalAmountValue: 3800,
    },
    {
      id: 53, bookingNo: 'T-20261013-000053', guestName: 'HSBC Group', accountNo: 'ACC-2023-0004',
      suite: 'Business Suite', dateTime: '2026-10-13 14:30', flightNo: 'SQ001', flightTime: '17:45',
      flightOrigin: 'SIN', flightDestination: 'NRT', flightType: 'Transit',
      bookingCategory: 'Corporate Booking', status: 'Confirmed', paymentStatus: 'Paid',
      services: ['Limousine Transfer', 'In-lounge Shopping'], amount: 'HK$8,700', numberOfGuests: 4, nonFlyingGuests: 1,
      isAdHoc: false, hasLimousine: true, hasShopping: true, accountType: 'Corporate',
      paymentMode: 'Upfront', bookingType: 'Email/Call to HKIAL', originalAmountValue: 8700, finalAmountValue: 8700,
    },
    {
      id: 52, bookingNo: 'D-20261012-000052', guestName: 'Helen Yuen', accountNo: 'ACC-2024-0052',
      suite: 'Premier Suite', dateTime: '2026-10-12 11:00', flightNo: 'QF108', flightTime: '14:30',
      flightOrigin: 'HKG', flightDestination: 'SYD', flightType: 'Departure',
      bookingCategory: 'AA Booking', status: 'Confirmed', paymentStatus: 'Paid',
      services: [], amount: 'HK$2,400', numberOfGuests: 2, nonFlyingGuests: 0,
      isAdHoc: false, hasLimousine: false, hasShopping: false, accountType: 'Individual',
      paymentMode: 'Upfront', bookingType: 'Online', originalAmountValue: 2400, finalAmountValue: 2400,
    },
    {
      id: 51, bookingNo: 'A-20261011-000051', guestName: 'EGL Tours Ltd', accountNo: 'ACC-2023-0005',
      suite: 'Open Lounge', dateTime: '2026-10-11 08:30', flightNo: 'EK384', flightTime: '11:15',
      flightOrigin: 'DXB', flightDestination: 'HKG', flightType: 'Arrival',
      bookingCategory: 'Agent Booking', status: 'Confirmed', paymentStatus: 'Paid',
      services: ['Limousine Transfer'], amount: 'HK$4,590',
      numberOfGuests: 3, nonFlyingGuests: 0, isAdHoc: false, hasLimousine: true, hasShopping: false,
      accountType: 'Travel Agency', paymentMode: 'Upfront', bookingType: 'Email/Call to HKIAL',
      agencyName: 'EGL Tours', agencyDiscountRate: 20, originalAmountValue: 5738, finalAmountValue: 4590,
    },
  );

  return bookings;
}
