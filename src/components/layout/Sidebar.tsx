"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

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
}

export const Sidebar = ({ user, unreadNotifsCount }: SidebarProps) => {
  const pathname = usePathname();
  const canCreate = true; // All roles can create tasks (employees create open-queue tasks)
  const userRole = (user.role || 'employee').toLowerCase();
  
  const nav = [
    { id: '/', l: 'Board', ic: '⊞' },
    { id: '/open-queue', l: 'Open Queue', ic: '◈' },
    { id: '/notifications', l: 'Notifications', ic: '⚐' },
    { id: '/leaderboard', l: 'Leaderboard', ic: '🍫' },
    ...( userRole === 'admin' ? [{ id: '/admin', l: 'Settings', ic: '⬡' }] : [])
  ];

  return (
    <div style={{ width: 220, flexShrink: 0, background: 'var(--bg1)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'sticky', top: 0, alignSelf: 'flex-start' }}>
      <div style={{ padding: '15px 14px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 7 }}>
        <div style={{ width: 24, height: 24, background: 'var(--accent)', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 20, color: '#fff' }}>T</div>
        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 17, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-.2px' }}>TaskDock</span>
      </div>
      
      <nav style={{ flex: 1, padding: '8px 7px', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {canCreate && (
          <Link href="/create" style={{ textDecoration: 'none' }}>
            <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 11px', borderRadius: 11, border: 'none', cursor: 'pointer', background: 'var(--accent)', color: '#fff', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 16, marginBottom: 8, boxShadow: '0 3px 16px rgba(255,79,0,.4)', transition: 'all .13s', letterSpacing: '-.1px' }}
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
              <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 7, padding: '7px 9px', borderRadius: 7, border: 'none', cursor: 'pointer', background: isActive ? 'var(--accent-dim)' : 'transparent', color: isActive ? 'var(--accent)' : 'var(--t3)', transition: 'all .11s', fontFamily: 'DM Sans, sans-serif', fontWeight: isActive ? 600 : 400, fontSize: 15 }}>
                <span style={{ fontSize: 15, opacity: 0.85 }}>{item.ic}</span>
                <span>{item.l}</span>
                {item.id === '/notifications' && unreadNotifsCount > 0 && (
                  <span style={{ marginLeft: 'auto', background: 'var(--accent)', color: '#fff', fontSize: 11, borderRadius: 120, padding: '1px 5px', fontFamily: 'DM Mono, monospace', minWidth: 14, textAlign: 'center' }}>{unreadNotifsCount}</span>
                )}
              </button>
            </Link>
          );
        })}
      </nav>
      
      <Link href="/leaderboard" style={{ textDecoration: 'none' }}>
        <div style={{ margin: '0 7px 8px', background: 'linear-gradient(135deg,#1A0D2E,#2D1654)', border: '1px solid #5B21B6', borderRadius: 12, padding: '10px 12px', cursor: 'pointer' }}>
          <div style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: '#C084FC', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 5 }}>My brownie points</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 15 }}>🍫</span>
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 20, color: '#FCD34D', lineHeight: 1 }}>{user.browniePoints}</span>
            <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: '#C084FC', lineHeight: 1.45, marginTop: 4 }}>pts</span>
          </div>
          <div style={{ fontSize: 15, color: '#7C3AED', fontFamily: 'DM Mono, monospace', marginTop: 4 }}>Finish before deadline → +1</div>
        </div>
      </Link>
      
      <div style={{ padding: '9px 7px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 9px', marginBottom: 2 }}>
          {user.image ? (
            <img src={user.image} style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: `1.5px solid ${user.color || '#555'}` }} alt="Avatar" />
          ) : (
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: user.color || '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: '#fff', flexShrink: 0 }}>
              {user.initials || (user.name || '?').charAt(0).toUpperCase()}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, color: 'var(--t1)', fontSize: 16, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
            <div style={{ fontSize: 13, color: 'var(--t4)', textTransform: 'capitalize', fontFamily: 'DM Mono, monospace' }}>{user.role}</div>
          </div>
        </div>
        <button onClick={() => signOut({ callbackUrl: '/login' })} style={{ width: '100%', textAlign: 'left', padding: '5px 9px', borderRadius: 5, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--t4)', fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>
          Sign out
        </button>
      </div>
    </div>
  );
};
