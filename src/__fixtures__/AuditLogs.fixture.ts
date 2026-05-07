import type { AuditLogsLog } from '../app/components/AuditLogs';

export const mockAuditLogs: AuditLogsLog[] = [
  { id: '1', timestamp: '2024-10-22 14:30:25', user: 'HKIAL Staff',     action: 'Updated booking status',         module: 'Bookings',       details: 'Changed status from Pending to Approved for A-202602-000001', ipAddress: '192.168.1.100', status: 'success' },
  { id: '2', timestamp: '2024-10-22 14:15:12', user: 'Wong Chi Ming',   action: 'Approved customer application',  module: 'Customers',      details: 'Approved application APP-2024-015 and assigned account ACC-2024-0234', ipAddress: '192.168.1.105', status: 'success' },
  { id: '3', timestamp: '2024-10-22 13:45:33', user: 'Chan Siu Lan',    action: 'Failed login attempt',           module: 'Authentication', details: 'Invalid password entered', ipAddress: '192.168.1.120', status: 'failed' },
  { id: '4', timestamp: '2024-10-22 13:30:18', user: 'Lee Ka Wai',      action: 'Created new booking',            module: 'Bookings',       details: 'Created booking A-202602-000045 for guest John Smith', ipAddress: '192.168.1.108', status: 'success' },
  { id: '5', timestamp: '2024-10-22 12:20:44', user: 'Lam Mei Ling',    action: 'Updated bookable item',          module: 'Items',          details: 'Changed price of VIP Suite A from HK$4,200 to HK$4,500', ipAddress: '192.168.1.115', status: 'success' },
  { id: '6', timestamp: '2024-10-22 11:55:09', user: 'HKIAL Staff',     action: 'Created system user',            module: 'System Users',   details: 'Created new staff account for Tang Wai Hong', ipAddress: '192.168.1.100', status: 'success' },
  { id: '7', timestamp: '2024-10-22 11:30:22', user: 'Wong Chi Ming',   action: 'Exported report',                module: 'Reports',        details: 'Generated and exported Daily Booking Report for 2024-10-22', ipAddress: '192.168.1.105', status: 'success' },
  { id: '8', timestamp: '2024-10-22 10:45:15', user: 'Lee Ka Wai',      action: 'Attempted unauthorized access',  module: 'System Users',   details: 'Tried to access System Users Management without permission', ipAddress: '192.168.1.108', status: 'warning' },
  { id: '9', timestamp: '2024-10-22 10:15:38', user: 'Chan Siu Lan',    action: 'Rejected booking',               module: 'Bookings',       details: 'Rejected booking A-202602-000044 - Reason: Suite not available', ipAddress: '192.168.1.120', status: 'success' },
  { id: '10', timestamp: '2024-10-22 09:30:51', user: 'HKIAL Staff',    action: 'Updated system settings',        module: 'Settings',       details: 'Changed email notification settings for booking confirmations', ipAddress: '192.168.1.100', status: 'success' },
];
