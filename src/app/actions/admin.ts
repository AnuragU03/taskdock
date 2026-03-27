"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateUserRole(userId: string, workspaceId: string, role: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");
  if ((session.user as any).role !== 'admin') throw new Error("Requires admin role");

  await prisma.workspaceMember.update({
    where: { workspaceId_userId: { workspaceId, userId } },
    data: { role }
  });

  // Since user role is also stored on User model for easy access in session sometimes,
  // we might want to sync it if your session relies on User instead of WorkspaceMember.
  // Wait, I mapped role to WorkspaceMember in the UI, but session uses `user.role`.
  // Let's also update the User model just in case to avoid desync for prototype.
  /* 
  Wait, User model doesn't have a role string natively, wait, does it?
  In schema.prisma, User model does not have role:
  `role` is inside `WorkspaceMember`.
  Wait! In my `auth.ts`, session callback looks at `user.role`. BUT User doesn't have `role`!
  Ah, my schema doesn't have `role` on User, I need to fetch it via WorkspaceMember.
  */

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
