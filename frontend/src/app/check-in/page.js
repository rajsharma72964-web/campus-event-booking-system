'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Camera,
  Keyboard,
  Clock,
  User,
  MapPin,
  ArrowRight,
  Loader2,
  Lock,
  RotateCcw,
  Sparkles,
  Ticket,
} from 'lucide-react';
import QRScanner from '@/components/QRScanner';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function CheckInPage() {
  const { user, isAuthenticated, isOrganizer, loading: authLoading } = useAuth();
  const router = useRouter();

  // Mode: 'camera' | 'manual'
  const [mode, setMode] = useState('camera');
  const [manualCode, setManualCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Verification results:
  // result = { type: 'success' | 'error', message: '', details: {} }
  const [result, setResult] = useState(null);

  // Session check-in history
  const [sessionHistory, setSessionHistory] = useState([]);

  // Cooldown / debounce to avoid double triggers from the scanner
  const lastScannedCodeRef = useRef('');
  const scanLockoutRef = useRef(false);

  const handleVerify = async (code) => {
    const trimmed = (code || '').trim();
    if (!trimmed) return;

    if (scanLockoutRef.current && trimmed === lastScannedCodeRef.current) {
      return;
    }

    scanLockoutRef.current = true;
    lastScannedCodeRef.current = trimmed;
    setVerifying(true);
    setResult(null);

    try {
      const data = await api.post('/bookings/verify', {
        qrCodeString: trimmed,
      });

      // Successful Check-In
      const successInfo = {
        type: 'success',
        title: 'Entry Approved! Welcome.',
        message: data.message || 'Ticket verified successfully.',
        attendeeName: data.attendee?.name || 'Attendee',
        attendeeEmail: data.attendee?.email || '',
        eventTitle: data.event?.title || 'Campus Event',
        venue: data.event?.venue || '',
        bookingId: data.booking?.id || '',
        verifiedAt: new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
        }),
      };

      setResult(successInfo);
      setSessionHistory((prev) => [successInfo, ...prev]);

      // Haptic feedback if supported
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    } catch (err) {
      console.error('Verification error:', err);
      const errorData = err.data || {};
      const errorType = errorData.error || 'VerificationFailed';

      let title = 'Entry Denied';
      if (errorType === 'AlreadyCheckedIn') {
        title = 'Duplicate Ticket — Already Checked In';
      } else if (errorType === 'TicketCancelled') {
        title = 'Invalid — Ticket Was Cancelled';
      } else if (errorType === 'EventCancelled') {
        title = 'Event Cancelled';
      } else if (errorType === 'InvalidTicket') {
        title = 'Ticket Not Found';
      }

      setResult({
        type: 'error',
        errorType,
        title,
        message: err.message || 'Verification failed. Please check the ticket credentials.',
        details: errorData.booking || null,
        scannedCode: trimmed,
        failedAt: new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
        }),
      });

      // Haptic error vibration
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(300);
      }
    } finally {
      setVerifying(false);
      // Release lockout after 3 seconds for next scan
      setTimeout(() => {
        scanLockoutRef.current = false;
      }, 3000);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim() || verifying) return;
    handleVerify(manualCode);
  };

  const resetResult = () => {
    setResult(null);
    setManualCode('');
    lastScannedCodeRef.current = '';
    scanLockoutRef.current = false;
  };

  // ── Auth Loading State ──
  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        <p className="text-sm text-slate-400">Verifying authorization...</p>
      </div>
    );
  }

  // ── Access Restriction Guard: Organizers & Admins Only ──
  if (!isAuthenticated || !isOrganizer) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 backdrop-blur-md shadow-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-white">Organizer Access Restricted</h2>
          <p className="mt-2 text-xs text-slate-400 leading-relaxed">
            The Gate Check-In verification portal requires an <strong>ORGANIZER</strong> or <strong>ADMIN</strong> account.
          </p>

          <div className="mt-6 flex flex-col gap-2">
            {!isAuthenticated ? (
              <Link
                href="/login?redirect=/check-in"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition"
              >
                <span>Log In with Organizer Account</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                href="/dashboard/student"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white transition"
              >
                <span>Return to Student Dashboard</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
      {/* ── Top Header ── */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20 mb-2">
          <ShieldCheck className="h-4 w-4" />
          <span>Organizer Gate Verification</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Event Ticket Check-In
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          Scan attendee QR codes to verify admissions and automatically prevent duplicate gate entry.
        </p>
      </div>

      {/* ── Mode Switcher (Camera vs Manual Input) ── */}
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 p-1 w-full max-w-xs shadow-inner">
          <button
            onClick={() => {
              setMode('camera');
              resetResult();
            }}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition ${
              mode === 'camera'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="h-3.5 w-3.5" />
            <span>Camera Scanner</span>
          </button>
          <button
            onClick={() => {
              setMode('manual');
              resetResult();
            }}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition ${
              mode === 'manual'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Keyboard className="h-3.5 w-3.5" />
            <span>Manual Input</span>
          </button>
        </div>
      </div>

      {/* ── LIVE ALERT BANNERS ── */}
      {result && (
        <div className="mb-6 animate-in fade-in duration-200">
          {result.type === 'success' ? (
            /* GREEN ALERT: Valid Check-In */
            <div className="rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-b from-emerald-950/80 to-slate-900 p-4 sm:p-6 text-white shadow-2xl shadow-emerald-950/40">
              <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3.5 sm:gap-4">
                <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>
                <div className="flex-1 min-w-0 w-full">
                  <span className="inline-block rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 border border-emerald-500/30 mb-1">
                    ✓ Verified & Checked In
                  </span>
                  <h3 className="text-base sm:text-lg font-extrabold text-white truncate">{result.attendeeName}</h3>
                  <p className="text-xs text-emerald-200/90 truncate">{result.attendeeEmail}</p>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-emerald-500/20 pt-3 text-xs text-left">
                    <div>
                      <span className="text-emerald-300/70 text-[11px] block">Event</span>
                      <span className="font-semibold text-white break-words">{result.eventTitle}</span>
                    </div>
                    <div>
                      <span className="text-emerald-300/70 text-[11px] block">Time Verified</span>
                      <span className="font-semibold text-white">{result.verifiedAt}</span>
                    </div>
                  </div>

                  <button
                    onClick={resetResult}
                    className="mt-4 w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-3.5 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/30 transition"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Scan Next Attendee</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* RED ALERT: Duplicate, Cancelled, or Invalid */
            <div className="rounded-2xl border-2 border-rose-500/60 bg-gradient-to-b from-rose-950/80 to-slate-900 p-4 sm:p-6 text-white shadow-2xl shadow-rose-950/40">
              <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3.5 sm:gap-4">
                <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <XCircle className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>
                <div className="flex-1 min-w-0 w-full">
                  <span className="inline-block rounded-full bg-rose-500/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-rose-300 border border-rose-500/30 mb-1">
                    ✗ Entry Prohibited
                  </span>
                  <h3 className="text-base sm:text-lg font-extrabold text-white">{result.title}</h3>
                  <p className="text-xs text-rose-200/90 mt-1 leading-relaxed">{result.message}</p>

                  {result.details && (
                    <div className="mt-3 rounded-lg bg-slate-950/60 p-3 border border-rose-500/20 text-xs text-slate-300 space-y-1 text-left">
                      <div>Attendee: <strong className="text-white">{result.details.attendeeName}</strong></div>
                      <div>Event: <strong className="text-white">{result.details.eventTitle}</strong></div>
                      <div>Status: <span className="text-amber-400 uppercase font-bold text-[10px]">{result.details.status}</span></div>
                    </div>
                  )}

                  <button
                    onClick={resetResult}
                    className="mt-4 w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40 px-3.5 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-500/30 transition"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Try Again / Clear</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Main Scanner / Manual Input Box ── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 backdrop-blur-md shadow-xl mb-6 sm:mb-8">
        {mode === 'camera' ? (
          <div>
            <QRScanner
              onScan={(scannedText) => handleVerify(scannedText)}
              isPaused={verifying}
            />
          </div>
        ) : (
          /* Manual Input Fallback */
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label htmlFor="manualCode" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Booking ID, Attendee Email, or QR String
              </label>
              <input
                id="manualCode"
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="e.g. CEH-tmp-... or attendee@campus.edu"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono transition"
                autoFocus
              />
              <p className="mt-1.5 text-[11px] text-slate-500">
                You can manually look up a ticket by its Booking ID or the attendee&apos;s registered email address.
              </p>
            </div>

            <button
              type="submit"
              disabled={verifying || !manualCode.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-xs font-bold text-white shadow-lg hover:bg-indigo-500 transition disabled:opacity-50"
            >
              {verifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying Ticket...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Verify & Check In</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* ── Live Session Admissions Log ── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Ticket className="h-4 w-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Admissions Log</h3>
          </div>
          <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 text-[11px] font-bold text-indigo-300">
            {sessionHistory.length} Checked In
          </span>
        </div>

        {sessionHistory.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">
            No attendees checked in yet this session. Scanned tickets will appear here in real-time.
          </p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {sessionHistory.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 rounded-xl bg-slate-950/60 border border-slate-800 px-3.5 py-2.5 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                  <div className="truncate min-w-0">
                    <span className="font-semibold text-white">{item.attendeeName}</span>
                    <span className="text-slate-500 text-[11px] ml-2 truncate">({item.eventTitle})</span>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-slate-400 shrink-0 pl-4 sm:pl-0">
                  {item.verifiedAt}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
