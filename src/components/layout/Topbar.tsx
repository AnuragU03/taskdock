"use client";

import React from 'react';
import { signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';

export const Topbar = ({ user, unreadNotifsCount = 0 }: { user: any, unreadNotifsCount?: number }) => {
  const pathname = usePathname();
  const [showNotifs, setShowNotifs] = React.useState(false);
  const [notifs, setNotifs] = React.useState<any[]>([]);
  const lastCount = React.useRef(unreadNotifsCount);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Lazy Evaluation Trigger for recurring tasks
    fetch('/api/lazy-cron').catch(console.error);

    // Initial fetch for dropdown
    fetch('/api/notifications/unread')
      .then(r => r.json())
      .then(setNotifs)
      .catch(() => {});
  }, []);

  useEffect(() => {
    // Professional Ping Sound
    if (unreadNotifsCount > lastCount.current) {
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
        audio.volume = 0.4;
        audio.play().catch(() => {});
      } catch {}
    }
    lastCount.current = unreadNotifsCount;
  }, [unreadNotifsCount]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    <div style={{ height: 60, borderBottom: '1px solid var(--border)', background: 'var(--bg0)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0, position: 'sticky', top: 0, zIndex: 100 }}>
      {/* Breadcrumb / Title area */}
      <div style={{ fontSize: 14, fontFamily: 'var(--font-mono), monospace', color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
        {getPageTitle()}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button 
            onClick={() => setShowNotifs(!showNotifs)}
            style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', background: 'var(--bg1)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--t2)', transition: 'all .15s' }}
          >
            <span style={{ fontSize: 18 }}>🔔</span>
            {unreadNotifsCount > 0 && (
              <span style={{ position: 'absolute', top: -4, right: -4, background: 'var(--accent)', color: '#fff', fontSize: 10, borderRadius: 10, padding: '1px 5px', fontFamily: 'var(--font-mono), monospace', minWidth: 14, textAlign: 'center', border: '2px solid var(--bg0)' }}>
                {unreadNotifsCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 12, width: 320, background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: '0 10px 30px rgba(0,0,0,.4)', overflow: 'hidden', zIndex: 999 }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg2)' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>Recent Notifications</span>
                <Link href="/notifications" onClick={() => setShowNotifs(false)} style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>View All</Link>
              </div>
              <div style={{ maxHeight: 350, overflowY: 'auto' }}>
                {notifs.length > 0 ? notifs.slice(0, 5).map((n: any) => (
                  <Link 
                    key={n.id} 
                    href={n.taskId ? `/task/${n.taskId}` : '/notifications'} 
                    onClick={() => setShowNotifs(false)}
                    style={{ display: 'block', padding: '12px 16px', borderBottom: '1px solid var(--border)', textDecoration: 'none', transition: 'background .1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.4, marginBottom: 4 }}>{n.text}</div>
                    <div style={{ fontSize: 10, color: 'var(--t4)', fontFamily: 'var(--font-mono), monospace' }}>{new Date(n.createdAt).toLocaleTimeString()}</div>
                  </Link>
                )) : (
                  <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--t4)', fontSize: 13 }}>No unread notifications</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 4px' }} />

        <Link href="/profile" style={{ display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none', cursor: 'pointer' }}>
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
        </Link>
        <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 4px' }} />
        <button onClick={() => signOut({ callbackUrl: '/login' })} style={{ background: 'transparent', border: 'none', color: 'var(--t4)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans), sans-serif', padding: '4px 8px', transition: 'color .1s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--t4)'}>
          Log out
        </button>
      </div>
    </div>
  );
};
