"use client";

import React from 'react';
import { useCD } from './Countdown';
import { Av, SPill, PDot } from './Atoms';
import { URGENCY_COLORS } from '@/lib/constants';

interface UserProps {
  id: string;
  name: string;
  image?: string | null;
  color?: string;
  initials?: string;
}

interface TaskProps {
  id: string;
  title: string;
  desc?: string | null;
  status: string;
  category?: string | null;
  priority: string;
  dueAt?: Date | string | null;
  assignedTo?: string | null;
  assignee?: UserProps | null;
  type?: string;
  refLink?: string | null;
  subText?: string | null;
  subLink?: string | null;
  comments?: any[];
}

export const getUrgency = (cd: any) => {
  if (cd.exp)  return URGENCY_COLORS.over;
  if (cd.urgent) return URGENCY_COLORS.fire;
  const hrs = (cd.d * 24) + cd.h;
  if (hrs < 12)  return URGENCY_COLORS.hot;
  if (hrs < 36)  return URGENCY_COLORS.warn;
  return URGENCY_COLORS.safe;
};

export const CardHeader = ({ task }: { task: TaskProps }) => {
  const cd = useCD(task.dueAt || null);
  const au = task.assignee;
  const done = ['completed', 'cancelled'].includes(task.status);
  const isUnpicked = task.type === 'open' && !task.assignedTo && task.status === 'open';
  
  // If task has no deadline and not done
  if (!task.dueAt && !done && !isUnpicked) {
      return (
        <div style={{ padding: '16px', background: 'var(--bg2)', borderRadius: '13px 13px 0 0', borderBottom: `1px solid var(--border)`, minHeight: 112, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Av user={au} sz={72} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-.2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{au?.name || 'Unassigned'}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 14, fontFamily: 'var(--font-mono), monospace', color: 'var(--t4)' }}>No deadline</div>
            </div>
          </div>
        </div>
      );
  }

  const urg = done ? null : getUrgency(cd);

  if (done) return (
    <div style={{ padding: '20px 16px', background: 'rgba(52,211,153,.08)', borderRadius: '13px 13px 0 0', borderBottom: '1px solid rgba(52,211,153,.15)', display: 'flex', alignItems: 'center', gap: 14, minHeight: 112 }}>
      {au?.image ? (
        <img src={au.image} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', objectPosition: 'center top', flexShrink: 0, border: '3px solid #34D399' }} alt={au?.name || ''} />
      ) : (
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: au?.color || '#34D399', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#fff', flexShrink: 0, border: '2px solid #34D399' }}>{au?.initials || '✓'}</div>
      )}
      <div>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#34D399' }}>{au?.name || 'Completed'}</div>
        <div style={{ fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: 'rgba(52,211,153,.6)', marginTop: 3 }}>Task completed ✓</div>
      </div>
    </div>
  );

  if (isUnpicked) return (
    <div style={{ padding: '16px', background: 'linear-gradient(135deg,#1A0D2E,#0D0820)', borderRadius: '13px 13px 0 0', borderBottom: '1px solid #5B21B6', minHeight: 112, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', right: -16, top: -16, width: 70, height: 70, borderRadius: '50%', background: '#7C3AED', opacity: .12 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(124,58,237,.2)', border: '2px dashed #7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>◈</div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#C084FC', lineHeight: 1, letterSpacing: '-.3px' }}>PICK UP</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#FCD34D', lineHeight: 1.1, letterSpacing: '-.3px' }}>SOON</div>
        </div>
        {task.dueAt && (
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: cd.color, letterSpacing: '-1px', lineHeight: 1 }}>
              {String(cd.d * 24 + cd.h).padStart(2, '0')}H:{String(cd.m).padStart(2, '0')}M
            </div>
            <div style={{ fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: cd.color, opacity: .6, marginTop: 2 }}>
              {cd.d > 0 ? `+${cd.d}d ` : ''}remaining
            </div>
          </div>
        )}
      </div>
      {task.dueAt && (
        <div style={{ height: 2, background: 'rgba(124,58,237,.2)', borderRadius: 2, overflow: 'hidden', marginTop: 10 }}>
          <div style={{ height: '100%', width: `${cd.pct}%`, background: 'linear-gradient(90deg,#7C3AED,#FCD34D)', borderRadius: 2, transition: 'width .8s' }} />
        </div>
      )}
    </div>
  );

  const totalH = cd.d * 24 + cd.h;
  const timeStr = `${String(totalH).padStart(2, '0')}H:${String(cd.m).padStart(2, '0')}M:${String(cd.s).padStart(2, '0')}S`;

  return (
    <div style={{ padding: '16px', background: urg?.bg, borderRadius: '13px 13px 0 0', borderBottom: `1px solid ${urg?.border}`, minHeight: 112, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', right: -18, top: -18, width: 80, height: 80, borderRadius: '50%', background: urg?.color, opacity: .07 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {au?.image ? (
          <img src={au.image} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', objectPosition: 'center top', flexShrink: 0, border: `3px solid ${urg?.color}`, boxShadow: `0 0 0 4px ${urg?.color}22` }} alt={au?.name || ''} />
        ) : (
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: au?.color || urg?.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#fff', flexShrink: 0, border: `3px solid ${urg?.color}`, boxShadow: `0 0 0 4px ${urg?.color}22` }}>{au?.initials || '?'}</div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-.2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{au?.name || 'Unassigned'}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
            <span className="ld" style={{ background: urg?.color }} />
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: urg?.color, textTransform: 'uppercase', letterSpacing: '.08em' }}>{cd.exp ? 'overdue' : cd.urgent ? 'due soon' : 'in progress'}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: totalH >= 100 ? 14 : totalH >= 10 ? 18 : 22, fontWeight: 700, color: urg?.color, letterSpacing: '-1px', lineHeight: 1, fontFamily: 'var(--font-mono), monospace' }}>{cd.exp && <span style={{ fontSize: 15, opacity: .7 }}>+</span>}{timeStr}</div>
          <div style={{ fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: urg?.color, opacity: .6, marginTop: 2, textAlign: 'right' }}>{cd.exp ? 'overdue' : 'left'}</div>
        </div>
      </div>
      <div style={{ height: 2, background: `${urg?.color}1A`, borderRadius: 2, overflow: 'hidden', marginTop: 10 }}>
        <div style={{ height: '100%', width: `${cd.pct}%`, background: urg?.color, borderRadius: 2, transition: 'width .8s' }} />
      </div>
    </div>
  );
};

