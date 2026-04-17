import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { markNotifsRead } from "@/app/actions/admin";
import NotificationsClient from "./NotificationsClient";

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const notifs = await prisma.notification.findMany({
    where: { userId: (session.user as any).id },
    orderBy: { createdAt: 'desc' }
  });

  // Mark as read immediately on page load
  if (notifs.some(n => !n.read)) {
    markNotifsRead();
  }

  // Serialize dates for client component
  const serialized = notifs.map(n => ({
    id: n.id,
    text: n.text,
    type: n.type,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
    taskId: n.taskId ?? null,
    metadata: n.metadata ?? null,
  }));

  return <NotificationsClient notifs={serialized} />;
}
