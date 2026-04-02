import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'admin') {
    redirect('/');
  }

  const members = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return <AdminClient members={members} />;
}
