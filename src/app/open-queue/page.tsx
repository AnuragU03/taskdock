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
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg0)' }}>
        <h1 style={{ fontFamily: 'var(--font-sans), sans-serif', fontSize: 24, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-.4px' }}>Open Queue</h1>
        <p style={{ fontSize: 14, color: 'var(--t3)', maxWidth: 500, marginTop: 4 }}>Unassigned tasks waiting for an owner. Pick up a task to start working on it.</p>
      </div>
      <BoardClient initialTasks={tasks} user={session.user} allUsers={allUsers} hideTitle={true} />
    </div>
  );
}
