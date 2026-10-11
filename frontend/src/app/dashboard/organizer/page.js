'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  PlusCircle,
  Calendar,
  Users,
  BarChart3,
  DollarSign,
  Edit2,
  Trash2,
  MapPin,
  AlertCircle,
  Loader2,
  X,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Ticket,
  CheckCircle2,
  PieChart as PieChartIcon,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const CATEGORIES = ['Technology', 'Cultural', 'Sports', 'Academic', 'Social'];
const PIE_COLORS = ['#10B981', '#6366F1', '#64748B', '#F59E0B', '#EC4899'];

export default function OrganizerDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isOrganizer, loading: authLoading } = useAuth();

  const [events, setEvents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);

  // Modal State for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Technology',
    venue: '',
    startDateTime: '',
    endDateTime: '',
    capacity: '',
    price: '0',
    status: 'PUBLISHED',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch organizer's events & analytics overview
  const loadDashboardData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setAnalyticsLoading(true);
    setError(null);

    try {
      // Parallel fetch: events list + analytics overview
      const [eventsRes, analyticsRes] = await Promise.all([
        api.get(`/events?organizerId=${user.id}`).catch(() => ({ events: [] })),
        api.get('/events/analytics/overview').catch(() => null),
      ]);

      setEvents(eventsRes?.events || []);
      setAnalytics(analyticsRes || null);
    } catch (err) {
      console.error('Failed to load organizer dashboard data:', err);
      setError('Unable to load your hosted events and analytics. Please try again.');
    } finally {
      setLoading(false);
      setAnalyticsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login?redirect=/dashboard/organizer');
      } else if (!isOrganizer) {
        router.push('/dashboard/student');
      } else {
        loadDashboardData();
      }
    }
  }, [authLoading, isAuthenticated, isOrganizer, router, loadDashboardData]);

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingEvent(null);
    const tomorrow = new Date(Date.now() + 86400000);
    const dayAfter = new Date(Date.now() + 86400000 + 14400000);

    setFormData({
      title: '',
      description: '',
      category: 'Technology',
      venue: '',
      startDateTime: tomorrow.toISOString().slice(0, 16),
      endDateTime: dayAfter.toISOString().slice(0, 16),
      capacity: '100',
      price: '0',
      status: 'PUBLISHED',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title || '',
      description: event.description || '',
      category: event.category || 'Technology',
      venue: event.venue || '',
      startDateTime: new Date(event.startDateTime).toISOString().slice(0, 16),
      endDateTime: new Date(event.endDateTime).toISOString().slice(0, 16),
      capacity: event.capacity.toString(),
      price: event.price.toString(),
      status: event.status || 'PUBLISHED',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Submit Form (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        venue: formData.venue,
        startDateTime: new Date(formData.startDateTime).toISOString(),
        endDateTime: new Date(formData.endDateTime).toISOString(),
        capacity: parseInt(formData.capacity, 10),
        price: parseFloat(formData.price) || 0,
        status: formData.status,
      };

      if (editingEvent) {
        await api.put(`/events/${editingEvent.id}`, payload);
      } else {
        await api.post('/events', payload);
      }

      setIsModalOpen(false);
      await loadDashboardData();
    } catch (err) {
      console.error('Form submission failed:', err);
      setFormError(err.message || 'Operation failed. Please check your form fields.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Event Cancellation or Removal
  const handleDelete = async (eventId, title) => {
    if (!confirm(`Are you sure you want to cancel or remove "${title}"?`)) return;

    try {
      await api.delete(`/events/${eventId}`);
      await loadDashboardData();
    } catch (err) {
      console.error('Failed to remove event:', err);
      alert(err.message || 'Could not delete this event.');
    }
  };

  if (authLoading || (loading && events.length === 0)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400 mb-3" />
        <p className="text-sm text-slate-400">Loading organizer dashboard & analytics...</p>
      </div>
    );
  }

  // Summary Metrics (fallback to local calculation if analytics API endpoint is still loading)
  const summary = analytics?.summary || {
    totalEvents: events.length,
    totalCapacity: events.reduce((acc, ev) => acc + ev.capacity, 0),
    totalTicketsSold: events.reduce((acc, ev) => acc + (ev.capacity - ev.availableSeats), 0),
    totalCheckedIn: 0,
    totalConfirmed: events.reduce((acc, ev) => acc + (ev.capacity - ev.availableSeats), 0),
    totalRevenue: events.reduce(
      (acc, ev) => acc + (ev.capacity - ev.availableSeats) * (ev.price || 0),
      0
    ),
    overallCheckInRate: 0,
    overallOccupancyRate:
      events.reduce((acc, ev) => acc + ev.capacity, 0) > 0
        ? Math.round(
            (events.reduce((acc, ev) => acc + (ev.capacity - ev.availableSeats), 0) /
              events.reduce((acc, ev) => acc + ev.capacity, 0)) *
              100
          )
        : 0,
  };

  // Prepare chart data for top 6 events
  const chartEventData = (analytics?.eventBreakdown || events.map((ev) => ({
    title: ev.title,
    confirmedCount: ev.capacity - ev.availableSeats,
    checkedInCount: 0,
    capacity: ev.capacity,
  })))
    .slice(0, 6)
    .map((ev) => ({
      name: ev.title.length > 14 ? ev.title.slice(0, 14) + '…' : ev.title,
      fullName: ev.title,
      CheckedIn: ev.checkedInCount || 0,
      Confirmed: ev.confirmedCount || 0,
      Capacity: ev.capacity || 0,
    }));

  const pieData = analytics?.attendanceSummary?.filter((s) => s.value > 0) || [
    { name: 'Confirmed', value: summary.totalTicketsSold, color: '#6366F1' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5 sm:pb-6 mb-6 sm:mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 border border-indigo-500/20 mb-2">
            <span>Organizer Management Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Organizer Dashboard</h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Welcome back, <span className="text-white font-medium">{user?.name}</span>. Monitor live seat occupancy, conversion rates, and ticket admissions.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <Link
            href="/check-in"
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600/20 border border-emerald-500/30 px-4 py-2.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-600/30 transition shadow-sm"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Open Gate Scanner</span>
          </Link>
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition active:scale-[0.99]"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create New Event</span>
          </button>
        </div>
      </div>

      {/* ── Analytics KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">Total Bookings</span>
            <div className="rounded-lg bg-indigo-500/10 p-1.5 sm:p-2 text-indigo-400">
              <Ticket className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-extrabold text-white">{summary.totalTicketsSold}</div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1">
            Out of <strong className="text-slate-200">{summary.totalCapacity}</strong> seats
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">Gate Conversion</span>
            <div className="rounded-lg bg-emerald-500/10 p-1.5 sm:p-2 text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-extrabold text-white">{summary.overallCheckInRate}%</div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1">
            <strong className="text-emerald-400">{summary.totalCheckedIn}</strong> verified at gate
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">Seat Occupancy</span>
            <div className="rounded-lg bg-purple-500/10 p-1.5 sm:p-2 text-purple-400">
              <BarChart3 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-extrabold text-white">{summary.overallOccupancyRate}%</div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1">Average capacity filled</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">Gross Value</span>
            <div className="rounded-lg bg-amber-500/10 p-1.5 sm:p-2 text-amber-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-extrabold text-white">₹{summary.totalRevenue.toFixed(2)}</div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1">From confirmed reservations</div>
        </div>
      </div>

      {/* ── Visual Analytics Charts Row ── */}
      {/* ── Visual Analytics Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 sm:mb-10">
        {/* Attendance Breakdown Bar Chart */}
        <div className="lg:col-span-2 min-w-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 shadow-xl backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-400 shrink-0" />
              <h2 className="text-sm font-bold text-white">Event Attendance & Capacity Breakdown</h2>
            </div>
            <span className="text-xs text-slate-500">Confirmed vs Checked-In</span>
          </div>

          {mounted && chartEventData.length > 0 ? (
            <div className="h-64 w-full min-w-0 overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartEventData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#F8FAFC',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
                    iconType="circle"
                  />
                  <Bar dataKey="CheckedIn" fill="#10B981" name="Checked In" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Confirmed" fill="#6366F1" name="Confirmed" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Capacity" fill="#334155" name="Capacity" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <BarChart3 className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-xs">No active event booking data available yet.</p>
            </div>
          )}
        </div>

        {/* Ticket Status Distribution Pie Chart */}
        <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 shadow-xl backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-emerald-400 shrink-0" />
              <h2 className="text-sm font-bold text-white">Ticket Status Distribution</h2>
            </div>
          </div>

          {mounted && pieData.length > 0 && summary.totalTicketsSold > 0 ? (
            <div className="h-56 w-full relative min-w-0 overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#F8FAFC',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-extrabold text-white">{summary.totalTicketsSold}</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Tickets</span>
              </div>
            </div>
          ) : (
            <div className="h-56 flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <PieChartIcon className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-xs">No ticket reservations recorded yet.</p>
            </div>
          )}

          <div className="border-t border-slate-800/80 pt-3 flex items-center justify-around text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span>Checked In ({summary.totalCheckedIn})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
              <span>Confirmed ({summary.totalConfirmed})</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Events Table / Grid ── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="border-b border-slate-800 p-4 sm:p-5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Your Managed Events</h2>
            <p className="text-xs text-slate-400 mt-0.5">Real-time seat occupancy and check-in rates</p>
          </div>
          <span className="text-xs text-slate-400 font-semibold">{events.length} records</span>
        </div>

        {events.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <Calendar className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No Events Created Yet</h3>
            <p className="text-xs text-slate-400 mt-1">
              Start by creating your first campus seminar, hackathon, or cultural festival.
            </p>
            <button
              onClick={handleOpenCreate}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Create Event</span>
            </button>
          </div>
        ) : (
          <>
            {/* ── DESKTOP VIEW: Wide Table (hidden on mobile) ── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Event Details</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Date & Time</th>
                    <th className="px-6 py-4">Occupancy</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {events.map((ev) => {
                    const booked = ev.capacity - ev.availableSeats;
                    const pct = Math.min(100, Math.round((booked / ev.capacity) * 100));

                    return (
                      <tr key={ev.id} className="hover:bg-slate-800/40 transition">
                        <td className="px-6 py-4">
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>{ev.title}</span>
                            <Link
                              href={`/events/${ev.id}`}
                              target="_blank"
                              className="text-slate-500 hover:text-indigo-400"
                              title="View Public Page"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3 text-slate-500" />
                            <span>{ev.venue}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-300 border border-slate-700">
                            {ev.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400">
                          <div>{new Date(ev.startDateTime).toLocaleDateString()}</div>
                          <div className="text-[11px] text-slate-500">
                            {new Date(ev.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-semibold text-white">{booked} / {ev.capacity}</span>
                            <span className="text-[11px] text-slate-400 font-mono">{pct}%</span>
                          </div>
                          {/* Occupancy progress bar */}
                          <div className="h-1.5 w-32 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                pct >= 90 ? 'bg-rose-500' : pct >= 60 ? 'bg-amber-500' : 'bg-indigo-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              ev.status === 'PUBLISHED'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : ev.status === 'CANCELLED'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {ev.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(ev)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                              title="Edit Event"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(ev.id, ev.title)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-950/40 hover:text-rose-400 transition"
                              title="Cancel / Delete Event"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── MOBILE VIEW: Stacked Cards (visible on phones only) ── */}
            <div className="md:hidden divide-y divide-slate-800/60 p-3 sm:p-4 space-y-3">
              {events.map((ev) => {
                const booked = ev.capacity - ev.availableSeats;
                const pct = Math.min(100, Math.round((booked / ev.capacity) * 100));

                return (
                  <div key={ev.id} className="pt-3 first:pt-0 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span className="truncate">{ev.title}</span>
                          <Link
                            href={`/events/${ev.id}`}
                            target="_blank"
                            className="text-slate-500 hover:text-indigo-400 shrink-0"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-slate-500 shrink-0" />
                          <span className="truncate">{ev.venue}</span>
                        </div>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          ev.status === 'PUBLISHED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : ev.status === 'CANCELLED'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {ev.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-medium text-slate-300 border border-slate-700">
                        {ev.category}
                      </span>
                      <span>
                        {new Date(ev.startDateTime).toLocaleDateString()} &bull;{' '}
                        {new Date(ev.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Occupancy bar */}
                    <div className="rounded-xl bg-slate-950/60 p-2.5 border border-slate-800/80">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-400 text-[11px]">Occupancy:</span>
                        <span className="font-semibold text-white text-[11px]">
                          {booked} / {ev.capacity} ({pct}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            pct >= 90 ? 'bg-rose-500' : pct >= 60 ? 'bg-amber-500' : 'bg-indigo-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleOpenEdit(ev)}
                        className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(ev.id, ev.title)}
                        className="flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-950/20 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-red-900/30 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Create / Edit Modal Dialog ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 sm:pb-4 mb-4 sm:mb-5">
              <h3 className="text-base sm:text-lg font-bold text-white">
                {editingEvent ? 'Edit Event Details' : 'Publish New Campus Event'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. AI Product Showcase 2026"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 p-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide schedule details, prerequisites, and activities..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 p-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Venue / Location
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    placeholder="e.g. Science Quad Hall B"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 p-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startDateTime}
                    onChange={(e) => setFormData({ ...formData, startDateTime: e.target.value })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.endDateTime}
                    onChange={(e) => setFormData({ ...formData, endDateTime: e.target.value })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Capacity (Seats)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    placeholder="100"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Publish Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="PUBLISHED">Published</option>
                    <option value="DRAFT">Draft</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition"
                >
                  {formSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingEvent ? 'Save Changes' : 'Publish Event'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
