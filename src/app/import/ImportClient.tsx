"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { Toast } from '@/components/ui/Atoms';
import { bulkCreateTasks } from '@/app/actions/task';

export default function ImportClient({ members }: { members: any[] }) {
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3000); };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        mapTasks(data);
      } catch (err) {
        flash('❌ Error reading file. Make sure it is a valid Excel or CSV.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const mapTasks = (data: any[]) => {
    const mapped = data.map((row: any) => {
      // Find assignee by email or name if provided
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
        category: row['Category'] || 'General',
        priority: String(row['Priority'] || 'medium').toLowerCase(),
        weight: Number(row['Weight'] || row['Complexity'] || 5),
        refLink: row['Link'] || row['URL'] || row['Reference'] || null,
        assignedTo: assignedToId,
      };
    });
    setTasks(mapped);
  };

  const submitBulk = async () => {
    if (tasks.length === 0) return;
    setLoading(true);
    try {
      const res = await bulkCreateTasks(tasks);
      flash(`✅ Successfully imported ${res.count} tasks!`);
      setTimeout(() => router.push('/'), 1800);
    } catch (err) {
      flash('❌ Error importing tasks.');
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '30px 40px', maxWidth: 1000, margin: '0 auto' }}>
      <Toast msg={toast} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-sans), sans-serif', fontSize: 24, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-.4px', marginBottom: 6 }}>Bulk Task Import</h1>
          <p style={{ fontSize: 14, color: 'var(--t3)' }}>Upload a .xlsx or .csv sheet to instantly generate tasks.</p>
        </div>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', fontSize: 14 }}>← Back to Board</button>
      </div>

      <div style={{ background: 'var(--bg1)', border: '1px dashed var(--border)', borderRadius: 12, padding: 40, textAlign: 'center', marginBottom: 24 }}>
        <input 
          type="file" 
          accept=".xlsx, .xls, .csv" 
          onChange={handleFileUpload} 
          style={{ display: 'none' }} 
          id="file-upload" 
        />
        <label htmlFor="file-upload" style={{ display: 'inline-block', padding: '10px 20px', background: 'var(--accent)', color: '#fff', borderRadius: 8, fontFamily: 'var(--font-sans), sans-serif', fontWeight: 600, cursor: 'pointer', transition: 'all .12s' }}>
          Select Spreadsheet
        </label>
        <div style={{ fontSize: 13, color: 'var(--t4)', marginTop: 12, fontFamily: 'var(--font-mono), monospace' }}>
          Supported columns: Title, Description, Category, Priority, Weight, Assignee, Link
        </div>
      </div>

      {tasks.length > 0 && (
        <div style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '16px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontFamily: 'var(--font-mono), monospace', color: 'var(--t1)' }}>{tasks.length} tasks detected</span>
            <button 
              onClick={submitBulk} 
              disabled={loading} 
              className="bp"
            >
              {loading ? 'Importing...' : `▶ Generate ${tasks.length} Tasks`}
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 800 }}>
              <thead>
                <tr style={{ background: 'var(--bg2)', fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '.1em' }}>
                  <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>Title</th>
                  <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>Category</th>
                  <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>Weight</th>
                  <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>Assignee</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t, idx) => (
                  <tr key={idx} style={{ borderBottom: idx < tasks.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: 'var(--t1)' }}>{t.title}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--t2)' }}>
                       <span style={{ background: 'var(--bg3)', padding: '2px 6px', borderRadius: 4 }}>{t.category}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: 'var(--t2)', fontFamily: 'var(--font-mono), monospace' }}>{t.weight}/10</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: t.assignedTo ? 'var(--green)' : 'var(--t4)' }}>
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
  );
}
