"use client";

import React, { useState } from 'react';
import { Toast } from '@/components/ui/Atoms';

export default function SharedVaultClient({ creds }: { creds: any[] }) {
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2500); };

  const toggleReveal = (id: string) => {
    setRevealed(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const copyToClipboard = (val: string, label: string) => {
    navigator.clipboard.writeText(val).then(() => flash(`${label} copied!`)).catch(() => flash('Failed to copy'));
  };

  const mask = (val: string | null) => val ? '•'.repeat(Math.min(val.length, 20)) : '—';

  return (
    <div style={{ padding: '30px 40px', maxWidth: 900, margin: '0 auto' }}>
      <Toast msg={toast} />

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-sans), sans-serif', fontSize: 24, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-.4px', marginBottom: 6 }}>
          Credential Locker
        </h1>
        <p style={{ fontSize: 14, color: 'var(--t3)' }}>
          Credentials shared with you by your admin.
        </p>
      </div>

      {creds.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 14 }}>
          <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.4 }}>⊔</div>
          <div style={{ fontSize: 15, color: 'var(--t3)', fontFamily: 'var(--font-mono), monospace' }}>
            No credentials shared with you yet.
          </div>
          <div style={{ fontSize: 13, color: 'var(--t4)', marginTop: 6 }}>
            Your admin will share tools you need access to.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {creds.map(c => {
            const isRevealed = revealed.has(c.id);
            const daysUntilRenewal = c.renewalDate
              ? Math.ceil((new Date(c.renewalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : null;
            const isExpiring = daysUntilRenewal !== null && daysUntilRenewal <= 7;
            const isExpired = daysUntilRenewal !== null && daysUntilRenewal <= 0;

            return (
              <div key={c.id} style={{
                background: 'var(--bg1)',
                border: `1px solid ${isExpired ? 'var(--red)44' : isExpiring ? 'var(--amber)44' : 'var(--border)'}`,
                borderRadius: 14,
                overflow: 'hidden',
              }}>
                {/* Header */}
                <div style={{ padding: '14px 20px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'var(--t2)', border: '1px solid var(--border)', fontFamily: 'var(--font-mono), monospace' }}>
                      {(c.toolName || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--t1)' }}>{c.toolName}</div>
                      {c.toolUrl && (
                        <a href={c.toolUrl.startsWith('http') ? c.toolUrl : `https://${c.toolUrl}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: 'var(--accent)', textDecoration: 'none' }}>
                          {c.toolUrl} ↗
                        </a>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isExpired && (
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono), monospace', background: 'var(--red-bg)', border: '1px solid var(--red)44', color: 'var(--red)', padding: '3px 8px', borderRadius: 6 }}>
                        ⚠ EXPIRED
                      </span>
                    )}
                    {!isExpired && isExpiring && (
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono), monospace', background: 'var(--amber-bg)', border: '1px solid var(--amber)44', color: 'var(--amber)', padding: '3px 8px', borderRadius: 6 }}>
                        ◷ Expires in {daysUntilRenewal}d
                      </span>
                    )}
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: c.billingCycle === 'yearly' ? 'rgba(59,130,246,.12)' : 'rgba(16,185,129,.08)', color: c.billingCycle === 'yearly' ? 'var(--blue)' : 'var(--green)', fontFamily: 'var(--font-mono), monospace', textTransform: 'uppercase' }}>
                      {c.billingCycle}
                    </span>
                  </div>
                </div>

                {/* Credentials body */}
                <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                  {c.loginEmail && (
                    <div>
                      <div style={{ fontSize: 10, fontFamily: 'var(--font-mono), monospace', color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 5 }}>Email / Username</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontFamily: 'var(--font-mono), monospace', color: 'var(--t2)' }}>{c.loginEmail}</span>
                        <button onClick={() => copyToClipboard(c.loginEmail, 'Email')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--t4)', padding: 0 }} title="Copy">⊕</button>
                      </div>
                    </div>
                  )}

                  {c.loginPass && (
                    <div>
                      <div style={{ fontSize: 10, fontFamily: 'var(--font-mono), monospace', color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 5 }}>Password</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontFamily: 'var(--font-mono), monospace', color: 'var(--t2)', letterSpacing: isRevealed ? 'normal' : '.2em' }}>
                          {isRevealed ? c.loginPass : mask(c.loginPass)}
                        </span>
                        <button onClick={() => toggleReveal(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--accent)', textDecoration: 'underline', padding: 0 }}>
                          {isRevealed ? 'Hide' : 'Show'}
                        </button>
                        {isRevealed && (
                          <button onClick={() => copyToClipboard(c.loginPass, 'Password')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--t4)', padding: 0 }} title="Copy">⊕</button>
                        )}
                      </div>
                    </div>
                  )}

                  {c.apiKey && (
                    <div>
                      <div style={{ fontSize: 10, fontFamily: 'var(--font-mono), monospace', color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 5 }}>API Key</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontFamily: 'var(--font-mono), monospace', color: 'var(--t2)', letterSpacing: isRevealed ? 'normal' : '.2em' }}>
                          {isRevealed ? c.apiKey : mask(c.apiKey)}
                        </span>
                        {isRevealed && (
                          <button onClick={() => copyToClipboard(c.apiKey, 'API Key')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--t4)', padding: 0 }} title="Copy">⊕</button>
                        )}
                      </div>
                    </div>
                  )}

                  {c.renewalDate && (
                    <div>
                      <div style={{ fontSize: 10, fontFamily: 'var(--font-mono), monospace', color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 5 }}>Renewal Date</div>
                      <div style={{ fontSize: 14, fontFamily: 'var(--font-mono), monospace', color: isExpired ? 'var(--red)' : isExpiring ? 'var(--amber)' : 'var(--t2)', fontWeight: 600 }}>{c.renewalDate}</div>
                    </div>
                  )}

                  {c.notes && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: 10, fontFamily: 'var(--font-mono), monospace', color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 5 }}>Notes</div>
                      <div style={{ fontSize: 13, color: 'var(--t3)', lineHeight: 1.6 }}>{c.notes}</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
