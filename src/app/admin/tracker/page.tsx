import React from 'react';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TrackerGrid from "./TrackerGrid";

export default async function AdminTrackerPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !['admin','superadmin'].includes((session.user as any).role)) redirect('/');

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  const users = await prisma.user.findMany({
    where: { role: { not: 'superadmin' } }, // Optional: exclude superadmin from tracking if needed
    include: {
      attendance: {
        where: {
          date: { startsWith: `${year}-${String(month).padStart(2, '0')}` }
        }
      }
    }
  });

  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, month - 1, i + 1);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    return { day: i + 1, dayName: dayName.toLowerCase(), isWeekend };
  });

  // Calculate current week boundaries
  const todayDateObj = new Date();
  const currentDayOfWeek = todayDateObj.getDay(); 
  const startOfWeekDate = new Date(todayDateObj);
  startOfWeekDate.setDate(todayDateObj.getDate() - currentDayOfWeek + (currentDayOfWeek === 0 ? -6 : 1)); // Monday
  const endOfWeekDate = new Date(startOfWeekDate);
  endOfWeekDate.setDate(startOfWeekDate.getDate() + 6); // Sunday
  
  const startOfWeekStr = startOfWeekDate.toISOString().split('T')[0];
  const endOfWeekStr = endOfWeekDate.toISOString().split('T')[0];

  const usersMapped = users.map(u => {
    const attendanceMap: any = {};
    let monthProd = 0;
    let monthUnprod = 0;
    let monthPoor = 0;
    let weekProd = 0;
    let weekUnprod = 0;
    let weekPoor = 0;

    u.attendance.forEach((a: any) => {
      attendanceMap[a.date] = a;
      
      const isThisWeek = a.date >= startOfWeekStr && a.date <= endOfWeekStr;

      if (a.morningProd === 'Productive') {
        monthProd++;
        if (isThisWeek) weekProd++;
      }
      if (a.morningProd === 'Not productive') {
        monthUnprod++;
        if (isThisWeek) weekUnprod++;
      }
      if (a.morningProd === 'Poor') {
        monthPoor++;
        if (isThisWeek) weekPoor++;
      }
      if (a.afternoonProd === 'Productive') {
        monthProd++;
        if (isThisWeek) weekProd++;
      }
      if (a.afternoonProd === 'Not productive') {
        monthUnprod++;
        if (isThisWeek) weekUnprod++;
      }
      if (a.afternoonProd === 'Poor') {
        monthPoor++;
        if (isThisWeek) weekPoor++;
      }
    });

    return { ...u, attendanceMap, monthProd, monthUnprod, monthPoor, weekProd, weekUnprod, weekPoor };
  });

  const totalProd = usersMapped.reduce((acc, u) => acc + u.monthProd, 0);
  const totalUnprod = usersMapped.reduce((acc, u) => acc + u.monthUnprod + u.monthPoor, 0);
  
  const totalWeekProd = usersMapped.reduce((acc, u) => acc + u.weekProd, 0);
  const totalWeekUnprod = usersMapped.reduce((acc, u) => acc + u.weekUnprod + u.weekPoor, 0);

  return (
    <div style={{ padding: '30px 40px', maxWidth: 1400, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'var(--font-sans), sans-serif', fontSize: 24, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-.4px', marginBottom: 6 }}>Activity Tracker</h1>
      <p style={{ fontSize: 14, color: 'var(--t3)', marginBottom: 24 }}>Manage shift activity and monitor manual productivity overrides.</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 20, marginBottom: 30 }}>
        <div style={{ padding: 20, background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 12 }}>
          <h3 style={{ fontSize: 13, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 16 }}>Monthly Analysis</h3>
          <div style={{ display: 'flex', gap: 30 }}>
            <div>
              <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--green)', lineHeight: 1 }}>{totalProd}</div>
              <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>Productive Shifts</div>
            </div>
            <div>
              <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--red)', lineHeight: 1 }}>{totalUnprod}</div>
              <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>Unproductive Shifts</div>
            </div>
          </div>
        </div>
        <div style={{ padding: 20, background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 12 }}>
           <h3 style={{ fontSize: 13, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 16 }}>Weekly Summary</h3>
           <div style={{ display: 'flex', gap: 30 }}>
            <div>
              <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--green)', lineHeight: 1 }}>{totalWeekProd}</div>
              <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>Productive This Week</div>
            </div>
            <div>
              <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--red)', lineHeight: 1 }}>{totalWeekUnprod}</div>
              <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>Unproductive This Week</div>
            </div>
          </div>
        </div>
      </div>

      <TrackerGrid users={usersMapped} days={days} year={year} month={month} />
    </div>
  );
}
