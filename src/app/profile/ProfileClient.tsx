"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Av, Toast } from '@/components/ui/Atoms';
import { uploadDocument, deleteDocument } from '@/app/actions/documents';
import { uploadProfilePhoto } from '@/app/actions/profile';

const DOC_TYPES = [
  { id: 'pan', label: 'PAN Card', icon: '□', desc: 'Permanent Account Number card' },
  { id: 'aadhaar', label: 'Aadhaar Card', icon: '◎', desc: 'Unique Identification card' },
  { id: 'certificate', label: 'Certificate', icon: '◈', desc: 'Degree, diploma, or supporting document' },
];

export default function ProfileClient({ user }: { user: any }) {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3000); };

  const handlePhotoUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { flash('Photo too large (max 5MB)'); return; }
    setPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await uploadProfilePhoto(formData);
      flash('Profile photo updated');
      router.refresh();
    } catch (e: any) {
      flash(`Upload failed: ${e.message}`);
    }
    setPhotoUploading(false);
  };

  const handleUpload = async (docType: string, file: File) => {
    if (file.size > 10 * 1024 * 1024) { flash('File too large (max 10MB)'); return; }
    setUploading(docType);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('docType', docType);
      await uploadDocument(formData);
      flash('Document uploaded');
      router.refresh();
    } catch (e: any) {
      flash(`Upload failed: ${e.message}`);
    }
    setUploading(null);
  };

  const handleDelete = async (docId: string) => {
    try {
      await deleteDocument(docId);
      flash('Document deleted');
      router.refresh();
    } catch { flash('Error deleting'); }
  };

  const getDoc = (type: string) => user.documents?.find((d: any) => d.docType === type);

  return (
    <div style={{ padding: '30px 40px', maxWidth: 900, margin: '0 auto' }}>
      <Toast msg={toast} />

      {/* PROFILE HEADER */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 32 }}>
        {/* Clickable avatar with camera overlay */}
        <label style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }} title="Click to change photo">
          <Av user={user} sz={80} />
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg0)', fontSize: 13, color: '#fff', transition: 'all .15s' }}>
            {photoUploading ? '◌' : '⊕'}
          </div>
          <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])} />
        </label>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'var(--font-sans), sans-serif', fontSize: 24, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-.4px', marginBottom: 4 }}>{user.name}</h1>
          <div style={{ fontSize: 14, color: 'var(--t3)', marginBottom: 4 }}>{user.email}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono), monospace', background: 'var(--accent-dim)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 5, textTransform: 'uppercase' }}>{user.role}</span>
            {user.profile?.designation && <span style={{ fontSize: 12, fontFamily: 'var(--font-mono), monospace', background: 'var(--bg3)', color: 'var(--t2)', padding: '2px 8px', borderRadius: 5 }}>{user.profile.designation}</span>}
            {user.profile?.department && <span style={{ fontSize: 12, fontFamily: 'var(--font-mono), monospace', background: 'var(--bg3)', color: 'var(--t2)', padding: '2px 8px', borderRadius: 5 }}>{user.profile.department}</span>}
          </div>
          <div style={{ fontSize: 12, color: 'var(--t4)', marginTop: 6, fontFamily: 'var(--font-mono), monospace' }}>Click avatar to update photo (JPG/PNG/WebP, max 5MB)</div>
        </div>
      </div>

      {/* STATS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}>
        {[
          { label: 'Brownie Points', value: user.browniePoints, color: 'var(--accent)' },
          { label: 'Avg Productivity', value: user.avgProductivity > 0 ? user.avgProductivity : '—', color: 'var(--green)' },
          { label: 'Tasks Completed', value: user.completedTasks, color: 'var(--blue)' },
          { label: 'Monthly Salary', value: user.profile?.monthlySalary ? `₹${user.profile.monthlySalary.toLocaleString('en-IN')}` : '—', color: '#FCD34D' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-mono), monospace', color: s.color, letterSpacing: '-1px', marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono), monospace', color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '.1em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* DOCUMENT UPLOAD */}
      <h2 style={{ fontFamily: 'var(--font-sans), sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--t1)', marginBottom: 16 }}>My Documents</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {DOC_TYPES.map(dt => {
          const doc = getDoc(dt.id);
          return (
            <div key={dt.id} style={{ background: 'var(--bg1)', border: `1px solid ${doc ? 'var(--green)33' : 'var(--border)'}`, borderRadius: 12, padding: 20, position: 'relative' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{dt.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--t1)', marginBottom: 4 }}>{dt.label}</div>
              <div style={{ fontSize: 12, color: 'var(--t4)', marginBottom: 14 }}>{dt.desc}</div>

              {doc ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--green-bg)', padding: '8px 10px', borderRadius: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 14, color: 'var(--green)' }}>✓</span>
                    <span style={{ fontSize: 13, fontFamily: 'var(--font-mono), monospace', color: 'var(--green)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{doc.fileName}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <a href={doc.secureUrl || doc.blobUrl} target="_blank" rel="noopener" style={{ flex: 1, textAlign: 'center', padding: '6px 0', fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: 'var(--blue)', background: 'var(--bg3)', borderRadius: 6, textDecoration: 'none' }}>View ↗</a>
                    <button onClick={() => handleDelete(doc.id)} style={{ padding: '6px 10px', fontSize: 12, fontFamily: 'var(--font-mono), monospace', color: 'var(--red)', background: 'var(--red-bg)', borderRadius: 6, border: 'none', cursor: 'pointer' }}>Delete</button>
                  </div>
                  <div style={{ position: 'absolute', top: 12, right: 12 }}>
                    <label style={{ fontSize: 11, color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'var(--font-mono), monospace' }}>
                      Replace
                      <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleUpload(dt.id, e.target.files[0])} />
                    </label>
                  </div>
                </div>
              ) : (
                <label style={{ display: 'block', padding: '14px', border: '1px dashed var(--border)', borderRadius: 8, textAlign: 'center', cursor: 'pointer', transition: 'all .12s' }}>
                  {uploading === dt.id ? (
                    <span style={{ fontSize: 13, color: 'var(--accent)' }}>Uploading...</span>
                  ) : (
                    <>
                      <span style={{ fontSize: 13, color: 'var(--t3)', display: 'block' }}>Click to upload</span>
                      <span style={{ fontSize: 11, color: 'var(--t4)' }}>PDF, JPG, PNG (max 10MB)</span>
                    </>
                  )}
                  <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleUpload(dt.id, e.target.files[0])} />
                </label>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
