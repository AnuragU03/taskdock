"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { uploadBlob, deleteBlob } from "@/lib/blob";

export async function uploadProfilePhoto(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");
  const userId = (session.user as any).id;

  const file = formData.get('file') as File;
  if (!file || file.size === 0) throw new Error("No file provided");
  if (file.size > 5 * 1024 * 1024) throw new Error("File too large (max 5MB)");

  const ext = file.name.split('.').pop() || 'jpg';
  const blobPath = `profiles/${userId}.${ext}`;

  // Delete old profile photo if it exists and is in our storage
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.image?.includes('profiles/')) {
    const oldPath = decodeURIComponent(user.image.split('/').slice(-2).join('/').split('?')[0]);
    try { await deleteBlob(oldPath); } catch { /* ignore if not found */ }
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const url = await uploadBlob(blobPath, buffer, file.type);

  await prisma.user.update({ where: { id: userId }, data: { image: url } });

  revalidatePath('/profile');
  revalidatePath('/');
  return url;
}

export async function upsertProfile(userId: string, data: {
  designation?: string;
  department?: string;
  monthlySalary?: number;
  workingHoursDay?: number;
  roleDesc?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !['admin','superadmin'].includes((session.user as any).role)) throw new Error("Admin only");

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
  if (!session?.user || !['admin','superadmin'].includes((session.user as any).role)) throw new Error("Admin only");

  return prisma.employeeProfile.findMany({
    include: { user: { select: { id: true, name: true, email: true, image: true, color: true, role: true } } }
  });
}

export async function updateWorkspaceSettings(data: { defaultWorkHours?: number }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !['admin','superadmin'].includes((session.user as any).role)) throw new Error("Admin only");

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
