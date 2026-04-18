"use client";

import React, { useState, useEffect } from 'react';
import { Av, Toast } from '@/components/ui/Atoms';
import { updateUserRole, deleteUser } from '@/app/actions/admin';
import { upsertProfile, updateWorkspaceSettings } from '@/app/actions/profile';
import { useRouter } from 'next/navigation';
import { getAllTodayAttendance, adminOverrideAttendance, getRecentAttendance } from '@/app/actions/attendance';
import { updateUserMultiplier } from '@/app/actions/admin';
import { bulkCreateTasks } from '@/app/actions/task';
import * as XLSX from 'xlsx';
import { CATS } from '@/lib/constants';

function HistoryPanel({ userId }: { userId: string }) {
  const [data, setData] = useState<any[]|null>(null);
  useEffect(() => {
    getRecentAttendance(userId).then(setData);
  }, [userId]);
  
  if (!data) return <div style={{ padding: '16px 20px', background: 'var(--bg0)', borderBottom: '1px solid var(--border)', color: 'var(--t4)', fontSize: 13, fontFamily: 'var(--font-mono), monospace' }}>Loading history...</div>;

  const present = data.filter(d => d.status === 'present').length;
  const half = data.filter(d => d.status === 'halfday').length;
  const wfh = data.filter(d => d.status === 'wfh').length;
  const leave = data.filter(d => d.status === 'leave').length;

  return (
    <div style={{ background: 'var(--bg0)', padding: '20px 20px 24px 60px', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, overflowX: 'auto' }}>
        <div style={{ padding: '8px 12px', background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 6, minWidth: 90 }}>
          <div style={{ fontSize: 11, color: 'var(--t4)', fontFamily: 'var(--font-mono), monospace', marginBottom: 4 }}>PRESENT 30D</div>
          <div style={{ fontSize: 18, color: 'var(--green)', fontWeight: 600, fontFamily: 'var(--font-mono), monospace' }}>{present}</div>
        </div>
        <div style={{ padding: '8px 12px', background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 6, minWidth: 90 }}>
          <div style={{ fontSize: 11, color: 'var(--t4)', fontFamily: 'var(--font-mono), monospace', marginBottom: 4 }}>WFH</div>
          <div style={{ fontSize: 18, color: 'var(--blue)', fontWeight: 600, fontFamily: 'var(--font-mono), monospace' }}>{wfh}</div>
        </div>
        <div style={{ padding: '8px 12px', background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 6, minWidth: 90 }}>
          <div style={{ fontSize: 11, color: 'var(--t4)', fontFamily: 'var(--font-mono), monospace', marginBottom: 4 }}>HALF DAY</div>
          <div style={{ fontSize: 18, color: '#FCD34D', fontWeight: 600, fontFamily: 'var(--font-mono), monospace' }}>{half}</div>
        </div>
        <div style={{ padding: '8px 12px', background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 6, minWidth: 90 }}>
          <div style={{ fontSize: 11, color: 'var(--t4)', fontFamily: 'var(--font-mono), monospace', marginBottom: 4 }}>LEAVE</div>
          <div style={{ fontSize: 18, color: 'var(--red)', fontWeight: 600, fontFamily: 'var(--font-mono), monospace' }}>{leave}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {data.slice(0, 14).map(r => (
          <div key={r.id} style={{ padding: '8px 12px', background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 6, opacity: r.status === 'leave' ? 0.6 : 1, minWidth: 90, flexShrink: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--t4)', fontFamily: 'var(--font-mono), monospace', marginBottom: 4 }}>{new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: r.status === 'present' ? 'var(--green)' : r.status === 'halfday' ? '#FCD34D' : r.status === 'wfh' ? 'var(--blue)' : 'var(--red)' }}>
              {r.status.toUpperCase()}
            </div>
            <div style={{ fontSize: 11, color: r.hoursWorked ? 'var(--t3)' : 'var(--t4)', marginTop: 4 }}>{r.hoursWorked ? `${r.hoursWorked}h` : '-'}</div>
          </div>
        ))}
        {data.length === 0 && <div style={{ fontSize: 13, color: 'var(--t4)' }}>No recent attendance data.</div>}
      </div>
    </div>
  );
}

export default function AdminClient({ members, workspace }: { members: any[], workspace: any }) {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('team');
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2400); };

  // Bulk Import State
  const [importTasks, setImportTasks] = useState<any[]>([]);
  const [importLoading, setImportLoading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        if (!bstr) return;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);
        const mapped = data.map((row: any) => {
          const rawAssignee = row['Assignee'] || row['Email'] || row['Assigned To'];
          let assignedToId = null;
          if (rawAssignee) {
            const match = members.find(m => 
              m.email?.toLowerCase() === String(rawAssignee).toLowerCase().trim() ||
              m.name?.toLowerCase() === String(rawAssignee).toLowerCase().trim()
            );
            if (match) assignedToId = match.id;
          }
          return {
            title: row['Title'] || row['Task'] || 'Untitled Batch Task',
            desc: row['Description'] || row['Brief'] || row['Details'] || '',
            category: row['Category'] || 'Design',
            priority: String(row['Priority'] || 'medium').toLowerCase(),
            weight: Number(row['Weight'] || row['Complexity'] || 5),
            refLink: row['Link'] || row['URL'] || row['Reference'] || null,
            assignedTo: assignedToId,
          };
        });
        setImportTasks(mapped);
      } catch (err) {
        flash('Error reading file.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const submitBulk = async () => {
    if (importTasks.length === 0) return;
    setImportLoading(true);
    try {
      await bulkCreateTasks(importTasks);
      flash(`Imported ${importTasks.length} tasks`);
      setImportTasks([]);
      setActiveTab('team');
    } catch {
      flash('Error importing tasks.');
    } finally {
      setImportLoading(false);
    }
  };

  // Attendance states
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [historyId, setHistoryId] = useState<string | null>(null);

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

  const handleMultiplierChange = async (userId: string, val: string) => {
    try {
      await updateUserMultiplier(userId, parseFloat(val));
      flash(`Multiplier set to ${val}x`);
    } catch { flash('Failed to update multiplier'); }
  };

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
    { id: 'import', label: 'Bulk Import' },
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
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.2fr', padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg2)', fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '.1em' }}>
            <div>Member</div>
            <div>Points</div>
            <div>Multiplier</div>
            <div>Role</div>
          </div>
          {members.map(u => (
            <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.2fr', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Av user={u} sz={40} />
                <div>
                  <div style={{ fontFamily: 'var(--font-sans), sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--t1)' }}>{u.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--t4)', marginTop: 2 }}>{u.email}</div>
                </div>
              </div>
              <div style={{ fontSize: 16, fontFamily: 'var(--font-mono), monospace', color: 'var(--accent)', fontWeight: 600 }}>{u.browniePoints}</div>
              <div style={{ paddingRight: 10 }}>
                <select className="inp" defaultValue={u.pointMultiplier || 1.0} onChange={e => handleMultiplierChange(u.id, e.target.value)} style={{ padding: '4px 8px', fontSize: 13, minHeight: 0 }}>
                  <option value="0.5">0.5x (Probation)</option>
                  <option value="1.0">1.0x (Standard)</option>
                  <option value="1.2">1.2x (Senior)</option>
                  <option value="1.5">1.5x (Elite)</option>
                  <option value="2.0">2.0x (GOD)</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <select className="inp" defaultValue={u.role} onChange={e => handleRoleChange(u.id, e.target.value)} style={{ padding: '6px 10px', fontSize: 14, minHeight: 0 }}>
                  <option value="employee">Creative / Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
                {u.role !== 'superadmin' && (
                  <button 
                    onClick={async () => {
                      const challenge = window.prompt(`[DANGER: ACCOUNT REMOVAL] To permanently delete user ${u.name}, type 'delete' below:`);
                      if (challenge === 'delete') {
                        await deleteUser(u.id);
                        flash('User deleted');
                        router.refresh();
                      } else if (challenge !== null) {
                        alert('Deletion cancelled. The text did not match.');
                      }
                    }} 
                    style={{ color: 'var(--red)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 16 }}
                  >
                    ✕
                  </button>
                )}
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
              const isExpanded = historyId === u.id;
              return (
                <React.Fragment key={u.id}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr', alignItems: 'center', padding: '14px 20px', borderBottom: isExpanded ? 'none' : '1px solid var(--border)', background: isExpanded ? 'var(--bg2)' : 'transparent', transition: 'background .2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button onClick={() => setHistoryId(isExpanded ? null : u.id)} style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isExpanded ? 'var(--bg3)' : 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '50%', cursor: 'pointer', color: 'var(--t3)', transition: 'all .2s' }}>
                      {isExpanded ? '▼' : '▶'}
                    </button>
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
                {isExpanded && <HistoryPanel userId={u.id} />}
                </React.Fragment>
              );
           })}
        </div>
      )}

      {activeTab === 'import' && (
        <div>
          <div style={{ background: 'var(--bg1)', border: '1px dashed var(--border)', borderRadius: 12, padding: 40, textAlign: 'center', marginBottom: 24 }}>
            <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} style={{ display: 'none' }} id="dash-import" />
            <label htmlFor="dash-import" style={{ display: 'inline-block', padding: '10px 20px', background: 'var(--accent)', color: '#fff', borderRadius: 8, fontFamily: 'var(--font-sans), sans-serif', fontWeight: 600, cursor: 'pointer' }}>
              Select Spreadsheet
            </label>
            <div style={{ fontSize: 13, color: 'var(--t4)', marginTop: 12, fontFamily: 'var(--font-mono), monospace' }}>Supported: Title, Description, Category, Priority, Weight, Assignee</div>
          </div>
          {importTasks.length > 0 && (
            <div style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '16px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontFamily: 'var(--font-mono), monospace', color: 'var(--t1)' }}>{importTasks.length} tasks detected</span>
                <button onClick={submitBulk} disabled={importLoading} className="bp">{importLoading ? 'Importing...' : `▶ Generate ${importTasks.length} Tasks`}</button>
              </div>
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ position: 'sticky', top: 0, background: 'var(--bg2)', zIndex: 1 }}>
                    <tr style={{ fontSize: 11, fontFamily: 'var(--font-mono), monospace', color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '.1em' }}>
                      <th style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>Title</th>
                      <th style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>Category</th>
                      <th style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>Assignee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importTasks.map((t, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 16px', fontSize: 13, color: 'var(--t1)' }}>{t.title}</td>
                        <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--t3)' }}>{t.category}</td>
                        <td style={{ padding: '10px 16px', fontSize: 12, color: t.assignedTo ? 'var(--green)' : 'var(--t4)' }}>
                          {t.assignedTo ? members.find(m => m.id === t.assignedTo)?.name : 'Open Queue'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

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
