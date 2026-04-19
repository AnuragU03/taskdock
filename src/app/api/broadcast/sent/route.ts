import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — fetch broadcasts sent BY the current admin, grouped by broadcastId
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json([], { status: 401 });

    const senderId = (session.user as any).id as string;

    // Fetch all BROADCAST notifications where this user is the sender
    // We fetch all and filter by metadata.senderId (stored in JSON)
    const all = await prisma.notification.findMany({
      where: { type: "BROADCAST" },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    // Filter to only those sent by this admin
    const mine = all.filter((n) => {
      try {
        const meta = JSON.parse(n.metadata ?? "{}");
        return meta.senderId === senderId;
      } catch { return false; }
    });

    // Group by broadcastId — one broadcast goes to N recipients, each a separate DB row
    const grouped = new Map<string, {
      broadcastId: string;
      message: string;
      sentAt: Date;
      recipients: { userId: string; name?: string; acked: boolean; response?: string; replyText?: string; ackedAt?: string }[];
    }>();

    for (const n of mine) {
      const meta = JSON.parse(n.metadata ?? "{}");
      const bId = meta.broadcastId ?? n.id;

      if (!grouped.has(bId)) {
        grouped.set(bId, {
          broadcastId: bId,
          message: meta.message ?? n.text,
          sentAt: n.createdAt,
          recipients: [],
        });
      }

      const ackEntry = (meta.acknowledgedBy ?? []).find((a: any) => a.userId === n.userId);
      grouped.get(bId)!.recipients.push({
        userId: n.userId,
        acked: !!ackEntry,
        response: ackEntry?.response,
        replyText: ackEntry?.replyText,
        ackedAt: ackEntry?.at,
      });
    }

    // Enrich with user names
    const userIds = [...new Set(mine.map(n => n.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, color: true, initials: true },
    });
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));

    const result = Array.from(grouped.values()).map(g => ({
      ...g,
      sentAt: g.sentAt.toISOString(),
      recipients: g.recipients.map(r => ({
        ...r,
        name: userMap[r.userId]?.name ?? "Unknown",
        color: userMap[r.userId]?.color,
        initials: userMap[r.userId]?.initials,
      })),
    }));

    // Sort newest first
    result.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

    return NextResponse.json(result);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
