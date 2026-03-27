"use client";

import React, { useState, useMemo } from 'react';
import { StatsBar } from './StatsBar';
import { FilterBar } from './FilterBar';
import { GridV, KanV, ListView } from './BoardViews';
import { useRouter } from 'next/navigation';

export default function BoardClient({ initialTasks, user, allUsers }: { initialTasks: any[]; user: any; allUsers: any[] }) {
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [vm, setVm] = useState('board');
  const [q, setQ] = useState('');
  const router = useRouter();

  const tasks = useMemo(() => {
    let t = [...initialTasks].sort((a, b) => {
      // Sort by dueAt (earliest first), put nulls at the end
      if (!a.dueAt) return 1;
      if (!b.dueAt) return -1;
      return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
    });

    if ((filters.status || []).length) t = t.filter(x => filters.status.includes(x.status));
    if ((filters.category || []).length) t = t.filter(x => filters.category.includes(x.category));
    if ((filters.priority || []).length) t = t.filter(x => filters.priority.includes(x.priority));
    if ((filters.assignee || []).length) t = t.filter(x => filters.assignee.includes(x.assignedTo));
    if (q) t = t.filter(x => x.title.toLowerCase().includes(q.toLowerCase()) || (x.desc && x.desc.toLowerCase().includes(q.toLowerCase())));
    
    return t;
  }, [initialTasks, filters, q]);

  const go = (taskId: string) => {
    router.push(`/task/${taskId}`);
  };

  return (
    <div style={{ position: 'relative' }}>
      <StatsBar tasks={tasks} userRole={user.role} />
      
      <div style={{ padding: '16px 24px 12px', background: 'var(--bg1)', display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px solid var(--border)' }}>
        <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-.2px' }}>Creative Board</h1>
        <span style={{ fontSize: 12, color: 'var(--t4)', fontFamily: 'DM Mono, monospace' }}>{tasks.length} tasks</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--t4)', fontSize: 15 }}>⌕</span>
            <input 
              value={q} 
              onChange={e => setQ(e.target.value)} 
              placeholder="Search tasks…" 
              className="inp" 
              style={{ paddingLeft: 27, width: 170, padding: '6px 11px 6px 26px' }} 
            />
          </div>
        </div>
      </div>
      
      <FilterBar 
        filters={filters} 
        setFilters={setFilters} 
        userRole={user.role} 
        users={allUsers} 
        vm={vm} 
        setVm={setVm} 
      />
      
      {vm === 'board' && <GridV tasks={tasks} onClickTask={go} />}
      {vm === 'kanban' && <KanV tasks={tasks} onClickTask={go} />}
      {vm === 'list' && <ListView tasks={tasks} onClickTask={go} />}
    </div>
  );
}
