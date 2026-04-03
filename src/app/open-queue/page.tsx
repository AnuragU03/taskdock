import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import BoardClient from "@/components/board/BoardClient";

export default async function OpenQueuePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const tasks = await prisma.task.findMany({
    where: {
      assignedToId: null,
      status: { notIn: ['completed', 'cancelled'] }
    },
    include: {
      assignee: { select: { id: true, name: true, image: true, color: true, initials: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  const allUsers = await prisma.user.findMany({
    select: { id: true, name: true, role: true, image: true, color: true, initials: true }
  });

  return (
    <div>
      <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg,#1A0D2E,#0D0820)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -20, top: -20, width: 120, height: 120, borderRadius: '50%', background: '#7C3AED', opacity: .12 }} />
        <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 24, fontWeight: 700, color: '#C084FC', letterSpacing: '-.4px', marginBottom: 6 }}>Open Queue</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,.6)', maxWidth: 500 }}>Unassigned creative tasks waiting for an owner. Pick up a task to start working on it.</p>
      </div>
      <BoardClient initialTasks={tasks} user={session.user} allUsers={allUsers} />
    </div>
  );
}
