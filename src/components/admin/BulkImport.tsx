"use client";

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { bulkCreateTasks } from '@/app/actions/task';
import { Toast } from '@/components/ui/Atoms';

export default function BulkImport({ members }: { members: any[] }) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2400); };

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
        setTasks(mapped);
        flash(`${mapped.length} tasks ready for import`);
      } catch (err) {
        flash('Error reading file.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const submitBulk = async () => {
    if (tasks.length === 0) return;
    setLoading(true);
    try {
      await bulkCreateTasks(tasks);
      flash(`Successfully imported ${tasks.length} tasks`);
      setTasks([]);
      window.location.reload();
    } catch {
      flash('Error importing tasks.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <Toast msg={toast} />
      <div style={{ background: 'var(--bg1)', border: '1px dashed var(--border)', borderRadius: 12, padding: 24, textAlign: 'center' }}>
        <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} style={{ display: 'none' }} id="openq-import" />
        <label htmlFor="openq-import" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'var(--accent)', color: '#fff', borderRadius: 8, fontFamily: 'var(--font-sans), sans-serif', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
          <span>+</span> Bulk Import (Excel/CSV)
        </label>
        <div style={{ fontSize: 11, color: 'var(--t4)', marginTop: 8, fontFamily: 'var(--font-mono), monospace' }}>Title, Desc, Category, Priority, Weight, Assignee</div>
      </div>

      {tasks.length > 0 && (
        <div style={{ marginTop: 16, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }} className="fu">
          <div style={{ padding: '12px 16px', background: 'var(--bg3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{tasks.length} tasks detected</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={submitBulk} disabled={loading} className="bp" style={{ padding: '6px 12px', fontSize: 13 }}>{loading ? 'Importing...' : '▶ Start Import'}</button>
              <button onClick={() => setTasks([])} className="bg" style={{ padding: '6px 12px', fontSize: 13 }}>Cancel</button>
            </div>
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto', fontSize: 12 }}>
             {tasks.slice(0, 5).map((t, i) => (
               <div key={i} style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', color: 'var(--t3)' }}>
                 {t.title} <span style={{ opacity: 0.5 }}>— {t.category}</span>
               </div>
             ))}
             {tasks.length > 5 && <div style={{ padding: '8px 16px', color: 'var(--t4)', fontStyle: 'italic' }}>...and {tasks.length - 5} more</div>}
          </div>
        </div>
      )}
    </div>
  );
}
