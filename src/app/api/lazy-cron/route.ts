import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    
    // Find tasks that are recurring
    const recurringTasks = await prisma.task.findMany({
      where: { isRecurring: true }
    });

    const now = new Date();
    const currentMs = now.getTime();
    
    let createdCount = 0;

    for (const task of recurringTasks) {
      if (!task.recurringPattern || !task.recurringTime) continue;

      // Check if it's past the designated time today
      const [h, m] = task.recurringTime.split(":").map(Number);
      const executionTimeToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
      
      if (currentMs < executionTimeToday.getTime()) continue;

      // Check if we already created a clone today for daily
      // For weekly/monthly we need logic based on created/last executed time.
      // To keep it simple, we compare current date to createdAt or a stored metadata flag.
      // We'll read the latest clone by looking for tasks created from this one.
      
      const pattern = task.recurringPattern; // daily, weekly, biweekly, monthly
      
      // Let's see if there's a task with the exact same title created recently
      // Simple heuristic: 
      let msSinceStart = currentMs - new Date(task.createdAt).getTime();
      let daysSinceStart = Math.floor(msSinceStart / (1000 * 60 * 60 * 24));
      
      let shouldCreate = false;
      
      // Fast check to see if we created one recently
      const existingClones = await prisma.task.findMany({
        where: {
          title: task.title,
          isRecurring: false, // clones are not recurring themselves to avoid recursive explosion
          createdById: task.createdById, // same owner
          createdAt: {
            gte: new Date(currentMs - (1000 * 60 * 60 * 23)) // past 23 hrs
          }
        }
      });
      
      if (existingClones.length > 0) continue; // we already spawned one recently

      // If it's a completely new day based on pattern
      const latestClone = await prisma.task.findFirst({
         where: { title: task.title, isRecurring: false, createdById: task.createdById },
         orderBy: { createdAt: 'desc' }
      });
      
      const msSinceLast = latestClone ? (currentMs - new Date(latestClone.createdAt).getTime()) : msSinceStart;
      const daysSinceLast = Math.floor(msSinceLast / (1000 * 60 * 60 * 24));
      
      if (pattern === 'daily' && daysSinceLast >= 1) shouldCreate = true;
      if (pattern === 'weekly' && daysSinceLast >= 7) shouldCreate = true;
      if (pattern === 'biweekly' && daysSinceLast >= 14) shouldCreate = true;
      if (pattern === 'monthly' && daysSinceLast >= 30) shouldCreate = true;

      if (shouldCreate) {
        // Clone the task
        await prisma.task.create({
          data: {
            workspaceId: task.workspaceId,
            title: task.title,
            desc: task.desc,
            status: task.assignedToId ? 'assigned' : 'open',
            category: task.category,
            priority: task.priority,
            weight: task.weight,
            type: task.type,
            assignedToId: task.assignedToId,
            dueAt: task.dueAt ? new Date(currentMs + 172800000) : null, // Default 2 days for new drop
            refLink: task.refLink,
            createdById: task.createdById,
            isRecurring: false, // The clone itself is not recurring
            events: JSON.stringify([{
              id: `ea${Date.now()}`, type: 'TASK_CREATED', label: `Task cloned from recurring schedule`, by: task.createdById, at: now.toISOString()
            }])
          }
        });
        createdCount++;
      }
    }

    return NextResponse.json({ success: true, evaluated: recurringTasks.length, created: createdCount });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
