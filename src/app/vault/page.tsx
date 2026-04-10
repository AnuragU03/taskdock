import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import VaultClient from "./VaultClient";

export default async function VaultPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  
  const role = (session.user as any).role;
  if (role !== 'admin' && role !== 'superadmin') redirect('/');

  const members = await prisma.user.findMany({
    select: { id: true, name: true, email: true, image: true, color: true },
    orderBy: { name: 'asc' }
  });

  return <VaultClient members={members} />;
}
