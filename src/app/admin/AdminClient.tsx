"use client";

import React, { useState, useEffect } from 'react';
import { Av, Toast } from '@/components/ui/Atoms';
import { updateUserRole } from '@/app/actions/admin';
import { upsertProfile, updateWorkspaceSettings } from '@/app/actions/profile';
import { getAllTodayAttendance, adminOverrideAttendance } from '@/app/actions/attendance';

export default function AdminClient({ members, workspace }: { members: any[], workspace: any }) {
  const [toast, setToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('team');
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2400); };

  // Attendance states
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // Settings states
  const [defaultHours, setDefaultHours] = useState(workspace?.defaultWorkHours || 8);

  const fetchAttendance = async () => {
    setLoadingAttendance(true);
    try {
      const records = await getAllTodayAttendance();
      // For a robust system, the SA should accept a date. Since getAllTodayAttendance is using 'todayStr()', 
      // let's assume we are just viewing today. We can enhance to view historical later.
      setAttendanceRecords(records);
    } catch { }
    setLoadingAttendance(false);
  };

  useEffect(() => {
    if (activeTab === 'attendance') {
      fetchAttendance();
    }
  }, [activeTab]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateUserRole(userId, newRole);
      flash(`Role updated to ${newRole}`);
    } catch {
      flash('Failed to update role');
    }
  };

  const handleProfileUpdate = async (userId: string, field: string, value: any) => {
    try {
      await upsertProfile(userId, { [field]: value });
      flash(`Profile updated`);
    } catch {
      flash('Error updating profile');
    }
  };

  const handleSettingsSave = async () => {
    try {
      await updateWorkspaceSettings({ defaultWorkHours: Number(defaultHours) });
      flash('Settings saved');
    } catch {
      flash('Error saving settings');
    }
  };

  const handleAttendanceOverride = async (userId: string, status: string) => {
    try {
      await adminOverrideAttendance(userId, attendanceDate, status, 'Admin override');
      flash(`Attendance marked as ${status}`);
      fetchAttendance();
    } catch {
      flash('Error overriding attendance');
    }
  };

  const tabs = [
    { id: 'team', label: 'Team Roles' },
    { id: 'profiles', label: 'Profiles & Payroll' },
    { id: 'attendance', label: "Today's Attendance" },
    { id: 'settings', label: 'Settings' }
  ];

  return (
    <div style={{ padding: '30px 40px', maxWidth: 1000, margin: '0 auto' }}>
      <Toast msg={toast} />
      <h1 style={{ fontFamily: 'var(--font-sans), sans-serif', fontSize: 24, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-.4px', marginBottom: 20 }}>Workspace Settings</h1>
      
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
        {tabs.map(t => (
          <button 
            key={t.id} 
            onClick={() => setActiveTab(t.id)}
            style={{ 
              padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: activeTab === t.id ? 'var(--accent)' : 'transparent',
              color: activeTab === t.id ? '#fff' : 'var(--t3)',
              fontFamily: 'var(--font-sans), sans-serif', fontWeight: 600, fontSize: 14
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'team' && (
        <div style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg2)', fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '.1em' }}>
            <div>Member</div>
            <div>Points</div>
            <div>Role</div>
          </div>
          {members.map(u => (
            <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Av user={u} sz={40} />
                <div>
                  <div style={{ fontFamily: 'var(--font-sans), sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--t1)' }}>{u.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--t4)', marginTop: 2 }}>{u.email}</div>
                </div>
              </div>
              <div style={{ fontSize: 16, fontFamily: 'var(--font-mono), monospace', color: 'var(--accent)', fontWeight: 600 }}>{u.browniePoints}</div>
              <div>
                <select className="inp" defaultValue={u.role} onChange={e => handleRoleChange(u.id, e.target.value)} style={{ padding: '6px 10px', fontSize: 14, minHeight: 0 }}>
                  <option value="employee">Creative / Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'profiles' && (
        <div style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg2)', fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '.1em' }}>
            <div>Member</div>
            <div>Department</div>
            <div>Designation</div>
            <div>Monthly Salary (₹)</div>
          </div>
          {members.map(u => (
            <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Av user={u} sz={40} />
                <div style={{ fontFamily: 'var(--font-sans), sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--t1)' }}>{u.name}</div>
              </div>
              <div style={{ paddingRight: 10 }}>
                <input className="inp" defaultValue={u.profile?.department || ''} placeholder="e.g. Design" onBlur={e => handleProfileUpdate(u.id, 'department', e.target.value)} />
              </div>
              <div style={{ paddingRight: 10 }}>
                <input className="inp" defaultValue={u.profile?.designation || ''} placeholder="e.g. UX Designer" onBlur={e => handleProfileUpdate(u.id, 'designation', e.target.value)} />
              </div>
              <div>
                <input type="number" className="inp" defaultValue={u.profile?.monthlySalary || ''} placeholder="0" onBlur={e => handleProfileUpdate(u.id, 'monthlySalary', Number(e.target.value) || 0)} />
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'attendance' && (
        <div style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
           <div style={{ padding: '12px 20px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <div style={{ fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.1em' }}>Status for {attendanceDate}</div>
             <button onClick={fetchAttendance} className="bg" style={{ padding: '4px 10px', fontSize: 12 }}>Refresh</button>
           </div>
           
           {members.map(u => {
              const record = attendanceRecords.find(r => r.userId === u.id);
              return (
                <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Av user={u} sz={40} />
                    <div style={{ fontFamily: 'var(--font-sans), sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--t1)' }}>{u.name}</div>
                  </div>
                  <div>
                    {record ? (
                      <div style={{ fontSize: 13, color: 'var(--t2)', fontFamily: 'var(--font-mono), monospace' }}>
                         Clock In: {new Date(record.clockIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                         {record.clockOut && ` — Clock Out: ${new Date(record.clockOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
                         {record.hoursWorked && ` (${record.hoursWorked} hrs)`}
                      </div>
                    ) : (
                      <span style={{ fontSize: 13, color: 'var(--t4)' }}>Not clocked in</span>
                    )}
                  </div>
                  <div>
                    <select 
                      className="inp" 
                      value={record?.status || 'leave'} 
                      onChange={e => handleAttendanceOverride(u.id, e.target.value)}
                      style={{ 
                        padding: '6px 10px', fontSize: 13, minHeight: 0,
                        color: record ? (record.status === 'present' ? 'var(--green)' : record.status === 'halfday' ? '#FCD34D' : record.status === 'wfh' ? 'var(--blue)' : 'var(--red)') : 'var(--t4)',
                        borderColor: record ? (record.status === 'present' ? 'var(--green)33' : record.status === 'halfday' ? '#FCD34D33' : record.status === 'wfh' ? 'var(--blue)33' : 'var(--red)33') : 'var(--border)'
                      }}
                    >
                      <option value="present">Present (Full Day)</option>
                      <option value="halfday">Present (Half Day)</option>
                      <option value="wfh">Work from Home</option>
                      <option value="leave">Leave / Absent</option>
                    </select>
                  </div>
                </div>
              );
           })}
        </div>
      )}

      {activeTab === 'settings' && (
        <div style={{ maxWidth: 500 }}>
          <div style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
            <h3 style={{ fontSize: 16, fontFamily: 'var(--font-sans), sans-serif', fontWeight: 600, color: 'var(--t1)', marginBottom: 16 }}>General Details</h3>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: 'var(--t4)', textTransform: 'uppercase', marginBottom: 8 }}>Default Working Hours / Day</label>
              <input type="number" className="inp" value={defaultHours} onChange={(e) => setDefaultHours(Number(e.target.value))} />
              <p style={{ fontSize: 12, color: 'var(--t4)', marginTop: 8 }}>Used to calculate half-day deviations and baseline metrics.</p>
            </div>
            
            <button className="bp" onClick={handleSettingsSave}>Save Settings</button>
          </div>
        </div>
      )}
      
    </div>
  );
}
