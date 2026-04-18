"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateUserRole(userId: string, role: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");
  if (!['admin','superadmin'].includes((session.user as any).role)) throw new Error("Requires admin role");

  await prisma.user.update({
    where: { id: userId },
    data: { role }
  });

  revalidatePath('/admin');
  return true;
}

export async function updateUserMultiplier(userId: string, pointMultiplier: number) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");
  if (!['admin','superadmin'].includes((session.user as any).role)) throw new Error("Requires admin role");

  await prisma.user.update({
    where: { id: userId },
    data: { pointMultiplier }
  });

  revalidatePath('/admin');
  return true;
}

export async function deleteUser(userId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");
  if (!['admin','superadmin'].includes((session.user as any).role)) throw new Error("Requires admin role");

  await prisma.user.delete({ where: { id: userId } });

  revalidatePath('/admin');
  return true;
}

export async function markNotifsRead() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");

  await prisma.notification.updateMany({
    where: { userId: (session.user as any).id, read: false },
    data: { read: true }
  });

  revalidatePath('/notifications');
  return true;
}
