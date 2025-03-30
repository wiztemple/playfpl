// /lib/auth-options.ts
import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
    newUser: "/auth/signup",
    error: "/auth/error",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Find user with their credentials
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { accounts: true }
        });

        if (!user) {
          return null;
        }

        // For users who registered with credentials, check password
        const userAccount = await prisma.account.findFirst({
          where: {
            userId: user.id,
            type: "credentials"
          }
        });

        if (!userAccount || !('password' in userAccount)) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          userAccount.password as string
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          username: (user as any).username,
          fplTeamId: user.fplTeamId,
        };
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as any).username;
        token.fplTeamId = (user as any).fplTeamId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as any).username = token.username as string;
        (session.user as any).fplTeamId = token.fplTeamId as number;
      }
      return session;
    },
  },
  // Removed duplicate pages and session properties
};