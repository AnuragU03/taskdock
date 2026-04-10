"use client";

import React from 'react';
import { TCard } from '@/components/ui/TaskCard';
import { CDSmall } from '@/components/ui/Countdown';
import { SPill, PDot, Av } from '@/components/ui/Atoms';
import { SC, KCOLS } from '@/lib/constants';

interface BoardViewsProps {
  tasks: any[];
  onClickTask: (taskId: string) => void;
}

export const GridV = ({ tasks, onClickTask }: BoardViewsProps) => {
  if (!tasks.length) return <p style={{ padding: '60px 0', textAlign: 'center', color: 'var(--t4)', fontSize: 18 }}>No tasks match your filters</p>;
  
  return (
    <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16, alignItems: 'stretch' }}>
      {tasks.map(t => (
        <div key={t.id} style={{ display: 'flex', minWidth: 0 }}>
          <TCard task={t} onClick={() => onClickTask(t.id)} />
        </div>
      ))}
    </div>
  );
};

export const KanV = ({ tasks, onClickTask }: BoardViewsProps) => (
  <div style={{ padding: '20px 24px', display: 'flex', gap: 14, overflowX: 'auto', alignItems: 'flex-start' }}>
    {KCOLS.map(col => {
      const ct = tasks.filter(t => t.status === col.id);
      const c = SC[col.id] || SC.draft;
      return (
        <div key={col.id} className="kanban-col">
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10, padding: '0 2px' }}>
            <span className="pill" style={{ background: c.bg, color: c.tc }}>{col.l}</span>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: 'var(--t4)' }}>{ct.length}</span>
          </div>
          {ct.map(t => <TCard key={t.id} task={t} onClick={() => onClickTask(t.id)} compact />)}
          {ct.length === 0 && (
            <div style={{ padding: '18px', textAlign: 'center', color: 'var(--t4)', fontSize: 12, fontFamily: 'var(--font-mono), monospace', background: 'var(--bg1)', borderRadius: 12, border: `1px dashed var(--border)` }}>
              Empty
            </div>
          )}
        </div>
      );
    })}
  </div>
);

export const ListView = ({ tasks, onClickTask }: BoardViewsProps) => {
  if (!tasks.length) return <p style={{ padding: '60px 0', textAlign: 'center', color: 'var(--t4)', fontSize: 18 }}>No tasks match your filters</p>;
  
  return (
    <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 7 }}>
      {tasks.map(t => {
        const au = t.assignee;
        const fmtS = (s: string | Date | null) => s ? new Date(s).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : 'No Date';

        return (
          <div key={t.id} className="card fu" onClick={() => onClickTask(t.id)} style={{ padding: 0, display: 'flex', overflow: 'hidden', height: 84, cursor: 'pointer' }}>
            <div style={{ width: 130, flexShrink: 0, background: 'var(--bg1)', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '10px 14px', borderRight: '1px solid var(--border)' }}>
              <CDSmall task={t} />
              <div style={{ fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: 'var(--t4)', marginTop: 3 }}>{fmtS(t.dueAt)}</div>
            </div>
            
            <div style={{ flex: 1, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 5, marginBottom: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                  <SPill status={t.status} />
                  {t.category && <span style={{ fontSize: 12, fontFamily: 'var(--font-mono), monospace', background: 'var(--bg3)', padding: '2px 5px', borderRadius: 3, color: 'var(--t4)' }}>{t.category}</span>}
                </div>
                <div style={{ fontFamily: 'var(--font-sans), sans-serif', fontWeight: 600, fontSize: 16, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-.2px' }}>{t.title}</div>
                <div style={{ fontSize: 12, color: 'var(--t4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>{t.desc}</div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
                <PDot priority={t.priority} />
                {au && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Av user={au} sz={24} />
                    <span style={{ fontSize: 12, color: 'var(--t3)' }}>{au.name?.split(' ')[0]}</span>
                  </div>
                )}
                <CDSmall task={t} />
              </div>
              
              <span style={{ color: 'var(--t4)', fontSize: 15 }}>›</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
