"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Toast, SPill, Av } from '@/components/ui/Atoms';
import { CardHeader } from '@/components/ui/TaskCard';
import { CDBig } from '@/components/ui/Countdown';
import { updateTask, pickupTask, submitWork, reviewTask, reopenTask, addComment, deleteTask } from '@/app/actions/task';

// Using the same format relative helper from HTML
const fmtRel = (s: string) => {
  const m = Math.floor((Date.now() - new Date(s).getTime()) / 60000);
  return m < 1 ? 'just now' : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.floor(m / 60)}h ago` : `${Math.floor(m / 1440)}d ago`;
};

const EI: Record<string, string> = {
  TASK_CREATED: '✦', TASK_ASSIGNED: '→', TASK_OPENED: '◈', TASK_PICKED_UP: '⊙',
  TASK_ACCEPTED: '✓', TASK_STARTED: '▶', TASK_SUBMITTED: '↑', TASK_APPROVED: '✓',
  TASK_REJECTED: '✗', TASK_REOPENED: '↺', TASK_REMINDER_SENT: '⏰', TASK_UPDATED: '✎'
};

export default function DetailClient({ initTask, user, allUsers }: { initTask: any; user: any; allUsers: any[] }) {
  const router = useRouter();
  const [task, setTask] = useState(initTask);
  const [comment, setComment] = useState('');
  const [sText, setSText] = useState('');
  const [sLink, setSLink] = useState('');
  const [fbText, setFbText] = useState('');
  const [score, setScore] = useState(0);
  const [showSub, setShowSub] = useState(initTask.status === 'in_progress' && initTask.assignedToId === user.id);
  const [showRev, setShowRev] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2400); };
  
  const handleAction = async (action: string) => {
    try {
      if (action === 'accept' || action === 'start') {
        const u = await updateTask(task.id, { status: 'in_progress' });
        setTask(u); setShowSub(true); flash('Started — submit when done!');
      } else if (action === 'pickup') {
        const u = await pickupTask(task.id);
        setTask(u); setShowSub(true); flash('Task picked up!');
      } else if (action === 'submit') {
        if (!sText && !sLink) return;
        const u = await submitWork(task.id, sText, sLink);
        setTask(u); setShowSub(false); flash('Submitted ✓');
      } else if (action === 'approve') {
        if (!score) { flash('Please select a score first'); return; }
        const u = await reviewTask(task.id, true, fbText, score);
        setTask(u); setShowRev(false); setScore(0); flash('Task approved!');
      } else if (action === 'reject') {
        if (!score) { flash('Please select a score first'); return; }
        if (!fbText) { flash('Feedback required for rejection'); return; }
        const u = await reviewTask(task.id, false, fbText, score);
        setTask(u); setShowRev(false); setScore(0); flash('Sent back for revision');
      } else if (action === 'reopen') {
        const u = await reopenTask(task.id);
        setTask(u); flash('Reopened');
      }
      router.refresh();
    } catch {
      flash('Error performing action');
    }
  };

  const gU = (id: string) => allUsers.find(u => u.id === id);

  const postComment = async () => {
    if (!comment.trim()) return;
    try {
      const u = await addComment(task.id, comment);
      setTask(u);
      setComment('');
      flash('Comment added');
      router.refresh();
    } catch {
      flash('Failed to post comment');
    }
  };

  const isMgr = ['manager', 'admin'].includes(user.role?.toLowerCase());
  const isEmp = !isMgr;
  const isMe = task.assignedToId === user.id;
  const isUnassigned = !task.assignedToId && !['completed', 'cancelled'].includes(task.status);
  const hasOut = task.subText || task.subLink;
  
  const safeParse = (s: string | null) => { try { return s ? JSON.parse(s) : []; } catch { return []; } };
  const events = safeParse(task.events);
  const commentsList = safeParse(task.comments);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Toast msg={toast} />
      
      {/* LEFT COLUMN */}
      <div style={{ width: 360, flexShrink: 0, borderRight: '1px solid var(--border)', background: 'var(--bg1)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', fontSize: 14, fontFamily: 'var(--font-sans), sans-serif', display: 'flex', alignItems: 'center', gap: 4 }}>← Board</button>
          
          {(isMgr || task.createdById === user.id) && (
            <button onClick={async () => { if(window.confirm('Delete this task forever?')) { await deleteTask(task.id); router.push('/'); } }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: 14, fontFamily: 'var(--font-sans), sans-serif', display: 'flex', alignItems: 'center', gap: 4 }}>🗑️ Delete</button>
          )}
        </div>
        
        <div style={{ background: 'var(--bg0)', overflow: 'hidden' }}>
          <CardHeader task={task} />
          <div style={{ padding: '8px 16px', display: 'flex', gap: 5, flexWrap: 'wrap', borderBottom: '1px solid var(--border)' }}>
            <SPill status={task.status} />
            {isUnassigned && <span className="pill" style={{ background: 'var(--blue)', color: '#fff' }}>◈ Open Queue</span>}
          </div>
        </div>
        
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <CDBig task={task} />
        </div>
        
        {task.refLink && (
          <div style={{ margin: '12px 16px', background: 'var(--accent-dim)', border: '1px solid var(--accent)33', borderRadius: 12, padding: '10px 12px' }}>
            <div style={{ fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 6 }}>Reference</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 26, height: 26, background: 'var(--accent)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff', fontSize: 15 }}>↗</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: '#FB923C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <a href={task.refLink} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                    {task.refLink.replace('https://', '')}
                  </a>
                </div>
                <div style={{ fontSize: 12, color: 'var(--accent)55', marginTop: 1 }}>Reference link</div>
              </div>
            </div>
          </div>
        )}
        
        {hasOut && (
          <div style={{ margin: '0 16px 12px', background: 'var(--green-bg)', border: '1px solid var(--green)33', borderRadius: 12, padding: '10px 12px' }}>
            <div style={{ fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 12, height: 12, background: 'var(--green)', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg0)', fontSize: 17, fontWeight: 700 }}>✓</span>
              Output delivered
            </div>
            {task.subText && <p style={{ fontSize: 12, color: 'var(--green)', lineHeight: 1.75, marginBottom: task.subLink ? 7 : 0, opacity: 0.85 }}>{task.subText}</p>}
            {task.subLink && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,0,0,.2)', borderRadius: 6, padding: '5px 8px' }}>
                <span style={{ fontSize: 18, color: 'var(--green)' }}>↗</span>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: 'var(--green)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <a href={task.subLink} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                    {task.subLink.replace('https://', '')}
                  </a>
                </span>
              </div>
            )}
          </div>
        )}
        
        {task.fbText && (
          <div style={{ margin: '0 16px 12px', background: task.status === 'completed' ? 'var(--green-bg)' : 'var(--red-bg)', border: `1px solid ${task.status === 'completed' ? 'var(--green)' : 'var(--red)'}33`, borderRadius: 12, padding: '10px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <div style={{ fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: task.status === 'completed' ? 'var(--green)' : 'var(--red)', textTransform: 'uppercase', letterSpacing: '.1em' }}>
                {task.status === 'completed' ? '✓ Approved' : '✗ Rejected'} — Feedback
              </div>
              {task.adminScore ? (
                <div style={{ fontSize: 13, fontFamily: 'var(--font-sans), sans-serif', fontWeight: 700, color: task.status === 'completed' ? 'var(--green)' : 'var(--red)' }}>
                  {task.adminScore} / 5 ★
                </div>
              ) : null}
            </div>
            <p style={{ fontSize: 15, color: task.status === 'completed' ? 'var(--green)' : 'var(--red)', lineHeight: 1.75, fontStyle: 'italic', opacity: 0.85 }}>{task.fbText}</p>
          </div>
        )}
        
        <div style={{ padding: '10px 16px 18px', flex: 1, overflowY: 'auto' }}>
          <div style={{ fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10 }}>Audit trail</div>
          {events.map((e: any, i: number) => (
            <div key={e.id} style={{ display: 'flex', gap: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 18 }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: e.type.includes('APPROVED') ? 'var(--green-bg)' : e.type.includes('REJECTED') ? 'var(--red-bg)' : 'var(--bg3)', border: `1px solid ${e.type.includes('APPROVED') ? 'var(--green)33' : e.type.includes('REJECTED') ? 'var(--red)33' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0, color: e.type.includes('APPROVED') ? 'var(--green)' : e.type.includes('REJECTED') ? 'var(--red)' : 'var(--t3)' }}>
                  {EI[e.type] || '·'}
                </div>
                {i < events.length - 1 && <div style={{ width: 1, flex: 1, background: 'var(--border)', margin: '2px 0', minHeight: 8 }} />}
              </div>
              <div style={{ paddingBottom: 9, paddingTop: 0 }}>
                <div style={{ fontSize: 14, color: 'var(--t2)' }}>{e.label}</div>
                <div style={{ fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: 'var(--t4)', marginTop: 1 }}>{e.by ? gU(e.by)?.name : 'System'} · {fmtRel(e.at)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* RIGHT COLUMN */}
      <div style={{ flex: 1, background: 'var(--bg0)', minWidth: 0, overflowY: 'auto' }}>
        <div style={{ padding: '24px 28px', maxWidth: 620 }}>
          <div style={{ marginBottom: 16 }}>
            <h1 style={{ fontFamily: 'var(--font-sans), sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-.4px', lineHeight: 1.2, marginBottom: 8 }}>{task.title}</h1>
            <p style={{ fontSize: 14, color: 'var(--t2)', lineHeight: 1.9, fontWeight: 300 }}>{task.desc}</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, marginBottom: 18 }}>
            {[
              { l: 'Created by', v: <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}><Av user={task.createdBy} sz={40} /><span style={{ fontSize: 15, color: 'var(--t1)' }}>{task.createdBy?.name}</span></div> },
              { l: 'Assigned to', v: task.assignee ? <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}><Av user={task.assignee} sz={40} /><span style={{ fontSize: 15, color: 'var(--t1)' }}>{task.assignee.name}</span></div> : <span style={{ fontSize: 13, color: 'var(--t4)', marginTop: 5, display: 'block' }}>—</span> },
              { l: 'Category', v: <div style={{ marginTop: 5 }}>{task.category ? <span style={{ fontSize: 12, fontFamily: 'var(--font-mono), monospace', background: 'var(--bg3)', padding: '2px 8px', borderRadius: 5, color: 'var(--t2)' }}>{task.category}</span> : <span style={{ fontSize: 13, color: 'var(--t4)' }}>—</span>}</div> },
              task.productivity ? { l: 'Productivity Score', v: <div style={{ marginTop: 2, display: 'flex', alignItems: 'baseline', gap: 4 }}><span style={{ fontFamily: 'var(--font-sans), sans-serif', fontWeight: 700, fontSize: 22, color: 'var(--green)' }}>{task.productivity}</span><span style={{ fontSize: 10, color: 'var(--t4)' }}>pts/hr</span></div> } : null,
              task.adminScore ? { l: 'Quality Rating', v: <div style={{ marginTop: 2, fontSize: 18, color: '#FCD34D' }}>{"★".repeat(task.adminScore)}{"☆".repeat(5 - task.adminScore)}</div> } : null
            ].filter(Boolean).map((stat: any) => (
              <div key={stat.l} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 11, padding: '9px 11px' }}>
                <div style={{ fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '.09em' }}>{stat.l}</div>{stat.v}
              </div>
            ))}
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 18 }}>
            {isUnassigned && <button onClick={() => handleAction('pickup')} className="bp">◈ Pick Up & Start</button>}
            {isMe && task.status === 'assigned' && <button onClick={() => handleAction('accept')} className="bp">▶ Accept & Start</button>}
            {isMe && task.status === 'in_progress' && !showSub && <button onClick={() => setShowSub(true)} className="bp">↑ Submit Work</button>}
            {isMe && task.status === 'rejected' && <button onClick={() => handleAction('start')} className="bp">↺ Revise & Resubmit</button>}
            {isMe && task.status === 'reopened' && <button onClick={() => handleAction('start')} className="bp">▶ Restart Work</button>}
            {['admin','superadmin'].includes(user.role?.toLowerCase()) && task.status === 'submitted' && <button onClick={() => setShowRev(true)} className="bp">★ Approve / Review</button>}
            {['admin','superadmin'].includes(user.role?.toLowerCase()) && task.status === 'under_review' && <button onClick={() => setShowRev(true)} className="bp">★ Complete Review</button>}
            {['admin','superadmin'].includes(user.role?.toLowerCase()) && ['completed', 'rejected', 'reopened'].includes(task.status) && <button onClick={() => handleAction('reopen')} className="bg">↺ Reopen</button>}
          </div>
          
          {showSub && (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px', marginBottom: 16 }} className="fu">
              <div style={{ fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 12 }}>Submit your work</div>
              <textarea className="inp" value={sText} onChange={e => setSText(e.target.value)} placeholder="What did you create / build / write?" style={{ marginBottom: 7 }} />
              <input className="inp" value={sLink} onChange={e => setSLink(e.target.value)} placeholder="Output link (Figma, Docs, Notion…)" style={{ marginBottom: 12 }} />
              <div style={{ display: 'flex', gap: 7 }}>
                <button onClick={() => handleAction('submit')} className="bp">Submit →</button>
                <button onClick={() => setShowSub(false)} className="bg">Cancel</button>
              </div>
            </div>
          )}
          
          {showRev && (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px', marginBottom: 16 }} className="fu">
              <div style={{ fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 12 }}>Review submission</div>
              {task.subText && <div style={{ background: 'var(--bg1)', borderRadius: 7, padding: '9px 11px', marginBottom: 7, fontSize: 15, color: 'var(--t2)', lineHeight: 1.75, fontStyle: 'italic' }}>{task.subText}</div>}
              {task.subLink && <div style={{ background: 'var(--accent-dim)', borderRadius: 7, padding: '7px 10px', marginBottom: 12, fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: '#FB923C' }}>{task.subLink}</div>}
              
              <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <button 
                    key={s} 
                    onClick={() => setScore(s)} 
                    style={{ 
                      flex: 1, 
                      padding: '10px 0', 
                      borderRadius: 8, 
                      border: `1.5px solid ${score === s ? 'var(--accent)' : 'var(--border)'}`, 
                      background: score === s ? 'var(--accent-dim)' : 'var(--bg1)', 
                      color: score === s ? 'var(--accent)' : 'var(--t2)',
                      fontFamily: 'var(--font-sans), sans-serif',
                      fontSize: 16,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.12s'
                    }}
                  >
                    {s} ★
                  </button>
                ))}
              </div>
              <textarea className="inp" value={fbText} onChange={e => setFbText(e.target.value)} placeholder="Feedback (required if rejecting)" style={{ marginBottom: 12 }} />
              <div style={{ display: 'flex', gap: 7 }}>
                <button onClick={() => handleAction('approve')} style={{ background: 'var(--green)', color: 'var(--bg0)', border: 'none', borderRadius: 8, padding: '8px 16px', fontFamily: 'var(--font-sans), sans-serif', fontWeight: 600, fontSize: 18, cursor: 'pointer' }}>✓ Approve</button>
                <button onClick={() => handleAction('reject')} style={{ background: 'var(--red)', color: 'var(--bg0)', border: 'none', borderRadius: 8, padding: '8px 16px', fontFamily: 'var(--font-sans), sans-serif', fontWeight: 600, fontSize: 18, cursor: 'pointer' }}>✗ Reject</button>
                <button onClick={() => setShowRev(false)} className="bg">Cancel</button>
              </div>
            </div>
          )}
          
          <div>
            <div style={{ fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 12 }}>
              Discussion ({commentsList.length})
            </div>
            {commentsList.length === 0 && <p style={{ fontSize: 13, color: 'var(--t4)', fontStyle: 'italic', marginBottom: 12 }}>No comments yet.</p>}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {commentsList.map((c: any) => {
                const au = gU(c.aId);
                return (
                  <div key={c.id} style={{ display: 'flex', gap: 8 }} className="fu">
                    <Av user={au} sz={40} />
                    <div style={{ flex: 1, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '11px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                        <span style={{ fontFamily: 'var(--font-sans), sans-serif', fontWeight: 600, fontSize: 16, color: 'var(--t1)' }}>{au?.name}</span>
                        <span style={{ fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: 'var(--t4)' }}>{fmtRel(c.at)}</span>
                      </div>
                      <p style={{ fontSize: 15, color: 'var(--t2)', lineHeight: 1.75 }}>{c.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
              <Av user={user} sz={40} />
              <input 
                className="inp" 
                value={comment} 
                onChange={e => setComment(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && postComment()} 
                placeholder="Add a comment… (Enter to send)" 
                style={{ flex: 1 }} 
              />
              <button onClick={postComment} className="bp" style={{ padding: '8px 14px' }}>Post</button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
