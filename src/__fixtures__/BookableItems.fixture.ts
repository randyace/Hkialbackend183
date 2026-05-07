import type { BookableItemsItem } from '../app/components/BookableItems';

const SUITE_NAMES = ['VIP Suite A', 'VIP Suite B', 'VIP Suite C', 'Executive Suite', 'Business Suite', 'Premier Suite', 'Family Suite', 'Deluxe Suite', 'Royal Suite', 'Grand Suite', 'Presidential Suite', 'Luxury Suite'];
const TRANSFER_NAMES = ['Limousine Transfer', 'Airport Limousine Service', 'City Limousine Transfer', 'Premium Chauffeur Service', 'Executive Car Service', 'VIP Transfer', 'Luxury Sedan Transfer', 'Mercedes S-Class Transfer', 'BMW 7-Series Transfer', 'In-town Limousine', 'Cross-border Transfer', 'Hotel Transfer Service'];
const FOOD_NAMES = ['Champagne Service', 'Fine Dining Menu', 'Afternoon Tea Set', 'Private Chef Service', 'Wine Tasting Experience', 'Gourmet Breakfast', 'Premium Catering', 'Sake Selection', 'Cocktail Service', 'Premium Coffee & Tea'];
const SHOPPING_NAMES = ['In-Lounge Shopping', 'Private Sales Consultation', 'Luxury Goods Shopping', 'Duty-Free Shopping Assistance', 'Personal Shopper Service', 'VIP Shopping Escort'];
const AVAILABILITIES: BookableItemsItem['availability'][] = ['available', 'available', 'available', 'limited', 'unavailable'];

