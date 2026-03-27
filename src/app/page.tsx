import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import BoardClient from "@/components/board/BoardClient";

export default async function BoardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect('/login');
  }

  // Fetch all tasks with basic assignee info
  const tasks = await prisma.task.findMany({
    include: {
      assignee: {
        select: { id: true, name: true, image: true, color: true, initials: true }
      },
      comments: { select: { id: true } } // just get count by having them populated
    },
    orderBy: { createdAt: 'desc' }
  });

  // Fetch all users for the assignees filter
  const allUsers = await prisma.user.findMany({
    select: { id: true, name: true, role: true, image: true, color: true, initials: true }
  });

  return (
    <BoardClient 
      initialTasks={tasks} 
      user={session.user} 
      allUsers={allUsers} 
    />
  );
}
