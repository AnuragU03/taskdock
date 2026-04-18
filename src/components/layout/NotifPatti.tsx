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
  metadata?: string | null;
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
  BROADCAST: '⊛',
  BROADCAST_ACK: '◎',
  OPEN_QUEUE_POST: '◈',
  PAYMENT_REMINDER: '⊘',
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
  TASK_PICKED_UP: 'var(--t3)',
  BROADCAST: 'var(--amber)',
  BROADCAST_ACK: 'var(--green)',
  OPEN_QUEUE_POST: '#14B8A6',
  PAYMENT_REMINDER: 'var(--red)',
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

async function ackBroadcast(notifId: string, response: 'yes' | 'no', replyText?: string) {
  try {
    await fetch(`/api/broadcast/${notifId}/ack`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response, replyText }),
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
  const [ackedIds, setAckedIds] = useState<Set<string>>(new Set());
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    const data = await fetchUnread();
    if (data.length > 0) {
      if (!visible && data.some(n => n.type === 'BROADCAST')) {
        // Play simple ping for new broadcasts
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
          osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
          gain.gain.setValueAtTime(0.1, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.3);
        } catch {}
      }
      setNotifs(data);
      setVisible(true);
      setDismissed(false);
    } else if (notifs.length > 0) {
      setNotifs([]);
      setVisible(false);
    }
  }, [notifs.length, visible]);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    pollTimer.current = setInterval(load, 30000);
    return () => { if (pollTimer.current) clearInterval(pollTimer.current); };
  }, [load]);

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

  const handleAck = async (n: Notif, response: 'yes' | 'no', replyText?: string) => {
    setAckedIds(prev => new Set([...prev, n.id]));
    await ackBroadcast(n.id, response, replyText);
    await markRead([n.id]);
    load();
  };

  if (!visible || dismissed || notifs.length === 0) return null;

  const current = notifs[activeIdx] ?? notifs[0];
  const color = TYPE_COLOR[current.type] ?? TYPE_COLOR.DEFAULT;
  const icon = TYPE_ICON[current.type] ?? TYPE_ICON.DEFAULT;

  const BroadcastActions = ({ n, color }: { n: Notif; color: string }) => {
    const isAcked = ackedIds.has(n.id);
    const [replying, setReplying] = useState<'yes' | 'no' | null>(null);
    const [replyText, setReplyText] = useState('');

    if (isAcked) {
      return (
        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono), monospace', color: 'var(--green)', padding: '2px 8px', border: '1px solid var(--green)44', borderRadius: 6 }}>
          ✓ Acknowledged
        </span>
      );
    }

    if (replying) {
      return (
        <div style={{ display: 'flex', gap: 5, flexShrink: 0, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
          <input
            autoFocus
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleAck(n, replying, replyText);
              if (e.key === 'Escape') setReplying(null);
            }}
            placeholder={`Reply ${replying}... (optional)`}
            style={{ fontSize: 11, fontFamily: 'var(--font-mono), monospace', background: 'rgba(255,255,255,0.06)', border: `1px solid ${color}44`, color: '#fff', padding: '3px 8px', borderRadius: 6, outline: 'none', width: 140 }}
          />
          <button onClick={() => handleAck(n, replying, replyText)} style={{ fontSize: 11, fontFamily: 'var(--font-sans), sans-serif', background: color, border: 'none', color: '#000', padding: '3px 8px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
            Send
          </button>
          <button onClick={() => setReplying(null)} style={{ fontSize: 11, fontFamily: 'var(--font-sans), sans-serif', background: 'transparent', border: `1px solid var(--border)`, color: 'var(--t4)', padding: '2px 6px', borderRadius: 6, cursor: 'pointer' }}>
            ×
          </button>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
        <button
          onClick={(e) => { e.stopPropagation(); setReplying('yes'); }}
          style={{ fontSize: 11, fontFamily: 'var(--font-mono), monospace', background: 'rgba(34,197,94,.12)', border: '1px solid rgba(34,197,94,.4)', color: '#22C55E', padding: '2px 10px', borderRadius: 6, cursor: 'pointer' }}
        >
          ✓ Yes
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setReplying('no'); }}
          style={{ fontSize: 11, fontFamily: 'var(--font-mono), monospace', background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.4)', color: '#EF4444', padding: '2px 10px', borderRadius: 6, cursor: 'pointer' }}
        >
          ✕ No
        </button>
      </div>
    );
  };

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

          {/* Inline Yes/No for BROADCAST in collapsed state */}
          {current.type === 'BROADCAST' && (
            <BroadcastActions n={current} color={color} />
          )}

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
        <div style={{ maxHeight: 320, overflowY: 'auto' }}>
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
                onClick={() => n.type !== 'BROADCAST' && goToTask(n)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                  borderBottom: i < notifs.length - 1 ? '1px solid var(--border)' : 'none',
                  cursor: n.taskId && n.type !== 'BROADCAST' ? 'pointer' : 'default',
                  background: i === activeIdx ? `${c}08` : 'transparent',
                  transition: 'background .15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${c}10`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = i === activeIdx ? `${c}08` : 'transparent'; }}
              >
                <span style={{ fontSize: 14, color: c, fontFamily: 'var(--font-mono), monospace', flexShrink: 0 }}>{ic}</span>
                <span style={{ fontSize: 13, color: 'var(--t2)', flex: 1, fontFamily: 'var(--font-sans), sans-serif' }}>{n.text}</span>

                {/* Yes / No for broadcast */}
                {n.type === 'BROADCAST' && (
                  <BroadcastActions n={n} color={c} />
                )}

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
