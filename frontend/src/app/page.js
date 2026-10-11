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
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-12 sm:pt-20 pb-20 sm:pb-32 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3.5 py-1 text-[11px] sm:text-xs font-semibold text-indigo-400 mb-6">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span>Campus Event & Booking System &bull; Live Online</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl bg-clip-text leading-tight sm:leading-tight">
            Discover Campus Life. <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              Reserve Tickets Seamlessly.
            </span>
          </h1>

          <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-relaxed text-slate-300 max-w-2xl mx-auto px-2">
            Your all-in-one college platform for event discovery, instant seat reservations with unique QR code tickets, and streamlined organizer check-ins.
          </p>

          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 max-w-md sm:max-w-none mx-auto">
            <Link
              href="/events"
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 transition-all hover:scale-[1.02]"
            >
              <span>Explore Events</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard/student"
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-6 py-3.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
            >
              <Ticket className="h-4 w-4 text-indigo-400" />
              <span>Student Portal</span>
            </Link>
            <Link
              href="/check-in"
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-6 py-3.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
            >
              <QrCode className="h-4 w-4 text-emerald-400" />
              <span>Event Check-In</span>
            </Link>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-16 sm:mt-24 grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8 max-w-5xl mx-auto">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8 hover:border-indigo-500/30 transition">
            <div className="rounded-xl bg-indigo-600/20 p-3 w-fit text-indigo-400 mb-4">
              <Calendar className="h-6 w-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white">Curated Campus Events</h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
              Explore workshops, tech hackathons, cultural fests, and guest lectures with real-time seat tracking.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8 hover:border-purple-500/30 transition">
            <div className="rounded-xl bg-purple-600/20 p-3 w-fit text-purple-400 mb-4">
              <QrCode className="h-6 w-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white">Instant QR Code Passes</h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
              Automated booking generation with digital QR tickets sent straight to your email and student wallet.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8 hover:border-emerald-500/30 transition">
            <div className="rounded-xl bg-emerald-600/20 p-3 w-fit text-emerald-400 mb-4">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white">Fast Gate Check-In</h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
              Live camera barcode verification for event organizers that eliminates queues and prevents double entries.
            </p>
          </div>
        </div>

        {/* Architecture Status Banner */}
        <div className="mt-16 sm:mt-20 max-w-3xl mx-auto rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 sm:p-6 backdrop-blur">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Campus Event Hub Core Features</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-center">
            <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800/60">
              <div className="text-[11px] sm:text-xs text-slate-400">Frontend</div>
              <div className="text-xs sm:text-sm font-semibold text-white mt-1">Next.js 16</div>
            </div>
            <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800/60">
              <div className="text-[11px] sm:text-xs text-slate-400">Styling</div>
              <div className="text-xs sm:text-sm font-semibold text-white mt-1">Tailwind CSS 4</div>
            </div>
            <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800/60">
              <div className="text-[11px] sm:text-xs text-slate-400">Backend API</div>
              <div className="text-xs sm:text-sm font-semibold text-white mt-1">Node Express</div>
            </div>
            <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800/60">
              <div className="text-[11px] sm:text-xs text-slate-400">Database</div>
              <div className="text-xs sm:text-sm font-semibold text-white mt-1">Prisma SQLite</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
