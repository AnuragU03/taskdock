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

  // Notify the recipient that a credential has been shared with them
  const workspace = await prisma.workspace.findFirst();
  if (workspace) {
    await prisma.notification.create({
      data: {
        workspaceId: workspace.id,
        userId,
        text: `⊔ ${session.user.name} shared the credential "${cred?.toolName}" with you. View it in your Credential Locker.`,
        type: 'CREDENTIAL_SHARED',
        metadata: JSON.stringify({ credentialId: credId, toolName: cred?.toolName, sharedBy: session.user.name }),
      },
    });
  }

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

// Called when admin confirms payment was made — auto-advances renewalDate
// and clears reminder timestamps so the next cycle gets fresh alerts
export async function markCredentialRenewed(credentialId: string, notifId?: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");
  assertAdmin((session.user as any).role);

  const cred = await prisma.credential.findUnique({ where: { id: credentialId } });
  if (!cred) throw new Error("Credential not found");

  let newRenewalDate = cred.renewalDate;

  if (cred.renewalDate) {
    const current = new Date(cred.renewalDate);
    if (cred.billingCycle === 'yearly') {
      current.setFullYear(current.getFullYear() + 1);
    } else {
      // monthly (default)
      current.setMonth(current.getMonth() + 1);
    }
    // Format as YYYY-MM-DD
    newRenewalDate = current.toISOString().split('T')[0];
  }

  await prisma.credential.update({
    where: { id: credentialId },
    data: {
      renewalDate: newRenewalDate,
      reminder4dAt: null,  // reset so next cycle gets fresh reminders
      reminder1dAt: null,
    },
  });

  // Mark the notification as read if provided
  if (notifId) {
    await prisma.notification.update({
      where: { id: notifId },
      data: { read: true },
    }).catch(() => {}); // silent if notif already gone
  }

  revalidatePath('/vault');
  revalidatePath('/notifications');
  return { ok: true, newRenewalDate };
}
// Called by employees to get credentials shared with them
export async function getSharedCredentials() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error('Unauthorized');
  const userId = (session.user as any).id as string;

  const all = await prisma.credential.findMany({
    where: { sharedWith: { not: null } },
    include: { assignedTo: { select: { id: true, name: true, image: true, color: true } } }
  });

  // Filter to creds where the current user is in sharedWith
  return all.filter(c => {
    const list: string[] = c.sharedWith ? JSON.parse(c.sharedWith) : [];
    return list.includes(userId);
  });
}
