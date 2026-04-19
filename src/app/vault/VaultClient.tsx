"use client";

import React, { useState, useEffect } from 'react';
import { Toast, Av } from '@/components/ui/Atoms';
import { getCredentials, addCredential, updateCredential, deleteCredential, shareCredential, revokeCredential } from '@/app/actions/vault';

const BLANK = { toolName: '', toolUrl: '', loginEmail: '', loginPass: '', apiKey: '', assignedToId: '', renewalDate: '', monthlyCost: 0, billingCycle: 'monthly', notes: '' };

// ── CredForm is defined OUTSIDE VaultClient to prevent remounting on every keystroke ──
function CredForm({ f, setF, onSave, onCancel, saveLabel, members, savedEmails }: {
  f: any; setF: (v: any) => void; onSave: () => void; onCancel: () => void;
  saveLabel: string; members: any[]; savedEmails: string[];
}) {
  const [showEmailList, setShowEmailList] = useState(false);
  const filteredEmails = savedEmails.filter(e => e.toLowerCase().includes(f.loginEmail?.toLowerCase() || ''));

  return (
    <div style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 20 }} className="fu">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
        <input className="inp" placeholder="Tool Name *" value={f.toolName} onChange={e => setF({ ...f, toolName: e.target.value })} />
        <input className="inp" placeholder="URL (e.g. figma.com)" value={f.toolUrl} onChange={e => setF({ ...f, toolUrl: e.target.value })} />
        <select className="inp" value={f.assignedToId} onChange={e => setF({ ...f, assignedToId: e.target.value })}>
          <option value="">Assigned To (optional)</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
        {/* Email with saved suggestions */}
        <div style={{ position: 'relative' }}>
          <input
            className="inp"
            placeholder="Login Email"
            value={f.loginEmail}
            autoComplete="off"
            onFocus={() => setShowEmailList(true)}
            onBlur={() => setTimeout(() => setShowEmailList(false), 150)}
            onChange={e => setF({ ...f, loginEmail: e.target.value })}
          />
          {showEmailList && filteredEmails.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, zIndex: 100, marginTop: 4, overflow: 'hidden' }}>
              {filteredEmails.map(email => (
                <div
                  key={email}
                  onMouseDown={() => { setF({ ...f, loginEmail: email }); setShowEmailList(false); }}
                  style={{ padding: '8px 12px', fontSize: 13, fontFamily: 'var(--font-mono), monospace', color: 'var(--t2)', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg3)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {email}
                </div>
              ))}
            </div>
          )}
        </div>
        <input className="inp" type="password" placeholder="Password" value={f.loginPass} autoComplete="new-password" onChange={e => setF({ ...f, loginPass: e.target.value })} />
        <input className="inp" placeholder="API Key (optional)" value={f.apiKey} onChange={e => setF({ ...f, apiKey: e.target.value })} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 120px', gap: 10, marginBottom: 14 }}>
        <input className="inp" type="date" value={f.renewalDate} onChange={e => setF({ ...f, renewalDate: e.target.value })} />
        <input className="inp" type="number" placeholder="Cost (₹)" value={f.monthlyCost || ''} onChange={e => setF({ ...f, monthlyCost: Number(e.target.value) })} />
        <input className="inp" placeholder="Notes" value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} />
        <select className="inp" value={f.billingCycle} onChange={e => setF({ ...f, billingCycle: e.target.value })}>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onSave} className="bp">{saveLabel}</button>
        <button onClick={onCancel} className="bg">Cancel</button>
      </div>
    </div>
  );
}

