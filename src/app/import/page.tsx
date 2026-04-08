import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ImportClient from "./ImportClient";

export default async function ImportPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  
  const role = (session.user as any).role;
  if (role === 'employee') redirect('/');

  const members = await prisma.user.findMany({
    orderBy: { name: 'asc' }
  });

  return <ImportClient members={members} />;
}
