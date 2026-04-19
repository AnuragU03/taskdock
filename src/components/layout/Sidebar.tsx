"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { clockIn, clockOut } from '@/app/actions/attendance';

interface SidebarProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    image?: string | null;
    color?: string;
    initials?: string;
    browniePoints: number;
  };
  unreadNotifsCount: number;
  todayAttendance?: any;
  earnings?: { earned: number; total: number; multiplier?: number } | null;
}

interface MentionUser {
  id: string;
  name: string;
  role: string;
  color?: string;
  initials?: string;
}

function BroadcastPanel({ currentUserId }: { currentUserId: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [mention, setMention] = useState('');
  const [tagged, setTagged] = useState<MentionUser[]>([]);
  const [suggestions, setSuggestions] = useState<MentionUser[]>([]);
  const [allUsers, setAllUsers] = useState<MentionUser[]>([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open || allUsers.length > 0) return;
    fetch('/api/broadcast')
      .then(r => r.json())
      .then((users: MentionUser[]) => setAllUsers(users.filter(u => u.id !== currentUserId)))
      .catch(() => {});
  }, [open, currentUserId, allUsers.length]);

  useEffect(() => {
    if (!mention.trim()) { setSuggestions([]); setShowSuggestions(false); return; }
    const q = mention.toLowerCase();
    const filtered = allUsers.filter(u => u.name?.toLowerCase().includes(q) && !tagged.some(t => t.id === u.id));
    setSuggestions(filtered.slice(0, 6));
    setShowSuggestions(filtered.length > 0);
  }, [mention, allUsers, tagged]);

  const addTag = (user: MentionUser) => {
    setTagged(prev => [...prev, user]);
    setMention('');
    setShowSuggestions(false);
    textareaRef.current?.focus();
  };

  const removeTag = (id: string) => setTagged(prev => prev.filter(u => u.id !== id));

  const handleSend = async () => {
    if (!message.trim() || tagged.length === 0) return;
    setSending(true);
    try {
      const res = await fetch('/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim(), targetUserIds: tagged.map(u => u.id) }),
      });
      if (res.ok) {
        setSent(true);
        setMessage('');
        setTagged([]);
        setTimeout(() => setSent(false), 3000);
      }
    } catch {}
    setSending(false);
  };

  const INP: React.CSSProperties = {
    width: '100%',
    background: 'var(--bg1)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '7px 10px',
    fontSize: 12,
    fontFamily: 'var(--font-mono), monospace',
    color: 'var(--t1)',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color .12s',
  };

  return (
    <div style={{ margin: '0 7px 6px' }}>
      {/* Toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 11px',
          borderRadius: 10,
          border: `1px solid ${open ? 'var(--border2)' : 'var(--border)'}`,
          background: open ? 'var(--bg2)' : 'transparent',
          color: 'var(--t3)',
          fontFamily: 'var(--font-mono), monospace',
          fontSize: 11,
          cursor: 'pointer',
          transition: 'all .15s',
          letterSpacing: '.05em',
          textTransform: 'uppercase',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg2)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = open ? 'var(--bg2)' : 'transparent'; }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          {/* SVG megaphone/broadcast icon */}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 8.5c0 2.5-1.5 4.5-4 5.5v-11c2.5 1 4 3 4 5.5z"/>
            <path d="M18 14v5a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-5"/>
            <path d="M4 9H2a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h2l10 4V5L4 9z"/>
          </svg>
          Broadcast
        </span>
        <span style={{ fontSize: 9, opacity: 0.5 }}>{open ? '▲' : '▼'}</span>
      </button>

      {/* Expanded panel */}
      {open && (
        <div style={{
          marginTop: 6,
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 11,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          {/* Tagged user pills */}
          {tagged.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {tagged.map(u => (
                <span key={u.id} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: 'var(--bg3)', border: '1px solid var(--border2)',
                  borderRadius: 20, padding: '2px 7px 2px 5px',
                  fontSize: 11, color: 'var(--t2)',
                  fontFamily: 'var(--font-mono), monospace',
                }}>
                  <span style={{
                    width: 15, height: 15, borderRadius: '50%',
                    background: u.color || 'var(--accent)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 8, color: '#fff', fontWeight: 700, flexShrink: 0,
                  }}>
                    {u.initials || u.name?.[0]?.toUpperCase() || '?'}
                  </span>
                  @{u.name?.split(' ')[0]}
                  <button onClick={() => removeTag(u.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--t4)', cursor: 'pointer', padding: 0, fontSize: 12, lineHeight: 1 }}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* @mention input + dropdown */}
          <div style={{ position: 'relative' }}>
            <input
              placeholder="@mention someone..."
              value={mention}
              onChange={e => setMention(e.target.value)}
              onFocus={() => { if (suggestions.length) setShowSuggestions(true); }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              style={INP}
              onFocusCapture={e => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
              onBlurCapture={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            />
            {showSuggestions && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0,
                background: 'var(--bg1)', border: '1px solid var(--border2)',
                borderRadius: 8, zIndex: 999, marginTop: 3, overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0,0,0,.6)',
              }}>
                {suggestions.map(u => (
                  <div key={u.id} onMouseDown={() => addTag(u)} style={{
                    padding: '7px 10px', fontSize: 12,
                    fontFamily: 'var(--font-mono), monospace',
                    color: 'var(--t2)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 7,
                    borderBottom: '1px solid var(--border)',
                    transition: 'background .1s',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg2)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <span style={{
                      width: 20, height: 20, borderRadius: '50%',
                      background: u.color || 'var(--accent)',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, color: '#fff', fontWeight: 700, flexShrink: 0,
                    }}>
                      {u.initials || u.name?.[0]?.toUpperCase() || '?'}
                    </span>
                    {u.name}
                    <span style={{ fontSize: 10, color: 'var(--t4)', marginLeft: 'auto' }}>{u.role}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Message textarea */}
          <textarea
            ref={textareaRef}
            placeholder="Type your message..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={3}
            style={{ ...INP, resize: 'none', lineHeight: 1.5, fontFamily: 'var(--font-sans), sans-serif' }}
            onFocusCapture={e => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
            onBlurCapture={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
          />

          {/* Send */}
          {sent ? (
            <div style={{ textAlign: 'center', fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: 'var(--green)', padding: '5px 0' }}>
              ✓ Broadcast sent
            </div>
          ) : (
            <button
              onClick={handleSend}
              disabled={sending || !message.trim() || tagged.length === 0}
              style={{
                width: '100%', padding: '8px 0', borderRadius: 8, border: 'none',
                cursor: sending || !message.trim() || tagged.length === 0 ? 'not-allowed' : 'pointer',
                background: sending || !message.trim() || tagged.length === 0 ? 'var(--bg3)' : 'var(--accent)',
                color: sending || !message.trim() || tagged.length === 0 ? 'var(--t4)' : '#fff',
                fontFamily: 'var(--font-sans), sans-serif',
                fontWeight: 600, fontSize: 13,
                transition: 'all .15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              {sending ? (
                <>
                  <span className="spin" style={{ display: 'inline-block', fontSize: 12 }}>◌</span> Sending…
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                  Send Broadcast
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Admin-side: shows all sent broadcasts with per-recipient acknowledgement status */
function AdminBroadcastHistory() {
  const [threads, setThreads] = React.useState<any[]>([]);
  const [open, setOpen] = React.useState(true);
  const chatRef = React.useRef<HTMLDivElement>(null);

  const fmtTime = (s: string) => {
    const m = Math.floor((Date.now() - new Date(s).getTime()) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    if (m < 1440) return `${Math.floor(m / 60)}h ago`;
    return `${Math.floor(m / 1440)}d ago`;
  };

  const load = () => {
    fetch('/api/broadcast/sent')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setThreads(data); })
      .catch(() => {});
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { const t = setInterval(load, 30000); return () => clearInterval(t); }, []);

  if (threads.length === 0) return null;

  return (
    <div style={{ margin: '4px 7px 8px', display: 'flex', flexDirection: 'column' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--t3)', fontSize: 11, fontFamily: 'var(--font-mono), monospace', textTransform: 'uppercase', letterSpacing: '.05em', cursor: 'pointer', marginBottom: 5 }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          Sent ({threads.length})
        </span>
        <span style={{ fontSize: 9, opacity: .5 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div ref={chatRef} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden auto', maxHeight: 320, display: 'flex', flexDirection: 'column' }}>
          {threads.map((thread) => {
            const ackedCount = thread.recipients.filter((r: any) => r.acked).length;
            const total = thread.recipients.length;

            return (
              <div key={thread.broadcastId} style={{ borderBottom: '1px solid var(--border)', padding: '10px 11px 9px' }}>
                {/* Sent message bubble */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, marginBottom: 8 }}>
                  <div style={{ background: 'var(--accent)', borderRadius: '10px 0 10px 10px', padding: '7px 10px', fontSize: 13, color: '#fff', lineHeight: 1.5, maxWidth: '90%', alignSelf: 'flex-end' }}>
                    {thread.message}
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--t4)', fontFamily: 'var(--font-mono), monospace' }}>
                    {fmtTime(thread.sentAt)} · {ackedCount}/{total} replied
                  </span>
                </div>

                {/* Recipients with ack status */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {thread.recipients.map((r: any) => (
                    <div key={r.userId} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: r.color || 'var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                          {r.initials || r.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--t3)', fontFamily: 'var(--font-mono), monospace', flex: 1 }}>{r.name}</span>
                        {r.acked ? (
                          <span style={{ fontSize: 10, color: r.response === 'yes' ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--font-mono), monospace', fontWeight: 600 }}>
                            {r.response === 'yes' ? '✓ Yes' : '✕ No'}
                          </span>
                        ) : (
                          <span style={{ fontSize: 10, color: 'var(--t4)', fontFamily: 'var(--font-mono), monospace', fontStyle: 'italic' }}>pending</span>
                        )}
                      </div>
                      {/* Reply text if any */}
                      {r.replyText && (
                        <div style={{ marginLeft: 24, background: 'var(--bg3)', borderRadius: '0 8px 8px 8px', padding: '5px 8px', fontSize: 12, color: 'var(--t2)', lineHeight: 1.4 }}>
                          "{r.replyText}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EmployeeBroadcasts({ currentUserId }: { currentUserId: string }) {
  const [messages, setMessages] = React.useState<any[]>([]);
  const [replies, setReplies] = React.useState<Record<string, string>>({});
  const [sending, setSending] = React.useState<Record<string, boolean>>({});
  const [open, setOpen] = React.useState(true);
  const chatRef = React.useRef<HTMLDivElement>(null);

  const fmtTime = (s: string) => {
    const m = Math.floor((Date.now() - new Date(s).getTime()) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    if (m < 1440) return `${Math.floor(m / 60)}h ago`;
    return `${Math.floor(m / 1440)}d ago`;
  };

  const load = () => {
    fetch('/api/broadcast/active')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setMessages(data); })
      .catch(() => {});
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { const t = setInterval(load, 30000); return () => clearInterval(t); }, []);
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const sendReply = async (notifId: string) => {
    const text = replies[notifId]?.trim();
    if (!text) return;
    setSending(s => ({ ...s, [notifId]: true }));
    try {
      await fetch(`/api/broadcast/${notifId}/ack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: 'yes', replyText: text }),
      });
      setReplies(r => ({ ...r, [notifId]: '' }));
      load();
    } catch {}
    setSending(s => ({ ...s, [notifId]: false }));
  };

  if (messages.length === 0) return null;

  // Group messages by senderId — all broadcasts from same admin = one thread
  const sorted = [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const threadMap = new Map<string, { senderName: string; msgs: any[] }>();
  for (const msg of sorted) {
    const key = msg.senderId || msg.senderName || 'admin';
    if (!threadMap.has(key)) threadMap.set(key, { senderName: msg.senderName || 'Admin', msgs: [] });
    threadMap.get(key)!.msgs.push(msg);
  }
  const threads = Array.from(threadMap.entries());

  return (
    <div style={{ margin: '0 7px 8px', display: 'flex', flexDirection: 'column' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--t3)', fontSize: 11, fontFamily: 'var(--font-mono), monospace', textTransform: 'uppercase', letterSpacing: '.06em', cursor: 'pointer', marginBottom: 5 }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          Messages ({messages.length})
        </span>
        <span style={{ fontSize: 9 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div ref={chatRef} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden auto', maxHeight: 340, display: 'flex', flexDirection: 'column' }}>
          {threads.map(([senderId, thread]) => (
            <div key={senderId} style={{ borderBottom: '1px solid var(--border)', padding: '10px 10px 8px' }}>
              {/* Sender header — shown once per thread */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--t3)', flexShrink: 0 }}>
                  {thread.senderName.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono), monospace', color: 'var(--t4)', fontWeight: 600 }}>{thread.senderName}</span>
              </div>

              {/* All messages as sequential bubbles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, paddingLeft: 31 }}>
                {thread.msgs.map((msg, idx) => {
                  const myAck = msg.acknowledgedBy?.find((a: any) => a.userId === currentUserId);
                  const alreadyReplied = !!myAck;
                  const isLast = idx === thread.msgs.length - 1;

                  return (
                    <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {/* Admin bubble */}
                      <div style={{ alignSelf: 'flex-start', background: 'var(--bg3)', borderRadius: '0 10px 10px 10px', padding: '7px 10px', fontSize: 13, color: 'var(--t1)', lineHeight: 1.5, maxWidth: '90%' }}>
                        {msg.message}
                      </div>
                      <span style={{ fontSize: 10, color: 'var(--t4)', fontFamily: 'var(--font-mono), monospace' }}>{fmtTime(msg.createdAt)}</span>

                      {/* My reply bubble */}
                      {alreadyReplied && myAck.replyText && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginTop: 2 }}>
                          <div style={{ background: 'var(--accent)', borderRadius: '10px 0 10px 10px', padding: '6px 10px', fontSize: 13, color: '#fff', lineHeight: 1.5, maxWidth: '82%' }}>
                            {myAck.replyText}
                          </div>
                          <span style={{ fontSize: 10, color: 'var(--t4)', marginTop: 2, fontFamily: 'var(--font-mono), monospace' }}>✓ Sent</span>
                        </div>
                      )}
                      {alreadyReplied && !myAck.replyText && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <span style={{ fontSize: 10, color: 'var(--t4)', fontFamily: 'var(--font-mono), monospace', fontStyle: 'italic' }}>✓ Acknowledged</span>
                        </div>
                      )}

                      {/* Reply input — only on last unreplied message */}
                      {!alreadyReplied && isLast && (
                        <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginTop: 3 }}>
                          <input
                            value={replies[msg.id] || ''}
                            onChange={e => setReplies(r => ({ ...r, [msg.id]: e.target.value }))}
                            onKeyDown={e => { if (e.key === 'Enter') sendReply(msg.id); }}
                            placeholder="Reply..."
                            style={{ flex: 1, background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 20, padding: '5px 10px', fontSize: 12, color: 'var(--t1)', outline: 'none', fontFamily: 'var(--font-sans), sans-serif' }}
                          />
                          <button
                            onClick={() => sendReply(msg.id)}
                            disabled={sending[msg.id] || !replies[msg.id]?.trim()}
                            style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: !replies[msg.id]?.trim() ? 0.4 : 1 }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


export const Sidebar = ({ user, unreadNotifsCount, todayAttendance, earnings }: SidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const canCreate = true;
  const userRole = (user.role || 'employee').toLowerCase();
  const [loading, setLoading] = useState(false);
  const isClockedIn = !!todayAttendance?.clockIn;
  const isClockedOut = !!todayAttendance?.clockOut;

  const handleClockIn = async () => {
    setLoading(true);
    try {
      await clockIn();
      router.refresh();
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleClockOut = async () => {
    setLoading(true);
    try {
      await clockOut();
      router.refresh();
    } catch { /* ignore */ }
    setLoading(false);
  };
  
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  const nav = [
    { id: '/', l: 'Board', ic: '⊞' },
    { id: '/open-queue', l: 'Open Queue', ic: '◈' },
    { id: '/leaderboard', l: 'Leaderboard', ic: '☆' },
    { id: '/productivity', l: 'Productivity', ic: '◱' },
    { id: '/vault', l: 'Credential Locker', ic: '⎔' },
    ...( isAdmin ? [
      { id: '/admin/tracker', l: 'Activity Tracker', ic: '◫' },
      { id: '/admin', l: 'Admin Settings', ic: '⬡' }
    ] : [])
  ];

  return (
    <div style={{ width: 220, flexShrink: 0, background: 'var(--bg1)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'sticky', top: 0, alignSelf: 'flex-start' }}>
      <div style={{ padding: '15px 14px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 7 }}>
        <div style={{ width: 24, height: 24, background: 'var(--accent)', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans), sans-serif', fontWeight: 700, fontSize: 20, color: '#fff' }}>T</div>
        <span style={{ fontFamily: 'var(--font-sans), sans-serif', fontSize: 17, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-.2px' }}>TaskDock</span>
      </div>
      
      {/* START MY DAY / CLOCK IN-OUT */}
      {!isClockedIn && (
        <div style={{ margin: '10px 7px 0', padding: '14px', background: 'linear-gradient(135deg,#061A0E,#0D2818)', border: '1px solid var(--green)', borderRadius: 14, boxShadow: '0 4px 22px rgba(34,197,94,.18)' }} className="fu">
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono), monospace', color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 10 }}>◈ Good morning</div>
          <button onClick={handleClockIn} disabled={loading}
            style={{ width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'var(--green)', color: '#000', fontFamily: 'var(--font-sans), sans-serif', fontWeight: 800, fontSize: 16, letterSpacing: '-.2px', transition: 'all .15s', boxShadow: '0 2px 12px rgba(34,197,94,.35)' }}>
            {loading ? '◌ Starting…' : '▶ Start My Day'}
          </button>
        </div>
      )}

      {isClockedIn && !isClockedOut && (
        <div style={{ margin: '10px 7px 0', padding: '10px 14px', background: 'linear-gradient(135deg,#061A0E,#0D2818)', border: '1px solid var(--green)55', borderRadius: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono), monospace', color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 2 }}>● In session</div>
              <div style={{ fontSize: 14, fontFamily: 'var(--font-mono), monospace', color: 'var(--t2)', fontWeight: 600 }}>
                {new Date(todayAttendance.clockIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <button onClick={handleClockOut} disabled={loading}
              style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--red)66', background: 'var(--red-bg)', color: 'var(--red)', fontFamily: 'var(--font-sans), sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              {loading ? '◌' : '◼ End Day'}
            </button>
          </div>
        </div>
      )}

      {isClockedIn && isClockedOut && (
        <div style={{ margin: '10px 7px 0', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono), monospace', color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '.08em' }}>✓ Day complete</span>
            <span style={{ fontSize: 13, fontFamily: 'var(--font-mono), monospace', color: 'var(--t3)', fontWeight: 600 }}>
              {todayAttendance.hoursWorked ? `${todayAttendance.hoursWorked.toFixed(1)}h` : '—'}
            </span>
          </div>
          <button onClick={handleClockIn} disabled={loading}
            style={{ width: '100%', padding: '10px 14px', border: 'none', background: 'transparent', color: 'var(--t2)', fontFamily: 'var(--font-sans), sans-serif', fontWeight: 600, fontSize: 14, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6 }}>
            {loading ? '◌' : '↺'} Resume Day
          </button>
        </div>
      )}

      <nav style={{ flex: 1, padding: '8px 7px', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {canCreate && (
          <Link href="/create" style={{ textDecoration: 'none' }}>
            <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 11px', borderRadius: 11, border: 'none', cursor: 'pointer', background: 'var(--accent)', color: '#fff', fontFamily: 'var(--font-sans), sans-serif', fontWeight: 700, fontSize: 16, marginBottom: 8, boxShadow: '0 3px 16px rgba(255,79,0,.4)', transition: 'all .13s', letterSpacing: '-.1px' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#E04500'; e.currentTarget.style.boxShadow = '0 5px 24px rgba(255,79,0,.55)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 3px 16px rgba(255,79,0,.4)'; }}>
              <span style={{ fontSize: 14, lineHeight: 1, fontWeight: 300 }}>+</span>
              <span>Create Task</span>
            </button>
          </Link>
        )}
        
        {nav.map(item => {
          const isActive = pathname === item.id;
          return (
            <Link key={item.id} href={item.id} style={{ textDecoration: 'none' }}>
              <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 7, padding: '7px 9px', borderRadius: 7, border: 'none', cursor: 'pointer', background: isActive ? 'var(--accent-dim)' : 'transparent', color: isActive ? 'var(--accent)' : 'var(--t3)', transition: 'all .11s', fontFamily: 'var(--font-sans), sans-serif', fontWeight: isActive ? 600 : 400, fontSize: 15 }}>
                <span style={{ fontSize: 15, opacity: 0.85 }}>{item.ic}</span>
                <span>{item.l}</span>
              </button>
            </Link>
          );
        })}
      </nav>
      
      {/* BROADCAST PANEL — admin/superadmin only */}
      {isAdmin ? (
        <>
          <BroadcastPanel currentUserId={user.id} />
          <AdminBroadcastHistory />
        </>
      ) : (
        <EmployeeBroadcasts currentUserId={user.id} />
      )}

      {/* EARNINGS PROGRESS BAR */}
      {earnings && earnings.total > 0 && (
        <div style={{ margin: '0 7px 4px', padding: '10px 12px', background: 'linear-gradient(135deg,#0D1A24,#0A1420)', border: '1px solid var(--blue)44', borderRadius: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono), monospace', color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '.1em' }}>This month</div>
            {earnings.multiplier && earnings.multiplier !== 1 && (
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono), monospace', color: earnings.multiplier > 1 ? 'var(--green)' : 'var(--red)', background: earnings.multiplier > 1 ? 'var(--green-bg)' : 'var(--red-bg)', padding: '2px 5px', borderRadius: 4 }}>
                {earnings.multiplier}x Prod.
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
            <span style={{ fontFamily: 'var(--font-sans), sans-serif', fontWeight: 700, fontSize: 18, color: 'var(--blue)', lineHeight: 1 }}>₹{earnings.earned.toLocaleString('en-IN')}</span>
            <span style={{ fontSize: 13, fontFamily: 'var(--font-mono), monospace', color: 'var(--t4)' }}>of ₹{earnings.total.toLocaleString('en-IN')}</span>
          </div>
          <div style={{ height: 4, background: 'var(--bg4)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min((earnings.earned / earnings.total) * 100, 100)}%`, background: 'linear-gradient(90deg,var(--blue),#38BDF8)', borderRadius: 3, transition: 'width .6s ease' }} />
          </div>
        </div>
      )}

      <Link href="/leaderboard" style={{ textDecoration: 'none' }}>
        <div style={{ margin: '0 7px 8px', background: 'linear-gradient(135deg,#042F2E,#115E59)', border: '1px solid #0F766E', borderRadius: 12, padding: '10px 12px', cursor: 'pointer' }}>
          <div style={{ fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: '#2DD4BF', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 5 }}>My brownie points</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 15 }}>◆</span>
            <span style={{ fontFamily: 'var(--font-sans), sans-serif', fontWeight: 700, fontSize: 20, color: '#FCD34D', lineHeight: 1 }}>{user.browniePoints}</span>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: '#2DD4BF', lineHeight: 1.45, marginTop: 4 }}>pts</span>
          </div>
          <div style={{ fontSize: 15, color: '#14B8A6', fontFamily: 'var(--font-mono), monospace', marginTop: 4 }}>Finish before deadline → +1</div>
        </div>
      </Link>
    </div>
  );
};
