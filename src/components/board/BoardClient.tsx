"use client";

import React, { useState, useMemo } from 'react';
import { StatsBar } from './StatsBar';
import { FilterBar } from './FilterBar';
import { GridV, KanV, ListView } from './BoardViews';
import { useRouter } from 'next/navigation';

export default function BoardClient({ initialTasks, user, allUsers, title = 'Creative Board', hideTitle = false, hideStats = false, isOpenQueue = false }: { initialTasks: any[]; user: any; allUsers: any[]; title?: string; hideTitle?: boolean; hideStats?: boolean; isOpenQueue?: boolean }) {
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [vm, setVm] = useState('board');
  const [q, setQ] = useState('');
  const router = useRouter();

  const [prevLength, setPrevLength] = useState(initialTasks.length);
  const [prevCompleted, setPrevCompleted] = useState(initialTasks.filter(t => t.status === 'completed').length);

  React.useEffect(() => {
    const playChime = (high: boolean) => {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(high ? 600 : 400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(high ? 1200 : 800, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start(); osc.stop(ctx.currentTime + 0.15);
      } catch (e) {}
    };

    const currCompleted = initialTasks.filter(t => t.status === 'completed').length;
    if (initialTasks.length > prevLength) playChime(false);
    else if (currCompleted > prevCompleted) playChime(true);
    
    setPrevLength(initialTasks.length);
    setPrevCompleted(currCompleted);
  }, [initialTasks, prevLength, prevCompleted]);

  const tasks = useMemo(() => {
    let t = [...initialTasks].sort((a, b) => {
      // 1. Uncompleted tasks stuck to the top
      const aDone = ['completed', 'rejected'].includes(a.status);
      const bDone = ['completed', 'rejected'].includes(b.status);
      if (aDone && !bDone) return 1;
      if (!aDone && bDone) return -1;

      // 1.5. Urgent tasks stuck to the very top
      const aUrgent = a.priority === 'urgent';
      const bUrgent = b.priority === 'urgent';
      if (aUrgent && !bUrgent) return -1;
      if (!aUrgent && bUrgent) return 1;

      // 2. Sort by dueAt (earliest first), put nulls at the end
      if (!a.dueAt && b.dueAt) return 1;
      if (a.dueAt && !b.dueAt) return -1;
      if (!a.dueAt && !b.dueAt) return 0;
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
      {!hideStats && <StatsBar tasks={tasks} userRole={user.role} minimal={isOpenQueue} />}
      
      {!hideTitle && (
        <div style={{ padding: '16px 24px', background: 'var(--bg1)', display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px solid var(--border)' }}>
          <h1 style={{ fontFamily: 'var(--font-sans), sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-.2px' }}>{title}</h1>
          <span style={{ fontSize: 12, color: 'var(--t4)', fontFamily: 'var(--font-mono), monospace' }}>{tasks.length} tasks</span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--t4)', fontSize: 15 }}>⌕</span>
              <input 
                value={q} 
                onChange={e => setQ(e.target.value)} 
                placeholder="Search tasks…" 
                className="inp" 
                style={{ paddingLeft: 27, width: 170, padding: '6px 11px 6px 26px', minHeight: 36 }} 
              />
            </div>
          </div>
        </div>
      )}
      
      <FilterBar 
        filters={filters} 
        setFilters={setFilters} 
        userRole={user.role} 
        users={allUsers} 
        vm={vm} 
        setVm={setVm} 
        isOpenQueue={isOpenQueue}
      />
      
      {vm === 'board' && <GridV tasks={tasks} onClickTask={go} />}
      {vm === 'kanban' && <KanV tasks={tasks} onClickTask={go} />}
      {vm === 'list' && <ListView tasks={tasks} onClickTask={go} />}
    </div>
  );
}
