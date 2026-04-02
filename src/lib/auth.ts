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
        // Auto-Admin: If there are 0 admins in the database, forcefully upgrade this user.
        if (user.role !== 'admin') {
          const adminCount = await prisma.user.count({ where: { role: 'admin' } });
          if (adminCount === 0) {
            await prisma.user.update({ where: { id: user.id }, data: { role: 'admin' } });
            user.role = 'admin';
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
