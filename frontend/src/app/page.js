import Link from 'next/link';
import { Calendar, Ticket, ShieldCheck, Sparkles, ArrowRight, QrCode, Users, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="relative isolate overflow-hidden">
      {/* Background Gradient Orbs */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-indigo-600 to-purple-800 opacity-25 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
      </div>

      {/* Hero Section */}
      <div className="mx-auto max-w-7xl px-6 pt-16 pb-24 sm:pb-32 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-400 mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Campus Event & Booking System &bull; Phase 1 Active</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl bg-clip-text">
            Discover Campus Life. <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              Reserve Tickets Seamlessly.
            </span>
          </h1>

          <p className="mt-6 text-lg leading-8 text-slate-300 max-w-2xl mx-auto">
            Your all-in-one college platform for event discovery, instant seat reservations with unique QR code tickets, and streamlined organizer check-ins.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/events"
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 transition-all hover:scale-[1.02]"
            >
              <span>Explore Events</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard/student"
              className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-6 py-3.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
            >
              <Ticket className="h-4 w-4 text-indigo-400" />
              <span>Student Portal</span>
            </Link>
            <Link
              href="/check-in"
              className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-6 py-3.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
            >
              <QrCode className="h-4 w-4 text-emerald-400" />
              <span>Event Check-In</span>
            </Link>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 hover:border-indigo-500/30 transition">
            <div className="rounded-xl bg-indigo-600/20 p-3 w-fit text-indigo-400 mb-4">
              <Calendar className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Curated Campus Events</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Explore workshops, tech hackathons, cultural fests, and guest lectures with real-time seat tracking.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 hover:border-purple-500/30 transition">
            <div className="rounded-xl bg-purple-600/20 p-3 w-fit text-purple-400 mb-4">
              <QrCode className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Instant QR Code Passes</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Automated booking generation with digital QR tickets sent straight to your email and student wallet.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 hover:border-emerald-500/30 transition">
            <div className="rounded-xl bg-emerald-600/20 p-3 w-fit text-emerald-400 mb-4">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Fast Gate Check-In</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Live camera barcode verification for event organizers that eliminates queues and prevents double entries.
            </p>
          </div>
        </div>

        {/* Architecture Status Banner */}
        <div className="mt-20 max-w-3xl mx-auto rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Phase 1 Baseline Infrastructure</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-800/60">
              <div className="text-xs text-slate-400">Frontend</div>
              <div className="text-sm font-semibold text-white mt-1">Next.js 15 App</div>
            </div>
            <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-800/60">
              <div className="text-xs text-slate-400">Styling & Icons</div>
              <div className="text-sm font-semibold text-white mt-1">Tailwind + Lucide</div>
            </div>
            <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-800/60">
              <div className="text-xs text-slate-400">Backend API</div>
              <div className="text-sm font-semibold text-white mt-1">Node.js Express</div>
            </div>
            <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-800/60">
              <div className="text-xs text-slate-400">Database ORM</div>
              <div className="text-sm font-semibold text-white mt-1">Prisma + Postgres</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
