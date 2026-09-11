import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { ShieldCheck, ScrollText } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import QueryState from '../../components/QueryState';
import Badge from '../../components/Badge';
import Avatar from '../../components/Avatar';
import { SelectField, TextField } from '../../components/FormField';
import * as auditLogsApi from '../../api/auditLogs';

const ACTION_VARIANT = { create: 'success', update: 'primary', delete: 'danger' };
const PAGE_SIZE = 25;

// SR-1 / NFR4: the access log is append-only at the database level; this view adds
// filtering so a specific action, object type, or time window can be audited.
export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ action: '', objectType: '', from: '', to: '' });

  const setFilter = (patch) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  const logsQuery = useQuery({
    queryKey: ['audit-logs', page, filters],
    queryFn: () =>
      auditLogsApi.listAuditLogs({
        page,
        pageSize: PAGE_SIZE,
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
      }),
    placeholderData: keepPreviousData,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ScrollText}
        eyebrow={logsQuery.data ? `${logsQuery.data.total} entries` : undefined}
        title="Access Log"
        description="Every create, update, and delete action in SPRAT. Append-only and tamper-evident."
      />

      <div className="card grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SelectField
          label="Action"
          value={filters.action}
          onChange={(e) => setFilter({ action: e.target.value })}
        >
          <option value="">All actions</option>
          <option value="create">create</option>
          <option value="update">update</option>
          <option value="delete">delete</option>
        </SelectField>
        <SelectField
          label="Object type"
          value={filters.objectType}
          onChange={(e) => setFilter({ objectType: e.target.value })}
        >
          <option value="">All object types</option>
          {(logsQuery.data?.objectTypes || []).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </SelectField>
        <TextField
          label="From"
          type="date"
          value={filters.from}
          onChange={(e) => setFilter({ from: e.target.value })}
        />
        <TextField
          label="To"
          type="date"
          value={filters.to}
          onChange={(e) => setFilter({ to: e.target.value })}
        />
      </div>

      <QueryState query={logsQuery}>
        {(data) => (
          <>
            <div className="card overflow-x-auto p-0">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-background text-xs uppercase text-text-secondary">
                  <tr>
                    <th className="px-4 py-3">When</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Object</th>
                    <th className="px-4 py-3">Detail</th>
                    <th className="px-4 py-3">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((log) => (
                    <tr key={log.id} className="border-b border-border transition-colors last:border-0 hover:bg-surface-soft/60">
                      <td className="px-4 py-3 text-text-secondary">{log.occurred_at}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-text-primary">
                          <Avatar name={log.user_name || '?'} size="sm" />
                          {log.user_name || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={ACTION_VARIANT[log.action]}>{log.action}</Badge>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {log.object_type} #{log.object_id}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{log.detail || '—'}</td>
                      <td className="px-4 py-3 text-text-secondary">{log.ip_address || '—'}</td>
                    </tr>
                  ))}
                  {data.rows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">
                        <ShieldCheck size={20} className="mx-auto mb-2" />
                        No log entries match these filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between text-sm text-text-secondary">
              <span>
                Page {data.page} — {data.total} total entries
              </span>
              <div className="flex gap-2">
                <button
                  className="btn-secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <button
                  className="btn-secondary"
                  disabled={page * data.pageSize >= data.total}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </QueryState>
    </div>
  );
}
