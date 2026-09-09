import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon, Target, GitBranch } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import QueryState from '../../components/QueryState';
import EmptyState from '../../components/EmptyState';
import Badge from '../../components/Badge';
import { SelectField, TextField } from '../../components/FormField';
import { TAXONOMY_SUBTYPES, SUBJECT_CLASSIFICATIONS } from '../../constants/taxonomy';
import * as searchApi from '../../api/search';
import * as documentsApi from '../../api/documents';

const EMPTY = {
  q: '',
  taxonomyCategory: '',
  taxonomySubtype: '',
  granularity: '',
  observable: '',
  subjectClassification: '',
  actor: '',
  legislation: '',
  status: '',
  documentId: '',
};

// FR8 (FR-GSM 16/17, FR-SSM 7): attribute-based search across goals and scenarios.
export default function SearchPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [draft, setDraft] = useState(EMPTY);
  const [applied, setApplied] = useState(null);

  const documentsQuery = useQuery({
    queryKey: ['documents', projectId],
    queryFn: () => documentsApi.listDocuments(projectId),
  });

  const resultsQuery = useQuery({
    queryKey: ['search', projectId, applied],
    queryFn: () => searchApi.search(projectId, cleanParams(applied)),
    enabled: applied != null,
  });

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const subtypes = draft.taxonomyCategory ? TAXONOMY_SUBTYPES[draft.taxonomyCategory] : [];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={SearchIcon}
        title="Search"
        description="Find goals and scenarios by any combination of attributes (FR-GSM 16/17, FR-SSM 7)."
      />

      <form
        className="card grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          setApplied(draft);
        }}
      >
        <div className="sm:col-span-2 lg:col-span-3">
          <TextField
            label="Text"
            placeholder="Description, actor, Goal ID, context, scenario elements…"
            value={draft.q}
            onChange={(e) => set({ q: e.target.value })}
          />
        </div>

        <SelectField
          label="Taxonomy category"
          value={draft.taxonomyCategory}
          onChange={(e) => set({ taxonomyCategory: e.target.value, taxonomySubtype: '' })}
        >
          <option value="">Any</option>
          <option value="protection">Protection</option>
          <option value="vulnerability">Vulnerability</option>
        </SelectField>

        <SelectField
          label="Taxonomy subtype"
          value={draft.taxonomySubtype}
          onChange={(e) => set({ taxonomySubtype: e.target.value })}
          disabled={!draft.taxonomyCategory}
        >
          <option value="">Any</option>
          {subtypes.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Subject classification"
          value={draft.subjectClassification}
          onChange={(e) => set({ subjectClassification: e.target.value })}
        >
          <option value="">Any</option>
          {SUBJECT_CLASSIFICATIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Granularity"
          value={draft.granularity}
          onChange={(e) => set({ granularity: e.target.value })}
        >
          <option value="">Any</option>
          <option value="policy">Policy goal</option>
          <option value="scenario">Scenario goal</option>
        </SelectField>

        <SelectField
          label="Observable"
          value={draft.observable}
          onChange={(e) => set({ observable: e.target.value })}
        >
          <option value="">Any</option>
          <option value="true">Observable</option>
          <option value="false">Unobservable</option>
        </SelectField>

        <SelectField
          label="Source document"
          value={draft.documentId}
          onChange={(e) => set({ documentId: e.target.value })}
        >
          <option value="">Any</option>
          {(documentsQuery.data || []).map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </SelectField>

        <TextField
          label="Actor contains"
          value={draft.actor}
          onChange={(e) => set({ actor: e.target.value })}
        />

        <TextField
          label="Legislation contains"
          value={draft.legislation}
          onChange={(e) => set({ legislation: e.target.value })}
        />

        <SelectField
          label="Scenario status"
          value={draft.status}
          onChange={(e) => set({ status: e.target.value })}
        >
          <option value="">Any</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="resolved">Resolved</option>
        </SelectField>

        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
          <button type="submit" className="btn-primary">
            <SearchIcon size={16} /> Search
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setDraft(EMPTY);
              setApplied(null);
            }}
          >
            Reset
          </button>
        </div>
      </form>

      {applied != null && (
        <QueryState query={resultsQuery}>
          {(data) => (
            <div className="space-y-6">
              <ResultList
                title="Goals"
                icon={Target}
                count={data.goals.length}
                items={data.goals}
                render={(g) => (
                  <button
                    key={g.id}
                    onClick={() => navigate(`/projects/${projectId}/goals/${g.id}`)}
                    className="flex w-full flex-col gap-1 px-4 py-3 text-left hover:bg-background sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="text-sm text-text-primary">
                      <span className="font-mono text-xs text-text-secondary">{g.goal_code}</span>{' '}
                      {g.description}
                    </span>
                    <span className="flex flex-wrap gap-1.5">
                      <Badge variant={g.taxonomy_category === 'protection' ? 'primary' : 'warning'}>
                        {g.taxonomy_category}
                      </Badge>
                      <Badge variant="neutral">{g.granularity} goal</Badge>
                    </span>
                  </button>
                )}
              />
              <ResultList
                title="Scenarios"
                icon={GitBranch}
                count={data.scenarios.length}
                items={data.scenarios}
                render={(s) => (
                  <button
                    key={s.id}
                    onClick={() => navigate(`/projects/${projectId}/scenarios/${s.id}`)}
                    className="flex w-full flex-col gap-1 px-4 py-3 text-left hover:bg-background sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="text-sm font-medium text-text-primary">{s.name}</span>
                    <span className="flex flex-wrap gap-1.5">
                      <Badge variant="neutral">{s.status}</Badge>
                      <Badge variant="neutral">{s.goals.length} goal(s)</Badge>
                    </span>
                  </button>
                )}
              />
            </div>
          )}
        </QueryState>
      )}
    </div>
  );
}

function ResultList({ title, icon, count, items, render }) {
  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-text-primary">
        {title} <span className="text-text-secondary">({count})</span>
      </h2>
      {count === 0 ? (
        <EmptyState icon={icon} title={`No matching ${title.toLowerCase()}`} />
      ) : (
        <div className="card divide-y divide-border p-0">{items.map(render)}</div>
      )}
    </div>
  );
}

function cleanParams(obj) {
  return Object.fromEntries(Object.entries(obj || {}).filter(([, v]) => v !== '' && v != null));
}
