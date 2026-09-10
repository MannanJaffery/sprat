import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { LogOut, Search, Menu as MenuIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Avatar from './Avatar';
import Badge, { roleVariant } from './Badge';
import Breadcrumbs from './Breadcrumbs';
import { useAuth } from '../hooks/useAuth';

const ROLE_LABELS = {
  admin: 'Administrator',
  project_manager: 'Project Manager',
  analyst: 'Analyst',
  guest: 'Guest',
};

export default function Topbar({ onOpenSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Signed out.');
      navigate('/login');
    } catch {
      toast.error('Could not sign out. Please try again.');
    }
  };

  const openPalette = () => {
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true })
    );
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="rounded-lg p-1.5 text-text-secondary hover:bg-background hover:text-text-primary lg:hidden"
          aria-label="Open menu"
        >
          <MenuIcon size={20} />
        </button>
        <div className="min-w-0">
          <Breadcrumbs />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={openPalette}
          className="flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-text-secondary transition-colors hover:border-primary-300 hover:text-text-primary sm:px-3"
        >
          <Search size={14} />
          <span className="hidden sm:inline">Search</span>
          <kbd className="ml-1 hidden rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] text-text-muted sm:ml-2 sm:inline">
            ⌘K
          </kbd>
        </button>

        {user && (
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-background">
              <Avatar name={user.name} size="sm" />
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-150"
              enterFrom="opacity-0 scale-95 -translate-y-1"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-20 mt-2 w-64 origin-top-right rounded-xl border border-border bg-surface p-1.5 shadow-soft focus:outline-none">
                <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
                  <Avatar name={user.name} size="md" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text-primary">{user.name}</p>
                    <p className="truncate text-xs text-text-secondary">{user.email}</p>
                  </div>
                </div>
                <div className="px-3 pb-2">
                  <Badge variant={roleVariant(user.role)}>{ROLE_LABELS[user.role] || user.role}</Badge>
                </div>
                <div className="my-1 border-t border-border" />
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleLogout}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-primary ${
                        active ? 'bg-background' : ''
                      }`}
                    >
                      <LogOut size={15} />
                      Sign out
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        )}
      </div>
    </header>
  );
}
