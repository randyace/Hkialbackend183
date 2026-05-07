import type { SystemUsersUser } from '../app/components/SystemUsers';

const FIRST_NAMES = ['Wong', 'Chan', 'Lee', 'Lam', 'Cheng', 'Ng', 'Cheung', 'Ho', 'Leung', 'Tang', 'Yip', 'Fong', 'Tsang', 'Chow', 'Kwok'];
const LAST_NAMES = ['Chi Ming', 'Siu Lan', 'Ka Wai', 'Mei Ling', 'Hoi Man', 'Yuk Fai', 'Wai Ying', 'Chun Kit', 'Sum Yi', 'Wing Sze'];
const ROLES: SystemUsersUser['role'][] = ['System Admin', 'Lounge Manager', 'Supervisor', 'Staff', 'Staff', 'Staff'];
const DEPARTMENTS = ['IT Department', 'Lounge Operations', 'Guest Services', 'Finance', 'Management', 'Security', 'Housekeeping', 'F&B Services'];
const STATUSES: SystemUsersUser['status'][] = ['active', 'active', 'active', 'active', 'inactive'];

export function buildMockSystemUsers(count = 45): SystemUsersUser[] {
  const users: SystemUsersUser[] = [];
  for (let i = 1; i <= count; i++) {
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[i % LAST_NAMES.length];
    const name = `${firstName} ${lastName}`;
    const role = ROLES[i % ROLES.length];
    const department = DEPARTMENTS[i % DEPARTMENTS.length];
    const status = STATUSES[i % STATUSES.length];

    const createdDate = new Date(2023, Math.floor(i / 10), (i % 28) + 1);
    const lastLoginDate = new Date(2026, 0, 15 + (i % 8));
    const lastLoginHour = 8 + (i % 12);
    const lastLoginMinute = (i * 15) % 60;

    let permissions: string[] = [];
    if (role === 'System Admin') {
      permissions = ['all'];
    } else if (role === 'Lounge Manager') {
      permissions = ['approve_invoices', 'manage_staff', 'view_reports', 'approve_bookings'];
    } else if (role === 'Supervisor') {
      permissions = ['approve_bookings', 'manage_bookings', 'view_reports', 'create_bookings'];
    } else {
      permissions = ['create_bookings', 'edit_bookings', 'view_guests'];
    }

    users.push({
      id: i,
      name: i === 1 ? 'HKIAL Staff' : name,
      email: i === 1 ? 'admin@hkial.com' : `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(' ', '')}@hkial.com`,
      role,
      department,
      status,
      lastLogin: `${lastLoginDate.toISOString().split('T')[0]} ${String(lastLoginHour).padStart(2, '0')}:${String(lastLoginMinute).padStart(2, '0')}`,
      createdDate: createdDate.toISOString().split('T')[0],
      permissions,
    });
  }
  return users;
}

export const mockSystemUsers: SystemUsersUser[] = buildMockSystemUsers();
