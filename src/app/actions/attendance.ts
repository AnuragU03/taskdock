"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export async function clockIn() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");
  const userId = (session.user as any).id;
  const date = todayStr();

  const existing = await prisma.attendance.findUnique({
    where: { userId_date: { userId, date } }
  });

  if (existing?.clockIn) return existing; // already clocked in

  const record = await prisma.attendance.upsert({
    where: { userId_date: { userId, date } },
    update: { clockIn: new Date(), status: 'present' },
    create: { userId, date, clockIn: new Date(), status: 'present' }
  });

  revalidatePath('/');
  return record;
}

export async function clockOut() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");
  const userId = (session.user as any).id;
  const date = todayStr();

  const existing = await prisma.attendance.findUnique({
    where: { userId_date: { userId, date } }
  });

  if (!existing?.clockIn) throw new Error("Not clocked in");

  const clockInTime = new Date(existing.clockIn).getTime();
  const now = Date.now();
  const hoursWorked = Math.round(((now - clockInTime) / 3600000) * 100) / 100;

  // Get workspace default hours for half-day check
  const workspace = await prisma.workspace.findFirst();
  const requiredHours = workspace?.defaultWorkHours || 8;
  const isHalfDay = hoursWorked < (requiredHours / 2);

  const record = await prisma.attendance.update({
    where: { userId_date: { userId, date } },
    data: {
      clockOut: new Date(),
      hoursWorked,
      status: isHalfDay ? 'halfday' : 'present'
    }
  });

  revalidatePath('/');
  return record;
}

export async function getTodayAttendance(userId?: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const uid = userId || (session.user as any).id;
  const date = todayStr();

  return prisma.attendance.findUnique({
    where: { userId_date: { userId: uid, date } }
  });
}

export async function getMonthAttendance(userId: string, year: number, month: number) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

  return prisma.attendance.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: endDate }
    },
    orderBy: { date: 'asc' }
  });
}

export async function getAllTodayAttendance() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'admin') throw new Error("Admin only");
  const date = todayStr();

  return prisma.attendance.findMany({
    where: { date },
    include: { user: { select: { id: true, name: true, email: true, image: true, color: true, role: true } } }
  });
}

export async function adminOverrideAttendance(userId: string, date: string, status: string, note?: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'admin') throw new Error("Admin only");

  const record = await prisma.attendance.upsert({
    where: { userId_date: { userId, date } },
    update: { status, adminNote: note || null },
    create: { userId, date, status, adminNote: note || null }
  });

  revalidatePath('/admin');
  return record;
}
