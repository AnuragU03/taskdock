"use client";

import React, { useState } from 'react';

export const DLPick = ({ value, onChange }: { value: string | null; onChange: (v: string) => void }) => {
  const [custom, setCustom] = useState(false);
  
  const PRESET = [
    { l: '2 hrs', h: 2 },
    { l: '4 hrs', h: 4 },
    { l: '1 day', h: 24 },
    { l: '2 days', h: 48 },
    { l: '1 week', h: 168 },
    { l: 'Custom', h: null }
  ];
  
  const mkISO = (h: number) => {
    const d = new Date();
    d.setHours(d.getHours() + h);
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  };
  
  const setP = (h: number | null) => {
    if (h === null) {
      setCustom(true);
      return;
    }
    setCustom(false);
    onChange(mkISO(h));
  };
  
  const active = (p: any) => p.h !== null && !custom && value === mkISO(p.h);
  
  const formattedDate = value ? new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
  
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 6 }}>
        {PRESET.map(p => (
          <button 
            key={p.l} 
            type="button" 
            onClick={() => setP(p.h)} 
            style={{ 
              padding: '5px 11px', borderRadius: 120, 
              border: `1px solid ${(active(p) || (p.h === null && custom)) ? 'var(--accent)' : 'var(--border)'}`, 
              background: (active(p) || (p.h === null && custom)) ? 'var(--accent-dim)' : 'var(--bg2)', 
              color: (active(p) || (p.h === null && custom)) ? 'var(--accent)' : 'var(--t3)', 
              fontSize: 13, fontFamily: 'DM Sans, sans-serif', fontWeight: 500, cursor: 'pointer', transition: 'all .11s' 
            }}
          >
            {p.l}
          </button>
        ))}
      </div>
      {(custom || !PRESET.some(active)) && (
        <input 
          type="datetime-local" 
          className="inp" 
          value={value || ''} 
          onChange={e => onChange(e.target.value)} 
        />
      )}
      {value && !custom && (
        <div style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--t3)', marginTop: 4 }}>
          → {formattedDate}
        </div>
      )}
    </div>
  );
};

export const AiBrief = ({ title, category, onApply }: { title: string; category?: string; onApply: (v: string) => void }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  
  const gen = async () => {
    if (!title.trim()) return;
    setLoading(true);
    setResult('');
    try {
      // Stub for actual API call, replace with Next.js Server Action later
      const res = await fetch('/api/ai/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category })
      });
      if (res.ok) {
        const d = await res.json();
        setResult(d.brief || '');
      } else {
        throw new Error('Failed');
      }
    } catch {
      setResult('Could not generate right now. Write the brief manually.');
    }
    setLoading(false);
  };
  
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', gap: 7, marginBottom: result ? 8 : 0 }}>
        <button 
          type="button" 
          onClick={gen} 
          disabled={loading || !title.trim()} 
          style={{ 
            padding: '6px 12px', borderRadius: 8, 
            border: `1px solid ${title.trim() ? 'var(--accent)' : 'var(--border)'}`, 
            background: title.trim() ? 'var(--accent-dim)' : 'var(--bg3)', 
            color: title.trim() ? 'var(--accent)' : 'var(--t4)', 
            fontSize: 13, fontFamily: 'DM Sans, sans-serif', fontWeight: 500, 
            cursor: title.trim() ? 'pointer' : 'not-allowed', 
            display: 'flex', alignItems: 'center', gap: 5, transition: 'all .12s' 
          }}
        >
          <span className={loading ? 'spin' : ''}>{loading ? '◌' : '✦'}</span>
          {loading ? 'Generating…' : 'AI brief'}
        </button>
        {result && (
          <button 
            type="button" 
            onClick={() => onApply(result)} 
            style={{ 
              padding: '6px 12px', borderRadius: 8, border: '1px solid var(--green)44', 
              background: 'var(--green-bg)', color: 'var(--green)', fontSize: 13, 
              fontFamily: 'DM Sans, sans-serif', fontWeight: 500, cursor: 'pointer' 
            }}
          >
            Use ↗
          </button>
        )}
      </div>
      {result && (
        <div className="fu" style={{ padding: '10px 12px', background: 'var(--accent-dim)', border: '1px solid var(--accent)33', borderRadius: 8, fontSize: 15, color: 'var(--t2)', lineHeight: 1.755 }}>
          {result}
        </div>
      )}
    </div>
  );
};
