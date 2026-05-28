import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { AccountStatus, Role } from "@prisma/client";

import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { loginSchema } from "@/lib/validators/auth";

const SESSION_SHORT = 60 * 60 * 24;
const SESSION_LONG = 60 * 60 * 24 * 30;

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: SESSION_LONG
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login"
  },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember me", type: "text" }
      },
      async authorize(raw) {
        const parsed = loginSchema.safeParse({
          email: raw?.email,
          password: raw?.password,
          rememberMe: String(raw?.rememberMe ?? "") === "true"
        });
        if (!parsed.success) return null;

        const email = parsed.data.email.toLowerCase();
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const valid = await verifyPassword(parsed.data.password, user.password);
        if (!valid) return null;
        if (user.accountStatus === AccountStatus.SUSPENDED) return null;
        if (!user.emailVerified) return null;

        const { notifySecurityLogin } = await import("@/lib/notifications/workflow-events");
        void notifySecurityLogin({ userId: user.id });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as Role,
          rememberMe: parsed.data.rememberMe
        };
      }
    })
  ],
 callbacks: {
  async jwt({ token, user, trigger }) {
    if (user) {
      const row = await prisma.user.findUnique({
        where: { id: user.id },
        select: { emailVerified: true }
      });
      token.id = user.id;
      token.role = user.role;
      token.email = user.email;
      token.name = user.name;
      token.emailVerified = !!row?.emailVerified;
      token.rememberMe = (user as { rememberMe?: boolean }).rememberMe ?? false;
      const maxAge = token.rememberMe ? SESSION_LONG : SESSION_SHORT;
      token.exp = Math.floor(Date.now() / 1000) + maxAge;
    }
    if (trigger === "update" && token.id) {
      const row = await prisma.user.findUnique({
        where: { id: token.id as string },
        select: { emailVerified: true }
      });
      token.emailVerified = !!row?.emailVerified;
    }
    return token;
  },

  async session({ session, token }) {
    session.user = {
      id: token.id as string,
      role: token.role as Role,
      email: token.email as string,
      name: token.name as string,
      emailVerified: Boolean(token.emailVerified)
    };
    if (token.exp) {
      session.expires = new Date((token.exp as number) * 1000).toISOString();
    }

    return session;
  }
},
  secret: process.env.NEXTAUTH_SECRET
};
