import type { TravelAgencyAgency } from '../app/components/TravelAgency';

const AGENCY_NAMES = [
  'EGL Tours', 'Wing On Travel', 'Hong Thai Travel', 'TravelExpert', 'Goldjoy Travel', 'Zuji Travel',
  'Expedia Hong Kong', 'Trip.com', 'Klook Travel', 'KKday', 'CTrip Hong Kong', 'Agoda Travel',
  'Asia World-Expo Travel', 'China Travel Service', 'Pak Kong Travel', 'Sincerity Travel',
  'Morning Star Travel', 'Brilliant Tour', 'Jetour Holidays', 'Sunflower Travel',
  'Concorde Tours', 'Miramar Travel', 'JTB Hong Kong', 'HIS Travel', 'Phoenix Travel',
  'Dragonair Holidays', 'Cathay Holidays', 'Premier Holidays', 'Royal Holiday', 'Elite Tours',
  'Executive Travel', 'Premium Voyages', 'Luxury Escapes', 'First Class Travel', 'Diamond Tours',
  'Platinum Journeys', 'Golden Gate Travel', 'Silk Road Tours', 'Orient Express', 'Asia Pacific Travel',
  'Global Gateway', 'Worldwide Ventures', 'International Tours', 'Universal Travel', 'Cosmos Holidays',
];

const CONTACT_NAMES = ['Sarah Wong', 'John Chen', 'Michael Lee', 'Emily Tam', 'David Cheng', 'Lisa Wang', 'Peter Chan', 'Jennifer Lam', 'Raymond Ho', 'Angela Ng'];
const PAYMENT_METHODS: TravelAgencyAgency['paymentMethod'][] = ['Upfront', 'Net Upfront', 'On-Credit', 'Monthly Invoice'];
const STATUSES: TravelAgencyAgency['status'][] = ['active', 'active', 'active', 'active', 'active', 'inactive', 'suspended'];

export function buildMockTravelAgencies(count = 45): TravelAgencyAgency[] {
  const agencies: TravelAgencyAgency[] = [];
  for (let i = 1; i <= count; i++) {
    const date = new Date(2024, Math.floor(i / 10), (i % 28) + 1);
    const creditLimit = 50000 + (i * 10000) % 300000;
    const creditUsed = Math.floor(creditLimit * (0.2 + (i % 5) * 0.15));
    const agencyName = AGENCY_NAMES[i % AGENCY_NAMES.length];
    const contactName = CONTACT_NAMES[i % CONTACT_NAMES.length];

    agencies.push({
      id: i,
      agencyName,
      agencyCode: `TA-${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(65 + ((i * 2) % 26))}-${String(i).padStart(3, '0')}`,
      contactPerson: contactName,
      email: `${contactName.toLowerCase().replace(' ', '.')}@${agencyName.toLowerCase().replace(/ /g, '')}${i > 20 ? i : ''}.com.hk`,
      phone: `+852 ${2000 + (i * 123) % 9000} ${1000 + (i * 456) % 9000}`,
      paymentMethod: PAYMENT_METHODS[i % PAYMENT_METHODS.length],
      creditLimit,
      creditBalance: creditLimit - creditUsed,
      discountRate: 10 + (i % 3) * 5,
      memberCount: 20 + (i * 5) % 100,
      totalBookings: 50 + (i * 15) % 500,
      status: STATUSES[i % STATUSES.length],
      createdDate: date.toISOString().split('T')[0],
    });
  }
  return agencies;
}

export const mockTravelAgencies: TravelAgencyAgency[] = buildMockTravelAgencies();
