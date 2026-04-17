"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Super admin / admin sends a broadcast to one or more users
export async function sendBroadcast(message: string, targetUserIds: string[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");
  const role = (session.user as any).role;
  if (role !== "admin" && role !== "superadmin") throw new Error("Requires admin role");

  const senderId = (session.user as any).id as string;
  const senderName = session.user.name ?? "Admin";

  if (!message.trim()) throw new Error("Message cannot be empty");
  if (!targetUserIds.length) throw new Error("No recipients selected");

  let workspace = await prisma.workspace.findFirst();
  if (!workspace) throw new Error("No workspace found");

  const broadcastId = `bc_${Date.now()}`;

  // Create one notification per recipient
  await prisma.notification.createMany({
    data: targetUserIds.map((uid) => ({
      workspaceId: workspace!.id,
      userId: uid,
      text: `📢 ${senderName}: ${message}`,
      type: "BROADCAST",
      metadata: JSON.stringify({
        broadcastId,
        senderId,
        senderName,
        message,
        targetUserIds,
        acknowledgedBy: [], // { userId, response, at }[]
      }),
    })),
  });

  revalidatePath("/");
  revalidatePath("/notifications");
  return { ok: true, broadcastId };
}

// Recipient acknowledges a broadcast with yes/no
export async function acknowledgeBroadcast(notifId: string, response: "yes" | "no") {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");

  const userId = (session.user as any).id as string;
  const userName = session.user.name ?? "Someone";

  const notif = await prisma.notification.findUnique({ where: { id: notifId } });
  if (!notif || notif.userId !== userId) throw new Error("Not found");

  const meta = notif.metadata ? JSON.parse(notif.metadata) : {};
  const ackList: any[] = meta.acknowledgedBy ?? [];

  // Prevent double-acknowledgement
  if (ackList.some((a: any) => a.userId === userId)) {
    return { ok: true, alreadyAcked: true };
  }

  ackList.push({ userId, response, at: new Date().toISOString() });

  await prisma.notification.update({
    where: { id: notifId },
    data: {
      read: true,
      metadata: JSON.stringify({ ...meta, acknowledgedBy: ackList }),
    },
  });

  // Send acknowledgement notification back to sender
  let workspace = await prisma.workspace.findFirst();
  if (workspace && meta.senderId) {
    const emoji = response === "yes" ? "✓" : "✕";
    await prisma.notification.create({
      data: {
        workspaceId: workspace.id,
        userId: meta.senderId,
        text: `${emoji} ${userName} responded "${response.toUpperCase()}" to your broadcast: "${meta.message?.slice(0, 60)}${meta.message?.length > 60 ? "…" : ""}"`,
        type: "BROADCAST_ACK",
        metadata: JSON.stringify({
          broadcastId: meta.broadcastId,
          responderId: userId,
          responderName: userName,
          response,
          originalMessage: meta.message,
        }),
      },
    });
  }

  revalidatePath("/notifications");
  return { ok: true };
}

// Fetch users for @mention autocomplete (called client-side via API)
export async function getAllUsersForMention() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return [];
  const role = (session.user as any).role;
  if (role !== "admin" && role !== "superadmin") return [];

  return prisma.user.findMany({
    select: { id: true, name: true, role: true, image: true, color: true, initials: true },
    orderBy: { name: "asc" },
  });
}