export function generateMockItems(): BookableItemsItem[] {
  const items: BookableItemsItem[] = [];
  let id = 1;

  for (let i = 0; i < 15; i++) {
    const date = new Date(2024, 0, 5 + i * 2);
    items.push({
      id: id++,
      nameEn: SUITE_NAMES[i % SUITE_NAMES.length] + (i >= SUITE_NAMES.length ? ` ${Math.floor(i / SUITE_NAMES.length) + 1}` : ''),
      nameSimp: SUITE_NAMES[i % SUITE_NAMES.length] + (i >= SUITE_NAMES.length ? ` ${Math.floor(i / SUITE_NAMES.length) + 1}` : ''),
      nameTrad: SUITE_NAMES[i % SUITE_NAMES.length] + (i >= SUITE_NAMES.length ? ` ${Math.floor(i / SUITE_NAMES.length) + 1}` : ''),
      category: 'Suite',
      price: 2500 + (i * 300),
      discountRate: i % 4 === 0 ? (5 + (i % 3) * 5) : 0,
      descriptionEn: 'Premium VIP suite with private facilities and luxury amenities',
      descriptionSimp: 'Premium VIP suite with private facilities and luxury amenities',
      descriptionTrad: 'Premium VIP suite with private facilities and luxury amenities',
      availability: AVAILABILITIES[i % AVAILABILITIES.length],
      stock: AVAILABILITIES[i % AVAILABILITIES.length] === 'limited' ? 2 + (i % 5) : undefined,
      createdDate: date.toISOString().split('T')[0],
      priceCalEquation: 'unitPrice',
      priority: i + 1,
    });
  }

  items.push({
    id: id++,
    nameEn: 'Extension of stay in VIP Lounge',
    nameSimp: 'Extension of stay in VIP Lounge',
    nameTrad: 'Extension of stay in VIP Lounge',
    category: 'Suite',
    price: 1500,
    discountRate: 0,
    descriptionEn: 'Extended stay package with private rooms and resting zone access',
    descriptionSimp: 'Extended stay package with private rooms and resting zone access',
    descriptionTrad: 'Extended stay package with private rooms and resting zone access',
    availability: 'available',
    createdDate: new Date(2024, 0, 20).toISOString().split('T')[0],
    priceCalEquation: '(qty * unitPrice * noOfPrivateRoom) + (qty * 1000 * totalNoOfPplInRestingZone) - discount',
    priority: 16,
  });

  for (let i = 0; i < 15; i++) {
    const date = new Date(2024, 1, 1 + i * 2);
    const isAirportLimo = TRANSFER_NAMES[i % TRANSFER_NAMES.length] === 'Airport Limousine Service';
    items.push({
      id: id++,
      nameEn: TRANSFER_NAMES[i % TRANSFER_NAMES.length] + (i >= TRANSFER_NAMES.length ? ` ${Math.floor(i / TRANSFER_NAMES.length) + 1}` : ''),
      nameSimp: TRANSFER_NAMES[i % TRANSFER_NAMES.length] + (i >= TRANSFER_NAMES.length ? ` ${Math.floor(i / TRANSFER_NAMES.length) + 1}` : ''),
      nameTrad: TRANSFER_NAMES[i % TRANSFER_NAMES.length] + (i >= TRANSFER_NAMES.length ? ` ${Math.floor(i / TRANSFER_NAMES.length) + 1}` : ''),
      category: 'Transfer Services',
      price: 800 + (i * 200),
      discountRate: i % 5 === 0 ? (5 + (i % 2) * 5) : 0,
      descriptionEn: 'Professional transfer service with experienced chauffeur and luxury vehicle',
      descriptionSimp: 'Professional transfer service with experienced chauffeur and luxury vehicle',
      descriptionTrad: 'Professional transfer service with experienced chauffeur and luxury vehicle',
      availability: AVAILABILITIES[i % AVAILABILITIES.length],
      stock: AVAILABILITIES[i % AVAILABILITIES.length] === 'limited' ? 3 + (i % 4) : undefined,
      createdDate: date.toISOString().split('T')[0],
      priceCalEquation: isAirportLimo ? '(qty * unitPrice) - discount' : 'unitPrice',
      priority: i + 17,
    });
  }

  for (let i = 0; i < 12; i++) {
    const date = new Date(2024, 2, 1 + i * 3);
    items.push({
      id: id++,
      nameEn: FOOD_NAMES[i % FOOD_NAMES.length] + (i >= FOOD_NAMES.length ? ` Package ${Math.floor(i / FOOD_NAMES.length) + 1}` : ''),
      nameSimp: FOOD_NAMES[i % FOOD_NAMES.length] + (i >= FOOD_NAMES.length ? ` Package ${Math.floor(i / FOOD_NAMES.length) + 1}` : ''),
      nameTrad: FOOD_NAMES[i % FOOD_NAMES.length] + (i >= FOOD_NAMES.length ? ` Package ${Math.floor(i / FOOD_NAMES.length) + 1}` : ''),
      category: 'Food & Beverage',
      price: 300 + (i * 150),
      discountRate: i % 3 === 0 ? (10 + (i % 2) * 5) : 0,
      descriptionEn: 'Premium food and beverage service with finest ingredients',
      descriptionSimp: 'Premium food and beverage service with finest ingredients',
      descriptionTrad: 'Premium food and beverage service with finest ingredients',
      availability: AVAILABILITIES[i % AVAILABILITIES.length],
      stock: AVAILABILITIES[i % AVAILABILITIES.length] === 'limited' ? 5 + (i % 3) : undefined,
      createdDate: date.toISOString().split('T')[0],
      priceCalEquation: 'unitPrice',
      priority: i + 32,
    });
  }

  for (let i = 0; i < 8; i++) {
    const date = new Date(2024, 5, 1 + i * 5);
    items.push({
      id: id++,
      nameEn: SHOPPING_NAMES[i % SHOPPING_NAMES.length] + (i >= SHOPPING_NAMES.length ? ` Service ${Math.floor(i / SHOPPING_NAMES.length) + 1}` : ''),
      nameSimp: SHOPPING_NAMES[i % SHOPPING_NAMES.length] + (i >= SHOPPING_NAMES.length ? ` Service ${Math.floor(i / SHOPPING_NAMES.length) + 1}` : ''),
      nameTrad: SHOPPING_NAMES[i % SHOPPING_NAMES.length] + (i >= SHOPPING_NAMES.length ? ` Service ${Math.floor(i / SHOPPING_NAMES.length) + 1}` : ''),
      category: 'Shopping',
      price: 0 + (i * 100),
      discountRate: 0,
      descriptionEn: 'Personal shopping assistance and luxury goods access',
      descriptionSimp: 'Personal shopping assistance and luxury goods access',
      descriptionTrad: 'Personal shopping assistance and luxury goods access',
      availability: AVAILABILITIES[i % AVAILABILITIES.length],
      stock: AVAILABILITIES[i % AVAILABILITIES.length] === 'limited' ? 2 + (i % 4) : undefined,
      createdDate: date.toISOString().split('T')[0],
      priceCalEquation: 'unitPrice',
      priority: i + 44,
    });
  }

  return items;
}

export const mockBookableItems: BookableItemsItem[] = generateMockItems();
