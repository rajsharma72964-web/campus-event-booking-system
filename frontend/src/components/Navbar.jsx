'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Ticket, LogIn, UserPlus, LogOut, User, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, logout, isAuthenticated, isOrganizer } = useAuth();
  const pathname = usePathname();

  const dashboardLink = isOrganizer ? '/dashboard/organizer' : '/dashboard/student';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-white tracking-tight">
          <Calendar className="h-6 w-6 text-indigo-400" />
          <span>Campus<span className="text-indigo-400">Events</span></span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href="/events"
            className={`text-sm font-medium transition-colors ${
              pathname === '/events' ? 'text-indigo-400 font-semibold' : 'text-slate-300 hover:text-white'
            }`}
          >
            Explore Events
          </Link>
          <Link
            href="/check-in"
            className={`text-sm font-medium transition-colors ${
              pathname === '/check-in' ? 'text-indigo-400 font-semibold' : 'text-slate-300 hover:text-white'
            }`}
          >
            Check-In
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-3 ml-4">
              <Link
                href={dashboardLink}
                className="flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
              >
                <LayoutDashboard className="h-4 w-4 text-indigo-400" />
                <span>Dashboard</span>
              </Link>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
                <User className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-white font-medium">{user.name}</span>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {user.role}
                </span>
              </div>

              <button
                onClick={logout}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-400 px-2 py-1.5 rounded hover:bg-slate-900 transition"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 ml-4">
              <Link
                href="/login"
                className="flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition"
              >
                <LogIn className="h-4 w-4" />
                <span>Login</span>
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg shadow-sm transition"
              >
                <UserPlus className="h-4 w-4" />
                <span>Register</span>
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
