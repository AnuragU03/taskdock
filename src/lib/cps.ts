import { prisma } from './prisma';

export async function calculateAllCPS() {
  const users = await prisma.user.findMany({
    include: {
      tasksAssigned: true,
      attendance: true
    }
  });

  const results = users.map(user => {
    // 1. CF: Completion Factor
    const assignedTasks = user.tasksAssigned || [];
    if (assignedTasks.length === 0) {
      return { user, cps: 0, cf: 0, tf: 0, ef: 0, tasksCompleted: 0, tasksAssigned: 0 };
    }
    
    // Count as completed if done or submitted for review
    const completedTasks = assignedTasks.filter(t => ['completed', 'submitted'].includes(t.status));
    let cf = (completedTasks.length / assignedTasks.length) * 100;
    cf = Math.min(Math.max(cf, 0), 100);

    // 2. TF: Timeliness Factor
    let tfScores: number[] = [];
    let taskWeights: number[] = [];
    
    for (const task of completedTasks) {
      if (!task.dueAt) continue; 
      
      let submitTime = task.completedAt || new Date();
      if (task.events) {
        try {
          const events = JSON.parse(task.events);
          const subEvent = events.find((e: any) => e.type === 'TASK_SUBMITTED');
          if (subEvent) submitTime = new Date(subEvent.at);
        } catch { } 
      }
      
      const startTime = task.pickedUpAt || task.createdAt;
      const actualHours = (submitTime.getTime() - startTime.getTime()) / 3600000;
      const deadlineHours = (task.dueAt.getTime() - startTime.getTime()) / 3600000;
      
      if (deadlineHours <= 0) continue; 
      
      const deviation = (actualHours - deadlineHours) / deadlineHours;
      
      // TF exponential decay logic (drop abs to reward early completion)
      let tf_task = 100 * Math.exp(-2.0 * deviation);
      tf_task = Math.min(Math.max(tf_task, 50), 200); // capped at 50-200
      
      tfScores.push(tf_task * deadlineHours);
      taskWeights.push(deadlineHours);
    }
    
    const tfSumWeights = taskWeights.reduce((a,b)=>a+b, 0);
    const tf = tfSumWeights > 0 ? (tfScores.reduce((a,b)=>a+b, 0) / tfSumWeights) : 100;

    // 3. EF: Efficiency Factor
    const totalClocked = (user.attendance || []).reduce((acc, a) => acc + (a.hoursWorked || 0), 0);
    let ef = 100;
    if (totalClocked > 0) {
      ef = (tfSumWeights / totalClocked) * 100;
      ef = Math.min(ef, 150); // cap
    } else if (completedTasks.length > 0 && tfSumWeights > 0) {
      // Completed items with no clocked hours (exceptional productivity trick)
      ef = 150;
    }

    let manualMod = 0;
    (user.attendance || []).forEach(a => {
      if ((a as any).morningProd === 'Productive') manualMod += 10;
      if ((a as any).morningProd === 'Not productive') manualMod -= 10;
      if ((a as any).afternoonProd === 'Productive') manualMod += 10;
      if ((a as any).afternoonProd === 'Not productive') manualMod -= 10;
    });

    const baseCps = (0.3 * cf) + (0.4 * tf) + (0.3 * ef);
    const cps = baseCps + manualMod;
    
    return {
      user,
      cps: Number(cps.toFixed(2)),
      cf: Number(cf.toFixed(2)),
      tf: Number(tf.toFixed(2)),
      ef: Number(ef.toFixed(2)),
      tasksCompleted: completedTasks.length,
      tasksAssigned: assignedTasks.length
    };
  });
  
  return results.sort((a, b) => b.cps - a.cps);
}
