'use client';

import { useState, useEffect, useRef } from 'react';
import { Camera, CameraOff, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function QRScanner({ onScan, isPaused = false }) {
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
  const scannerRef = useRef(null);
  const scannerContainerId = 'qr-reader-region';

  const startScanner = async () => {
    setCameraError(null);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');

      // If already running, stop first
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
          await scannerRef.current.clear();
        } catch (e) {
          console.warn('Error clearing previous scanner instance:', e);
        }
      }

      const html5QrCode = new Html5Qrcode(scannerContainerId);
      scannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const edge = Math.min(viewfinderWidth, viewfinderHeight);
          return {
            width: Math.floor(edge * 0.72),
            height: Math.floor(edge * 0.72),
          };
        },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: 'environment' }, // Prefer back camera on phones
        config,
        (decodedText) => {
          if (!isPaused && onScan) {
            onScan(decodedText);
          }
        },
        () => {
          // Frame parse failure is normal between scans
        }
      );

      setScannerActive(true);
      setHasPermission(true);
    } catch (err) {
      console.error('Camera scanner start error:', err);
      setCameraError(err.message || 'Unable to access camera. Please check camera permissions or use manual entry.');
      setHasPermission(false);
      setScannerActive(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (e) {
        console.warn('Error stopping scanner:', e);
      }
      scannerRef.current = null;
    }
    setScannerActive(false);
  };

  useEffect(() => {
    // Auto-start on mount if supported
    startScanner();

    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="w-full flex flex-col items-center">
      {/* Scanner Box */}
      <div className="relative w-full max-w-[340px] sm:max-w-sm rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 shadow-2xl">
        {/* Viewfinder Target Container */}
        <div id={scannerContainerId} className="w-full min-h-[260px] sm:min-h-[300px] overflow-hidden" />

        {/* Overlay when paused */}
        {isPaused && scannerActive && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center z-10">
            <div className="h-8 w-8 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin mb-3" />
            <p className="text-sm font-semibold text-white">Verifying Ticket...</p>
            <p className="text-xs text-slate-400 mt-1">Please wait a moment</p>
          </div>
        )}

        {/* Error / Fallback State */}
        {cameraError && (
          <div className="p-5 sm:p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <CameraOff className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-white">Camera Access Unavailable</h4>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              {cameraError}
            </p>
            <button
              onClick={startScanner}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition border border-slate-700"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry Camera</span>
            </button>
          </div>
        )}

        {/* Scanner Active Controls Bar */}
        <div className="border-t border-slate-800/80 bg-slate-900/90 px-3.5 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`h-2 w-2 rounded-full shrink-0 ${
                scannerActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
              }`}
            />
            <span className="text-slate-400 font-medium truncate text-[11px] sm:text-xs">
              {scannerActive ? 'Camera Active' : 'Camera Idle'}
            </span>
          </div>

          {scannerActive ? (
            <button
              onClick={stopScanner}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <CameraOff className="h-3.5 w-3.5" />
              <span>Turn Off</span>
            </button>
          ) : (
            <button
              onClick={startScanner}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/30 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-600/30 transition"
            >
              <Camera className="h-3.5 w-3.5" />
              <span>Start Camera</span>
            </button>
          )}
        </div>
      </div>

      <p className="mt-3 text-center text-[11px] text-slate-400 max-w-xs px-2">
        Align the attendee&apos;s digital or printed QR code ticket inside the scanner frame.
      </p>
    </div>
  );
}
