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
      OR: [
        { assignedToId: null, status: { notIn: ['completed', 'cancelled'] } },
        { status: 'abandoned' }
      ]
    },
    include: {
      assignee: { select: { id: true, name: true, image: true, color: true, initials: true } },
      createdBy: { select: { id: true, name: true, image: true, color: true, initials: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  const abandonedCount = tasks.filter(t => t.status === 'abandoned').length;

  const allUsers = await prisma.user.findMany({
    select: { id: true, name: true, role: true, image: true, color: true, initials: true, email: true }
  });

  return (
    <div style={{ padding: '0 0 40px' }}>
      <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)', background: 'var(--bg0)' }}>
        <h1 style={{ fontFamily: 'var(--font-sans), sans-serif', fontSize: 26, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-.6px' }}>Open Queue</h1>
        <p style={{ fontSize: 14, color: 'var(--t3)', maxWidth: 500, marginTop: 4 }}>
          Unassigned tasks and <span style={{ color: 'var(--red)', fontWeight: 600 }}>{abandonedCount} abandoned</span> tasks waiting for an owner.
        </p>
      </div>
      <BoardClient initialTasks={tasks} user={session.user} allUsers={allUsers} hideTitle={true} isOpenQueue={true} />
    </div>
  );
}
