import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "dummy",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "dummy",
    }),
  ],
  callbacks: {
    async session({ session, user }: any) {
      if (session.user) {
        // Auto-SuperAdmin: If there are 0 admins or superadmins, forcefully upgrade this user.
        if (user.role !== 'admin' && user.role !== 'superadmin') {
          const adminCount = await prisma.user.count({ where: { role: { in: ['admin', 'superadmin'] } } });
          if (adminCount === 0) {
            await prisma.user.update({ where: { id: user.id }, data: { role: 'superadmin' } });
            user.role = 'superadmin';
          }
        }
        session.user.id = user.id;
        session.user.role = user.role;
        session.user.color = user.color;
        session.user.browniePoints = user.browniePoints;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'database',
  },
};
