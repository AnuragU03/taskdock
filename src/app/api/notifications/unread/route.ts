import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: fetch unread notifications for current user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json([], { status: 401 });

  const userId = (session.user as any).id as string;

  const notifs = await prisma.notification.findMany({
    where: { userId, read: false },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: { id: true, text: true, type: true, read: true, createdAt: true, taskId: true },
  });

  return NextResponse.json(notifs);
}

// POST: mark specific notification IDs as read
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ ok: false }, { status: 401 });

  const userId = (session.user as any).id as string;
  const body = await req.json().catch(() => ({}));
  const ids: string[] = body.ids ?? [];

  if (ids.length > 0) {
    await prisma.notification.updateMany({
      where: { userId, id: { in: ids } },
      data: { read: true },
    });
  } else {
    // Mark all read if no ids provided
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  return NextResponse.json({ ok: true });
}
