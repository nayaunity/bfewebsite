import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Resend from "next-auth/providers/resend";
import { prisma } from "./prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Resend({
      // Use Resend's test address for development, your domain for production
      from: process.env.NODE_ENV === "production"
        ? "The Black Female Engineer <noreply@theblackfemaleengineer.com>"
        : "BFE <onboarding@resend.dev>",
      // Custom email template
      async sendVerificationRequest({ identifier: email, url, provider }) {
        const { Resend: ResendClient } = await import("resend");
        const resend = new ResendClient(process.env.RESEND_API_KEY);

        const result = await resend.emails.send({
          from: provider.from!,
          to: email,
          subject: "Sign in to The Black Female Engineer",
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                  <tr>
                    <td style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                      <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: #1a1a1a;">
                        Sign in to BFE
                      </h1>
                      <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #4a4a4a;">
                        Click the button below to sign in to your account and track your learning progress.
                      </p>
                      <a href="${url}" style="display: inline-block; padding: 14px 28px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 16px;">
                        Sign in
                      </a>
                      <p style="margin: 32px 0 0; font-size: 14px; line-height: 1.6; color: #6a6a6a;">
                        If you didn't request this email, you can safely ignore it.
                      </p>
                      <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e5e5;">
                      <p style="margin: 0; font-size: 12px; color: #8a8a8a;">
                        The Black Female Engineer<br>
                        Empowering young professionals in tech
                      </p>
                    </td>
                  </tr>
                </table>
              </body>
            </html>
          `,
          text: `Sign in to The Black Female Engineer\n\nClick here to sign in: ${url}\n\nIf you didn't request this email, you can safely ignore it.`,
        });

        if (result.error) {
          throw new Error(`Failed to send email: ${result.error.message}`);
        }
      },
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
      return session;
    },
  },
  session: {
    strategy: "database",
  },
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
