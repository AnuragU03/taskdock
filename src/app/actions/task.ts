"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createTask(formData: any) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !(session.user as any).id) throw new Error("Unauthorized");

  const { title, desc, type, priority, category, dueAt, assignedTo, refLink, weight } = formData;
  const isAdmin = (session.user as any).role === 'admin';
  // No assignee = open queue, with assignee = assigned (admin tasks go to under_review)
  const hasAssignee = !!assignedTo;
  const status = hasAssignee ? (isAdmin ? 'under_review' : 'assigned') : 'open';

  let workspace = await prisma.workspace.findFirst();
  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: { name: 'Main Workspace', slug: 'main' }
    });
  }

  const eventsList = [
    { id: `ea${Date.now()}`, type: 'TASK_CREATED', label: `Task created${isAdmin ? ' (Admin review)' : ''}`, by: (session.user as any).id, at: new Date().toISOString() },
    { 
      id: `eb${Date.now()}`,
      type: hasAssignee ? 'TASK_ASSIGNED' : 'TASK_OPENED',
      label: hasAssignee ? 'Assigned to user' : 'Published to open queue',
      by: (session.user as any).id,
      at: new Date().toISOString()
    }
  ];

  const task = await prisma.task.create({
    data: {
      workspaceId: workspace.id,
      title,
      desc,
      weight: weight ? Number(weight) : 5,
      status,
      category,
      priority: priority || 'medium',
      dueAt: dueAt ? new Date(dueAt) : null,
      refLink,
      type: type || 'assigned',
      assignedToId: hasAssignee ? assignedTo : null,
      createdById: (session.user as any).id,
      events: JSON.stringify(eventsList),
      comments: JSON.stringify([])
    }
  });

  revalidatePath('/');
  revalidatePath('/open-queue');
  return task;
}

export async function updateTask(taskId: string, data: any) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !(session.user as any).id) throw new Error("Unauthorized");

  const taskObj = await prisma.task.findUnique({ where: { id: taskId } });
  const existingEvents = taskObj?.events ? JSON.parse(taskObj.events) : [];
  
  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...data,
      events: JSON.stringify([
        ...existingEvents,
        { id: `eu${Date.now()}`, type: 'TASK_UPDATED', label: 'Task updated', by: (session.user as any).id, at: new Date().toISOString() }
      ])
    }
  });

  revalidatePath('/');
  revalidatePath(`/task/${taskId}`);
  return task;
}

export async function pickupTask(taskId: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !(session.user as any).id) throw new Error("Unauthorized");

  const taskObj = await prisma.task.findUnique({ where: { id: taskId } });
  const existingEvents = taskObj?.events ? JSON.parse(taskObj.events) : [];

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      status: 'in_progress',
      assignedToId: (session.user as any).id,
      pickedUpAt: new Date(),
      events: JSON.stringify([
        ...existingEvents,
        { id: `ep${Date.now()}`, type: 'TASK_PICKED_UP', label: `Picked up by ${session.user.name}`, by: (session.user as any).id, at: new Date().toISOString() }
      ])
    }
  });

  revalidatePath('/');
  revalidatePath('/open-queue');
  revalidatePath(`/task/${taskId}`);
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

  revalidatePath('/');
  revalidatePath(`/task/${taskId}`);
  return task;
}

