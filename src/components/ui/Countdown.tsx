"use client";

import React, { useState, useEffect, useCallback } from 'react';

export const useCD = (dueAt: Date | string | null) => {
  const calc = useCallback(() => {
    if (!dueAt) {
      return { exp: false, d: 0, h: 0, m: 0, s: 0, pct: 0, color: 'var(--green)', bg: 'var(--green-bg)', urgent: false };
    }
    const due = new Date(dueAt);
    const diff = due.getTime() - new Date().getTime();
    if (diff <= 0) {
      const od = Math.abs(diff);
      return { exp: true, d: Math.floor(od / 86400000), h: Math.floor((od % 86400000) / 3600000), m: Math.floor((od % 3600000) / 60000), s: Math.floor((od % 60000) / 1000), pct: 100, color: 'var(--red)', bg: 'var(--red-bg)', urgent: true };
    }
    const d = Math.floor(diff / 86400000), h = Math.floor((diff % 86400000) / 3600000), m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000);
    const tot = diff / 1000;
    const color = tot < 7200 ? 'var(--red)' : tot < 86400 ? 'var(--amber)' : 'var(--green)';
    const bg = tot < 7200 ? 'var(--red-bg)' : tot < 86400 ? 'var(--amber-bg)' : 'var(--green-bg)';
    return { exp: false, d, h, m, s, pct: Math.min(100, (1 - (diff / 172800000)) * 100), color, bg, urgent: tot < 7200 };
  }, [dueAt]);

  const [cd, setCd] = useState(calc);
  
  useEffect(() => {
    const t = setInterval(() => setCd(calc()), 1000);
    return () => clearInterval(t);
  }, [calc]);
  
  return cd;
};

export const CDSmall = ({ task }: { task: { dueAt: Date | string | null; status: string; type?: string; assignedTo?: string | null } }) => {
  const cd = useCD(task.dueAt);
  const done = ['completed', 'cancelled'].includes(task.status);
  
  if (done) return <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--green)' }}>✓ done</span>;
  if (!task.dueAt) return <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--t4)' }}>No deadline</span>;

  const str = cd.d > 0 ? `${cd.d}d ${cd.h}h` : cd.h > 0 ? `${cd.h}h ${cd.m}m` : `${cd.m}m ${cd.s}s`;
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span className="ld" style={{ background: cd.color }} />
      <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: cd.color, fontWeight: 500 }}>
        {cd.exp ? `${str} over` : str}
      </span>
    </div>
  );
};

export const CDBig = ({ task }: { task: { dueAt: Date | string | null; status: string } }) => {
  const cd = useCD(task.dueAt);
  const done = ['completed', 'cancelled'].includes(task.status);
  
  if (done) return (
    <div style={{ padding: '10px 14px', background: 'var(--green-bg)', border: '1px solid var(--green)33', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 18, color: 'var(--green)' }}>✓</span>
      <span style={{ fontSize: 12, color: 'var(--green)', fontFamily: 'DM Mono, monospace' }}>Task completed</span>
    </div>
  );
  if (!task.dueAt) return (
    <div style={{ padding: '12px 14px', background: 'var(--bg3)', borderRadius: 12, color:'var(--t4)', fontSize:14 }}>No deadline set</div>
  );

  const nums = [{ v: String(cd.h).padStart(2, '0'), l: 'hrs' }, { v: String(cd.m).padStart(2, '0'), l: 'min' }, { v: String(cd.s).padStart(2, '0'), l: 'sec' }];
  if (cd.d > 0) nums.unshift({ v: String(cd.d), l: 'days' });
  
  const formattedDate = new Date(task.dueAt).toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'});

  return (
    <div style={{ padding: '12px 14px', background: cd.bg, border: `1px solid ${cd.color}33`, borderRadius: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="ld" style={{ background: cd.color }} />
          <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: cd.color, textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 500 }}>
            {cd.exp ? 'Overdue by' : cd.urgent ? 'Due very soon' : 'Time remaining'}
          </span>
        </div>
        <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: cd.color, opacity: 0.7 }}>{formattedDate}</span>
      </div>
      <div style={{ display: 'flex', gap: 14, marginBottom: 8 }}>
        {nums.map(({ v, l }) => (
          <div key={l} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 20, color: cd.color, lineHeight: 1, letterSpacing: '-1px' }}>{v}</div>
            <div style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: cd.color, opacity: 0.6, marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ height: 3, background: `${cd.color}20`, borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${cd.pct}%`, background: cd.color, borderRadius: 2, transition: 'width .8s' }} />
      </div>
    </div>
  );
};
