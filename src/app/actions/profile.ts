"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function upsertProfile(userId: string, data: {
  designation?: string;
  department?: string;
  monthlySalary?: number;
  workingHoursDay?: number;
  roleDesc?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'admin') throw new Error("Admin only");

  const profile = await prisma.employeeProfile.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data }
  });

  revalidatePath('/admin');
  return profile;
}

export async function getProfile(userId?: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const uid = userId || (session.user as any).id;

  return prisma.employeeProfile.findUnique({ where: { userId: uid } });
}

export async function getAllProfiles() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'admin') throw new Error("Admin only");

  return prisma.employeeProfile.findMany({
    include: { user: { select: { id: true, name: true, email: true, image: true, color: true, role: true } } }
  });
}

export async function updateWorkspaceSettings(data: { defaultWorkHours?: number }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'admin') throw new Error("Admin only");

  let workspace = await prisma.workspace.findFirst();
  if (!workspace) {
    workspace = await prisma.workspace.create({ data: { name: 'Main Workspace', slug: 'main', ...data } });
  } else {
    workspace = await prisma.workspace.update({ where: { id: workspace.id }, data });
  }

  revalidatePath('/admin');
  return workspace;
}

export async function getWorkspaceSettings() {
  return prisma.workspace.findFirst();
}

// Calculate earnings for a user in a given month
export async function getMonthlyEarnings(userId: string, year: number, month: number) {
  const profile = await prisma.employeeProfile.findUnique({ where: { userId } });
  if (!profile?.monthlySalary) return { earned: 0, total: 0, days: 0, workingDays: 0 };

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

  const records = await prisma.attendance.findMany({
    where: { userId, date: { gte: startDate, lte: endDate } }
  });

  // Count working days in month (exclude weekends)
  const daysInMonth = new Date(year, month, 0).getDate();
  let workingDays = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const day = new Date(year, month - 1, d).getDay();
    if (day !== 0 && day !== 6) workingDays++;
  }

  const dailyRate = profile.monthlySalary / workingDays;
  let earned = 0;

  for (const r of records) {
    if (r.status === 'present' || r.status === 'wfh') earned += dailyRate;
    else if (r.status === 'halfday') earned += dailyRate * 0.5;
    // leave = 0
  }

  return {
    earned: Math.round(earned),
    total: Math.round(profile.monthlySalary),
    days: records.filter(r => r.status === 'present' || r.status === 'wfh').length,
    halfDays: records.filter(r => r.status === 'halfday').length,
    leaves: records.filter(r => r.status === 'leave').length,
    workingDays,
    dailyRate: Math.round(dailyRate)
  };
}
