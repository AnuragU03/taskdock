import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getBlobSasUrl } from "@/lib/blob";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  const userId = (session.user as any).id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      documents: { orderBy: { uploadedAt: 'desc' } },
      tasksAssigned: {
        where: { status: 'completed', productivity: { not: null } },
        select: { productivity: true }
      }
    }
  });

  const docsWithUrls = await Promise.all(
    (user?.documents || []).map(async (doc) => ({
      ...doc,
      secureUrl: await getBlobSasUrl(doc.blobPath)
    }))
  );


  // Calculate stats
  const tasks = user?.tasksAssigned || [];
  let avgProd = 0;
  if (tasks.length > 0) {
    avgProd = Number((tasks.reduce((s: number, t: any) => s + (t.productivity || 0), 0) / tasks.length).toFixed(1));
  }

  return (
    <ProfileClient 
      user={{
        id: user?.id || '',
        name: user?.name || '',
        email: user?.email || '',
        image: user?.image,
        role: user?.role || 'employee',
        browniePoints: user?.browniePoints || 0,
        profile: user?.profile,
        documents: docsWithUrls,
        avgProductivity: avgProd,
        completedTasks: tasks.length
      }}
    />
  );
}
