import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { type NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { Resend } from "resend";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const resend = new Resend(env.RESEND_API_KEY);

const appUrl = env.NEXTAUTH_URL ?? env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "database",
  },
  pages: {
    signIn: "/signin",
    verifyRequest: "/verify-email",
  },
  providers: [
    EmailProvider({
      from: env.RESEND_FROM_EMAIL,
      maxAge: 10 * 60, // Magic link valid for 10 minutes
      sendVerificationRequest: async ({ identifier, url }) => {
        const result = await resend.emails.send({
          from: env.RESEND_FROM_EMAIL,
          to: identifier,
          subject: `Sign in to ${env.NEXT_PUBLIC_APP_NAME}`,
          html: emailTemplate({ url, appName: env.NEXT_PUBLIC_APP_NAME ?? "Velocity" }),
          text: textTemplate({ url, appName: env.NEXT_PUBLIC_APP_NAME ?? "Velocity" }),
        });

        if (result.error) {
          throw new Error(`Failed to send verification email: ${result.error.message}`);
        }
      },
    }),
  ],
  callbacks: {
    session: async ({ session, user }) => {
      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
      };
    },
    redirect: async ({ url, baseUrl }) => {
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      return baseUrl;
    },
  },
  events: {
    createUser: async ({ user }) => {
      await prisma.userSettings.create({
        data: {
          userId: user.id,
        },
      }).catch(() => {
        // ignore if already created via transaction
      });
    },
  },
  cookies: {
    sessionToken: {
      name: "velocity.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: env.NODE_ENV === "production",
      },
    },
  },
  secret: env.NEXTAUTH_SECRET,
};

type TemplateOptions = {
  url: string;
  appName: string;
};

const textTemplate = ({ url, appName }: TemplateOptions) =>
  `Sign in to ${appName}\n${url}\n\nIf you did not request this email you can safely ignore it.`;

const emailTemplate = ({ url, appName }: TemplateOptions) => `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px;">
    <h1 style="font-size: 20px; color: #111827;">Sign in to ${appName}</h1>
    <p style="margin: 16px 0; color: #374151;">Click the button below to securely sign in. This link is valid for 10 minutes.</p>
    <a href="${url}" style="display: inline-block; padding: 12px 20px; background-color: #0ea5e9; color: #ffffff; font-weight: 600; border-radius: 9999px; text-decoration: none;">Sign in</a>
    <p style="margin-top: 24px; font-size: 12px; color: #6b7280;">If you did not request this email, you can safely ignore it.</p>
    <p style="margin-top: 8px; font-size: 12px; color: #6b7280;">This link will take you to: <span style="color: #111827;">${appUrl}</span></p>
  </div>
`;
