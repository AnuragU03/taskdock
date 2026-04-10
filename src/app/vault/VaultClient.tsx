"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Toast, Av } from '@/components/ui/Atoms';
import { getCredentials, addCredential, updateCredential, deleteCredential } from '@/app/actions/vault';

export default function VaultClient({ members }: { members: any[] }) {
  const router = useRouter();
  const [creds, setCreds] = useState<any[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3000); };

  const [form, setForm] = useState({ toolName: '', toolUrl: '', loginEmail: '', loginPass: '', apiKey: '', assignedToId: '', renewalDate: '', monthlyCost: 0, notes: '' });

  const load = async () => {
    setLoading(true);
    try { setCreds(await getCredentials()); } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.toolName.trim()) { flash('Tool name is required'); return; }
    try {
      await addCredential({
        ...form,
        monthlyCost: Number(form.monthlyCost) || 0,
        assignedToId: form.assignedToId || undefined,
        renewalDate: form.renewalDate || undefined
      });
      flash('✅ Credential saved');
      setShowAdd(false);
      setForm({ toolName: '', toolUrl: '', loginEmail: '', loginPass: '', apiKey: '', assignedToId: '', renewalDate: '', monthlyCost: 0, notes: '' });
      load();
    } catch { flash('❌ Error saving'); }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCredential(id);
      flash('Credential deleted');
      load();
    } catch { flash('Error deleting'); }
  };

  const toggleReveal = (id: string) => {
    setRevealed(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const totalCost = creds.reduce((sum, c) => sum + (c.monthlyCost || 0), 0);

  const mask = (val: string | null) => val ? '•'.repeat(Math.min(val.length, 20)) : '—';

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
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono), monospace', color: 'var(--accent)' }}>₹{totalCost.toLocaleString('en-IN')}</div>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono), monospace', color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '.1em' }}>Monthly Cost</div>
          </div>
          <button onClick={() => setShowAdd(!showAdd)} className="bp">{showAdd ? 'Cancel' : '+ Add Tool'}</button>
        </div>
      </div>

      {showAdd && (
        <div style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 20 }} className="fu">
          <div style={{ fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 14 }}>Add New Tool / Credential</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
            <input className="inp" placeholder="Tool Name *" value={form.toolName} onChange={e => setForm({ ...form, toolName: e.target.value })} />
            <input className="inp" placeholder="URL (e.g. figma.com)" value={form.toolUrl} onChange={e => setForm({ ...form, toolUrl: e.target.value })} />
            <select className="inp" value={form.assignedToId} onChange={e => setForm({ ...form, assignedToId: e.target.value })}>
              <option value="">Assigned To (optional)</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
            <input className="inp" placeholder="Login Email" value={form.loginEmail} onChange={e => setForm({ ...form, loginEmail: e.target.value })} />
            <input className="inp" type="password" placeholder="Password" value={form.loginPass} onChange={e => setForm({ ...form, loginPass: e.target.value })} />
            <input className="inp" placeholder="API Key (optional)" value={form.apiKey} onChange={e => setForm({ ...form, apiKey: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
            <input className="inp" type="date" placeholder="Renewal Date" value={form.renewalDate} onChange={e => setForm({ ...form, renewalDate: e.target.value })} />
            <input className="inp" type="number" placeholder="Monthly Cost (₹)" value={form.monthlyCost || ''} onChange={e => setForm({ ...form, monthlyCost: Number(e.target.value) })} />
            <input className="inp" placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <button onClick={handleAdd} className="bp">Save Credential →</button>
        </div>
      )}

      <div style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.5fr 1fr .8fr .5fr', padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg2)', fontSize: 11, fontFamily: 'var(--font-mono), monospace', color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '.1em' }}>
          <div>Tool</div><div>User</div><div>Credentials</div><div>Renewal</div><div>Cost/mo</div><div></div>
        </div>

        {loading && <div style={{ padding: 40, textAlign: 'center', color: 'var(--t4)', fontSize: 14 }}>Loading...</div>}

        {!loading && creds.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--t4)', fontSize: 14 }}>No credentials stored yet. Click "+ Add Tool" to start.</div>
        )}

        {creds.map(c => {
          const isRevealed = revealed.has(c.id);
          return (
            <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.5fr 1fr .8fr .5fr', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--t1)' }}>{c.toolName}</div>
                {c.toolUrl && <div style={{ fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: 'var(--t4)', marginTop: 2 }}>{c.toolUrl}</div>}
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
                <div style={{ fontSize: 13, color: 'var(--t2)', fontFamily: 'var(--font-mono), monospace' }}>
                  {c.loginEmail || '—'}
                </div>
                <div style={{ fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: 'var(--t3)', marginTop: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => toggleReveal(c.id)}>
                  <span>{isRevealed ? (c.loginPass || '—') : mask(c.loginPass)}</span>
                  <span style={{ fontSize: 10, color: 'var(--accent)', textDecoration: 'underline' }}>{isRevealed ? 'Hide' : 'Show'}</span>
                </div>
              </div>
              <div>
                {c.renewalDate ? (
                  <span style={{ fontSize: 13, fontFamily: 'var(--font-mono), monospace', color: new Date(c.renewalDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? 'var(--red)' : 'var(--t2)' }}>
                    {c.renewalDate}
                  </span>
                ) : <span style={{ fontSize: 13, color: 'var(--t4)' }}>—</span>}
              </div>
              <div style={{ fontSize: 14, fontFamily: 'var(--font-mono), monospace', fontWeight: 600, color: c.monthlyCost > 0 ? 'var(--accent)' : 'var(--t4)' }}>
                {c.monthlyCost > 0 ? `₹${c.monthlyCost.toLocaleString('en-IN')}` : 'Free'}
              </div>
              <div>
                <button onClick={() => handleDelete(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--red)', opacity: 0.6 }} title="Delete">✕</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
