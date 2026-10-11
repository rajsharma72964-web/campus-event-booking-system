'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  MapPin,
  Ticket,
  ArrowLeft,
  Building,
  User,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Share2,
  XCircle,
  LayoutDashboard,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function EventDetailPage({ params }) {
  // Unwrap params using React.use() or await params for Next.js 15+
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadEvent() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.get(`/events/${eventId}`);
        if (data?.event) {
          setEvent(data.event);
        } else {
          setError('Event details could not be found.');
        }
      } catch (err) {
        console.error('Failed to fetch event:', err);
        setError(err.message || 'Failed to load event details.');
      } finally {
        setLoading(false);
      }
    }

    if (eventId) {
      loadEvent();
    }
  }, [eventId]);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null); // { qrCodeDataURL, bookingId }
  const [bookingError, setBookingError] = useState(null);

  const handleBookingIntent = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/events/${eventId}`);
      return;
    }

    setBookingLoading(true);
    setBookingError(null);

    try {
      const data = await api.post('/bookings', { eventId });
      setBookingSuccess({
        qrCodeDataURL: data.booking?.qrCodeDataURL,
        bookingId: data.booking?.id,
        qrCodeString: data.booking?.qrCodeString,
      });
      // Decrement displayed seat count locally for instant feedback
      setEvent((prev) => ({
        ...prev,
        availableSeats: Math.max(0, prev.availableSeats - 1),
      }));
    } catch (err) {
      setBookingError(err.message || 'Failed to complete booking. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center py-20 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400 mb-3" />
        <p className="text-sm text-slate-400">Loading event information...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-10">
          <AlertCircle className="h-10 w-10 text-rose-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white">Event Not Found</h2>
          <p className="mt-2 text-sm text-slate-400">{error || 'This event may have been cancelled or deleted.'}</p>
          <Link
            href="/events"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Event Directory</span>
          </Link>
        </div>
      </div>
    );
  }

  const isSoldOut = event.availableSeats <= 0;
  const isCancelled = event.status === 'CANCELLED';
  const occupancyPercentage = Math.min(100, Math.round(((event.capacity - event.availableSeats) / event.capacity) * 100));

  const startDate = new Date(event.startDateTime).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const startTime = new Date(event.startDateTime).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });

  const endTime = new Date(event.endDateTime).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      {/* Back button */}
      <Link
        href="/events"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Events</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 backdrop-blur-md shadow-xl">
            {/* Badges */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  {event.category}
                </span>
                {isCancelled ? (
                  <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-400">
                    Cancelled
                  </span>
                ) : (
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                    Published & Active
                  </span>
                )}
              </div>

              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied Link!' : 'Share'}</span>
              </button>
            </div>

            {/* Event Title */}
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {event.title}
            </h1>

            {/* Organizer Info */}
            <div className="mt-4 flex items-center gap-3 border-b border-slate-800/80 pb-6 text-xs text-slate-400">
              <div className="h-9 w-9 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <User className="h-4 w-4" />
              </div>
              <div>
                <div className="text-slate-400 text-[11px]">Hosted by</div>
                <div className="font-semibold text-white">{event.organizer?.name || 'Campus Faculty'}</div>
              </div>
            </div>

            {/* Description */}
            <div className="mt-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">
                About This Event
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </div>

            {/* Details Grid */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-800/80 pt-6">
              <div className="flex items-start gap-3 rounded-xl bg-slate-950/40 p-4 border border-slate-800/60">
                <Calendar className="h-5 w-5 text-indigo-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-slate-500 font-semibold uppercase">Date</div>
                  <div className="text-sm font-semibold text-white">{startDate}</div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-slate-950/40 p-4 border border-slate-800/60">
                <Clock className="h-5 w-5 text-indigo-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-slate-500 font-semibold uppercase">Time</div>
                  <div className="text-sm font-semibold text-white">{startTime} - {endTime}</div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-slate-950/40 p-4 border border-slate-800/60">
                <MapPin className="h-5 w-5 text-indigo-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-slate-500 font-semibold uppercase">Location</div>
                  <div className="text-sm font-semibold text-white">{event.venue}</div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-slate-950/40 p-4 border border-slate-800/60">
                <Building className="h-5 w-5 text-indigo-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-slate-500 font-semibold uppercase">Entry Policy</div>
                  <div className="text-sm font-semibold text-white">Digital QR Ticket Required</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Ticket Reservation Box */}
        <div className="space-y-6">
          <div className="sticky top-24 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-xl shadow-2xl">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Ticket Price
            </div>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-4xl font-extrabold text-white">
                {event.price === 0 || !event.price ? 'Free' : `₹${parseFloat(event.price).toFixed(2)}`}
              </span>
              <span className="text-xs text-slate-500">/ attendee</span>
            </div>

            {/* Real-time Seat Counter & Progress Bar */}
            <div className="mb-6 rounded-xl bg-slate-950/60 p-4 border border-slate-800">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-slate-400">Available Seats:</span>
                <span className={`font-bold ${isSoldOut ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {isSoldOut ? '0 Seats Left' : `${event.availableSeats} of ${event.capacity}`}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    occupancyPercentage >= 90 ? 'bg-rose-500' : occupancyPercentage >= 70 ? 'bg-amber-500' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${occupancyPercentage}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                <span>{occupancyPercentage}% Booked</span>
                <span>Total: {event.capacity} seats</span>
              </div>
            </div>

            {/* Call to Action Button */}
            {!bookingSuccess ? (
              <>
                <button
                  onClick={handleBookingIntent}
                  disabled={isSoldOut || isCancelled || bookingLoading}
                  className={`w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold shadow-lg transition active:scale-[0.99] ${
                    isCancelled
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : isSoldOut
                      ? 'bg-rose-950/40 border border-rose-800/50 text-rose-300 cursor-not-allowed'
                      : bookingLoading
                      ? 'bg-indigo-700 text-indigo-200 cursor-wait'
                      : 'bg-indigo-600 text-white shadow-indigo-600/30 hover:bg-indigo-500'
                  }`}
                >
                  {bookingLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Ticket className="h-4 w-4" />
                  )}
                  <span>
                    {isCancelled
                      ? 'Event Cancelled'
                      : isSoldOut
                      ? 'Event Sold Out'
                      : bookingLoading
                      ? 'Reserving Ticket…'
                      : 'Reserve Ticket Now'}
                  </span>
                </button>

                {bookingError && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-300">
                    <XCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                    <span>{bookingError}</span>
                  </div>
                )}

                {!isAuthenticated && !isSoldOut && !isCancelled && (
                  <p className="mt-3 text-center text-[11px] text-slate-400">
                    You will be prompted to log in before confirming your ticket.
                  </p>
                )}

                <div className="mt-6 border-t border-slate-800/80 pt-4 space-y-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Instant QR pass generation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Email confirmation receipt</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Zero reservation fees</span>
                  </div>
                </div>
              </>
            ) : (
              /* ── Booking Success State ── */
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <span className="text-sm font-bold text-emerald-300">Booking Confirmed!</span>
                </div>

                {bookingSuccess.qrCodeDataURL && (
                  <div className="mb-4 rounded-xl border-2 border-indigo-500/40 bg-white p-2">
                    <img
                      src={bookingSuccess.qrCodeDataURL}
                      alt="Your QR Entry Ticket"
                      className="w-full max-w-[180px] h-auto rounded-lg block mx-auto"
                    />
                  </div>
                )}

                <p className="text-[10px] text-slate-500 font-mono break-all mb-4 px-2">
                  {bookingSuccess.qrCodeString}
                </p>

                <p className="text-xs text-slate-400 mb-4">
                  A confirmation email with your QR ticket has been sent. Present this QR code at the venue entrance.
                </p>

                <Link
                  href="/dashboard/student"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 border border-slate-700 py-3 text-xs font-semibold text-white hover:bg-slate-700 transition"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>View My Tickets</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
