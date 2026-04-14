"use client";

import React from 'react';
import { updateProdShift } from '@/app/actions/attendance';

export default function TrackerGrid({ users, days, year, month }: any) {
  
  const handleUpdate = async (userId: string, date: string, shift: 'morning' | 'afternoon', value: string) => {
    try {
      await updateProdShift(userId, date, shift, value || null);
    } catch {
      alert("Failed to update status.");
    }
  };

  return (
    <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg1)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: 13 }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid var(--border)', padding: 12, minWidth: 100, borderLeft: 'none', borderTop: 'none', background: 'var(--bg2)' }}>{new Date(year, month-1).toLocaleString('default', { month: 'long' })}</th>
            {users.map((u: any) => (
              <th key={u.id} colSpan={3} style={{ border: '1px solid var(--border)', padding: '12px', borderTop: 'none', background: 'var(--bg2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: u.color || 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{u.initials || u.name[0]}</div>
                  {u.name}
                </div>
              </th>
            ))}
          </tr>
          <tr>
            <th style={{ border: '1px solid var(--border)', padding: 8, borderLeft: 'none', background: 'var(--bg2)' }}>Date</th>
            {users.map((u: any) => (
              <React.Fragment key={u.id}>
                <th style={{ border: '1px solid var(--border)', padding: '6px 8px', fontWeight: 600, fontSize: 11, background: 'var(--bg2)', color: 'var(--t3)' }}>Morning</th>
                <th style={{ border: '1px solid var(--border)', padding: '6px 8px', fontWeight: 600, fontSize: 11, background: 'var(--bg2)', color: 'var(--t3)' }}>Afternoon</th>
                <th style={{ border: '1px solid var(--border)', padding: '6px 8px', fontWeight: 600, fontSize: 11, background: 'var(--bg2)', color: 'var(--t3)' }}>Shift (Log)</th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((d: any) => {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
            const isWeekend = d.isWeekend;
            return (
              <tr key={dateStr}>
                <td style={{ border: '1px solid var(--border)', padding: '8px 12px', background: isWeekend ? 'rgba(239, 68, 68, 0.4)' : 'transparent', fontWeight: isWeekend ? 700 : 500, color: isWeekend ? '#fff' : 'var(--t1)', borderLeft: 'none', textAlign: 'left' }}>
                  {d.day} {d.dayName}
                </td>
                {users.map((u: any) => {
                  const att = u.attendanceMap[dateStr] || {};
                  
                  let shiftStr = '';
                  if (att.clockIn) {
                    const inStr = new Date(att.clockIn).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                    const outStr = att.clockOut ? new Date(att.clockOut).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '...';
                    shiftStr = `${inStr} - ${outStr}`;
                  }

                  return (
                    <React.Fragment key={u.id}>
                      <td style={{ border: '1px solid var(--border)', padding: 0 }}>
                        <select 
                          disabled={isWeekend && !att.clockIn}
                          defaultValue={att.morningProd || ''}
                          onChange={(e) => handleUpdate(u.id, dateStr, 'morning', e.target.value)}
                          style={{ width: '100%', height: '100%', minHeight: 34, border: 'none', background: att.morningProd === 'Productive' ? 'rgba(16, 185, 129, 0.1)' : att.morningProd === 'Not productive' ? 'rgba(239, 68, 68, 0.1)' : 'transparent', padding: '6px 12px', color: 'var(--t1)', cursor: 'pointer', outline: 'none', WebkitAppearance: 'none', fontSize: 13 }}
                        >
                          <option value=""></option>
                          <option value="Productive">Productive</option>
                          <option value="Not productive">Not productive</option>
                        </select>
                      </td>
                      <td style={{ border: '1px solid var(--border)', padding: 0 }}>
                        <select 
                          disabled={isWeekend && !att.clockIn}
                          defaultValue={att.afternoonProd || ''}
                          onChange={(e) => handleUpdate(u.id, dateStr, 'afternoon', e.target.value)}
                          style={{ width: '100%', height: '100%', minHeight: 34, border: 'none', background: att.afternoonProd === 'Productive' ? 'rgba(16, 185, 129, 0.1)' : att.afternoonProd === 'Not productive' ? 'rgba(239, 68, 68, 0.1)' : 'transparent', padding: '6px 12px', color: 'var(--t1)', cursor: 'pointer', outline: 'none', WebkitAppearance: 'none', fontSize: 13 }}
                        >
                          <option value=""></option>
                          <option value="Productive">Productive</option>
                          <option value="Not productive">Not productive</option>
                        </select>
                      </td>
                      <td style={{ border: '1px solid var(--border)', padding: '6px 12px', fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: 'var(--t3)', whiteSpace: 'nowrap' }}>
                        {shiftStr}
                      </td>
                    </React.Fragment>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
