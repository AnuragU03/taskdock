import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Av } from "@/components/ui/Atoms";

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const members = await prisma.user.findMany({
    orderBy: { browniePoints: 'desc' }
  });

  return (
    <div style={{ padding: '30px 40px', maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 24, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-.4px', marginBottom: 6 }}>Leaderboard</h1>
      <p style={{ fontSize: 14, color: 'var(--t3)', marginBottom: 24 }}>Top contributors and creatives across the workspace.</p>
      
      <div style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {members.map((m: any, i: number) => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: i < members.length - 1 ? '1px solid var(--border)' : 'none', background: i === 0 ? 'var(--accent)08' : 'transparent' }}>
            <div style={{ width: 44, fontSize: 18, fontFamily: 'DM Mono, monospace', fontWeight: 600, color: i === 0 ? '#FCD34D' : i === 1 ? '#94A3B8' : i === 2 ? '#B45309' : 'var(--t4)' }}>
              #{i + 1}
            </div>
            <Av user={m} sz={44} />
            <div style={{ flex: 1, marginLeft: 16 }}>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 16, color: 'var(--t1)' }}>{m.name}</div>
              <div style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '.05em', marginTop: 2 }}>{m.role}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 24, fontFamily: 'DM Mono, monospace', fontWeight: 700, color: 'var(--accent)', letterSpacing: '-1px' }}>{m.browniePoints}</div>
              <div style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '.1em', marginTop: -2 }}>Points</div>
            </div>
          </div>
        ))}
        {members.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--t4)', fontSize: 14 }}>No members found.</div>
        )}
      </div>
    </div>
  );
}
