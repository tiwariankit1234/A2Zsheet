import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Bookmark, Info, ListChecks, Menu, Moon, Sun, User, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/', label: 'Sheet', icon: ListChecks, end: true },
  { to: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
  { to: '/about', label: 'About', icon: Info },
];

const navClass = ({ isActive }) =>
  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white'
      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white'
  }`;

export default function Navbar({ theme, onToggleTheme }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const accountLabel = user && !user.isGuest ? user.name || user.email : 'Sign in';

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <nav className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
        <Link to="/" className="mr-4 flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-700 text-xs font-bold text-white">A2Z</span>
          <span className="hidden sm:inline">A2Z Tracker</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={navClass}>
              <Icon className="h-4 w-4" /> {label}
            </NavLink>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1">
          <button className="icon-btn" onClick={onToggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} title="Toggle theme">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <NavLink to="/account" className={(s) => `${navClass(s)} hidden md:flex`}>
            <User className="h-4 w-4" />
            <span className="max-w-[10rem] truncate">{accountLabel}</span>
          </NavLink>
          <button className="icon-btn md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Open menu" aria-expanded={open}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-zinc-200 px-4 py-2 md:hidden dark:border-zinc-800">
          {[...links, { to: '/account', label: accountLabel, icon: User }].map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={navClass} onClick={() => setOpen(false)}>
              <Icon className="h-4 w-4" /> {label}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  );
}
