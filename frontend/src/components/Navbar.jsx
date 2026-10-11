'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calendar,
  LogIn,
  UserPlus,
  LogOut,
  User,
  LayoutDashboard,
  Menu,
  X,
  Compass,
  QrCode,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, logout, isAuthenticated, isOrganizer } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu whenever pathname changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const dashboardLink = isOrganizer ? '/dashboard/organizer' : '/dashboard/student';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-lg sm:text-xl font-bold text-white tracking-tight"
          onClick={() => setMobileMenuOpen(false)}
        >
          <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-400 shrink-0" />
          <span>
            Campus<span className="text-indigo-400">Events</span>
          </span>
        </Link>

        {/* ── Desktop Navigation (hidden on mobile) ── */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/events"
            className={`text-sm font-medium transition-colors ${
              pathname === '/events'
                ? 'text-indigo-400 font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Explore Events
          </Link>
          <Link
            href="/check-in"
            className={`text-sm font-medium transition-colors ${
              pathname === '/check-in'
                ? 'text-indigo-400 font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Check-In
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-3 ml-2">
              <Link
                href={dashboardLink}
                className="flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
              >
                <LayoutDashboard className="h-4 w-4 text-indigo-400" />
                <span>Dashboard</span>
              </Link>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
                <User className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-white font-medium max-w-[120px] truncate">{user.name}</span>
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
            <div className="flex items-center gap-3 ml-2">
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

        {/* ── Mobile Hamburger Button (visible on mobile only) ── */}
        <div className="flex items-center md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 transition focus:outline-none"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* ── Mobile Collapsible Menu Drawer ── */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800/90 bg-slate-950/95 px-4 pt-3 pb-5 shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-2">
            <Link
              href="/events"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                pathname === '/events'
                  ? 'bg-indigo-600/15 border border-indigo-500/30 text-indigo-300 font-semibold'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Compass className="h-4 w-4 text-indigo-400" />
              <span>Explore Events</span>
            </Link>

            <Link
              href="/check-in"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                pathname === '/check-in'
                  ? 'bg-indigo-600/15 border border-indigo-500/30 text-indigo-300 font-semibold'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <QrCode className="h-4 w-4 text-emerald-400" />
              <span>Gate Check-In</span>
            </Link>

            {isAuthenticated ? (
              <div className="border-t border-slate-800/80 pt-3 mt-2 space-y-2.5">
                {/* User info card */}
                <div className="flex items-center justify-between rounded-xl bg-slate-900/80 border border-slate-800 px-3.5 py-2.5 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-7 w-7 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                      <User className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">{user.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {user.role}
                  </span>
                </div>

                <Link
                  href={dashboardLink}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
                >
                  <LayoutDashboard className="h-4 w-4 text-indigo-400" />
                  <span>Go to Dashboard</span>
                </Link>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-950/20 px-4 py-2.5 text-xs font-semibold text-red-300 hover:bg-red-900/30 transition"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="border-t border-slate-800/80 pt-3 mt-2 grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Login</span>
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Register</span>
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
