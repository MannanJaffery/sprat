import { NavLink, useParams } from 'react-router-dom';
import clsx from 'clsx';
import {
  FolderKanban, Users, ShieldCheck, ScrollText, LayoutDashboard,
  Tags, FileText, Target, GitBranch, ArrowLeft, Search, SlidersHorizontal, BookMarked,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

function NavItem({ to, icon: Icon, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary-50 text-primary-700'
            : 'text-text-secondary hover:bg-background hover:text-text-primary'
        )
      }
    >
      <Icon size={18} />
      {label}
    </NavLink>
  );
}

export default function Sidebar() {
  const { user } = useAuth();
  const { projectId } = useParams();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col gap-1 border-r border-border bg-surface p-4">
      <div className="mb-4 flex items-center gap-2 px-2">
        <ShieldCheck size={22} className="text-primary-600" />
        <span className="text-base font-bold tracking-tight">SPRAT</span>
      </div>

      {projectId ? (
        <>
          <NavItem to="/projects" icon={ArrowLeft} label="All projects" end />
          <div className="my-2 border-t border-border" />
          <NavItem to={`/projects/${projectId}/overview`} icon={LayoutDashboard} label="Overview" />
          <NavItem to={`/projects/${projectId}/domains`} icon={Tags} label="Domains" />
          <NavItem to={`/projects/${projectId}/documents`} icon={FileText} label="Documents" />
          <NavItem to={`/projects/${projectId}/goals`} icon={Target} label="Goals" />
          <NavItem to={`/projects/${projectId}/scenarios`} icon={GitBranch} label="Scenarios" />
          <NavItem to={`/projects/${projectId}/search`} icon={Search} label="Search" />
          <NavItem to={`/projects/${projectId}/keywords`} icon={BookMarked} label="Keyword Definitions" />
          <NavItem
            to={`/projects/${projectId}/classifications`}
            icon={SlidersHorizontal}
            label="Classification Dimensions"
          />
        </>
      ) : (
        <>
          <NavItem to="/projects" icon={FolderKanban} label="Projects" end />
          {user?.role === 'admin' && (
            <>
              <div className="my-2 border-t border-border" />
              <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Administration
              </p>
              <NavItem to="/admin/users" icon={Users} label="Users" />
              <NavItem to="/admin/user-groups" icon={FolderKanban} label="User Groups" />
              <NavItem to="/admin/audit-log" icon={ScrollText} label="Audit Log" />
            </>
          )}
          {user?.role === 'project_manager' && (
            <>
              <div className="my-2 border-t border-border" />
              <NavItem to="/admin/audit-log" icon={ScrollText} label="Audit Log" />
            </>
          )}
        </>
      )}
    </aside>
  );
}
