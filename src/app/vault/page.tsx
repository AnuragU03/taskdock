import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import VaultClient from "./VaultClient";
import SharedVaultClient from "./SharedVaultClient";

export default async function VaultPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const role = (session.user as any).role?.toLowerCase();
  const isAdmin = role === 'admin' || role === 'superadmin';

  if (isAdmin) {
    const members = await prisma.user.findMany({
      select: { id: true, name: true, email: true, image: true, color: true },
      orderBy: { name: 'asc' }
    });
    return <VaultClient members={members} />;
  }

  // Employee: show only shared credentials
  const userId = (session.user as any).id as string;
  const allCreds = await prisma.credential.findMany({
    where: { sharedWith: { not: null } },
    include: { assignedTo: { select: { id: true, name: true, image: true, color: true } } }
  });
  const sharedCreds = allCreds.filter(c => {
    const list: string[] = c.sharedWith ? JSON.parse(c.sharedWith) : [];
    return list.includes(userId);
  });

  return <SharedVaultClient creds={sharedCreds} />;
}
