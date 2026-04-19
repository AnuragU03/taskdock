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
  isOpenQueue?: boolean;
}

export const FilterBar = ({ filters, setFilters, userRole, users, vm, setVm, isOpenQueue }: FilterBarProps) => {
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
      
      {/* Filters Hub */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Status Dropdown */}
        <div style={{ position: 'relative' }}>
          <select 
            onChange={e => { if (e.target.value) { if (e.target.value === 'CLEAR') setFilters(prev => ({ ...prev, status: [] })); else tog('status', e.target.value); e.target.value = ''; } }}
            style={{ appearance: 'none', background: 'var(--bg3)', border: '1px solid var(--border)', color: (filters.status || []).length ? 'var(--accent)' : 'var(--t1)', padding: '7px 28px 7px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', minWidth: 120, outline: 'none' }}
            value=""
          >
            <option value="" disabled>{(filters.status || []).length ? `${(filters.status || []).length} Status` : 'Status...'}</option>
            {[['in_progress', 'Started'], ['submitted', 'Submitted'], ['open', 'Open'], ['overdue', 'Overdue'], ['under_review', 'Review'], ['completed', 'Done'], ['abandoned', 'Abandoned']].map(([k, l]) => (
               <option key={k} value={k}>{l} { (filters.status || []).includes(k) ? '✓' : '' }</option>
            ))}
            {(filters.status || []).length > 0 && <option value="CLEAR">— Clear Status —</option>}
          </select>
          <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--t4)', fontSize: 10 }}>▼</span>
        </div>

      <Divider />
      
        {/* Category Dropdown */}
        <div style={{ position: 'relative' }}>
          <select 
            onChange={e => { if (e.target.value) { if (e.target.value === 'CLEAR') setFilters(prev => ({ ...prev, category: [] })); else tog('category', e.target.value); e.target.value = ''; } }}
            style={{ appearance: 'none', background: 'var(--bg3)', border: '1px solid var(--border)', color: (filters.category || []).length ? 'var(--accent)' : 'var(--t1)', padding: '7px 28px 7px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', minWidth: 130, outline: 'none' }}
            value=""
          >
            <option value="" disabled>{(filters.category || []).length ? `${(filters.category || []).length} Categories` : 'Category...'}</option>
            {CATS.map(cat => <option key={cat} value={cat}>{cat} { (filters.category || []).includes(cat) ? '✓' : '' }</option>)}
            {(filters.category || []).length > 0 && <option value="CLEAR">— Clear Category —</option>}
          </select>
          <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--t4)', fontSize: 10 }}>▼</span>
        </div>
      </div>

      <Divider />
      {/* Priority Dropdown */}
      <div style={{ position: 'relative' }}>
        <select 
          onChange={e => { if (e.target.value) { if (e.target.value === 'CLEAR') setFilters(prev => ({ ...prev, priority: [] })); else tog('priority', e.target.value); e.target.value = ''; } }}
          style={{ appearance: 'none', background: 'var(--bg3)', border: '1px solid var(--border)', color: (filters.priority || []).length ? 'var(--accent)' : 'var(--t1)', padding: '7px 28px 7px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', minWidth: 120, outline: 'none' }}
          value=""
        >
          <option value="" disabled>{(filters.priority || []).length ? `${(filters.priority || []).length} Priority` : 'Priority'}</option>
          {[['urgent', 'Urgent'], ['high', 'High'], ['medium', 'Medium'], ['low', 'Low']].map(([v, l]) => (
             <option key={v} value={v}>{l} { (filters.priority || []).includes(v) ? '✓' : '' }</option>
          ))}
          {(filters.priority || []).length > 0 && <option value="CLEAR">— Clear Priority —</option>}
        </select>
        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--t4)', fontSize: 10 }}>▼</span>
      </div>

      {!isOpenQueue && (
        <>
          <Divider />
          {/* Assignee hub with Names restored */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {users.filter(u => (u.role || 'employee').toLowerCase() !== 'admin').slice(0, 10).map(u => {
              const on = (filters.assignee || []).includes(u.id);
              return (
                <button 
                  key={u.id} 
                  onClick={() => tog('assignee', u.id)} 
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px 4px 4px', borderRadius: 20, 
                    border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`, 
                    background: on ? 'var(--accent-dim)' : 'var(--bg2)', 
                    cursor: 'pointer', transition: 'all .12s', flexShrink: 0 
                  }}
                >
                  <Av user={u} sz={24} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: on ? 'var(--accent)' : 'var(--t3)', paddingRight: 2 }}>{u.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
      
      <div style={{ flex: 1 }} />

      {n > 0 && (
        <button onClick={() => setFilters({})} className="bg" style={{ padding: '6px 12px', fontSize: 13, fontWeight: 700, color: 'var(--red)', borderColor: 'rgba(239,68,68,.3)', background: 'rgba(239,68,68,.1)' }}>
          Reset Filters ({n})
        </button>
      )}
      
      <div style={{ flex: 1 }} />
    </div>
  );
};
