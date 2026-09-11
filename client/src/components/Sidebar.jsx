import { NavLink, Link, useParams, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import {
  FolderKanban, Users, ScrollText, LayoutDashboard, Home,
  Tags, FileText, Target, GitBranch, ArrowLeft, Search, SlidersHorizontal, BookMarked, X,
} from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../hooks/useAuth';
import * as projectsApi from '../api/projects';
import Avatar from './Avatar';
import Badge, { roleVariant } from './Badge';

function NavItem({ to, icon: Icon, label, end, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className="relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium"
    >
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

export default function Sidebar({ open = false, onClose = () => {} }) {
  const { user } = useAuth();
  const { projectId } = useParams();
  const location = useLocation();

  const projectQuery = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.getProject(projectId),
    enabled: Boolean(projectId),
  });

  // Close the mobile/tablet drawer automatically whenever the route changes.
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Prevent the page behind the drawer from scrolling while it's open on mobile/tablet.
  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const ROLE_LABELS = {
    admin: 'Admin',
    project_manager: 'Project Manager',
    analyst: 'Analyst',
    guest: 'Guest',
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-text-primary/40 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex h-full w-72 shrink-0 flex-col border-r border-border bg-surface transition-transform duration-300 ease-in-out',
          'lg:static lg:z-auto lg:translate-x-0 lg:transition-none',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between gap-2.5 border-b border-border px-5 py-5">
          <Link to="/projects" className="flex min-w-0 items-center gap-2.5">
            <Logo size={36} className="shrink-0 drop-shadow-[0_4px_10px_rgba(154,119,32,0.35)]" />
            <div className="min-w-0">
              <p className="font-display text-lg font-semibold leading-tight text-text-primary">SPRAT</p>
              <p className="truncate text-[11px] leading-tight text-text-muted">
                Privacy &amp; Security Analysis
              </p>
            </div>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-secondary hover:bg-background hover:text-text-primary lg:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          {projectId ? (
            <>
              <NavItem to="/" icon={Home} label="Home" end onNavigate={onClose} />
              <NavItem to="/projects" icon={ArrowLeft} label="All projects" end onNavigate={onClose} />

              <div className="my-3 rounded-lg border border-border bg-surface-soft px-3 py-2.5">
                <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
                  Current project
                </p>
                <p className="truncate text-sm font-semibold text-text-primary">
                  {projectQuery.data?.name || 'Loading…'}
                </p>
              </div>

              <NavSection label="Workspace">
                <NavItem to={`/projects/${projectId}/overview`} icon={LayoutDashboard} label="Overview" onNavigate={onClose} />
                <NavItem to={`/projects/${projectId}/domains`} icon={Tags} label="Domains" onNavigate={onClose} />
                <NavItem to={`/projects/${projectId}/documents`} icon={FileText} label="Documents" onNavigate={onClose} />
                <NavItem to={`/projects/${projectId}/goals`} icon={Target} label="Goals" onNavigate={onClose} />
                <NavItem to={`/projects/${projectId}/scenarios`} icon={GitBranch} label="Scenarios" onNavigate={onClose} />
              </NavSection>

              <NavSection label="Analysis tools">
                <NavItem to={`/projects/${projectId}/search`} icon={Search} label="Search" onNavigate={onClose} />
                <NavItem to={`/projects/${projectId}/keywords`} icon={BookMarked} label="Keyword Definitions" onNavigate={onClose} />
                <NavItem
                  to={`/projects/${projectId}/classifications`}
                  icon={SlidersHorizontal}
                  label="Classification Dimensions"
                  onNavigate={onClose}
                />
              </NavSection>
            </>
          ) : (
            <>
              <NavSection>
                <NavItem to="/" icon={Home} label="Home" end onNavigate={onClose} />
                <NavItem to="/projects" icon={FolderKanban} label="Projects" end onNavigate={onClose} />
                <NavItem to="/admin/user-groups" icon={FolderKanban} label="User Groups" onNavigate={onClose} />
              </NavSection>
              {(user?.role === 'admin' || user?.role === 'project_manager') && (
                <NavSection label="Administration">
                  {user?.role === 'admin' && (
                    <NavItem to="/admin/users" icon={Users} label="Users" onNavigate={onClose} />
                  )}
                  <NavItem to="/admin/audit-log" icon={ScrollText} label="Audit Log" onNavigate={onClose} />
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
    </>
  );
}
