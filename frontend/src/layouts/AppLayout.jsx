import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Mic, History, BarChart3, Target, User, Settings, LogOut } from 'lucide-react';
import { Logo } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/studio', label: 'Studio', icon: Mic },
  { to: '/history', label: 'History', icon: History },
  { to: '/report', label: 'Progress', icon: BarChart3 },
  { to: '/improve', label: 'Improve', icon: Target },
];
const linkCls = ({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${isActive ? 'bg-brand-tint text-brand-dark' : 'text-muted hover:bg-brand-soft'}`;

export default function AppLayout() {
  const { user, logout } = useAuth(); const nav = useNavigate();
  const initials = user.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-white p-4 lg:flex">
        <Logo className="px-2 py-3" />
        <nav className="mt-6 flex flex-1 flex-col gap-1" aria-label="Main">
          {NAV.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={linkCls}><Icon className="h-[18px] w-[18px]" />{label}</NavLink>)}
        </nav>
        <div className="flex flex-col gap-1 border-t border-line pt-3">
          <NavLink to="/profile" className={linkCls}><User className="h-[18px] w-[18px]" />Profile</NavLink>
          <NavLink to="/settings" className={linkCls}><Settings className="h-[18px] w-[18px]" />Settings</NavLink>
          <button onClick={async () => { await logout(); nav('/'); }} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted hover:bg-brand-soft"><LogOut className="h-[18px] w-[18px]" />Log out</button>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-white/80 px-4 backdrop-blur-xl lg:px-8">
        <Logo className="lg:invisible" />
        <NavLink to="/profile" className="flex items-center gap-2" aria-label="Your profile">
          <span className="hidden text-sm font-semibold sm:block">{user.name}</span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">{initials}</span>
        </NavLink>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 lg:px-8 lg:pb-12"><Outlet /></main>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 border-t border-line bg-white/90 backdrop-blur-xl lg:hidden" aria-label="Mobile">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `flex flex-1 flex-col items-center justify-center gap-0.5 font-mono text-[11px] font-semibold ${isActive ? 'text-brand' : 'text-muted'}`}>
            <Icon className="h-5 w-5" />{label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
