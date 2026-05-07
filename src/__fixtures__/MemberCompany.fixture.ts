import type { MemberCompanyCompany } from '../app/components/MemberCompany';

const COMPANY_NAMES = [
  'Cathay Pacific Airways', 'HSBC Hong Kong', 'Ernst & Young', 'Swire Properties', 'PwC Hong Kong',
  'Bank of China', 'Standard Chartered', 'Deloitte', 'KPMG', 'AIA Group',
  'Hong Kong Land', 'MTR Corporation', 'CLP Holdings', 'Jardine Matheson', 'Wheelock and Company',
  'Sun Hung Kai Properties', 'Henderson Land', 'New World Development', 'Sino Group', 'Kerry Properties',
  'DBS Bank', 'Manulife Financial', 'Prudential Hong Kong', 'AXA Insurance', 'Zurich Insurance',
  'Morgan Stanley', 'Goldman Sachs', 'JP Morgan', 'Citibank', 'UBS',
  'Credit Suisse', 'Deutsche Bank', 'Barclays', 'BNP Paribas', 'Societe Generale',
  'ING Bank', 'Nomura Securities', 'Mizuho Bank', 'Sumitomo Mitsui', 'Bank of Tokyo',
  'China Construction Bank', 'ICBC', 'Agricultural Bank', 'China Merchants Bank', 'Ping An Insurance',
];

const CONTACT_NAMES = [
  'Sarah Wong', 'John Chen', 'Michael Lee', 'Emily Tam', 'David Cheng',
  'Lisa Wang', 'Peter Chan', 'Jennifer Lam', 'Raymond Ho', 'Angela Ng',
];

const PAYMENT_METHODS: MemberCompanyCompany['paymentMethod'][] = ['Upfront', 'Net Upfront', 'On-Credit', 'Bulk Purchase'];
const STATUSES: MemberCompanyCompany['status'][] = ['active', 'active', 'active', 'active', 'inactive'];

export function generateMockCompanies(): MemberCompanyCompany[] {
  const companies: MemberCompanyCompany[] = [];
  for (let i = 1; i <= 45; i++) {
    const date = new Date(2024, Math.floor(i / 10), (i % 28) + 1);
    const contact = CONTACT_NAMES[i % CONTACT_NAMES.length];
    const company = COMPANY_NAMES[i % COMPANY_NAMES.length];
    companies.push({
      id: i,
      companyName: company,
      companyCode: `CORP-${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(65 + ((i * 2) % 26))}-${String(i).padStart(3, '0')}`,
      contactPerson: contact,
      email: `${contact.toLowerCase().replace(' ', '.')}@${company.toLowerCase().replace(/ /g, '').replace(/&/g, '')}${i > 20 ? i : ''}.com`,
      phone: `+852 ${2000 + ((i * 123) % 9000)} ${1000 + ((i * 456) % 9000)}`,
      paymentMethod: PAYMENT_METHODS[i % PAYMENT_METHODS.length],
      discountRate: 5 + (i % 4) * 5,
      customerCount: 15 + ((i * 7) % 80),
      status: STATUSES[i % STATUSES.length],
      createdDate: date.toISOString().split('T')[0],
    });
  }
  return companies;
}

export const mockCompanies: MemberCompanyCompany[] = generateMockCompanies();
