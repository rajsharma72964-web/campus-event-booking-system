'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Ticket,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  LayoutDashboard,
  ChevronDown,
  ChevronUp,
  Ban,
  QrCode,
  User,
  ArrowRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

// ─── Helpers ──────────────────────────────────────────────
const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

const statusStyles = {
  CONFIRMED: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
  CHECKED_IN: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
  CANCELLED: 'bg-slate-700/40 border-slate-600/30 text-slate-400',
};

const statusLabels = {
  CONFIRMED: '✓ Confirmed',
  CHECKED_IN: '✅ Attended',
  CANCELLED: '✗ Cancelled',
};

// ─── QR Modal ─────────────────────────────────────────────
function QRModal({ booking, onClose }) {
  const [qrDataURL, setQrDataURL] = useState(null);
  const [loadingQr, setLoadingQr] = useState(true);

  useEffect(() => {
    const loadQr = async () => {
      try {
        if (booking.qrCodeDataURL) {
          setQrDataURL(booking.qrCodeDataURL);
          setLoadingQr(false);
          return;
        }
        // Fallback to QR Server API if data URL is absent
        const encoded = encodeURIComponent(booking.qrCodeString);
        const url = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encoded}&bgcolor=ffffff&color=0f172a&ecc=H&margin=10`;
        setQrDataURL(url);
      } catch {
        // noop
      } finally {
        setLoadingQr(false);
      }
    };
    loadQr();
  }, [booking.qrCodeString, booking.qrCodeDataURL]);

  const event = booking.event;
  const eventDate = formatDate(event.startDateTime);
  const eventTime = formatTime(event.startDateTime);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-200 mb-1">Campus Event Hub</p>
          <h2 className="text-lg font-extrabold text-white">{event.title}</h2>
          <p className="text-xs text-indigo-200 mt-1">{event.category}</p>
        </div>

        {/* QR Area */}
        <div className="px-6 py-6 flex flex-col items-center">
          <div className="rounded-xl border-4 border-indigo-500/40 bg-white p-3 mb-4 shadow-xl">
            {loadingQr ? (
              <div className="w-[200px] h-[200px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataURL}
                alt="Entry QR Code"
                className="w-[200px] h-[200px] object-contain"
              />
            )}
          </div>

          {/* Event Details */}
          <div className="w-full space-y-2 mb-5">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Calendar className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              <span>{eventDate} at {eventTime}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <MapPin className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              <span>{event.venue}</span>
            </div>
          </div>

          {/* QR String */}
          <div className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 mb-5">
            <p className="text-[10px] text-slate-500 font-mono text-center break-all leading-relaxed">
              {booking.qrCodeString}
            </p>
          </div>

          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[booking.status]}`}
          >
            {statusLabels[booking.status]}
          </span>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-xs font-semibold text-white hover:bg-slate-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Booking Card ──────────────────────────────────────────
function BookingCard({ booking, onCancel, onViewQR }) {
  const [expanded, setExpanded] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const event = booking.event;
  const isPast = new Date(event.startDateTime) < new Date();
  const isActive = booking.status === 'CONFIRMED';
  const isCheckedIn = booking.status === 'CHECKED_IN';
  const isCancelled = booking.status === 'CANCELLED';

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this booking? The seat will be released.')) return;
    setCancelling(true);
    await onCancel(booking.id);
    setCancelling(false);
  };

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 ${
        isCancelled
          ? 'border-slate-800 bg-slate-900/30 opacity-60'
          : isCheckedIn
          ? 'border-emerald-500/20 bg-emerald-950/10'
          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
      }`}
    >
      {/* Card Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                  statusStyles[booking.status]
                }`}
              >
                {statusLabels[booking.status]}
              </span>
              <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                {event.category}
              </span>
              {isPast && !isCheckedIn && !isCancelled && (
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                  Past Event
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-white truncate">{event.title}</h3>
          </div>

          {/* QR Button (only for non-cancelled) */}
          {!isCancelled && (
            <button
              onClick={() => onViewQR(booking)}
              className="shrink-0 flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition"
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>QR</span>
            </button>
          )}
        </div>

        {/* Event Meta */}
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 mb-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <span>{formatDate(event.startDateTime)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <span>{formatTime(event.startDateTime)}</span>
          </div>
          <div className="flex items-center gap-1.5 col-span-2">
            <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <span className="truncate">{event.venue}</span>
          </div>
        </div>

        {/* Actions Row */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            <span>{expanded ? 'Less' : 'Details'}</span>
          </button>

          {isActive && !isPast && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition disabled:opacity-50"
            >
              {cancelling ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Ban className="h-3.5 w-3.5" />
              )}
              <span>Cancel</span>
            </button>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-slate-800 px-5 py-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Booking ID</span>
            <span className="font-mono text-slate-300 text-[10px]">{booking.id}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Organizer</span>
            <span className="text-slate-300">{event.organizer?.name || 'N/A'}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Price</span>
            <span className="text-white font-semibold">
              {event.price === 0 ? 'Free' : `₹${parseFloat(event.price).toFixed(2)}`}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Booked On</span>
            <span className="text-slate-300">{formatDate(booking.createdAt)}</span>
          </div>
          <div className="pt-1">
            <p className="text-[10px] text-slate-600 mb-1">QR Payload</p>
            <p className="font-mono text-[9px] text-slate-500 break-all leading-relaxed">{booking.qrCodeString}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard Page ──────────────────────────────────
export default function StudentDashboardPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, attended: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'past' | 'cancelled'
  const [selectedBooking, setSelectedBooking] = useState(null); // for QR modal
  const [cancelError, setCancelError] = useState(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get('/bookings/my-bookings');
      setBookings(data.bookings || []);
      setStats({
        total: data.total || 0,
        active: data.active || 0,
        attended: data.attended || 0,
      });
    } catch (err) {
      setError(err.message || 'Failed to load your bookings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login?redirect=/dashboard/student');
      } else {
        fetchBookings();
      }
    }
  }, [authLoading, isAuthenticated, router, fetchBookings]);

  const handleCancel = async (bookingId) => {
    setCancelError(null);
    try {
      await api.delete(`/bookings/${bookingId}`);
      // Optimistic UI update
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: 'CANCELLED' } : b))
      );
      setStats((prev) => ({ ...prev, active: Math.max(0, prev.active - 1) }));
    } catch (err) {
      setCancelError(err.message || 'Failed to cancel booking.');
    }
  };

  // ── Filter bookings by tab ────────────────────────────
  const now = new Date();
  const filteredBookings = bookings.filter((b) => {
    const isPast = new Date(b.event.startDateTime) < now;
    if (activeTab === 'active') return b.status === 'CONFIRMED' && !isPast;
    if (activeTab === 'past') return b.status === 'CHECKED_IN' || (b.status === 'CONFIRMED' && isPast);
    if (activeTab === 'cancelled') return b.status === 'CANCELLED';
    return true;
  });

  // ── Upcoming this week ────────────────────────────────
  const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const upcomingThisWeek = bookings.filter(
    (b) =>
      b.status === 'CONFIRMED' &&
      new Date(b.event.startDateTime) >= now &&
      new Date(b.event.startDateTime) <= weekFromNow
  ).length;

  // ── Loading / auth guard ──────────────────────────────
  if (authLoading || (loading && bookings.length === 0)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        <p className="text-sm text-slate-400">Loading your dashboard…</p>
      </div>
    );
  }

  return (
    <>
      {/* QR Modal */}
      {selectedBooking && (
        <QRModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
      )}

      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <LayoutDashboard className="h-5 w-5 text-indigo-400" />
              <h1 className="text-2xl font-extrabold text-white">My Tickets</h1>
            </div>
            <p className="text-sm text-slate-400">
              Welcome back, <span className="font-semibold text-indigo-300">{user?.name || 'Student'}</span>! Manage your event tickets and QR passes.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchBookings}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <Link
              href="/events"
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition"
            >
              <Ticket className="h-3.5 w-3.5" />
              <span>Browse Events</span>
            </Link>
          </div>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'Total Bookings',
              value: stats.total,
              icon: Ticket,
              color: 'text-indigo-400',
              bg: 'bg-indigo-500/10 border-indigo-500/20',
            },
            {
              label: 'Active Tickets',
              value: stats.active,
              icon: CheckCircle2,
              color: 'text-emerald-400',
              bg: 'bg-emerald-500/10 border-emerald-500/20',
            },
            {
              label: 'Attended',
              value: stats.attended,
              icon: User,
              color: 'text-violet-400',
              bg: 'bg-violet-500/10 border-violet-500/20',
            },
            {
              label: 'This Week',
              value: upcomingThisWeek,
              icon: Clock,
              color: 'text-amber-400',
              bg: 'bg-amber-500/10 border-amber-500/20',
            },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={`rounded-xl border p-4 ${bg}`}>
              <Icon className={`h-5 w-5 mb-2 ${color}`} />
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">{label}</p>
              <p className="text-2xl font-extrabold text-white mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {/* ── Error / Cancel Error ── */}
        {(error || cancelError) && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-950/20 px-4 py-3 text-sm text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{error || cancelError}</span>
          </div>
        )}

        {/* ── Tab Navigation ── */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-900 border border-slate-800 p-1 mb-6 w-fit">
          {[
            { id: 'active', label: 'Active', count: bookings.filter((b) => b.status === 'CONFIRMED' && new Date(b.event.startDateTime) >= now).length },
            { id: 'past', label: 'Past', count: bookings.filter((b) => b.status === 'CHECKED_IN' || (b.status === 'CONFIRMED' && new Date(b.event.startDateTime) < now)).length },
            { id: 'cancelled', label: 'Cancelled', count: bookings.filter((b) => b.status === 'CANCELLED').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    activeTab === tab.id ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Bookings List ── */}
        {filteredBookings.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 px-8 py-16 text-center">
            {activeTab === 'active' ? (
              <>
                <Ticket className="h-10 w-10 text-slate-600 mx-auto mb-4" />
                <h3 className="text-base font-bold text-white mb-2">No Active Tickets</h3>
                <p className="text-sm text-slate-400 mb-6">
                  You have no upcoming event reservations. Browse events and reserve your spot!
                </p>
                <Link
                  href="/events"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition"
                >
                  <span>Browse Events</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            ) : activeTab === 'past' ? (
              <>
                <Calendar className="h-10 w-10 text-slate-600 mx-auto mb-4" />
                <h3 className="text-base font-bold text-white mb-2">No Past Events</h3>
                <p className="text-sm text-slate-400">Your attended events will appear here.</p>
              </>
            ) : (
              <>
                <XCircle className="h-10 w-10 text-slate-600 mx-auto mb-4" />
                <h3 className="text-base font-bold text-white mb-2">No Cancelled Bookings</h3>
                <p className="text-sm text-slate-400">Cancelled bookings will appear here.</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onCancel={handleCancel}
                onViewQR={(b) => setSelectedBooking(b)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
