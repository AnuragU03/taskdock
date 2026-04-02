"use client";

import React, { useState } from 'react';
import { Av, Toast } from '@/components/ui/Atoms';
import { updateUserRole } from '@/app/actions/admin';

export default function AdminClient({ members }: { members: any[] }) {
  const [toast, setToast] = useState<string | null>(null);
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2400); };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateUserRole(userId, newRole);
      flash(`Role updated to ${newRole}`);
    } catch {
      flash('Failed to update role');
    }
  };

  return (
    <div style={{ padding: '30px 40px', maxWidth: 900, margin: '0 auto' }}>
      <Toast msg={toast} />
      <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 24, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-.4px', marginBottom: 6 }}>Workspace Settings</h1>
      <p style={{ fontSize: 14, color: 'var(--t3)', marginBottom: 24 }}>Manage members, roles, and permissions.</p>

      <div style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg2)', fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '.1em' }}>
          <div>Member</div>
          <div>Points</div>
          <div>Role</div>
        </div>
        
        {members.map(u => (
          <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Av user={u} sz={40} />
              <div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--t1)' }}>{u.name}</div>
                <div style={{ fontSize: 13, color: 'var(--t4)', marginTop: 2 }}>{u.email}</div>
              </div>
            </div>
            <div style={{ fontSize: 16, fontFamily: 'DM Mono, monospace', color: 'var(--accent)', fontWeight: 600 }}>
              {u.browniePoints}
            </div>
            <div>
              <select 
                className="inp" 
                defaultValue={u.role} 
                onChange={e => handleRoleChange(u.id, e.target.value)}
                style={{ padding: '6px 10px', fontSize: 14, minHeight: 0 }}
              >
                <option value="employee">Creative / Employee</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: 24, padding: 20, background: 'var(--purple-bg)', borderRadius: 12, border: '1px solid var(--purple)33' }}>
        <h3 style={{ fontSize: 15, fontFamily: 'DM Sans, sans-serif', fontWeight: 600, color: 'var(--purple)', marginBottom: 6 }}>Role Capabilities</h3>
        <ul style={{ fontSize: 13, color: 'var(--purple)', opacity: 0.8, lineHeight: 1.8, paddingLeft: 18, margin: 0 }}>
          <li><strong>Admin:</strong> Can create review tasks, approve/reject submissions, and manage user roles.</li>
          <li><strong>Manager:</strong> Can create assigned tasks and view all queues.</li>
          <li><strong>Creative:</strong> Can pick up open tasks, submit work, and view their assigned queue.</li>
        </ul>
      </div>
    </div>
  );
}
