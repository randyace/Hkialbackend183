import { useMemo, useState } from 'react';
import { AuditLogs } from '../../app/components/AuditLogs';
import { mockAuditLogs } from '../AuditLogs.fixture';

export function AuditLogsPreview() {
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    return mockAuditLogs.filter((log) => {
      const matchesSearch =
        log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesModule = moduleFilter === 'all' || log.module === moduleFilter;
      const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
      return matchesSearch && matchesModule && matchesStatus;
    });
  }, [searchTerm, moduleFilter, statusFilter]);

  const stats = useMemo(() => ({
    total: mockAuditLogs.length,
    successCount: mockAuditLogs.filter((l) => l.status === 'success').length,
    failedCount: mockAuditLogs.filter((l) => l.status === 'failed').length,
    warningCount: mockAuditLogs.filter((l) => l.status === 'warning').length,
  }), []);

  return (
    <AuditLogs
      logs={filtered}
      totalCount={mockAuditLogs.length}
      stats={stats}
      searchTerm={searchTerm}
      moduleFilter={moduleFilter}
      statusFilter={statusFilter}
      currentPage={currentPage}
      totalPages={1}
      onSearchTermChange={(value) => {
        setSearchTerm(value);
        setCurrentPage(1);
      }}
      onModuleFilterChange={(value) => {
        setModuleFilter(value);
        setCurrentPage(1);
      }}
      onStatusFilterChange={(value) => {
        setStatusFilter(value);
        setCurrentPage(1);
      }}
      onPageChange={setCurrentPage}
    />
  );
}
