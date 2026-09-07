import { Loader2, AlertTriangle } from 'lucide-react';
import { getErrorMessage } from '../api/client';

// Wraps a react-query result so every screen shows consistent, observable
// loading/error/success feedback instead of ad-hoc spinners per page.
export default function QueryState({ query, children }) {
  if (query.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-text-secondary">
        <Loader2 size={20} className="animate-spin" />
        <span className="text-sm">Loading…</span>
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="card flex items-center gap-3 border-danger/30 bg-red-50 text-danger">
        <AlertTriangle size={20} />
        <span className="text-sm">{getErrorMessage(query.error)}</span>
      </div>
    );
  }

  return children(query.data);
}
