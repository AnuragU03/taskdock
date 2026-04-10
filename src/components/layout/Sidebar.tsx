"use client";

import React, { useState } from 'react';
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
    { id: '/leaderboard', l: 'Leaderboard', ic: '🍫' },
    ...( isAdmin ? [
      { id: '/import', l: 'Bulk Import', ic: '⇪' },
      { id: '/vault', l: 'Credential Locker', ic: '🔐' },
      { id: '/admin', l: 'Admin Dashboard', ic: '⬡' }
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
        <div style={{ margin: '8px 7px 0', padding: '10px 12px', background: 'linear-gradient(135deg,#0A1A10,#0D2818)', border: '1px solid var(--green)', borderRadius: 12 }} className="fu">
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono), monospace', color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 7 }}>☀ Good morning</div>
          <button onClick={handleClockIn} disabled={loading}
            style={{ width: '100%', padding: '9px 0', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'var(--green)', color: 'var(--bg0)', fontFamily: 'var(--font-sans), sans-serif', fontWeight: 700, fontSize: 14, transition: 'all .12s' }}>
            {loading ? '...' : '▶ Start My Day'}
          </button>
        </div>
      )}

      {isClockedIn && !isClockedOut && (
        <div style={{ margin: '8px 7px 0', padding: '8px 12px', background: 'var(--green-bg)', border: '1px solid var(--green)33', borderRadius: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono), monospace', color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '.08em' }}>● Clocked in</div>
              <div style={{ fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: 'var(--t4)', marginTop: 2 }}>
                {new Date(todayAttendance.clockIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <button onClick={handleClockOut} disabled={loading}
              style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--red)66', background: 'var(--red-bg)', color: 'var(--red)', fontFamily: 'var(--font-sans), sans-serif', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
              {loading ? '...' : 'End Day'}
            </button>
          </div>
        </div>
      )}

      {isClockedIn && isClockedOut && (
        <div style={{ margin: '8px 7px 0', padding: '8px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12 }}>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono), monospace', color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '.08em' }}>✓ Day complete</div>
          <div style={{ fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: 'var(--t3)', marginTop: 2 }}>
            {todayAttendance.hoursWorked ? `${todayAttendance.hoursWorked.toFixed(1)}h worked` : 'Done'}
          </div>
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
            <span style={{ fontSize: 15 }}>🍫</span>
            <span style={{ fontFamily: 'var(--font-sans), sans-serif', fontWeight: 700, fontSize: 20, color: '#FCD34D', lineHeight: 1 }}>{user.browniePoints}</span>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: '#2DD4BF', lineHeight: 1.45, marginTop: 4 }}>pts</span>
          </div>
          <div style={{ fontSize: 15, color: '#14B8A6', fontFamily: 'var(--font-mono), monospace', marginTop: 4 }}>Finish before deadline → +1</div>
        </div>
      </Link>
    </div>
  );
};