export default function VaultClient({ members }: { members: any[] }) {
  const [creds, setCreds] = useState<any[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [shareId, setShareId] = useState<string | null>(null);
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3000); };

  const [form, setForm] = useState({ ...BLANK });
  const [editForm, setEditForm] = useState({ ...BLANK });

  const load = async () => {
    setLoading(true);
    try { setCreds(await getCredentials()); } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Collect all saved emails from existing credentials for the dropdown suggestion
  const savedEmails = Array.from(new Set(creds.map(c => c.loginEmail).filter(Boolean)));

  const handleAdd = async () => {
    if (!form.toolName.trim()) { flash('Tool name is required'); return; }
    try {
      await addCredential({ ...form, monthlyCost: Number(form.monthlyCost) || 0, assignedToId: form.assignedToId || undefined, renewalDate: form.renewalDate || undefined });
      flash('Credential saved');
      setShowAdd(false);
      setForm({ ...BLANK });
      load();
    } catch { flash('Error saving'); }
  };

  const handleEditSave = async (id: string) => {
    try {
      await updateCredential(id, { ...editForm, monthlyCost: Number(editForm.monthlyCost) || 0, assignedToId: editForm.assignedToId || undefined, renewalDate: editForm.renewalDate || undefined });
      flash('Credential updated');
      setEditId(null);
      load();
    } catch { flash('Error updating'); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteCredential(id); flash('Deleted'); load(); } catch { flash('Error deleting'); }
  };

  const handleShare = async (credId: string, userId: string) => {
    try { await shareCredential(credId, userId); flash('Shared'); load(); } catch { flash('Error sharing'); }
  };

  const handleRevoke = async (credId: string, userId: string) => {
    try { await revokeCredential(credId, userId); flash('Revoked'); load(); } catch { flash('Error revoking'); }
  };

  const toggleReveal = (id: string) => {
    setRevealed(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const startEdit = (c: any) => {
    setEditId(c.id);
    setEditForm({ toolName: c.toolName || '', toolUrl: c.toolUrl || '', loginEmail: c.loginEmail || '', loginPass: c.loginPass || '', apiKey: c.apiKey || '', assignedToId: c.assignedToId || '', renewalDate: c.renewalDate || '', monthlyCost: c.monthlyCost || 0, billingCycle: c.billingCycle || 'monthly', notes: c.notes || '' });
  };

  const totalMonthly = creds.reduce((sum, c) => {
    const cost = c.monthlyCost || 0;
    return sum + (c.billingCycle === 'yearly' ? cost / 12 : cost);
  }, 0);

  const mask = (val: string | null) => val ? '•'.repeat(Math.min(val.length, 20)) : '—';

  const shareCred = shareId ? creds.find(c => c.id === shareId) : null;
  const sharedIds: string[] = shareCred?.sharedWith ? JSON.parse(shareCred.sharedWith) : [];

  return (
    <div style={{ padding: '30px 40px', maxWidth: 1100, margin: '0 auto' }}>
      <Toast msg={toast} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-sans), sans-serif', fontSize: 24, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-.4px', marginBottom: 4 }}>Credential Locker</h1>
          <p style={{ fontSize: 14, color: 'var(--t3)' }}>Secure storage for company tools, passwords, and subscriptions.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono), monospace', color: 'var(--accent)' }}>₹{Math.round(totalMonthly).toLocaleString('en-IN')}</div>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono), monospace', color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '.1em' }}>Eff. Monthly Cost</div>
          </div>
          <button onClick={() => { setShowAdd(!showAdd); setEditId(null); }} className="bp">{showAdd ? 'Cancel' : '+ Add Tool'}</button>
        </div>
      </div>

      {showAdd && (
        <CredForm
          f={form} setF={setForm}
          onSave={handleAdd}
          onCancel={() => setShowAdd(false)}
          saveLabel="Save Credential →"
          members={members}
          savedEmails={savedEmails}
        />
      )}

      {/* Share Modal */}
      {shareId && shareCred && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setShareId(null)}>
          <div style={{ background: 'var(--bg1)', padding: 28, borderRadius: 16, border: '1px solid var(--border)', width: '100%', maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--t1)' }}>Share: {shareCred.toolName}</div>
              <button onClick={() => setShareId(null)} style={{ border: 'none', background: 'transparent', fontSize: 20, color: 'var(--t4)', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {members.map(m => {
                const isShared = sharedIds.includes(m.id);
                return (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: isShared ? 'rgba(16,185,129,.06)' : 'var(--bg2)', borderRadius: 8, border: `1px solid ${isShared ? 'var(--green)33' : 'var(--border)'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Av user={m} sz={28} />
                      <span style={{ fontSize: 14, color: 'var(--t1)' }}>{m.name}</span>
                    </div>
                    {isShared ? (
                      <button onClick={() => handleRevoke(shareId, m.id)} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--red)44', background: 'var(--red-bg)', color: 'var(--red)', cursor: 'pointer' }}>Revoke</button>
                    ) : (
                      <button onClick={() => handleShare(shareId, m.id)} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--green)44', background: 'var(--green-bg)', color: 'var(--green)', cursor: 'pointer' }}>Share</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.5fr 1fr .8fr .8fr .5fr', padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg2)', fontSize: 11, fontFamily: 'var(--font-mono), monospace', color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '.1em' }}>
          <div>Tool</div><div>User</div><div>Credentials</div><div>Renewal</div><div>Cost</div><div>Shared</div><div></div>
        </div>

        {loading && <div style={{ padding: 40, textAlign: 'center', color: 'var(--t4)', fontSize: 14 }}>Loading...</div>}
        {!loading && creds.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: 'var(--t4)', fontSize: 14 }}>No credentials stored yet. Click &quot;+ Add Tool&quot; to start.</div>}

        {creds.map(c => {
          const isRevealed = revealed.has(c.id);
          const isEditing = editId === c.id;
          const sharedUserIds: string[] = c.sharedWith ? JSON.parse(c.sharedWith) : [];
          const effCost = c.billingCycle === 'yearly' ? (c.monthlyCost / 12) : c.monthlyCost;

          if (isEditing) return (
            <div key={c.id} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono), monospace', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10 }}>Editing: {c.toolName}</div>
              <CredForm
                f={editForm} setF={setEditForm}
                onSave={() => handleEditSave(c.id)}
                onCancel={() => setEditId(null)}
                saveLabel="Save Changes"
                members={members}
                savedEmails={savedEmails}
              />
            </div>
          );

          return (
            <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.5fr 1fr .8fr .8fr .5fr', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--t1)' }}>{c.toolName}</div>
                {c.toolUrl && <div style={{ fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: 'var(--t4)', marginTop: 2 }}>{c.toolUrl}</div>}
                <div style={{ display: 'inline-block', marginTop: 4, fontSize: 10, padding: '2px 6px', borderRadius: 4, background: c.billingCycle === 'yearly' ? 'rgba(59,130,246,.12)' : 'rgba(16,185,129,.08)', color: c.billingCycle === 'yearly' ? 'var(--blue)' : 'var(--green)', fontFamily: 'var(--font-mono), monospace', textTransform: 'uppercase', letterSpacing: '.06em' }}>{c.billingCycle}</div>
              </div>
              <div>
                {c.assignedTo ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Av user={c.assignedTo} sz={28} />
                    <span style={{ fontSize: 13, color: 'var(--t2)' }}>{c.assignedTo.name}</span>
                  </div>
                ) : <span style={{ fontSize: 13, color: 'var(--t4)' }}>—</span>}
              </div>
              <div>
                <div style={{ fontSize: 13, color: 'var(--t2)', fontFamily: 'var(--font-mono), monospace' }}>{c.loginEmail || '—'}</div>
                <div style={{ fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: 'var(--t3)', marginTop: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => toggleReveal(c.id)}>
                  <span>{isRevealed ? (c.loginPass || '—') : mask(c.loginPass)}</span>
                  <span style={{ fontSize: 10, color: 'var(--accent)', textDecoration: 'underline' }}>{isRevealed ? 'Hide' : 'Show'}</span>
                </div>
              </div>
              <div>
                {c.renewalDate ? (
                  <span style={{ fontSize: 13, fontFamily: 'var(--font-mono), monospace', color: new Date(c.renewalDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? 'var(--red)' : 'var(--t2)' }}>{c.renewalDate}</span>
                ) : <span style={{ fontSize: 13, color: 'var(--t4)' }}>—</span>}
              </div>
              <div>
                <div style={{ fontSize: 14, fontFamily: 'var(--font-mono), monospace', fontWeight: 600, color: effCost > 0 ? 'var(--accent)' : 'var(--t4)' }}>
                  {effCost > 0 ? `₹${Math.round(effCost).toLocaleString('en-IN')}` : 'Free'}
                </div>
                {c.billingCycle === 'yearly' && c.monthlyCost > 0 && (
                  <div style={{ fontSize: 10, color: 'var(--t4)', fontFamily: 'var(--font-mono), monospace' }}>₹{c.monthlyCost.toLocaleString('en-IN')} /yr</div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {sharedUserIds.slice(0, 3).map(uid => {
                  const m = members.find(x => x.id === uid);
                  return m ? <Av key={uid} user={m} sz={22} /> : null;
                })}
                {sharedUserIds.length > 3 && <span style={{ fontSize: 11, color: 'var(--t4)' }}>+{sharedUserIds.length - 3}</span>}
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button onClick={() => startEdit(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--t3)', lineHeight: 1, padding: '2px' }} title="Edit">✎</button>
                <button onClick={() => setShareId(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', lineHeight: 1, padding: '2px', display: 'flex', alignItems: 'center' }} title="Share">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
                <button onClick={() => handleDelete(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--red)', opacity: 0.6, lineHeight: 1, padding: '2px' }} title="Delete">✕</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
