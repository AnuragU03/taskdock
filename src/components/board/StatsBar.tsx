"use client";

import React, { useState } from 'react';
import { Tog } from '@/components/ui/Atoms';

interface TaskProps {
  id: string;
  status: string;
  dueAt?: Date | string | null;
}

const isOD = (t: TaskProps) => !['completed', 'cancelled'].includes(t.status) && t.dueAt && new Date(t.dueAt) < new Date();

const SOPTS = [
  { id: 'total', l: 'Total', fn: (t: TaskProps[]) => t.length },
  { id: 'active', l: 'Active', fn: (t: TaskProps[]) => t.filter(x => !['completed', 'cancelled'].includes(x.status)).length },
  { id: 'ip', l: 'In Progress', fn: (t: TaskProps[]) => t.filter(x => x.status === 'in_progress').length },
  { id: 'sub', l: 'Pending Review', fn: (t: TaskProps[]) => t.filter(x => x.status === 'submitted').length, ac: 'var(--amber)' },
  { id: 'od', l: 'Overdue', fn: (t: TaskProps[]) => t.filter(x => isOD(x)).length, ac: 'var(--red)' },
  { id: 'done', l: 'Completed', fn: (t: TaskProps[]) => t.filter(x => x.status === 'completed').length, ac: 'var(--green)' },
  { id: 'open', l: 'Open Queue', fn: (t: TaskProps[]) => t.filter(x => x.status === 'open').length, ac: 'var(--blue)' },
  { id: 'due2d', l: 'Due ≤ 2 days', fn: (t: TaskProps[]) => t.filter(x => {
      if (!x.dueAt) return false;
      const d = new Date(x.dueAt).getTime() - new Date().getTime();
      return d > 0 && d < 172800000 && !['completed', 'cancelled'].includes(x.status)
    }).length, ac: 'var(--amber)' },
];

interface StatsBarProps {
  tasks: TaskProps[];
  userRole: string;
}

export const StatsBar = ({ tasks, userRole }: StatsBarProps) => {
  const role = userRole.toLowerCase();
  const def = role === 'admin' ? ['total', 'active', 'od', 'done'] : role === 'manager' ? ['sub', 'ip', 'od', 'due2d'] : ['ip', 'sub', 'done', 'due2d'];
  const [vis, setVis] = useState<string[]>(def);
  const [edit, setEdit] = useState(false);
  
  return (
    <div style={{ background: 'var(--bg1)', borderBottom: '1px solid var(--border)', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ display: 'flex', gap: 9, flex: 1, flexWrap: 'wrap' }}>
        {SOPTS.filter(o => vis.includes(o.id)).map(o => (
          <div key={o.id} style={{ background: 'var(--bg3)', borderRadius: 12, padding: '9px 14px', minWidth: 80, flexShrink: 0 }}>
            <div style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.09em', marginBottom: 4 }}>{o.l}</div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 700, color: o.ac || 'var(--t1)', lineHeight: 1 }}>{o.fn(tasks)}</div>
          </div>
        ))}
      </div>
      <button onClick={() => setEdit(true)} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 7, padding: '6px 9px', cursor: 'pointer', color: 'var(--t3)', fontSize: 15, flexShrink: 0 }}>⚙</button>
      
      {edit && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setEdit(false)}>
          <div className="modal" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--t1)' }}>Customize stats</h3>
              <button onClick={() => setEdit(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--t3)' }}>×</button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--t3)', marginBottom: 14 }}>Choose up to 6 metrics for your header.</p>
            {SOPTS.map(o => {
              const on = vis.includes(o.id);
              return (
                <div key={o.id} onClick={() => on ? setVis(v => v.filter(x => x !== o.id)) : vis.length < 6 && setVis(v => [...v, o.id])} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 11, border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`, background: on ? 'var(--accent-dim)' : 'var(--bg3)', cursor: 'pointer', marginBottom: 5, transition: 'all .11s' }}>
                  <div>
                    <div style={{ fontSize: 14, color: 'var(--t1)', fontFamily: 'DM Sans, sans-serif', fontWeight: 500 }}>{o.l}</div>
                    <div style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--t3)', marginTop: 1 }}>{o.fn(tasks)} now</div>
                  </div>
                  <Tog on={on} onChange={() => {}} />
                </div>
              );
            })}
            <button onClick={() => setEdit(false)} className="bp" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
};
