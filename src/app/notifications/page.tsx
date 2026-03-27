import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Av } from "@/components/ui/Atoms";
import { markNotifsRead } from "@/app/actions/admin";

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const notifs = await prisma.notification.findMany({
    where: { userId: (session.user as any).id },
    orderBy: { createdAt: 'desc' }
  });

  // Mark as read immediately on page load
  if (notifs.some(n => !n.read)) {
    markNotifsRead();
  }

  const fmtRel = (s: Date) => {
    const m = Math.floor((Date.now() - new Date(s).getTime()) / 60000);
    return m < 1 ? 'just now' : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.floor(m / 60)}h ago` : `${Math.floor(m / 1440)}d ago`;
  };

  return (
    <div style={{ padding: '30px 40px', maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 24, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-.4px', marginBottom: 6 }}>Notifications</h1>
      <p style={{ fontSize: 14, color: 'var(--t3)', marginBottom: 24 }}>Your recent alerts and task updates.</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {notifs.map(n => (
          <div key={n.id} style={{ background: n.read ? 'var(--bg1)' : 'var(--accent-dim)', border: `1px solid ${n.read ? 'var(--border)' : 'var(--accent)33'}`, borderRadius: 12, padding: '16px 20px', display: 'flex', gap: 14 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: n.read ? 'transparent' : 'var(--accent)', marginTop: 6 }} />
            <div>
              <div style={{ fontSize: 15, color: 'var(--t1)', lineHeight: 1.6 }}>{n.text}</div>
              <div style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--t4)', marginTop: 4 }}>{fmtRel(n.createdAt)}</div>
            </div>
          </div>
        ))}
        {notifs.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--t4)', fontSize: 14, background: 'var(--bg1)', borderRadius: 12 }}>You have no notifications.</div>
        )}
      </div>
    </div>
  );
}
