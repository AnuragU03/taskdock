"use client";

import React from 'react';
import { SC, PC } from '@/lib/constants';

interface UserAvatarProps {
  user?: { image?: string | null; color?: string; initials?: string | null; name?: string | null } | null;
  sz?: number;
}
export const Av = ({ user, sz = 36 }: UserAvatarProps) => {
  if (user?.image) return (
    <img 
      src={user.image} 
      style={{ width: sz, height: sz, borderRadius: '50%', objectFit: 'cover', objectPosition: 'center top', flexShrink: 0, border: `2px solid ${user.color || '#555'}` }} 
      alt={user?.name || 'User'} 
    />
  );
  return (
    <div style={{ width: sz, height: sz, borderRadius: '50%', background: user?.color || '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: sz * 0.34, fontWeight: 600, color: '#fff', letterSpacing: '-.2px' }}>
      {user?.initials || user?.name?.charAt(0).toUpperCase() || '?'}
    </div>
  );
};

export const SPill = ({ status }: { status: string }) => {
  const c = SC[status.toLowerCase()] || SC.draft;
  return <span className="pill" style={{ background: c.bg, color: c.tc }}>{c.l}</span>;
};

export const PDot = ({ priority }: { priority: string }) => {
  const c = PC[priority.toLowerCase()] || PC.low;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: c.c, fontFamily: 'var(--font-mono), monospace', fontWeight: 500, whiteSpace: 'nowrap' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.c, display: 'inline-block' }}></span>
      {c.l}
    </span>
  );
};

export const Tog = ({ on, onChange }: { on: boolean; onChange: () => void }) => (
  <div className="tw" onClick={onChange} style={{ background: on ? 'var(--accent)' : 'var(--bg4)' }}>
    <div className="tk" style={{ left: on ? '19px' : '2px' }}></div>
  </div>
);

export const Toast = ({ msg }: { msg: string | null }) => {
  if (!msg) return null;
  return (
    <div style={{ position: 'fixed', bottom: 22, left: '50%', transform: 'translateX(-50%)', background: 'var(--accent)', color: '#fff', padding: '12px 22px', borderRadius: 120, fontSize: 13, fontFamily: 'var(--font-sans), sans-serif', fontWeight: 500, zIndex: 9999, boxShadow: '0 6px 24px rgba(0,0,0,.4)', whiteSpace: 'nowrap' }} className="fu">
      {msg}
    </div>
  );
};

export const Lbl = ({ c, sub }: { c: string; sub?: string }) => (
  <div style={{ marginBottom: 5 }}>
    <div style={{ fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.09em' }}>{c}</div>
    {sub && <div style={{ fontSize: 12, color: 'var(--t4)', marginTop: 1 }}>{sub}</div>}
  </div>
);

export const Divider = () => <div style={{ width: 1, height: 18, background: 'var(--border)', flexShrink: 0 }} />;
