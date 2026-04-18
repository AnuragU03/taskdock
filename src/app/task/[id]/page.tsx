import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import DetailClient from "./DetailClient";

export default async function TaskDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect('/login');
  }

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      assignee: { select: { id: true, name: true, image: true, color: true, initials: true } },
      createdBy: { select: { id: true, name: true, image: true, color: true, initials: true } }
    }
  });

  if (!task) {
    notFound();
  }

  const allUsers = await prisma.user.findMany({
    select: { id: true, name: true, role: true, image: true, color: true, initials: true }
  });

  return (
    <DetailClient 
      initTask={task} 
      user={session.user} 
      allUsers={allUsers} 
    />
  );
}
