"use client";

import React from 'react';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg0)', display: 'flex' }}>
      <div style={{ width: 420, flexShrink: 0, background: 'var(--bg1)', display: 'flex', flexDirection: 'column', padding: '44px 48px', justifyContent: 'space-between', borderRight: '1px solid var(--border)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 52 }}>
            <div style={{ width: 28, height: 28, background: 'var(--accent)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans), sans-serif', fontWeight: 700, fontSize: 20, color: '#fff' }}>T</div>
            <span style={{ fontFamily: 'var(--font-sans), sans-serif', fontSize: 15, fontWeight: 600, color: 'var(--t1)', letterSpacing: '-.2px' }}>TaskDock</span>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: 'var(--t4)', letterSpacing: '.12em', textTransform: 'uppercase', marginLeft: 2 }}>Creative OS</span>
          </div>
          <p style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 13, color: 'var(--t4)', letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 16 }}>Built for creative teams</p>
          <h1 style={{ fontFamily: 'var(--font-sans), sans-serif', fontSize: 48, fontWeight: 700, color: 'var(--t1)', lineHeight: 0.9, letterSpacing: '-1px', marginBottom: 20 }}>
            Brief in.<br />Work done.<br />
            <span style={{ color: 'var(--accent)', fontStyle: 'italic' }}>Output out.</span>
          </h1>
          <p style={{ color: 'var(--t3)', fontSize: 13, lineHeight: 1.9, fontWeight: 300, maxWidth: 300 }}>
            Every creative brief, reference, countdown, deliverable, and approval — in one place.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 28 }}>
          {[
            ['9', 'tasks'],
            ['2d', 'default deadline'],
            ['⏱', 'live countdowns']
          ].map(([n, l]) => (
            <div key={l}>
              <div style={{ fontFamily: 'var(--font-sans), sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--t1)', lineHeight: 1 }}>{n}</div>
              <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 13, color: 'var(--t4)', marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
        <div style={{ width: '100%', maxWidth: 340 }}>
          <h2 style={{ fontFamily: 'var(--font-sans), sans-serif', fontSize: 24, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-.2px', marginBottom: 5 }}>Sign In</h2>
          <p style={{ color: 'var(--t3)', fontSize: 14, marginBottom: 32 }}>Access your workspace and tasks.</p>
          
          <button 
            onClick={() => signIn('google', { callbackUrl: '/' })} 
            className="bp" 
            style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 16, borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}
