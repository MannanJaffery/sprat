import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '../../components/PageHeader';
import QueryState from '../../components/QueryState';
import Badge from '../../components/Badge';
import * as auditLogsApi from '../../api/auditLogs';

const ACTION_VARIANT = { create: 'success', update: 'primary', delete: 'danger' };

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const logsQuery = useQuery({
    queryKey: ['audit-logs', page],
    queryFn: () => auditLogsApi.listAuditLogs(page, 25),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Access Log"
        description="Every create, update, and delete action performed in SPRAT (SR-1)."
      />

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
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((log) => (
                    <tr key={log.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 text-text-secondary">{log.occurred_at}</td>
                      <td className="px-4 py-3 text-text-primary">{log.user_name || 'Unknown'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={ACTION_VARIANT[log.action]}>{log.action}</Badge>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {log.object_type} #{log.object_id}
                      </td>
                    </tr>
                  ))}
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
