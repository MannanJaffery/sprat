import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import QueryState from '../../components/QueryState';
import FleschScoreCard from '../../components/FleschScoreCard';
import * as documentsApi from '../../api/documents';

export default function DocumentDetailPage() {
  const { projectId, documentId } = useParams();
  const navigate = useNavigate();

  const documentQuery = useQuery({
    queryKey: ['document', projectId, documentId],
    queryFn: () => documentsApi.getDocument(projectId, documentId),
  });
  const readabilityQuery = useQuery({
    queryKey: ['readability', projectId, documentId],
    queryFn: () => documentsApi.getReadability(projectId, documentId),
  });
  const occurrencesQuery = useQuery({
    queryKey: ['goal-occurrences', projectId, documentId],
    queryFn: () => documentsApi.getGoalOccurrences(projectId, documentId),
  });
  const distinctCountQuery = useQuery({
    queryKey: ['distinct-goal-count', projectId, documentId],
    queryFn: () => documentsApi.getDistinctGoalCount(projectId, documentId),
  });

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(`/projects/${projectId}/documents`)}
        className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft size={14} /> Back to documents
      </button>

      <QueryState query={documentQuery}>
        {(doc) => <PageHeader title={doc.name} description={doc.source_url || 'Analysis document'} />}
      </QueryState>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <QueryState query={readabilityQuery}>{(data) => <FleschScoreCard data={data} />}</QueryState>

        <div className="card space-y-4">
          <h2 className="text-base font-semibold text-text-primary">
            Goal Occurrence Analytics (FR-GSM 11/12)
          </h2>
          <QueryState query={distinctCountQuery}>
            {(data) => (
              <p className="text-sm text-text-secondary">
                <span className="text-xl font-bold text-text-primary">{data.count}</span> distinct
                goal{data.count === 1 ? '' : 's'} found in this policy.
              </p>
            )}
          </QueryState>
          <QueryState query={occurrencesQuery}>
            {(rows) =>
              rows.length === 0 ? (
                <p className="text-sm text-text-secondary">No goals recorded against this document yet.</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border text-xs uppercase text-text-secondary">
                    <tr>
                      <th className="py-2">Goal</th>
                      <th className="py-2 text-right">Occurrences</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.goal_id} className="border-b border-border last:border-0">
                        <td className="py-2">
                          <span className="font-mono text-xs text-text-secondary">{r.goal_code}</span>{' '}
                          {r.description}
                        </td>
                        <td className="py-2 text-right font-semibold text-text-primary">
                          {r.occurrence_count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            }
          </QueryState>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-3 text-base font-semibold text-text-primary">Policy text</h2>
        <QueryState query={documentQuery}>
          {(doc) => (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
              {doc.content || 'No content recorded for this document.'}
            </p>
          )}
        </QueryState>
      </div>
    </div>
  );
}
