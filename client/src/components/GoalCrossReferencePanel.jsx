import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { FileStack, Tags, Users2, Scale } from 'lucide-react';
import QueryState from './QueryState';
import * as goalsApi from '../api/goals';

function GoalGroup({ icon: Icon, title, goals, projectId, navigate, emptyText }) {
  return (
    <div className="card space-y-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
        <Icon size={16} /> {title} ({goals.length})
      </h2>
      {goals.length === 0 ? (
        <p className="text-sm text-text-secondary">{emptyText}</p>
      ) : (
        <ul className="space-y-1">
          {goals.map((g) => (
            <li key={g.id}>
              <button
                type="button"
                onClick={() => navigate(`/projects/${projectId}/goals/${g.id}`)}
                className="flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-surface-soft"
              >
                <span className="mt-0.5 shrink-0 rounded bg-surface-soft px-1.5 py-0.5 font-mono text-xs text-text-secondary">
                  {g.goal_code}
                </span>
                <span className="text-text-primary">{g.description}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Read-only, non-AI view of goals related to this one — by document, taxonomy,
// subject classification, or legislation.
export default function GoalCrossReferencePanel({ projectId, goalId }) {
  const navigate = useNavigate();
  const query = useQuery({
    queryKey: ['cross-references', projectId, goalId],
    queryFn: () => goalsApi.getCrossReferences(projectId, goalId),
  });

  return (
    <QueryState query={query}>
      {(data) => (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <GoalGroup
            icon={FileStack}
            title="Same source document"
            goals={data.sameDocument}
            projectId={projectId}
            navigate={navigate}
            emptyText="No other goals come from this document."
          />
          <GoalGroup
            icon={Tags}
            title="Same taxonomy"
            goals={data.sameTaxonomy}
            projectId={projectId}
            navigate={navigate}
            emptyText="No other goals share this taxonomy category and subtype."
          />
          <GoalGroup
            icon={Users2}
            title="Same subject classification"
            goals={data.sameSubject}
            projectId={projectId}
            navigate={navigate}
            emptyText="No other goals share a subject classification."
          />
          <GoalGroup
            icon={Scale}
            title="Same legislation"
            goals={data.sameLegislation}
            projectId={projectId}
            navigate={navigate}
            emptyText="No relevant legislation recorded, or none shared."
          />
        </div>
      )}
    </QueryState>
  );
}
