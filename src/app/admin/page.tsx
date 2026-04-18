import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/');
  }

  const role = (session.user as any).role;
  if (role !== 'admin' && role !== 'superadmin') {
    redirect('/');
  }

  const members = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: { profile: true }
  });

  const workspace = await prisma.workspace.findFirst();

  return <AdminClient members={members} workspace={workspace} />;
}
