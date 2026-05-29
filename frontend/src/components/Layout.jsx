import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  BarChart3,
  Bot,
  ChevronLeft,
  ChevronRight,
  FileText,
  HeartHandshake,
  Info,
  Inbox,
  LayoutDashboard,
  Link2,
  LogOut,
  PlusCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navLinks = [
  { to: '/', icon: LayoutDashboard, label: 'Home Base', hint: 'Your search at a glance' },
  { to: '/first-mate', icon: Bot, label: 'Buddy Brief', hint: 'What needs attention' },
  { to: '/auto-track', icon: Inbox, label: 'Inbox Scan', hint: 'Auto-detect job emails' },
  { to: '/add', icon: PlusCircle, label: 'Save a Job', hint: 'Paste or log a role' },
  { to: '/resumes', icon: FileText, label: 'Resume Vault', hint: 'Every version remembered' },
  { to: '/sources', icon: Link2, label: 'Connections', hint: 'Coral-powered tools' },
  { to: '/insights', icon: BarChart3, label: 'Query Studio', hint: 'Ask your data' },
  { to: '/about', icon: Info, label: 'About', hint: 'Why this project wins' },
];

export default function Layout({ children }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    nav('/login');
  };

  return (
    <div className="story-shell flex min-h-screen">
      <aside className={`sticky top-0 flex h-screen shrink-0 flex-col border-r border-white/70 bg-white/72 shadow-[16px_0_60px_rgba(15,23,42,0.06)] backdrop-blur-2xl transition-all duration-300 ${collapsed ? 'w-24' : 'w-72'}`}>
        <div className={`border-b border-slate-200/70 ${collapsed ? 'p-4' : 'p-6'}`}>
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between gap-3'}`}>
            <Link to="/" className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-white shadow-lg">
              <HeartHandshake className="h-5 w-5" />
            </div>
            {!collapsed && (
            <div>
              <h1 className="text-xl font-black text-slate-950">JobHuntBuddy</h1>
              <p className="text-xs font-medium text-slate-500">Your calm job-search copilot</p>
            </div>
            )}
          </Link>
            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white/85 text-slate-600 transition hover:bg-teal-50 hover:text-teal-800"
              aria-label={collapsed ? 'Open sidebar' : 'Close sidebar'}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>
          {!collapsed && (
          <div className="mt-6 rounded-3xl border border-teal-100 bg-teal-50/80 p-4">
            <p className="text-xs font-semibold uppercase text-teal-800">Today&apos;s tone</p>
            <p className="mt-1 text-sm leading-5 text-slate-700">
              Breathe. We&apos;ll remember the details while you keep moving.
            </p>
            <p className="mt-3 text-xs text-slate-500">Signed in as {user?.name || 'job seeker'}</p>
          </div>
          )}
        </div>

        <nav className="flex-1 space-y-2 overflow-auto p-4">
          {navLinks.map(({ to, icon: Icon, label, hint }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                title={collapsed ? label : undefined}
                className={`group flex items-center gap-3 rounded-3xl px-3 py-3 transition ${
                  active
                    ? 'bg-slate-950 text-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]'
                    : 'text-slate-600 hover:-translate-y-0.5 hover:bg-white hover:text-slate-950 hover:shadow-sm'
                } ${collapsed ? 'justify-center' : ''}`}
              >
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${active ? 'bg-white/12' : 'bg-slate-100 group-hover:bg-teal-50'}`}>
                  <Icon className="h-4 w-4" />
                </span>
                {!collapsed && (
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{label}</span>
                  <span className={`block truncate text-xs ${active ? 'text-white/65' : 'text-slate-400'}`}>{hint}</span>
                </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200/70 p-4">
          <button
            onClick={handleLogout}
            title={collapsed ? 'Sign out' : undefined}
            className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-500 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && 'Sign out'}
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 overflow-auto">{children}</main>
    </div>
  );
}
