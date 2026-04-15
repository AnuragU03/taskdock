"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

function assertAdmin(role: string) {
  if (role !== 'admin' && role !== 'superadmin') throw new Error("Admin access required");
}

export async function getCredentials() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");
  assertAdmin((session.user as any).role);

  return prisma.credential.findMany({
    orderBy: { createdAt: 'desc' },
    include: { assignedTo: { select: { id: true, name: true, image: true, color: true } } }
  });
}

export async function addCredential(data: {
  toolName: string;
  toolUrl?: string;
  loginEmail?: string;
  loginPass?: string;
  apiKey?: string;
  assignedToId?: string;
  renewalDate?: string;
  monthlyCost?: number;
  billingCycle?: string;
  notes?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");
  assertAdmin((session.user as any).role);

  await prisma.credential.create({ data: { ...data, billingCycle: data.billingCycle || 'monthly' } });
  revalidatePath('/vault');
  return true;
}

export async function shareCredential(credId: string, userId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");
  assertAdmin((session.user as any).role);

  const cred = await prisma.credential.findUnique({ where: { id: credId } });
  const existing: string[] = cred?.sharedWith ? JSON.parse(cred.sharedWith) : [];
  if (!existing.includes(userId)) existing.push(userId);

  await prisma.credential.update({ where: { id: credId }, data: { sharedWith: JSON.stringify(existing) } });
  revalidatePath('/vault');
  return true;
}

export async function revokeCredential(credId: string, userId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");
  assertAdmin((session.user as any).role);

  const cred = await prisma.credential.findUnique({ where: { id: credId } });
  const existing: string[] = cred?.sharedWith ? JSON.parse(cred.sharedWith) : [];
  const updated = existing.filter(id => id !== userId);

  await prisma.credential.update({ where: { id: credId }, data: { sharedWith: JSON.stringify(updated) } });
  revalidatePath('/vault');
  return true;
}

export async function updateCredential(id: string, data: any) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");
  assertAdmin((session.user as any).role);

  await prisma.credential.update({ where: { id }, data });
  revalidatePath('/vault');
  return true;
}

export async function deleteCredential(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");
  assertAdmin((session.user as any).role);

  await prisma.credential.delete({ where: { id } });
  revalidatePath('/vault');
  return true;
}
