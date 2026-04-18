"use client";

import React from 'react';
import { Divider, Av } from '@/components/ui/Atoms';
import { SC, CATS } from '@/lib/constants';

interface UserProps {
  id: string;
  name: string;
  role: string;
  image?: string | null;
  color?: string;
  initials?: string;
}

interface FilterBarProps {
  filters: Record<string, string[]>;
  setFilters: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  userRole: string;
  users: UserProps[];
  vm: string;
  setVm: (vm: string) => void;
}

export const FilterBar = ({ filters, setFilters, userRole, users, vm, setVm }: FilterBarProps) => {
  const tog = (k: string, v: string) => setFilters(f => {
    const c = f[k] || [];
    return { ...f, [k]: c.includes(v) ? c.filter(x => x !== v) : [...c, v] };
  });
  
  const n = Object.values(filters).flat().filter(Boolean).length;
  
  const vmBtn = (ic: string, v: string) => (
    <button key={v} onClick={() => setVm(v)} style={{ padding: '4px 8px', borderRadius: 5, border: 'none', background: vm === v ? 'var(--bg4)' : 'transparent', color: vm === v ? 'var(--t1)' : 'var(--t4)', cursor: 'pointer', fontSize: 18, transition: 'all .1s' }}>
      {ic}
    </button>
  );

  return (
    <div style={{ background: 'var(--bg1)', borderBottom: '1px solid var(--border)', padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 7, overflowX: 'auto', flexShrink: 0 }}>
      {/* View mode toggle */}
      <div style={{ display: 'flex', gap: 2, background: 'var(--bg0)', borderRadius: 7, padding: 3, flexShrink: 0 }}>
        {[['⊞', 'board'], ['☷', 'kanban'], ['☰', 'list']].map(([ic, v]) => vmBtn(ic, v))}
      </div>
      
      <Divider />
      
      {/* Status Dropdown */}
      <div style={{ position: 'relative' }}>
        <select 
          onChange={e => { if (e.target.value) tog('status', e.target.value); e.target.value = ''; }}
          style={{ appearance: 'none', background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--t1)', padding: '6px 28px 6px 12px', borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
          value=""
        >
          <option value="" disabled>Status...</option>
          {[['in_progress', 'In Progress'], ['submitted', 'Submitted'], ['open', 'Open'], ['overdue', 'Overdue'], ['under_review', 'Review'], ['completed', 'Done'], ['abandoned', 'Abandoned']].map(([k, l]) => (
             <option key={k} value={k}>{l}</option>
          ))}
        </select>
        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--t4)', fontSize: 12 }}>▼</span>
      </div>
      
      {/* Active Status Pills */}
      {(filters.status || []).map(k => {
        const c = SC[k] || SC.draft;
        return (
          <button key={k} onClick={() => tog('status', k)} className="fb on" style={{ background: c.bg, color: '#FFF', borderColor: c.tc + '66', fontSize: 14 }}>
            {c.l} ✕
          </button>
        );
      })}

      <Divider />
      
      {/* Category Dropdown */}
      <div style={{ position: 'relative' }}>
        <select 
          onChange={e => { if (e.target.value) tog('category', e.target.value); e.target.value = ''; }}
          style={{ appearance: 'none', background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--t1)', padding: '6px 28px 6px 12px', borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
          value=""
        >
          <option value="" disabled>Category...</option>
          {CATS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--t4)', fontSize: 12 }}>▼</span>
      </div>

      {/* Active Category Pills */}
      {(filters.category || []).map(cat => (
        <button key={cat} onClick={() => tog('category', cat)} className="fb on" style={{ fontSize: 14, color: '#FFF' }}>
          {cat} ✕
        </button>
      ))}

      <Divider />
      
      {/* Priority filters */}
      {[['urgent', '🔴'], ['high', '🟡'], ['medium', '🔵'], ['low', '⚫']].map(([v, ic]) => (
        <button key={v} onClick={() => tog('priority', v)} className={`fb${(filters.priority || []).includes(v) ? ' on' : ''}`} style={{ padding: '5px 8px' }} title={v}>
          {ic}
        </button>
      ))}
      
      <Divider />
      
      {/* Assignee filters (managers/admins only usually, but show non-admins) */}
      {users.filter(u => (u.role || 'employee').toLowerCase() !== 'admin').map(u => {
        const on = (filters.assignee || []).includes(u.id);
        return (
          <button key={u.id} onClick={() => tog('assignee', u.id)} style={{ padding: '2px 8px 2px 3px', borderRadius: 120, border: `1px solid ${on ? u.color : 'var(--border)'}`, background: on ? u.color + '22' : 'var(--bg2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, transition: 'all .12s', flexShrink: 0 }}>
            <Av user={u} sz={24} />
            <span style={{ fontSize: 14, fontWeight: 500, color: on ? u.color : 'var(--t3)' }}>{u.name.split(' ')[0]}</span>
          </button>
        );
      })}
      
      {n > 0 && (
        <>
          <Divider />
          <button onClick={() => setFilters({})} className="fb" style={{ color: 'var(--red)', borderColor: 'var(--red)44', background: 'var(--red-bg)' }}>
            ✕ {n}
          </button>
        </>
      )}
      
      <div style={{ flex: 1 }} />
    </div>
  );
};