export async function reviewTask(taskId: string, approved: boolean, fbText: string, score: number) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");
  const userRole = (session.user as any).role;
  if (userRole !== 'admin' && userRole !== 'superadmin') throw new Error("Requires admin role");

  const taskObj = await prisma.task.findUnique({ where: { id: taskId } });
  const existingEvents = taskObj?.events ? JSON.parse(taskObj.events) : [];
  
  let productivity = null;
  const completedAt = new Date();
  
  if (approved && taskObj?.pickedUpAt) {
    let hours = (completedAt.getTime() - new Date(taskObj.pickedUpAt).getTime()) / (1000 * 60 * 60);
    if (hours < 1) hours = 1; // Clamp to avoid infinity score
    const w = taskObj?.weight || 5;
    productivity = Number(((w * score) / hours).toFixed(2));
  }

  const data: any = {
    status: approved ? 'completed' : 'rejected',
    fbText,
    adminScore: score,
    completedAt,
    ...(productivity !== null && { productivity }),
    events: JSON.stringify([
      ...existingEvents,
      { id: `er${Date.now()}`, type: approved ? 'TASK_APPROVED' : 'TASK_REJECTED', label: approved ? `Approved by ${session.user.name} (Score: ${score}/5)` : `Rejected by ${session.user.name} (Score: ${score}/5)`, by: (session.user as any).id, at: new Date().toISOString() }
    ])
  };

  const task = await prisma.task.update({ where: { id: taskId }, data });

  if (approved && taskObj?.assignedToId && taskObj.dueAt) {
    const isLate = new Date() > new Date(taskObj.dueAt);
    
    // Award brownie point if completed before deadline, Penalize -1 if completed past deadline
    await prisma.user.update({
      where: { id: taskObj.assignedToId },
      data: { browniePoints: { increment: isLate ? -1 : 1 } }
    });
  }

  revalidatePath('/');
  revalidatePath('/leaderboard');
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

  revalidatePath('/');
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

export async function generateBrief(title: string, category?: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return null;
  
  await new Promise(r => setTimeout(r, 1200)); 
  
  const brief = `◈ **Objective:** We need to execute on "${title}". Ensure all deliverables meet the highest quality standards.

⊞ **Style/Direction:** Follow our established brand guidelines. Keep the tone professional yet approachable.

◱ **Key Deliverables:**
- Initial concept / draft
- Refined version based on feedback
- Final high-resolution assets

⎔ **Constraints:** Please stick to the agreed timeline. Flag any blockers early.`;
  
  return category ? `[Category: ${category}]\n\n${brief}` : brief;
}

export async function bulkCreateTasks(tasks: any[]) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !(session.user as any).id) throw new Error("Unauthorized");
  const userId = (session.user as any).id;
  const isAdmin = (session.user as any).role === 'admin';

  let workspace = await prisma.workspace.findFirst();
  if (!workspace) {
    workspace = await prisma.workspace.create({ data: { name: 'Main Workspace', slug: 'main' } });
  }

  const tasksToCreate = tasks.map(t => {
    const hasAssignee = !!t.assignedTo;
    const status = hasAssignee ? (isAdmin ? 'under_review' : 'assigned') : 'open';
    const eventsList = [
      { id: `ea${Date.now()}`, type: 'TASK_CREATED', label: `Task created (Bulk)`, by: userId, at: new Date().toISOString() }
    ];

    return {
      workspaceId: workspace.id,
      title: t.title || 'Untitled Batch Task',
      desc: t.desc || '',
      weight: t.weight ? Number(t.weight) : 5,
      status,
      category: t.category || 'General',
      priority: t.priority || 'medium',
      type: hasAssignee ? 'assigned' : 'open',
      assignedToId: t.assignedTo || null,
      dueAt: t.dueAt ? new Date(t.dueAt) : null,
      refLink: t.refLink || null,
      createdById: userId,
      events: JSON.stringify(eventsList)
    };
  });

  await prisma.task.createMany({ data: tasksToCreate });

  revalidatePath('/');
  revalidatePath('/open-queue');
  return { success: true, count: tasks.length };
}

export async function deleteTask(taskId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");
  
  const taskObj = await prisma.task.findUnique({ where: { id: taskId } });
  const isAdmin = ['admin', 'superadmin'].includes((session.user as any).role);
  if (!isAdmin && taskObj?.createdById !== (session.user as any).id) {
    throw new Error("Requires admin role or task creator");
  }

  await prisma.task.delete({ where: { id: taskId } });

  revalidatePath('/');
  revalidatePath('/open-queue');
  return true;
}
