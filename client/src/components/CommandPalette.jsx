import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FolderKanban, Users, ScrollText, LayoutDashboard, Tags, FileText,
  Target, GitBranch, Search, SlidersHorizontal, BookMarked, LogOut,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { projectId } = useParams();

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const go = (path) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command palette"
      shouldFilter
      overlayClassName="fixed inset-0 z-[60] bg-text-primary/30 backdrop-blur-sm"
      contentClassName="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-24"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-surface shadow-soft">
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search size={16} className="text-text-muted" />
          <Command.Input
            autoFocus
            placeholder="Jump to a page…"
            className="w-full bg-transparent py-3.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          />
          <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px] text-text-muted">esc</kbd>
        </div>
        <Command.List className="max-h-80 overflow-y-auto p-2">
          <Command.Empty className="px-3 py-8 text-center text-sm text-text-secondary">
            No matching pages.
          </Command.Empty>

          <Command.Group heading="Workspace" className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-text-muted [&_[cmdk-group-items]]:mt-1">
            <PaletteItem icon={FolderKanban} label="All projects" onSelect={() => go('/projects')} />
            {projectId && (
              <>
                <PaletteItem icon={LayoutDashboard} label="Project overview" onSelect={() => go(`/projects/${projectId}/overview`)} />
                <PaletteItem icon={Tags} label="Domains" onSelect={() => go(`/projects/${projectId}/domains`)} />
                <PaletteItem icon={FileText} label="Documents" onSelect={() => go(`/projects/${projectId}/documents`)} />
                <PaletteItem icon={Target} label="Goals" onSelect={() => go(`/projects/${projectId}/goals`)} />
                <PaletteItem icon={GitBranch} label="Scenarios" onSelect={() => go(`/projects/${projectId}/scenarios`)} />
                <PaletteItem icon={Search} label="Search this project" onSelect={() => go(`/projects/${projectId}/search`)} />
                <PaletteItem icon={SlidersHorizontal} label="Classification dimensions" onSelect={() => go(`/projects/${projectId}/classifications`)} />
                <PaletteItem icon={BookMarked} label="Keyword definitions" onSelect={() => go(`/projects/${projectId}/keywords`)} />
              </>
            )}
          </Command.Group>

          {(user?.role === 'admin' || user?.role === 'project_manager') && (
            <Command.Group heading="Administration" className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-text-muted [&_[cmdk-group-items]]:mt-1">
              {user?.role === 'admin' && (
                <>
                  <PaletteItem icon={Users} label="Users" onSelect={() => go('/admin/users')} />
                  <PaletteItem icon={FolderKanban} label="User groups" onSelect={() => go('/admin/user-groups')} />
                </>
              )}
              <PaletteItem icon={ScrollText} label="Audit log" onSelect={() => go('/admin/audit-log')} />
            </Command.Group>
          )}

          <Command.Group heading="Account" className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-text-muted [&_[cmdk-group-items]]:mt-1">
            <PaletteItem
              icon={LogOut}
              label="Sign out"
              onSelect={async () => {
                setOpen(false);
                await logout();
                navigate('/login');
              }}
            />
          </Command.Group>
        </Command.List>
      </div>
    </Command.Dialog>
  );
}

function PaletteItem({ icon: Icon, label, onSelect }) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-primary
        data-[selected=true]:bg-primary-50 data-[selected=true]:text-primary-700"
    >
      <Icon size={16} />
      {label}
    </Command.Item>
  );
}
