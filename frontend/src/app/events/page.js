'use client';

import { useState, useEffect, useCallback } from 'react';
import EventCard from '@/components/EventCard';
import { api } from '@/lib/api';
import { Sparkles, Search, Filter, Calendar, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

const CATEGORIES = ['All', 'Technology', 'Cultural', 'Sports', 'Academic', 'Social'];

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (selectedCategory !== 'All') params.append('category', selectedCategory);

      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const data = await api.get(`/events${queryStr}`);
      setEvents(data?.events || []);
    } catch (err) {
      console.error('Failed to load events:', err);
      setError('Unable to load campus events. Please verify backend connectivity.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEvents();
    }, 250); // slight debounce for search input
    return () => clearTimeout(timer);
  }, [fetchEvents]);

  const handleReset = () => {
    setSearchQuery('');
    setSelectedCategory('All');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 sm:gap-6 border-b border-slate-800 pb-6 sm:pb-8 mb-6 sm:mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-[11px] sm:text-xs font-semibold text-indigo-400 border border-indigo-500/20 mb-2 sm:mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Discover & Attend</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            Campus Event Directory
          </h1>
          <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-400 max-w-xl">
            Browse through official student club mixers, hackathons, academic symposiums, and sports championships.
          </p>
        </div>

        {/* Search input */}
        <div className="w-full md:w-80">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, venue..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 py-2.5 pl-10 pr-12 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-white px-1 py-0.5"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category filter pills - Edge to edge scrolling on mobile */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 sm:mb-8 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mr-1 flex items-center gap-1 shrink-0">
          <Filter className="h-3.5 w-3.5" />
          <span>Filter:</span>
        </span>
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`rounded-xl px-3.5 sm:px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
              selectedCategory === category
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Content states */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400 mb-3" />
          <p className="text-sm text-slate-400">Loading campus events...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-red-500/20 bg-red-950/20 py-12 sm:py-16 px-4 sm:px-6 text-center max-w-xl mx-auto">
          <AlertCircle className="h-8 w-8 text-rose-400 mb-3" />
          <h3 className="text-base font-semibold text-white">Error Loading Events</h3>
          <p className="mt-1 text-xs text-slate-400">{error}</p>
          <button
            onClick={fetchEvents}
            className="mt-5 flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 py-16 sm:py-20 px-4 sm:px-6 text-center">
          <Calendar className="h-10 w-10 text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-white">No Events Found</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm">
            We couldn&apos;t find any events matching your selected filters or search keyword.
          </p>
          {(searchQuery || selectedCategory !== 'All') && (
            <button
              onClick={handleReset}
              className="mt-5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 px-4 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-600/30 transition"
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
