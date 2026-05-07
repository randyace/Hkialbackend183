import type { AccountListAccount } from '../app/components/AccountList';

const firstNames = [
  'John', 'Mary', 'David', 'Sarah', 'Robert', 'Emma', 'Michael', 'Lisa', 'James', 'Sophia',
  'William', 'Olivia', 'Richard', 'Emily', 'Thomas',
];

const lastNames = [
  'Smith', 'Johnson', 'Lee', 'Chen', 'Wang', 'Wilson', 'Brown', 'Taylor', 'Anderson', 'Martinez',
  'Wong', 'Chan', 'Lam', 'Ng', 'Cheung',
];

const corporateGroups = [
  'HSBC', 'Cathay Pacific', 'Standard Chartered', 'Bank of China', 'Swire Group',
  'Henderson Land', 'Sun Hung Kai Properties',
];

const travelAgencyGroups = [
  'EGL Tours', 'Wing On Travel', 'Hong Thai Travel', 'TravelExpert', 'Goldjoy Travel', 'Zuji Travel',
];

const individualGroups = [
  'Priority Club', 'Executive Circle', 'Platinum Members', 'Diamond Elite',
  "President's Club", "Chairman's Circle",
];

const futureExpiries = [
  '2026-06-30', '2026-09-30', '2026-12-31', '2027-03-31', '2027-06-30', '2027-12-31', '2026-08-31',
];
const pastExpiries = ['2025-03-31', '2025-06-30', '2025-09-30', '2025-12-31'];

function buildMockAccounts(): AccountListAccount[] {
  const accounts: AccountListAccount[] = [];
  for (let i = 1; i <= 50; i++) {
    const accountType: AccountListAccount['type'] =
      i % 3 === 0 ? 'Corporate' : i % 5 === 0 ? 'TravelAgency' : 'Individual';
    const status: AccountListAccount['status'] =
      i % 7 === 0 ? 'Inactive' : i % 11 === 0 ? 'Suspended' : 'Active';
    const date = new Date(2024, 0, 1 + i);

    let internal_grouping = '';
    let credit_balance: number | undefined;
    let membership_type: AccountListAccount['membership_type'];
    let membership_expiry: string | undefined;

    if (accountType === 'Corporate') {
      internal_grouping = corporateGroups[i % corporateGroups.length];
      credit_balance = 50000 + ((i * 10000) % 200000);
    } else if (accountType === 'TravelAgency') {
      internal_grouping = travelAgencyGroups[i % travelAgencyGroups.length];
      credit_balance = 30000 + ((i * 5000) % 100000);
    } else {
      internal_grouping = individualGroups[i % individualGroups.length];
      membership_type = i % 4 === 0 ? 'Diamond' : i % 3 === 0 ? 'Platinum' : i % 5 === 0 ? 'Sapphire' : 'Gold';
      membership_expiry =
        i % 10 < 3
          ? pastExpiries[i % pastExpiries.length]
          : futureExpiries[i % futureExpiries.length];
    }

    const fname = firstNames[i % firstNames.length];
    const lname = lastNames[i % lastNames.length];

    accounts.push({
      id: i,
      account_number: `ACC-20${23 + (i % 2)}-${String(1000 + i).slice(-4)}`,
      type: accountType,
      name: `${fname} ${lname}`,
      email: `${fname.toLowerCase()}.${lname.toLowerCase()}@email.com`,
      phone: `+852 ${9000 + i * 11}`,
      internal_grouping,
      payment_method: accountType === 'Individual' ? 'Credit Card' : 'Invoice',
      status,
      created_date: date.toISOString().slice(0, 10),
      credit_balance,
      membership_type,
      membership_expiry,
    });
  }
  return accounts;
}

export const mockAccounts: AccountListAccount[] = buildMockAccounts();
