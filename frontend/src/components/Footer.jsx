import Link from 'next/link';
import { Calendar, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/70 py-8 sm:py-10 text-xs text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand */}
        <div className="flex flex-col items-center md:items-start gap-2 text-center md:text-left">
          <Link
            href="/"
            className="flex items-center gap-2 text-base font-bold text-white tracking-tight hover:opacity-90 transition"
          >
            <Calendar className="h-5 w-5 text-indigo-400" />
            <span>
              Event<span className="text-indigo-400">Hive</span>
            </span>
          </Link>
          <p className="text-slate-400 text-xs max-w-sm">
            Campus event discovery, seamless QR pass ticketing, and live gate check-in system.
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-6 text-xs font-medium">
          <Link href="/events" className="text-slate-400 hover:text-white transition">
            Explore Events
          </Link>
          <Link href="/dashboard/student" className="text-slate-400 hover:text-white transition">
            Student Portal
          </Link>
          <Link href="/check-in" className="text-slate-400 hover:text-white transition">
            Gate Check-In
          </Link>
          <Link href="/login" className="text-slate-400 hover:text-white transition">
            Account Login
          </Link>
        </div>

        {/* Copyright */}
        <div className="text-center md:text-right text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} EventHive. All rights reserved.</p>
          <p className="mt-1 flex items-center justify-center md:justify-end gap-1">
            Built for universities and student life.
          </p>
        </div>
      </div>
    </footer>
  );
}
