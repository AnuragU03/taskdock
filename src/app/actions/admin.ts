"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateUserRole(userId: string, role: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");
  if ((session.user as any).role !== 'admin') throw new Error("Requires admin role");

  await prisma.user.update({
    where: { id: userId },
    data: { role }
  });

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
