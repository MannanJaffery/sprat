import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Sparkles } from 'lucide-react';
import * as aiApi from '../api/ai';
import { getErrorMessage } from '../api/client';

export default function AiSummaryCard({ projectId }) {
  const summarize = useMutation({
    mutationFn: () => aiApi.generateGoalsSummary(projectId),
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <div className="card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
            <Sparkles size={17} />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">AI summary</p>
            <p className="text-xs text-text-muted">An executive overview of every goal you can see</p>
          </div>
        </div>
        <button className="btn-secondary" onClick={() => summarize.mutate()} disabled={summarize.isPending}>
          {summarize.isPending ? 'Summarizing…' : summarize.data ? 'Regenerate' : 'Generate summary'}
        </button>
      </div>

      {summarize.data && (
        <p className="border-t border-border pt-4 font-display text-[15px] italic leading-relaxed text-text-secondary">
          {summarize.data.summary}
        </p>
      )}
    </div>
  );
}
