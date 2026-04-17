import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Resend from "next-auth/providers/resend";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

// Emails that should automatically be granted admin access on first sign-in
const AUTO_ADMIN_EMAILS = (process.env.AUTO_ADMIN_EMAILS || "obiajuluonyinye1@gmail.com")
  .split(",").map(e => e.trim().toLowerCase()).filter(Boolean);

// Emails that should automatically be granted contributor access on first sign-in
const AUTO_CONTRIBUTOR_EMAILS = (process.env.AUTO_CONTRIBUTOR_EMAILS || "ashlyncmitm@gmail.com")
  .split(",").map(e => e.trim().toLowerCase()).filter(Boolean);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: "The Black Female Engineer <noreply@theblackfemaleengineer.com>",
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = (credentials.email as string).toLowerCase().trim();
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true, emailVerified: true, passwordHash: true },
        });

        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, emailVerified: user.emailVerified };
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify-request",
  },
  callbacks: {
    session({ session, user, token }) {
      // For database sessions (magic link), user is available
      // For JWT sessions (credentials), token has the user info
      if (user) {
        session.user.id = user.id;
      } else if (token?.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
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
      // Auto-promote certain emails to contributor on first sign-in
      if (user.email && AUTO_CONTRIBUTOR_EMAILS.includes(user.email.toLowerCase())) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: "contributor" },
        });
      }
      // New users (magic-link / OAuth path) get the trial wall on immediately.
      // The credential signup route sets this in its INSERT; this covers
      // every other entry into account creation.
      await prisma.user.update({
        where: { id: user.id },
        data: { freeTierEndsAt: new Date() },
      });
    },
  },
  session: {
    strategy: "jwt",
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
