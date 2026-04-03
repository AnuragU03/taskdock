import type { Metadata } from "next";
import { DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { prisma } from "@/lib/prisma";

const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-sans" });
const dmMono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "TaskDock - Creative OS",
  description: "Every creative brief, reference, countdown, deliverable, and approval — in one place.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  
  // Fetch unread notifications if user exists
  let unreadNotifsCount = 0;
  if (session?.user?.id) {
    unreadNotifsCount = await prisma.notification.count({
      where: {
        userId: session.user.id as string,
        read: false,
      }
    });
  }

  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${dmMono.variable} antialiased`}>
        <AuthProvider>
          {session ? (
            <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg0)' }}>
              <Sidebar 
                 user={{
                   id: session.user.id as string,
                   name: session.user.name as string,
                   email: session.user.email as string,
                   role: (session.user as any).role || 'employee',
                   image: session.user.image,
                   color: (session.user as any).color,
                   browniePoints: (session.user as any).browniePoints || 0
                 }}
                 unreadNotifsCount={unreadNotifsCount}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                {children}
              </div>
            </div>
          ) : (
            <div style={{ minHeight: '100vh', background: 'var(--bg0)' }}>
              {children}
            </div>
          )}
        </AuthProvider>
      </body>
    </html>
  );
}
