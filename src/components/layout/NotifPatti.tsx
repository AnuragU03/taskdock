"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Notif {
  id: string;
  text: string;
  type: string;
  read: boolean;
  createdAt: string;
  taskId?: string | null;
}

const TYPE_ICON: Record<string, string> = {
  TASK_APPROVED: '✓',
  TASK_REJECTED: '✕',
  TASK_ASSIGNED: '◎',
  TASK_SUBMITTED: '↑',
  TASK_ABANDONED: '⊘',
  TASK_REOPENED: '↺',
  TASK_PICKED_UP: '⊙',
  TASK_REMINDER: '◷',
  DEFAULT: '⚐',
};

const TYPE_COLOR: Record<string, string> = {
  TASK_APPROVED: 'var(--green)',
  TASK_REJECTED: 'var(--red)',
  TASK_ABANDONED: 'var(--red)',
  TASK_ASSIGNED: 'var(--accent)',
  TASK_SUBMITTED: 'var(--accent)',
  TASK_REOPENED: 'var(--amber)',
  TASK_REMINDER: 'var(--amber)',
  DEFAULT: 'var(--t3)',
};

async function fetchUnread(): Promise<Notif[]> {
  try {
    const res = await fetch('/api/notifications/unread', { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function markRead(ids: string[]) {
  try {
    await fetch('/api/notifications/unread', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
  } catch {}
}

export function NotifPatti({ initialCount }: { initialCount: number }) {
  const router = useRouter();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [visible, setVisible] = useState(initialCount > 0);
  const [dismissed, setDismissed] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    const data = await fetchUnread();
    if (data.length > 0) {
      setNotifs(data);
      setVisible(true);
      setDismissed(false);
    } else if (notifs.length > 0) {
      // All read externally, hide
      setNotifs([]);
      setVisible(false);
    }
  }, [notifs.length]);

  // Initial load
  useEffect(() => { load(); }, []);

  // Poll every 30s for new notifications
  useEffect(() => {
    pollTimer.current = setInterval(load, 30000);
    return () => { if (pollTimer.current) clearInterval(pollTimer.current); };
  }, [load]);

  // Ticker: rotate through unread notifs
  useEffect(() => {
    if (!visible || expanded || notifs.length <= 1) return;
    tickTimer.current = setInterval(() => {
      setActiveIdx(i => (i + 1) % notifs.length);
    }, 4000);
    return () => { if (tickTimer.current) clearInterval(tickTimer.current); };
  }, [visible, expanded, notifs.length]);

  const dismiss = async () => {
    setDismissed(true);
    setVisible(false);
    const ids = notifs.map(n => n.id);
    if (ids.length) await markRead(ids);
    router.refresh();
  };

  const goToTask = (n: Notif) => {
    if (n.taskId) router.push(`/task/${n.taskId}`);
    else router.push('/notifications');
  };

  if (!visible || dismissed || notifs.length === 0) return null;

  const current = notifs[activeIdx] ?? notifs[0];
  const color = TYPE_COLOR[current.type] ?? TYPE_COLOR.DEFAULT;
  const icon = TYPE_ICON[current.type] ?? TYPE_ICON.DEFAULT;

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 200,
        width: '100%',
        background: 'linear-gradient(90deg, #0A0A0A 0%, #111 40%, #0A0A0A 100%)',
        borderBottom: `1px solid ${color}33`,
        boxShadow: `0 1px 20px ${color}18`,
        transition: 'all .3s ease',
      }}
    >
      {/* Thin colour accent bar */}
      <div style={{ height: 2, background: `linear-gradient(90deg, ${color}, transparent)`, opacity: 0.8 }} />

      {!expanded ? (
        /* ── Collapsed ticker row ── */
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 16px', minHeight: 36 }}>
          {/* Pulsing dot */}
          <div style={{ position: 'relative', width: 8, height: 8, flexShrink: 0 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, animation: 'pulse-dot 1.8s ease-in-out infinite' }} />
          </div>

          {/* Icon */}
          <span style={{ fontSize: 13, color, fontFamily: 'var(--font-mono), monospace', flexShrink: 0 }}>{icon}</span>

          {/* Ticker text */}
          <span
            onClick={() => goToTask(current)}
            style={{ fontSize: 13, color: 'var(--t2)', cursor: current.taskId ? 'pointer' : 'default', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-sans), sans-serif', transition: 'color .2s' }}
            onMouseEnter={e => { if (current.taskId) (e.target as HTMLElement).style.color = '#fff'; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.color = 'var(--t2)'; }}
          >
            {current.text}
          </span>

          {/* Count badge */}
          {notifs.length > 1 && (
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono), monospace', background: `${color}22`, color, border: `1px solid ${color}44`, borderRadius: 100, padding: '1px 7px', flexShrink: 0 }}>
              {activeIdx + 1}/{notifs.length}
            </span>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
            {notifs.length > 1 && (
              <button
                onClick={() => setExpanded(true)}
                style={{ background: 'transparent', border: `1px solid var(--border)`, color: 'var(--t4)', fontSize: 11, fontFamily: 'var(--font-mono), monospace', padding: '2px 8px', borderRadius: 6, cursor: 'pointer' }}
              >
                ↓ all {notifs.length}
              </button>
            )}
            <button
              onClick={dismiss}
              style={{ background: 'transparent', border: 'none', color: 'var(--t4)', fontSize: 16, cursor: 'pointer', lineHeight: 1, padding: '2px 4px' }}
              title="Dismiss all"
            >×</button>
          </div>
        </div>
      ) : (
        /* ── Expanded list ── */
        <div style={{ maxHeight: 260, overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px 6px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono), monospace', color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '.1em' }}>
              {notifs.length} unread notification{notifs.length !== 1 ? 's' : ''}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setExpanded(false)} style={{ background: 'transparent', border: 'none', color: 'var(--t4)', fontSize: 12, fontFamily: 'var(--font-mono), monospace', cursor: 'pointer' }}>↑ collapse</button>
              <button onClick={dismiss} style={{ background: 'transparent', border: 'none', color: 'var(--t4)', fontSize: 12, fontFamily: 'var(--font-mono), monospace', cursor: 'pointer' }}>Mark all read ×</button>
            </div>
          </div>
          {notifs.map((n, i) => {
            const c = TYPE_COLOR[n.type] ?? TYPE_COLOR.DEFAULT;
            const ic = TYPE_ICON[n.type] ?? TYPE_ICON.DEFAULT;
            return (
              <div
                key={n.id}
                onClick={() => goToTask(n)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px',
                  borderBottom: i < notifs.length - 1 ? '1px solid var(--border)' : 'none',
                  cursor: n.taskId ? 'pointer' : 'default',
                  background: i === activeIdx ? `${c}08` : 'transparent',
                  transition: 'background .15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${c}10`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = i === activeIdx ? `${c}08` : 'transparent'; }}
              >
                <span style={{ fontSize: 12, color: c, fontFamily: 'var(--font-mono), monospace', flexShrink: 0 }}>{ic}</span>
                <span style={{ fontSize: 13, color: 'var(--t2)', flex: 1, fontFamily: 'var(--font-sans), sans-serif' }}>{n.text}</span>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono), monospace', color: 'var(--t4)', flexShrink: 0 }}>
                  {(() => {
                    const m = Math.floor((Date.now() - new Date(n.createdAt).getTime()) / 60000);
                    return m < 1 ? 'just now' : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.floor(m / 60)}h ago` : `${Math.floor(m / 1440)}d ago`;
                  })()}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
      `}</style>
    </div>
  );
}
