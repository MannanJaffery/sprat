import { Link, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';

const STATIC_LABELS = {
  projects: 'Projects',
  overview: 'Overview',
  domains: 'Domains',
  documents: 'Documents',
  goals: 'Goals',
  scenarios: 'Scenarios',
  search: 'Search',
  classifications: 'Classification Dimensions',
  keywords: 'Keyword Definitions',
  admin: 'Administration',
  users: 'Users',
  'user-groups': 'User Groups',
  'audit-log': 'Audit Log',
};

// Reads whatever the page itself already fetched out of the React Query cache —
// no extra network requests just to label a breadcrumb.
export default function Breadcrumbs() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const segments = location.pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs = [];
  let path = '';

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    path += `/${seg}`;
    const prev = segments[i - 1];

    if (/^\d+$/.test(seg)) {
      let label = `#${seg}`;
      if (prev === 'projects') {
        const project = queryClient.getQueryData(['project', seg]);
        label = project?.name || 'Project';
      } else if (prev === 'goals') {
        const projectId = segments[1];
        const goal = queryClient.getQueryData(['goal', projectId, seg]);
        label = goal?.goal_code || 'Goal';
      } else if (prev === 'scenarios') {
        const projectId = segments[1];
        const scenario = queryClient.getQueryData(['scenario', projectId, seg]);
        label = scenario?.name || 'Scenario';
      } else if (prev === 'documents') {
        const projectId = segments[1];
        const doc = queryClient.getQueryData(['document', projectId, seg]);
        label = doc?.name || 'Document';
      }
      crumbs.push({ label, path, clickable: prev === 'projects' });
      continue;
    }

    crumbs.push({ label: STATIC_LABELS[seg] || seg, path, clickable: true });
  }

  return (
    <nav className="flex items-center gap-1.5 text-sm text-text-secondary">
      {crumbs.map((crumb, i) => (
        <span key={crumb.path} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight size={14} className="text-text-muted" />}
          {i === crumbs.length - 1 ? (
            <span className="max-w-[16rem] truncate font-medium text-text-primary">
              {crumb.label}
            </span>
          ) : crumb.clickable ? (
            <Link to={crumb.path} className="max-w-[12rem] truncate hover:text-text-primary">
              {crumb.label}
            </Link>
          ) : (
            <span className="max-w-[12rem] truncate">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
