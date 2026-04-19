import { prisma } from "./prisma";
import { TWENTY_HOURS_MS } from "./constants";

/**
 * Called from layout.tsx for superadmin/admin on login.
 * Checks all credentials with a renewalDate and sends
 * PAYMENT_REMINDER notifications at 4-day and 1-day thresholds.
 * Deduplication: skips if a reminder was already sent within the last 20 hours.
 */
export async function checkAndSendRenewalReminders(
  userId: string,
  workspaceId: string
) {
  try {
    const creds = await prisma.credential.findMany({
      where: { renewalDate: { not: null } },
    });

    const now = new Date();
    const nowMs = now.getTime();

    for (const cred of creds) {
      if (!cred.renewalDate) continue;

      const renewal = new Date(cred.renewalDate);
      const daysUntil = (renewal.getTime() - nowMs) / (1000 * 60 * 60 * 24);

      // ── OVERDUE — already past renewal date ──
      if (Math.ceil(daysUntil) <= 0) {
        const lastSent = cred.reminder1dAt?.getTime() ?? 0;
        if (nowMs - lastSent > TWENTY_HOURS_MS) {
          const overdueDays = Math.abs(Math.floor(daysUntil));
          await prisma.notification.create({
            data: {
              workspaceId,
              userId,
              text: `🚨 OVERDUE: "${cred.toolName}" renewal was due on ${cred.renewalDate} (${overdueDays > 0 ? `${overdueDays} day${overdueDays > 1 ? 's' : ''} ago` : 'today'}). Please pay immediately!`,
              type: "PAYMENT_REMINDER",
              metadata: JSON.stringify({ credentialId: cred.id, toolName: cred.toolName, renewalDate: cred.renewalDate, monthlyCost: cred.monthlyCost, daysUntil: Math.floor(daysUntil), threshold: "overdue" }),
            },
          });
          await prisma.credential.update({ where: { id: cred.id }, data: { reminder1dAt: now } });
        }
        continue; // Skip ahead-of-time reminders for overdue items
      }

      // ── 4-day reminder ──
      if (Math.ceil(daysUntil) === 4) {
        const lastSent = cred.reminder4dAt?.getTime() ?? 0;
        if (nowMs - lastSent > TWENTY_HOURS_MS) {
          await prisma.notification.create({
            data: {
              workspaceId,
              userId,
              text: `⊘ Payment reminder: "${cred.toolName}" renews on ${cred.renewalDate} (4 days away). Cost: ₹${cred.monthlyCost > 0 ? cred.monthlyCost.toLocaleString("en-IN") : "N/A"}.`,
              type: "PAYMENT_REMINDER",
              metadata: JSON.stringify({ credentialId: cred.id, toolName: cred.toolName, renewalDate: cred.renewalDate, monthlyCost: cred.monthlyCost, daysUntil: 4, threshold: "4d" }),
            },
          });
          await prisma.credential.update({ where: { id: cred.id }, data: { reminder4dAt: now } });
        }
      }

      // ── 3-day reminder ──
      if (Math.ceil(daysUntil) === 3) {
        const lastSent = cred.reminder3dAt?.getTime() ?? 0;
        if (nowMs - lastSent > TWENTY_HOURS_MS) {
          await prisma.notification.create({
            data: {
              workspaceId,
              userId,
              text: `⊘ Payment reminder: "${cred.toolName}" renews in 3 days. Action required!`,
              type: "PAYMENT_REMINDER",
              metadata: JSON.stringify({ credentialId: cred.id, toolName: cred.toolName, renewalDate: cred.renewalDate, monthlyCost: cred.monthlyCost, daysUntil: 3, threshold: "3d" }),
            },
          });
          await prisma.credential.update({ where: { id: cred.id }, data: { reminder3dAt: now } });
        }
      }

      // ── 1-day reminder ──
      if (Math.ceil(daysUntil) === 1) {
        const lastSent = cred.reminder1dAt?.getTime() ?? 0;
        if (nowMs - lastSent > TWENTY_HOURS_MS) {
          await prisma.notification.create({
            data: {
              workspaceId,
              userId,
              text: `🚨 URGENT: "${cred.toolName}" renews TOMORROW (${cred.renewalDate}). Make sure the payment is scheduled!`,
              type: "PAYMENT_REMINDER",
              metadata: JSON.stringify({ credentialId: cred.id, toolName: cred.toolName, renewalDate: cred.renewalDate, monthlyCost: cred.monthlyCost, daysUntil: 1, threshold: "1d" }),
            },
          });
          await prisma.credential.update({ where: { id: cred.id }, data: { reminder1dAt: now } });
        }
      }
    }
  } catch { /* silent — non-blocking */ }
}
