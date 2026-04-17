import { prisma } from "./prisma";

const TWENTY_HOURS_MS = 20 * 60 * 60 * 1000;

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

      // ── 4-day reminder ──
      if (daysUntil > 0 && daysUntil <= 4) {
        const lastSent = cred.reminder4dAt?.getTime() ?? 0;
        if (nowMs - lastSent > TWENTY_HOURS_MS) {
          await prisma.notification.create({
            data: {
              workspaceId,
              userId,
              text: `⊘ Payment reminder: "${cred.toolName}" renews on ${cred.renewalDate} (${Math.ceil(daysUntil)} day${Math.ceil(daysUntil) !== 1 ? "s" : ""} away). Cost: ₹${cred.monthlyCost > 0 ? cred.monthlyCost.toLocaleString("en-IN") : "N/A"}.`,
              type: "PAYMENT_REMINDER",
              metadata: JSON.stringify({
                credentialId: cred.id,
                toolName: cred.toolName,
                renewalDate: cred.renewalDate,
                monthlyCost: cred.monthlyCost,
                daysUntil: Math.ceil(daysUntil),
                threshold: "4d",
              }),
            },
          });
          await prisma.credential.update({
            where: { id: cred.id },
            data: { reminder4dAt: now },
          });
        }
      }

      // ── 1-day reminder ──
      if (daysUntil > 0 && daysUntil <= 1) {
        const lastSent = cred.reminder1dAt?.getTime() ?? 0;
        if (nowMs - lastSent > TWENTY_HOURS_MS) {
          await prisma.notification.create({
            data: {
              workspaceId,
              userId,
              text: `🚨 URGENT: "${cred.toolName}" renews TOMORROW (${cred.renewalDate}). Make sure the payment is scheduled!`,
              type: "PAYMENT_REMINDER",
              metadata: JSON.stringify({
                credentialId: cred.id,
                toolName: cred.toolName,
                renewalDate: cred.renewalDate,
                monthlyCost: cred.monthlyCost,
                daysUntil: Math.ceil(daysUntil),
                threshold: "1d",
              }),
            },
          });
          await prisma.credential.update({
            where: { id: cred.id },
            data: { reminder1dAt: now },
          });
        }
      }
    }
  } catch (err) {
    // Silent fail — reminder check should never break the layout
    console.error("[RenewalReminder]", err);
  }
}
