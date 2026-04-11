import React from 'react';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { calculateAllCPS } from "@/lib/cps";
import { Av } from "@/components/ui/Atoms";

export default async function ProductivityPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const rankings = await calculateAllCPS();

  return (
    <div style={{ padding: '30px 40px', maxWidth: 1000, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'var(--font-sans), sans-serif', fontSize: 24, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-.4px', marginBottom: 6 }}>Productivity Metrics</h1>
      <p style={{ fontSize: 14, color: 'var(--t3)', marginBottom: 24 }}>Composite Productivity Score (CPS) across all team members.</p>
      
      <div style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg2)', fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
              <th style={{ padding: '16px 20px', fontWeight: 600 }}>Rank</th>
              <th style={{ padding: '16px 20px', fontWeight: 600 }}>Employee</th>
              <th style={{ padding: '16px 20px', fontWeight: 600 }}>CF (Completion)</th>
              <th style={{ padding: '16px 20px', fontWeight: 600 }}>TF (Timeliness)</th>
              <th style={{ padding: '16px 20px', fontWeight: 600 }}>EF (Efficiency)</th>
              <th style={{ padding: '16px 20px', fontWeight: 600, textAlign: 'right' }}>CPS</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((r, i) => (
              <tr key={r.user.id} style={{ borderBottom: i < rankings.length - 1 ? '1px solid var(--border)' : 'none', background: i === 0 ? 'var(--accent)08' : 'transparent' }}>
                <td style={{ padding: '16px 20px', fontSize: 16, fontFamily: 'var(--font-mono), monospace', fontWeight: 600, color: i === 0 ? '#FCD34D' : i === 1 ? '#94A3B8' : i === 2 ? '#B45309' : 'var(--t4)' }}>
                  #{i + 1}
                </td>
                <td style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Av user={r.user as any} sz={36} />
                  <div>
                    <div style={{ fontFamily: 'var(--font-sans), sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--t1)' }}>{r.user.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--t4)' }}>{r.tasksCompleted} / {r.tasksAssigned} tasks</div>
                  </div>
                </td>
                <td style={{ padding: '16px 20px', fontFamily: 'var(--font-mono), monospace', fontSize: 14, color: 'var(--t1)' }}>{r.cf}</td>
                <td style={{ padding: '16px 20px', fontFamily: 'var(--font-mono), monospace', fontSize: 14, color: 'var(--t1)' }}>{r.tf}</td>
                <td style={{ padding: '16px 20px', fontFamily: 'var(--font-mono), monospace', fontSize: 14, color: 'var(--t1)' }}>{r.ef}</td>
                <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                  <div style={{ fontSize: 22, fontFamily: 'var(--font-mono), monospace', fontWeight: 700, color: 'var(--green)', letterSpacing: '-1px' }}>{r.cps > 0 ? r.cps : '—'}</div>
                </td>
              </tr>
            ))}
            {rankings.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--t4)', fontSize: 14 }}>No data available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
