import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "~/server/db";
import "~/types/next-auth";

export const authConfig = {
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password,
        );
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          schoolId: user.schoolId,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const u = user as any;
        token.role = u.role as "ADMIN" | "OPS_MANAGER";
        token.schoolId = u.schoolId as string | null;
      }
      return token;
    },
    session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub!,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          role: (token as any).role as "ADMIN" | "OPS_MANAGER",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          schoolId: ((token as any).schoolId as string | null) ?? null,
        },
      };
    },
  },
  pages: { signIn: "/auth/signin" },
} satisfies NextAuthConfig;
