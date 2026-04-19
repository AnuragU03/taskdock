import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TWENTY_HOURS_MS } from "@/lib/constants";

export async function GET() {
  try {
    const now = new Date();
    const currentMs = now.getTime();
    const todayStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
    
    let createdCount = 0;
    let reminderCount = 0;

    // 1. RECURRING TASKS SPOTTING
    const recurringTasks = await prisma.task.findMany({
      where: { isRecurring: true }
    });

    for (const task of recurringTasks) {
      if (!task.recurringPattern || !task.recurringTime) continue;

      // Check if it's past the designated time today
      const [h, m] = task.recurringTime.split(":").map(Number);
      const executionTimeToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
      
      if (currentMs < executionTimeToday.getTime()) continue;

      const pattern = task.recurringPattern; // daily, weekly, biweekly, monthly
      
      // Check if we created one TODAY already
      // Clones have isRecurring: false and match the master task's title/creator
      const existingToday = await prisma.task.findFirst({
        where: {
          title: task.title,
          isRecurring: false,
          createdById: task.createdById,
          createdAt: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
          }
        }
      });
      
      if (existingToday) continue; 

      // If not created today, check if the pattern threshold is met since the LATEST clone
      const latestClone = await prisma.task.findFirst({
         where: { title: task.title, isRecurring: false, createdById: task.createdById },
         orderBy: { createdAt: 'desc' }
      });
      
      let shouldCreate = false;
      if (!latestClone) {
        shouldCreate = true; // First time execution
      } else {
        const msSinceLast = currentMs - new Date(latestClone.createdAt).getTime();
        const daysSinceLast = Math.floor(msSinceLast / (1000 * 60 * 60 * 24));
        
        if (pattern === 'daily' && daysSinceLast >= 1) shouldCreate = true;
        if (pattern === 'weekly' && daysSinceLast >= 7) shouldCreate = true;
        if (pattern === 'biweekly' && daysSinceLast >= 14) shouldCreate = true;
        if (pattern === 'monthly' && daysSinceLast >= 30) shouldCreate = true;
      }

      if (shouldCreate) {
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
            dueAt: task.dueAt ? new Date(currentMs + 172800000) : null,
            refLink: task.refLink,
            createdById: task.createdById,
            isRecurring: false,
            events: JSON.stringify([{
              id: `ea${Date.now()}`, type: 'TASK_CREATED', label: `Task cloned from recurring schedule`, by: task.createdById, at: now.toISOString()
            }])
          }
        });
        createdCount++;
      }
    }

    // 2. CREDENTIAL RENEWAL REMINDERS
    const workspace = await prisma.workspace.findFirst();
    const admins = await prisma.user.findMany({
      where: { role: { in: ['admin', 'superadmin'] } }
    });

    if (workspace && admins.length > 0) {
      const creds = await prisma.credential.findMany({
        where: { renewalDate: { not: null } },
      });

      for (const cred of creds) {
        if (!cred.renewalDate) continue;
        const renewal = new Date(cred.renewalDate);
        const diffMs = renewal.getTime() - currentMs;
        const daysUntil = diffMs / (1000 * 60 * 60 * 24);
        const ceilDays = Math.ceil(daysUntil);

        const sendToAdmins = async (text: string, type: string, threshold: string, lastField: 'reminder4dAt' | 'reminder3dAt' | 'reminder1dAt') => {
          const lastSent = (cred as any)[lastField]?.getTime() ?? 0;
          if (currentMs - lastSent > TWENTY_HOURS_MS) {
            for (const admin of admins) {
              await prisma.notification.create({
                data: {
                  workspaceId: workspace.id,
                  userId: admin.id,
                  text,
                  type,
                  metadata: JSON.stringify({ credentialId: cred.id, toolName: cred.toolName, renewalDate: cred.renewalDate, threshold }),
                },
              });
            }
            await prisma.credential.update({ where: { id: cred.id }, data: { [lastField]: now } });
            reminderCount++;
          }
        };

        if (ceilDays <= 0) {
          // Already overdue — remind every day until renewed
          await sendToAdmins(`🚨 OVERDUE: "${cred.toolName}" renewal was due on ${cred.renewalDate}. Please pay now!`, 'PAYMENT_REMINDER', 'overdue', 'reminder1dAt');
        } else if (ceilDays === 4) {
          await sendToAdmins(`⊘ Payment reminder: "${cred.toolName}" renews in 4 days (${cred.renewalDate}).`, 'PAYMENT_REMINDER', '4d', 'reminder4dAt');
        } else if (ceilDays === 3) {
          await sendToAdmins(`⊘ Payment reminder: "${cred.toolName}" renews in 3 days. Action required!`, 'PAYMENT_REMINDER', '3d', 'reminder3dAt');
        } else if (ceilDays === 1) {
          await sendToAdmins(`🚨 URGENT: "${cred.toolName}" renews TOMORROW. Make sure payment is handled!`, 'PAYMENT_REMINDER', '1d', 'reminder1dAt');
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      tasksCreated: createdCount, 
      remindersSent: reminderCount 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

