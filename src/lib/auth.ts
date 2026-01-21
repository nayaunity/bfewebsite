import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Resend from "next-auth/providers/resend";
import { prisma } from "./prisma";

// Emails that should automatically be granted admin access on first sign-in
const AUTO_ADMIN_EMAILS = [
  "obiajuluonyinye1@gmail.com",
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: "The Black Female Engineer <noreply@theblackfemaleengineer.com>",
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify-request",
  },
  callbacks: {
    session({ session, user }) {
      // Add user id to session
      session.user.id = user.id;
      // Role is fetched separately in admin.ts to avoid adapter issues
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // Auto-promote certain emails to admin on first sign-in
      if (user.email && AUTO_ADMIN_EMAILS.includes(user.email.toLowerCase())) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: "admin" },
        });
      }
    },
  },
  session: {
    strategy: "database",
  },
  trustHost: true,
});

// Type augmentation for session
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      emailVerified: Date | null;
    };
  }
}