export const TCard = ({ task, onClick, compact = false }: { task: TaskProps; onClick?: () => void; compact?: boolean }) => {
  const hasOut = task.subText || task.subLink;
  
  if (compact) return (
    <div className="card fu" onClick={onClick} style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer', flex: 1, width: '100%' }}>
      <CardHeader task={task} />
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--t1)', lineHeight: 1.45 }}>{task.title}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <SPill status={task.status} />
          <PDot priority={task.priority} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="card fu" onClick={onClick} style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer', flex: 1, width: '100%' }}>
      <CardHeader task={task} />
      <div style={{ padding: '13px 14px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
            {task.category && <span style={{ fontSize: 12, fontFamily: 'var(--font-mono), monospace', background: 'var(--bg3)', padding: '2px 6px', borderRadius: 4, color: 'var(--t3)' }}>{task.category}</span>}
            <PDot priority={task.priority} />
            {hasOut && <span className="pill" style={{ background: 'var(--green)', color: 'var(--bg0)', marginLeft: 'auto' }}>↑ Output</span>}
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--t1)', lineHeight: 1.45, marginBottom: 4 }}>{task.title}</h3>
          <p style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.75, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{task.desc}</p>
        </div>
        {task.refLink && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 8px', background: 'var(--bg1)', borderRadius: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--t4)' }}>↗</span>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{task.refLink.replace('https://', '')}</span>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 7, borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
          <SPill status={task.status} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {(() => {
              let count = 0;
              if (Array.isArray(task.comments)) count = task.comments.length;
              else if (typeof task.comments === 'string') {
                try { count = JSON.parse(task.comments).length; } catch {}
              }
              return count > 0 ? <span style={{ fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: 'var(--t4)' }}>{count}💬</span> : null;
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};
