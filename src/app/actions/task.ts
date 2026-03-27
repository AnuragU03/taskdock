"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createTask(formData: any) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const { title, desc, type, priority, category, dueAt, assignedTo, refLink } = formData;
  const isAdmin = (session.user as any).role === 'admin';
  const status = isAdmin ? 'under_review' : type === 'assigned' ? 'assigned' : 'open';

  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id }
  });
  if (!workspaceMember) throw new Error("User has no workspace setup");

  const eventsList = [
    { id: `ea${Date.now()}`, type: 'TASK_CREATED', label: `Task created${isAdmin ? ' (Admin review)' : ''}`, by: session.user.id, at: new Date().toISOString() },
    { 
      id: `eb${Date.now()}`,
      type: isAdmin ? 'TASK_REVIEW_CREATED' : type === 'assigned' ? 'TASK_ASSIGNED' : 'TASK_OPENED',
      label: isAdmin ? 'Opened for admin review' : type === 'assigned' ? 'Assigned to user' : 'Published to open queue',
      by: session.user.id,
      at: new Date().toISOString()
    }
  ];

  const task = await prisma.task.create({
    data: {
      workspaceId: workspaceMember.workspaceId,
      title,
      desc,
      status,
      category,
      priority: priority || 'medium',
      dueAt: dueAt ? new Date(dueAt) : null,
      refLink,
      type: type || 'assigned',
      assignedToId: type === 'assigned' && assignedTo ? assignedTo : null,
      createdById: session.user.id,
      events: JSON.stringify(eventsList),
      comments: JSON.stringify([])
    }
  });

  revalidatePath('/');
  return task;
}

export async function updateTask(taskId: string, data: any) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const taskObj = await prisma.task.findUnique({ where: { id: taskId } });
  const existingEvents = taskObj?.events ? JSON.parse(taskObj.events) : [];
  
  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...data,
      events: JSON.stringify([
        ...existingEvents,
        { id: `eu${Date.now()}`, type: 'TASK_UPDATED', label: 'Task updated', by: session.user.id, at: new Date().toISOString() }
      ])
    }
  });

  revalidatePath('/');
  revalidatePath(`/task/${taskId}`);
  return task;
}

export async function pickupTask(taskId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const taskObj = await prisma.task.findUnique({ where: { id: taskId } });
  const existingEvents = taskObj?.events ? JSON.parse(taskObj.events) : [];

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      status: 'in_progress',
      assignedToId: (session.user as any).id,
      events: JSON.stringify([
        ...existingEvents,
        { id: `ep${Date.now()}`, type: 'TASK_PICKED_UP', label: `Picked up by ${session.user.name}`, by: (session.user as any).id, at: new Date().toISOString() }
      ])
    }
  });

  revalidatePath('/');
  revalidatePath(`/open-queue`);
  return task;
}

export async function submitWork(taskId: string, subText: string, subLink: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");
  
  const taskObj = await prisma.task.findUnique({ where: { id: taskId } });
  const existingEvents = taskObj?.events ? JSON.parse(taskObj.events) : [];

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      status: 'submitted',
      subText,
      subLink,
      events: JSON.stringify([
        ...existingEvents,
        { id: `es${Date.now()}`, type: 'TASK_SUBMITTED', label: 'Work submitted', by: (session.user as any).id, at: new Date().toISOString() }
      ])
    }
  });

  revalidatePath(`/task/${taskId}`);
  return task;
}

export async function reviewTask(taskId: string, approved: boolean, fbText: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");
  if ((session.user as any).role !== 'admin') throw new Error("Requires admin role");

  const taskObj = await prisma.task.findUnique({ where: { id: taskId } });
  const existingEvents = taskObj?.events ? JSON.parse(taskObj.events) : [];
  
  const data: any = {
    status: approved ? 'completed' : 'rejected',
    fbText,
    events: JSON.stringify([
      ...existingEvents,
      { id: `er${Date.now()}`, type: approved ? 'TASK_APPROVED' : 'TASK_REJECTED', label: approved ? `Approved by ${session.user.name}` : `Rejected by ${session.user.name}`, by: (session.user as any).id, at: new Date().toISOString() }
    ])
  };

  const task = await prisma.task.update({ where: { id: taskId }, data });

  if (approved && taskObj?.assignedToId && taskObj.dueAt && new Date() < new Date(taskObj.dueAt)) {
    // Award brownie point if completed before deadline
    await prisma.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId: taskObj.workspaceId, userId: taskObj.assignedToId } },
      data: { browniePoints: { increment: 1 } }
    });
  }

  revalidatePath(`/task/${taskId}`);
  return task;
}

export async function reopenTask(taskId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");

  const taskObj = await prisma.task.findUnique({ where: { id: taskId } });
  const existingEvents = taskObj?.events ? JSON.parse(taskObj.events) : [];

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      status: 'reopened',
      events: JSON.stringify([
        ...existingEvents,
        { id: `ero${Date.now()}`, type: 'TASK_REOPENED', label: 'Reopened', by: (session.user as any).id, at: new Date().toISOString() }
      ])
    }
  });

  revalidatePath(`/task/${taskId}`);
  return task;
}

export async function addComment(taskId: string, text: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");

  const taskObj = await prisma.task.findUnique({ where: { id: taskId } });
  const existingComments = taskObj?.comments ? JSON.parse(taskObj.comments) : [];

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      comments: JSON.stringify([
        ...existingComments,
        { id: `c${Date.now()}`, aId: (session.user as any).id, text, at: new Date().toISOString() }
      ])
    }
  });

  revalidatePath(`/task/${taskId}`);
  return task;
}
