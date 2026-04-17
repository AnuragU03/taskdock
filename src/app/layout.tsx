import type { Metadata } from "next";
import { DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { prisma } from "@/lib/prisma";

import { Topbar } from "@/components/layout/Topbar";
import { NotifPatti } from "@/components/layout/NotifPatti";
import { LiveToast } from "@/components/ui/LiveToast";
import { checkAndSendRenewalReminders } from "@/lib/reminders";

const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-sans" });
const dmMono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "TaskDock - Creative OS",
  description: "Every creative brief, reference, countdown, deliverable, and approval — in one place.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  
  // Fetch unread notifications if user exists
  let unreadNotifsCount = 0;
  let todayAttendance: any = null;
  let earnings: any = null;
  
  if (session?.user && (session.user as any).id) {
    const userId = (session.user as any).id as string;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    
    unreadNotifsCount = await prisma.notification.count({
      where: { userId, read: false }
    });
    
    todayAttendance = await prisma.attendance.findUnique({
      where: { userId_date: { userId, date: today } }
    });

    // Fetch monthly earnings
    const profile = await prisma.employeeProfile.findUnique({ where: { userId } });
    if (profile?.monthlySalary) {
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
      const records = await prisma.attendance.findMany({
        where: { userId, date: { gte: startDate, lte: endDate } }
      });
      const daysInMonth = new Date(year, month, 0).getDate();
      let workingDays = 0;
      for (let d = 1; d <= daysInMonth; d++) {
        const day = new Date(year, month - 1, d).getDay();
        if (day !== 0 && day !== 6) workingDays++;
      }
      // Active Math Constraints: Base rate factor is Attendance (Days), but the value is multiplied by Productivity.
      const tasksThisMonth = await prisma.task.findMany({
        where: {
          assignedToId: userId,
          status: 'completed',
          productivity: { not: null },
          completedAt: { gte: new Date(startDate), lte: new Date(endDate + 'T23:59:59Z') }
        },
        select: { productivity: true }
      });

      let prodMultiplier = 1.0;
      if (tasksThisMonth.length > 0) {
        const sum = tasksThisMonth.reduce((acc, t) => acc + (t.productivity || 0), 0);
        const avg = sum / tasksThisMonth.length;
        // Clamp multiplier between 0.7x (Safety) and 1.5x (Ceiling)
        prodMultiplier = Math.min(Math.max(avg / 5, 0.7), 1.5);
      }

      const dailyRate = profile.monthlySalary / workingDays;
      let earned = 0;
      for (const r of records) {
        if (r.status === 'present' || r.status === 'wfh') earned += dailyRate * prodMultiplier;
        else if (r.status === 'halfday') earned += (dailyRate * 0.5) * prodMultiplier;
      }
      earnings = { earned: Math.round(earned), total: Math.round(profile.monthlySalary), multiplier: Number(prodMultiplier.toFixed(2)) };
    }

    // Renewal reminders — only for admin/superadmin, silently
    const userRole = (session.user as any).role;
    if (userRole === 'admin' || userRole === 'superadmin') {
      const ws = await prisma.workspace.findFirst();
      if (ws) {
        await checkAndSendRenewalReminders(userId, ws.id);
      }
    }
  }

  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${dmMono.variable} antialiased`}>
        <AuthProvider>
          {session ? (
            <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg0)' }}>
              <Sidebar 
                 user={{
                   id: (session.user as any).id as string,
                   name: session.user.name as string,
                   email: session.user.email as string,
                   role: (session.user as any).role || 'employee',
                   image: session.user.image,
                   color: (session.user as any).color,
                   browniePoints: (session.user as any).browniePoints || 0
                 }}
                 unreadNotifsCount={unreadNotifsCount}
                 todayAttendance={todayAttendance}
                 earnings={earnings}
              />
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <Topbar user={session.user} />
                <NotifPatti initialCount={unreadNotifsCount} />
                <LiveToast />
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {children}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ minHeight: '100vh', background: 'var(--bg0)' }}>
              {children}
            </div>
          )}
        </AuthProvider>
      </body>
    </html>
  );
}
