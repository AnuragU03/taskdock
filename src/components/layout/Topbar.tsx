"use client";

import React from 'react';
import { signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';

export const Topbar = ({ user }: { user: any }) => {
  const pathname = usePathname();

  const getPageTitle = () => {
    if (pathname === '/') return 'Dashboard';
    if (pathname === '/profile') return 'My Profile';
    if (pathname === '/vault') return 'Credential Locker';
    if (pathname === '/admin') return 'Admin Dashboard';
    if (pathname === '/leaderboard') return 'Leaderboard';
    if (pathname === '/notifications') return 'Notifications';
    if (pathname === '/open-queue') return 'Open Queue';
    if (pathname === '/import') return 'Bulk Import';
    if (pathname?.startsWith('/task/')) return 'Task Details';
    return '';
  };

  return (
    <div style={{ height: 60, borderBottom: '1px solid var(--border)', background: 'var(--bg0)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0, position: 'sticky', top: 0, zIndex: 10 }}>
      {/* Breadcrumb / Title area */}
      <div style={{ fontSize: 14, fontFamily: 'var(--font-mono), monospace', color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
        {getPageTitle()}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>{user.name}</div>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono), monospace', color: 'var(--t4)', textTransform: 'uppercase' }}>{user.role}</div>
        </div>
        {user.image ? (
          <img src={user.image} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }} alt="Profile" />
        ) : (
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: user.color || 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>
            {user.initials || (user.name || '?').charAt(0).toUpperCase()}
          </div>
        )}
        <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 4px' }} />
        <button onClick={() => signOut({ callbackUrl: '/login' })} style={{ background: 'transparent', border: 'none', color: 'var(--t4)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans), sans-serif', padding: '4px 8px', transition: 'color .1s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--t4)'}>
          Log out
        </button>
      </div>
    </div>
  );
};
