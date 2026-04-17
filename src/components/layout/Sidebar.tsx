"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { clockIn, clockOut } from '@/app/actions/attendance';

interface SidebarProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    image?: string | null;
    color?: string;
    initials?: string;
    browniePoints: number;
  };
  unreadNotifsCount: number;
  todayAttendance?: any;
  earnings?: { earned: number; total: number; multiplier?: number } | null;
}

interface MentionUser {
  id: string;
  name: string;
  role: string;
  color?: string;
  initials?: string;
}

function BroadcastPanel({ currentUserId }: { currentUserId: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [mention, setMention] = useState('');
  const [tagged, setTagged] = useState<MentionUser[]>([]);
  const [suggestions, setSuggestions] = useState<MentionUser[]>([]);
  const [allUsers, setAllUsers] = useState<MentionUser[]>([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch users on open
  useEffect(() => {
    if (!open || allUsers.length > 0) return;
    fetch('/api/broadcast')
      .then(r => r.json())
      .then((users: MentionUser[]) => {
        setAllUsers(users.filter(u => u.id !== currentUserId));
      })
      .catch(() => {});
  }, [open, currentUserId, allUsers.length]);

  // Filter suggestions as user types
  useEffect(() => {
    if (!mention.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const q = mention.toLowerCase();
    const filtered = allUsers.filter(
      u =>
        u.name?.toLowerCase().includes(q) &&
        !tagged.some(t => t.id === u.id)
    );
    setSuggestions(filtered.slice(0, 6));
    setShowSuggestions(filtered.length > 0);
  }, [mention, allUsers, tagged]);

  const addTag = (user: MentionUser) => {
    setTagged(prev => [...prev, user]);
    setMention('');
    setShowSuggestions(false);
    textareaRef.current?.focus();
  };

  const removeTag = (id: string) => {
    setTagged(prev => prev.filter(u => u.id !== id));
  };

  const handleSend = async () => {
    if (!message.trim() || tagged.length === 0) return;
    setSending(true);
    try {
      const res = await fetch('/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim(), targetUserIds: tagged.map(u => u.id) }),
      });
      if (res.ok) {
        setSent(true);
        setMessage('');
        setTagged([]);
        setTimeout(() => setSent(false), 3000);
      }
    } catch {}
    setSending(false);
  };

  return (
    <div style={{ margin: '0 7px 6px' }}>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '9px 12px',
          borderRadius: 10,
          border: '1px solid rgba(251,191,36,.3)',
          background: open ? 'var(--amber-bg)' : 'transparent',
          color: 'var(--amber)',
          fontFamily: 'var(--font-mono), sans-serif',
          fontSize: 12,
          cursor: 'pointer',
          transition: 'all .15s',
          letterSpacing: '.04em',
          textTransform: 'uppercase',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(251,191,36,.1)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = open ? 'var(--amber-bg)' : 'transparent'; }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 14 }}>⊛</span>
          Broadcast
        </span>
        <span style={{ fontSize: 10, opacity: 0.7 }}>{open ? '▲' : '▼'}</span>
      </button>

      {/* Panel */}
      {open && (
        <div
          style={{
            marginTop: 8,
            background: 'linear-gradient(135deg, #120D00, #1A1200)',
            border: '1px solid #F59E0B33',
            borderRadius: 12,
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 9,
          }}
        >
          {/* Tagged users */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, minHeight: 24 }}>
            {tagged.map(u => (
              <span
                key={u.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'rgba(245,158,11,.15)',
                  border: '1px solid #F59E0B55',
                  borderRadius: 20,
                  padding: '2px 8px 2px 6px',
                  fontSize: 11,
                  color: '#F59E0B',
                  fontFamily: 'var(--font-mono), monospace',
                }}
              >
                <span
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: u.color || '#F59E0B',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 8,
                    color: '#fff',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {u.initials || u.name?.[0]?.toUpperCase() || '?'}
                </span>
                @{u.name?.split(' ')[0]}
                <button
                  onClick={() => removeTag(u.id)}
                  style={{ background: 'none', border: 'none', color: '#F59E0B', cursor: 'pointer', padding: 0, fontSize: 12, lineHeight: 1 }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          {/* @mention input */}
          <div style={{ position: 'relative' }}>
            <input
              placeholder="@mention someone..."
              value={mention}
              onChange={e => setMention(e.target.value)}
              onFocus={() => { if (suggestions.length) setShowSuggestions(true); }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              style={{
                width: '100%',
                background: 'rgba(245,158,11,.06)',
                border: '1px solid #F59E0B33',
                borderRadius: 8,
                padding: '7px 10px',
                fontSize: 12,
                fontFamily: 'var(--font-mono), monospace',
                color: '#F59E0B',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {showSuggestions && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#1A1200',
                  border: '1px solid #F59E0B44',
                  borderRadius: 8,
                  zIndex: 999,
                  marginTop: 3,
                  overflow: 'hidden',
                  boxShadow: '0 8px 24px rgba(0,0,0,.5)',
                }}
              >
                {suggestions.map(u => (
                  <div
                    key={u.id}
                    onMouseDown={() => addTag(u)}
                    style={{
                      padding: '7px 10px',
                      fontSize: 12,
                      fontFamily: 'var(--font-mono), monospace',
                      color: '#F59E0B',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                      borderBottom: '1px solid #F59E0B22',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(245,158,11,.1)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: u.color || '#F59E0B',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 9,
                        color: '#fff',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {u.initials || u.name?.[0]?.toUpperCase() || '?'}
                    </span>
                    {u.name}
                    <span style={{ fontSize: 10, opacity: 0.5, marginLeft: 'auto' }}>{u.role}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Message textarea */}
          <textarea
            ref={textareaRef}
            placeholder="Type your message..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              background: 'rgba(245,158,11,.06)',
              border: '1px solid #F59E0B33',
              borderRadius: 8,
              padding: '8px 10px',
              fontSize: 12,
              fontFamily: 'var(--font-sans), sans-serif',
              color: 'var(--t1)',
              outline: 'none',
              resize: 'none',
              boxSizing: 'border-box',
              lineHeight: 1.5,
            }}
            onFocus={e => { e.currentTarget.style.borderColor = '#F59E0B88'; }}
            onBlur={e => { e.currentTarget.style.borderColor = '#F59E0B33'; }}
          />

          {/* Send button */}
          {sent ? (
            <div style={{ textAlign: 'center', fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: 'var(--green)', padding: '6px 0' }}>
              ✓ Broadcast sent!
            </div>
          ) : (
            <button
              onClick={handleSend}
              disabled={sending || !message.trim() || tagged.length === 0}
              style={{
                width: '100%',
                padding: '9px 0',
                borderRadius: 8,
                border: 'none',
                cursor: sending || !message.trim() || tagged.length === 0 ? 'not-allowed' : 'pointer',
                background: sending || !message.trim() || tagged.length === 0 ? '#F59E0B44' : '#F59E0B',
                color: sending || !message.trim() || tagged.length === 0 ? '#F59E0B88' : '#000',
                fontFamily: 'var(--font-sans), sans-serif',
                fontWeight: 700,
                fontSize: 13,
                transition: 'all .15s',
              }}
            >
              {sending ? '◌ Sending…' : '⊛ Send Broadcast →'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export const Sidebar = ({ user, unreadNotifsCount, todayAttendance, earnings }: SidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const canCreate = true;
  const userRole = (user.role || 'employee').toLowerCase();
  const [loading, setLoading] = useState(false);
  const isClockedIn = !!todayAttendance?.clockIn;
  const isClockedOut = !!todayAttendance?.clockOut;

  const handleClockIn = async () => {
    setLoading(true);
    try {
      await clockIn();
      router.refresh();
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleClockOut = async () => {
    setLoading(true);
    try {
      await clockOut();
      router.refresh();
    } catch { /* ignore */ }
    setLoading(false);
  };
  
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  const nav = [
    { id: '/', l: 'Board', ic: '⊞' },
    { id: '/open-queue', l: 'Open Queue', ic: '◈' },
    { id: '/notifications', l: 'Notifications', ic: '⚐' },
    { id: '/leaderboard', l: 'Leaderboard', ic: '☆' },
    { id: '/productivity', l: 'Productivity', ic: '◱' },
    ...( isAdmin ? [
      { id: '/admin/tracker', l: 'Activity Tracker', ic: '◫' },
      { id: '/import', l: 'Bulk Import', ic: '⇪' },
      { id: '/vault', l: 'Credential Locker', ic: '⎔' },
      { id: '/admin', l: 'Admin Settings', ic: '⬡' }
    ] : [])
  ];

  return (
    <div style={{ width: 220, flexShrink: 0, background: 'var(--bg1)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'sticky', top: 0, alignSelf: 'flex-start' }}>
      <div style={{ padding: '15px 14px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 7 }}>
        <div style={{ width: 24, height: 24, background: 'var(--accent)', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans), sans-serif', fontWeight: 700, fontSize: 20, color: '#fff' }}>T</div>
        <span style={{ fontFamily: 'var(--font-sans), sans-serif', fontSize: 17, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-.2px' }}>TaskDock</span>
      </div>
      
      {/* START MY DAY / CLOCK IN-OUT */}
      {!isClockedIn && (
        <div style={{ margin: '10px 7px 0', padding: '14px', background: 'linear-gradient(135deg,#061A0E,#0D2818)', border: '1px solid var(--green)', borderRadius: 14, boxShadow: '0 4px 22px rgba(34,197,94,.18)' }} className="fu">
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono), monospace', color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 10 }}>☀ Good morning</div>
          <button onClick={handleClockIn} disabled={loading}
            style={{ width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'var(--green)', color: '#000', fontFamily: 'var(--font-sans), sans-serif', fontWeight: 800, fontSize: 16, letterSpacing: '-.2px', transition: 'all .15s', boxShadow: '0 2px 12px rgba(34,197,94,.35)' }}>
            {loading ? '◌ Starting…' : '▶ Start My Day'}
          </button>
        </div>
      )}

      {isClockedIn && !isClockedOut && (
        <div style={{ margin: '10px 7px 0', padding: '10px 14px', background: 'linear-gradient(135deg,#061A0E,#0D2818)', border: '1px solid var(--green)55', borderRadius: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono), monospace', color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 2 }}>● In session</div>
              <div style={{ fontSize: 14, fontFamily: 'var(--font-mono), monospace', color: 'var(--t2)', fontWeight: 600 }}>
                {new Date(todayAttendance.clockIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <button onClick={handleClockOut} disabled={loading}
              style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--red)66', background: 'var(--red-bg)', color: 'var(--red)', fontFamily: 'var(--font-sans), sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              {loading ? '◌' : '◼ End Day'}
            </button>
          </div>
        </div>
      )}

      {isClockedIn && isClockedOut && (
        <div style={{ margin: '10px 7px 0', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono), monospace', color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '.08em' }}>✓ Day complete</span>
            <span style={{ fontSize: 13, fontFamily: 'var(--font-mono), monospace', color: 'var(--t3)', fontWeight: 600 }}>
              {todayAttendance.hoursWorked ? `${todayAttendance.hoursWorked.toFixed(1)}h` : '—'}
            </span>
          </div>
          <button onClick={handleClockIn} disabled={loading}
            style={{ width: '100%', padding: '10px 14px', border: 'none', background: 'transparent', color: 'var(--t2)', fontFamily: 'var(--font-sans), sans-serif', fontWeight: 600, fontSize: 14, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6 }}>
            {loading ? '◌' : '↺'} Resume Day
          </button>
        </div>
      )}

      <nav style={{ flex: 1, padding: '8px 7px', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {canCreate && (
          <Link href="/create" style={{ textDecoration: 'none' }}>
            <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 11px', borderRadius: 11, border: 'none', cursor: 'pointer', background: 'var(--accent)', color: '#fff', fontFamily: 'var(--font-sans), sans-serif', fontWeight: 700, fontSize: 16, marginBottom: 8, boxShadow: '0 3px 16px rgba(255,79,0,.4)', transition: 'all .13s', letterSpacing: '-.1px' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#E04500'; e.currentTarget.style.boxShadow = '0 5px 24px rgba(255,79,0,.55)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 3px 16px rgba(255,79,0,.4)'; }}>
              <span style={{ fontSize: 14, lineHeight: 1, fontWeight: 300 }}>+</span>
              <span>Create Task</span>
            </button>
          </Link>
        )}
        
        {nav.map(item => {
          const isActive = pathname === item.id;
          return (
            <Link key={item.id} href={item.id} style={{ textDecoration: 'none' }}>
              <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 7, padding: '7px 9px', borderRadius: 7, border: 'none', cursor: 'pointer', background: isActive ? 'var(--accent-dim)' : 'transparent', color: isActive ? 'var(--accent)' : 'var(--t3)', transition: 'all .11s', fontFamily: 'var(--font-sans), sans-serif', fontWeight: isActive ? 600 : 400, fontSize: 15 }}>
                <span style={{ fontSize: 15, opacity: 0.85 }}>{item.ic}</span>
                <span>{item.l}</span>
                {item.id === '/notifications' && unreadNotifsCount > 0 && (
                  <span style={{ marginLeft: 'auto', background: 'var(--accent)', color: '#fff', fontSize: 11, borderRadius: 120, padding: '1px 5px', fontFamily: 'var(--font-mono), monospace', minWidth: 14, textAlign: 'center' }}>{unreadNotifsCount}</span>
                )}
              </button>
            </Link>
          );
        })}
      </nav>
      
      {/* BROADCAST PANEL — admin/superadmin only */}
      {isAdmin && (
        <BroadcastPanel currentUserId={user.id} />
      )}

      {/* EARNINGS PROGRESS BAR */}
      {earnings && earnings.total > 0 && (
        <div style={{ margin: '0 7px 4px', padding: '10px 12px', background: 'linear-gradient(135deg,#0D1A24,#0A1420)', border: '1px solid var(--blue)44', borderRadius: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono), monospace', color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '.1em' }}>This month</div>
            {earnings.multiplier && earnings.multiplier !== 1 && (
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono), monospace', color: earnings.multiplier > 1 ? 'var(--green)' : 'var(--red)', background: earnings.multiplier > 1 ? 'var(--green-bg)' : 'var(--red-bg)', padding: '2px 5px', borderRadius: 4 }}>
                {earnings.multiplier}x Prod.
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
            <span style={{ fontFamily: 'var(--font-sans), sans-serif', fontWeight: 700, fontSize: 18, color: 'var(--blue)', lineHeight: 1 }}>₹{earnings.earned.toLocaleString('en-IN')}</span>
            <span style={{ fontSize: 13, fontFamily: 'var(--font-mono), monospace', color: 'var(--t4)' }}>of ₹{earnings.total.toLocaleString('en-IN')}</span>
          </div>
          <div style={{ height: 4, background: 'var(--bg4)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min((earnings.earned / earnings.total) * 100, 100)}%`, background: 'linear-gradient(90deg,var(--blue),#38BDF8)', borderRadius: 3, transition: 'width .6s ease' }} />
          </div>
        </div>
      )}

      <Link href="/leaderboard" style={{ textDecoration: 'none' }}>
        <div style={{ margin: '0 7px 8px', background: 'linear-gradient(135deg,#042F2E,#115E59)', border: '1px solid #0F766E', borderRadius: 12, padding: '10px 12px', cursor: 'pointer' }}>
          <div style={{ fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: '#2DD4BF', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 5 }}>My brownie points</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 15 }}>◆</span>
            <span style={{ fontFamily: 'var(--font-sans), sans-serif', fontWeight: 700, fontSize: 20, color: '#FCD34D', lineHeight: 1 }}>{user.browniePoints}</span>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: '#2DD4BF', lineHeight: 1.45, marginTop: 4 }}>pts</span>
          </div>
          <div style={{ fontSize: 15, color: '#14B8A6', fontFamily: 'var(--font-mono), monospace', marginTop: 4 }}>Finish before deadline → +1</div>
        </div>
      </Link>
    </div>
  );
};
