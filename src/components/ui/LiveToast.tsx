"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

interface ToastNotif {
  id: string;
  text: string;
  type: string;
  taskId?: string | null;
}

// ── Audio ping using Web Audio API (no external files needed) ──
const PING_CONFIG: Record<string, { freq: number; freq2?: number; double?: boolean }> = {
  BROADCAST:         { freq: 660, freq2: 880, double: true },  // two-tone alert
  PAYMENT_REMINDER:  { freq: 880, double: true },              // urgent double beep
  CREDENTIAL_SHARED: { freq: 550 },                            // soft single ping
  OPEN_QUEUE_POST:   { freq: 440 },                            // gentle chime
  DEFAULT:           { freq: 520 },
};

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

function playBeep(ctx: AudioContext, freq: number, startTime: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, startTime);
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.18, startTime + 0.01);  // fade in
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25); // fade out
  osc.start(startTime);
  osc.stop(startTime + 0.28);
}

function playPing(type: string) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const cfg = PING_CONFIG[type] ?? PING_CONFIG.DEFAULT;
    const now = ctx.currentTime;
    playBeep(ctx, cfg.freq, now);
    if (cfg.double) {
      playBeep(ctx, cfg.freq2 ?? cfg.freq, now + 0.18);
    }
  } catch { /* silent — audio blocked */ }
}



const TYPE_COLOR: Record<string, string> = {
  OPEN_QUEUE_POST: "#14B8A6",
  BROADCAST: "#F59E0B",
  PAYMENT_REMINDER: "#EF4444",
  CREDENTIAL_SHARED: "#3B82F6",
  DEFAULT: "#6366F1",
};

const TYPE_ICON: Record<string, string> = {
  OPEN_QUEUE_POST: "◈",
  BROADCAST: "⊛",
  PAYMENT_REMINDER: "⊘",
  CREDENTIAL_SHARED: "⊔",
  DEFAULT: "⚐",
};

const TOAST_DURATION_MS = 30_000; // 30 seconds

export function LiveToast() {
  const [toasts, setToasts] = useState<(ToastNotif & { expiresAt: number })[]>([]);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/unread", { cache: "no-store" });
      if (!res.ok) return;
      const notifs: ToastNotif[] = await res.json();

      const now = Date.now();
      const newOnes = notifs.filter(
        (n) =>
          ["OPEN_QUEUE_POST", "BROADCAST", "PAYMENT_REMINDER", "CREDENTIAL_SHARED"].includes(n.type) &&
          !seenIdsRef.current.has(n.id)
      );

      if (newOnes.length > 0) {
        newOnes.forEach((n) => seenIdsRef.current.add(n.id));
        setToasts((prev) => [
          ...prev,
          ...newOnes.map((n) => ({ ...n, expiresAt: now + TOAST_DURATION_MS })),
        ]);
        // Play sound for the highest-priority new notification
        const priority = ['PAYMENT_REMINDER', 'BROADCAST', 'CREDENTIAL_SHARED', 'OPEN_QUEUE_POST'];
        const topType = newOnes.find(n => priority.includes(n.type))?.type ?? newOnes[0].type;
        playPing(topType);
      }
    } catch { /* silent */ }
  }, []);

  // Initial poll + periodic
  useEffect(() => {
    // Wait 2s before first poll so page can settle
    const init = setTimeout(poll, 2000);
    timerRef.current = setInterval(poll, 30_000);
    return () => {
      clearTimeout(init);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [poll]);

  // Auto-expire toasts
  useEffect(() => {
    if (toasts.length === 0) return;
    const expireTimer = setTimeout(() => {
      const now = Date.now();
      setToasts((prev) => prev.filter((t) => t.expiresAt > now));
    }, 1000);
    return () => clearTimeout(expireTimer);
  }, [toasts]);

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        pointerEvents: "none",
      }}
    >
      {toasts.map((toast) => {
        const color = TYPE_COLOR[toast.type] ?? TYPE_COLOR.DEFAULT;
        const icon = TYPE_ICON[toast.type] ?? TYPE_ICON.DEFAULT;
        const remaining = Math.max(0, Math.round((toast.expiresAt - Date.now()) / 1000));

        return (
          <div
            key={toast.id}
            style={{
              pointerEvents: "all",
              background: "linear-gradient(135deg, #0E0E0E, #181818)",
              border: `1px solid ${color}44`,
              borderLeft: `3px solid ${color}`,
              borderRadius: 12,
              padding: "14px 16px",
              minWidth: 320,
              maxWidth: 400,
              boxShadow: `0 8px 32px rgba(0,0,0,.6), 0 0 0 1px ${color}18`,
              animation: "toast-in 0.35s cubic-bezier(.21,1.02,.73,1) forwards",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              {/* Icon */}
              <span
                style={{
                  fontSize: 16,
                  color,
                  flexShrink: 0,
                  marginTop: 1,
                  fontFamily: "var(--font-mono), monospace",
                }}
              >
                {icon}
              </span>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--t1, #fff)",
                    fontFamily: "var(--font-sans), sans-serif",
                    lineHeight: 1.5,
                    marginBottom: 6,
                  }}
                >
                  {toast.text}
                </div>

                {/* Progress bar showing time remaining */}
                <div
                  style={{
                    height: 2,
                    background: `${color}22`,
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${(remaining / 30) * 100}%`,
                      background: color,
                      borderRadius: 2,
                      transition: "width 1s linear",
                    }}
                  />
                </div>
              </div>

              {/* Dismiss button */}
              <button
                onClick={() => dismiss(toast.id)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--t4, #666)",
                  fontSize: 16,
                  cursor: "pointer",
                  padding: "0 2px",
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>
          </div>
        );
      })}

      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
