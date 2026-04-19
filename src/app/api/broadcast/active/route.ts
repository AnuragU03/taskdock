import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — fetch active broadcast notifications for the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json([], { status: 401 });

    const userId = (session.user as any).id as string;

    const notifs = await prisma.notification.findMany({
      where: {
        userId,
        type: "BROADCAST",
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json(
      notifs.map((n) => {
        const meta = n.metadata ? JSON.parse(n.metadata) : {};
        return {
          id: n.id,
          message: meta.message || n.text,
          senderName: meta.senderName || "Admin",
          senderId: meta.senderId,
          broadcastId: meta.broadcastId,
          createdAt: n.createdAt,
          read: n.read,
          acknowledgedBy: meta.acknowledgedBy || [],
        };
      })
    );
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
