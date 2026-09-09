import { NavLink, Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import {
  FolderKanban, Users, ShieldCheck, ScrollText, LayoutDashboard,
  Tags, FileText, Target, GitBranch, ArrowLeft, Search, SlidersHorizontal, BookMarked,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import * as projectsApi from '../api/projects';
import Avatar from './Avatar';
import Badge, { roleVariant } from './Badge';

function NavItem({ to, icon: Icon, label, end }) {
  return (
    <NavLink to={to} end={end} className="relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium">
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="sidebar-active-pill"
              className="absolute inset-0 rounded-lg bg-primary-50"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <motion.span
            whileHover={{ x: 2 }}
            className={clsx(
              'relative z-10 flex items-center gap-3 transition-colors',
              isActive ? 'text-primary-700' : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <Icon size={18} />
            {label}
          </motion.span>
        </>
      )}
    </NavLink>
  );
}

function NavSection({ label, children }) {
  return (
    <div className="space-y-1">
      {label && (
        <p className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
          {label}
        </p>
      )}
      {children}
    </div>
  );
}

export default function Sidebar() {
  const { user } = useAuth();
  const { projectId } = useParams();

  const projectQuery = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.getProject(projectId),
    enabled: Boolean(projectId),
  });

  const ROLE_LABELS = {
    admin: 'Admin',
    project_manager: 'Project Manager',
    analyst: 'Analyst',
    guest: 'Guest',
  };

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-border bg-surface">
      <Link to="/projects" className="flex items-center gap-2.5 border-b border-border px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-primary-700 shadow-glow">
          <ShieldCheck size={18} className="text-white" />
        </div>
        <div>
          <p className="font-display text-lg font-semibold leading-tight text-text-primary">SPRAT</p>
          <p className="text-[11px] leading-tight text-text-muted">Privacy &amp; Security Analysis</p>
        </div>
      </Link>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {projectId ? (
          <>
            <NavItem to="/projects" icon={ArrowLeft} label="All projects" end />

            <div className="my-3 rounded-lg border border-border bg-surface-soft px-3 py-2.5">
              <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
                Current project
              </p>
              <p className="truncate text-sm font-semibold text-text-primary">
                {projectQuery.data?.name || 'Loading…'}
              </p>
            </div>

            <NavSection label="Workspace">
              <NavItem to={`/projects/${projectId}/overview`} icon={LayoutDashboard} label="Overview" />
              <NavItem to={`/projects/${projectId}/domains`} icon={Tags} label="Domains" />
              <NavItem to={`/projects/${projectId}/documents`} icon={FileText} label="Documents" />
              <NavItem to={`/projects/${projectId}/goals`} icon={Target} label="Goals" />
              <NavItem to={`/projects/${projectId}/scenarios`} icon={GitBranch} label="Scenarios" />
            </NavSection>

            <NavSection label="Analysis tools">
              <NavItem to={`/projects/${projectId}/search`} icon={Search} label="Search" />
              <NavItem to={`/projects/${projectId}/keywords`} icon={BookMarked} label="Keyword Definitions" />
              <NavItem
                to={`/projects/${projectId}/classifications`}
                icon={SlidersHorizontal}
                label="Classification Dimensions"
              />
            </NavSection>
          </>
        ) : (
          <>
            <NavSection>
              <NavItem to="/projects" icon={FolderKanban} label="Projects" end />
            </NavSection>
            {(user?.role === 'admin' || user?.role === 'project_manager') && (
              <NavSection label="Administration">
                {user?.role === 'admin' && (
                  <>
                    <NavItem to="/admin/users" icon={Users} label="Users" />
                    <NavItem to="/admin/user-groups" icon={FolderKanban} label="User Groups" />
                  </>
                )}
                <NavItem to="/admin/audit-log" icon={ScrollText} label="Audit Log" />
              </NavSection>
            )}
          </>
        )}
      </div>

      {user && (
        <div className="flex items-center gap-3 border-t border-border px-4 py-4">
          <Avatar name={user.name} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-text-primary">{user.name}</p>
            <Badge variant={roleVariant(user.role)} className="mt-0.5">
              {ROLE_LABELS[user.role] || user.role}
            </Badge>
          </div>
        </div>
      )}
    </aside>
  );
}
