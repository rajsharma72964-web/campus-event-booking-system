'use client';

import Link from 'next/link';
import { Calendar, MapPin, Users, Ticket, ArrowRight } from 'lucide-react';

const CATEGORY_COLORS = {
  Technology: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  Cultural: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  Sports: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Academic: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Social: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
};

export default function EventCard({ event }) {
  if (!event) return null;

  const categoryStyle = CATEGORY_COLORS[event.category] || 'bg-slate-800 text-slate-300 border-slate-700';
  const isSoldOut = event.availableSeats <= 0;
  const isLowAvailability = !isSoldOut && event.availableSeats <= 15;

  const formattedDate = event.startDateTime
    ? new Date(event.startDateTime).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    : 'Date TBA';

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition-all duration-300 hover:border-indigo-500/50 hover:bg-slate-900/80 hover:shadow-xl hover:shadow-indigo-500/5">
      <div>
        {/* Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${categoryStyle}`}>
            {event.category || 'General'}
          </span>
          <span className="text-sm font-bold text-white">
            {event.price === 0 || !event.price ? (
              <span className="text-emerald-400">Free</span>
            ) : (
              `₹${parseFloat(event.price).toFixed(2)}`
            )}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-white transition-colors group-hover:text-indigo-300 line-clamp-1">
          {event.title}
        </h3>

        {/* Description */}
        <p className="mt-2 text-xs text-slate-400 leading-relaxed line-clamp-2">
          {event.description}
        </p>
      </div>

      {/* Meta details footer */}
      <div className="mt-6 space-y-2.5 border-t border-slate-800/80 pt-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
          <span className="truncate">{formattedDate}</span>
        </div>

        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
          <span className="truncate">{event.venue || 'Campus Venue'}</span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800/40">
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-slate-500" />
            {isSoldOut ? (
              <span className="font-semibold text-rose-400">Sold Out</span>
            ) : isLowAvailability ? (
              <span className="font-semibold text-amber-400">
                Only {event.availableSeats} left!
              </span>
            ) : (
              <span>{event.availableSeats} seats available</span>
            )}
          </div>

          <Link
            href={`/events/${event.id}`}
            className="flex items-center gap-1 font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <span>Details</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
