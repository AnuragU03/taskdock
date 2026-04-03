"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CardHeader } from '@/components/ui/TaskCard';
import { Toast, Lbl, PDot } from '@/components/ui/Atoms';
import { DLPick, AiBrief } from '@/components/ui/TaskInputs';
import { CATS } from '@/lib/constants';
import { createTask } from '@/app/actions/task';

export default function CreateClient({ user, allUsers }: { user: any; allUsers: any[] }) {
  const router = useRouter();
  const isAdmin = user.role?.toLowerCase() === 'admin';
  const isEmployee = user.role?.toLowerCase() === 'employee' || !user.role;
  const [f, setF] = useState({ title: '', desc: '', type: isEmployee ? 'open' : 'assigned', priority: 'medium', category: 'Design', dueAt: '', assignedTo: '', refLink: '' });
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const set = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));
  const employees = allUsers.filter(u => u.role?.toLowerCase() !== 'admin');
  const valid = f.title && f.desc && f.dueAt;
  
  const submit = async () => {
    if (!valid || loading) return;
    setLoading(true);
    try {
      // Auto-detect type: no assignee = open queue
      const payload = { ...f, type: f.assignedTo ? 'assigned' : 'open' };
      await createTask(payload);
      setToast('💳 Task created successfully!');
      setTimeout(() => router.push('/'), 1300);
    } catch (e) {
      setToast('❌ Failed to create task');
      setLoading(false);
    }
  };

  const previewTask = {
    ...f, 
    id: 'prev', 
    status: f.assignedTo ? (isAdmin ? 'under_review' : 'assigned') : 'open', 
    dueAt: f.dueAt ? new Date(f.dueAt.includes('T') ? f.dueAt : f.dueAt + 'T00:00') : new Date(Date.now() + 172800000),
    assignee: allUsers.find(u => u.id === f.assignedTo)
  };

  const formattedDueAt = f.dueAt ? new Date(f.dueAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      <Toast msg={toast} />
      
      {/* Left side: Live Preview */}
      <div style={{ width: 340, flexShrink: 0, background: 'var(--bg1)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', fontSize: 14, fontFamily: 'var(--font-sans), sans-serif' }}>← Cancel</button>
          <span style={{ fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: 'var(--t4)' }}>Card preview</span>
        </div>
        <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card" style={{ overflow: 'hidden', cursor: 'default', pointerEvents: 'none' }}>
            <div style={{ borderRadius: '13px 13px 0 0', overflow: 'hidden' }}>
              <CardHeader task={previewTask as any} />
            </div>
            <div style={{ padding: '11px 13px' }}>
              <div style={{ display: 'flex', gap: 5, marginBottom: 5, alignItems: 'center' }}>
                {f.category && <span style={{ fontSize: 12, fontFamily: 'var(--font-mono), monospace', background: 'var(--bg3)', padding: '2px 5px', borderRadius: 3, color: 'var(--t4)' }}>{f.category}</span>}
                <PDot priority={f.priority} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-sans), sans-serif', fontSize: 16, fontWeight: 600, color: f.title ? 'var(--t1)' : 'var(--t4)', letterSpacing: '-.2px', lineHeight: 1.45 }}>{f.title || 'Task title…'}</h3>
              <p style={{ fontSize: 12, color: 'var(--t4)', lineHeight: 1.55, marginTop: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{f.desc || 'Brief…'}</p>
              {f.refLink && <div style={{ marginTop: 6, padding: '4px 7px', background: 'var(--bg1)', borderRadius: 5, fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>↗ {f.refLink.replace('https://', '')}</div>}
              {f.dueAt && <div style={{ marginTop: 6, padding: '4px 7px', background: 'var(--green-bg)', borderRadius: 5, fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: 'var(--green)' }}>⏱ {formattedDueAt}</div>}
            </div>
          </div>
          {isAdmin && (
            <div style={{ background: 'var(--purple-bg)', border: '1px solid var(--purple)33', borderRadius: 12, padding: '10px 12px' }}>
              <div style={{ fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>★ Admin task</div>
              <p style={{ fontSize: 13, color: ' var(--purple)', lineHeight: 1.75, opacity: 0.8 }}>Admin tasks auto-route to Under Review status.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Right side: Form Inputs */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 36px', maxWidth: 640 }}>
        <h1 style={{ fontFamily: 'var(--font-sans), sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-.2px', marginBottom: 22 }}>Create a task</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div><Lbl c="Title *"/><input className="inp" value={f.title} onChange={e => set('title', e.target.value)} placeholder="What needs to be created?"/></div>
          <div>
            <Lbl c="Brief *" sub="Write manually or generate with AI"/>
            <AiBrief title={f.title} category={f.category} onApply={v => set('desc', v)}/>
            <textarea className="inp" value={f.desc} onChange={e => set('desc', e.target.value)} placeholder="Full creative brief — deliverables, style direction, constraints…" rows={4}/>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <Lbl c="Category"/>
              <select className="inp" value={f.category} onChange={e => set('category', e.target.value)}>
                {CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Lbl c="Priority *"/>
              <select className="inp" value={f.priority} onChange={e => set('priority', e.target.value)}>
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          {!isEmployee && (
            <div>
              <Lbl c="Assign to" sub="Leave empty → task goes to Open Queue for anyone to pick up"/>
              <select className="inp" value={f.assignedTo} onChange={e => set('assignedTo', e.target.value)}>
                <option value="">No assignee (Open Queue) ◈</option>
                {employees.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
              </select>
            </div>
          )}
          <div>
            <Lbl c="Deadline *" sub="Default is 2 days — adjust as needed"/>
            <DLPick value={f.dueAt} onChange={v => set('dueAt', v)}/>
          </div>
          <div>
            <Lbl c="Reference link"/>
            <input className="inp" value={f.refLink} onChange={e => set('refLink', e.target.value)} placeholder="Figma, Notion, Google Docs, Loom…"/>
          </div>
          <button 
            onClick={submit} 
            disabled={!valid || loading} 
            className="bp" 
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 16, borderRadius: 12, marginTop: 4, opacity: valid && !loading ? 1 : 0.4, cursor: valid && !loading ? 'pointer' : 'not-allowed' }}
          >
            {loading ? 'Creating...' : f.assignedTo ? 'Assign Task →' : 'Create Open Task ◈'}
          </button>
        </div>
      </div>
    </div>
  );
}
