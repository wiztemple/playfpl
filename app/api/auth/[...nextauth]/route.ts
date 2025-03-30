import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
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

        try {
          // Find the user by email
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          });

          // If user doesn't exist or doesn't have a password
          if (!user || !user.password) {
            return null;
          }

          // Check if email is verified
          if (!user.emailVerified) {
            throw new Error("Email not verified. Please verify your email first.");
          }

          // Compare passwords
          const passwordMatch = await bcrypt.compare(credentials.password, user.password);

          if (!passwordMatch) {
            return null;
          }

          // Return user object without password
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (error) {
          console.error("Auth error:", error);
          throw error;
        }
      }
    })
  ],
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/signin", // Error code passed in query string as ?error=
    verifyRequest: "/auth/verify-request",
    newUser: "/auth/new-user"
  },
  callbacks: {
    async session({ session, user }: { session: any; user: any }) {
      if (session.user) {
        // Add custom user data to session
        const userData = await prisma.user.findUnique({
          where: { email: session.user.email || "" },
          select: {
            id: true,
            fplTeamId: true,
            fplTeamName: true,
            username: true,
          }
        });

        if (userData) {
          session.user.id = userData.id;
          session.user.fplTeamId = userData.fplTeamId;
          session.user.fplTeamName = userData.fplTeamName;
          session.user.username = userData.username;
        }
      }
      return session;
    },
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    }
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth({
  ...authOptions,
  session: {
    strategy: "jwt" as const, // Use 'as const' to make TypeScript recognize this as a literal type
  }
});
export { handler as GET, handler as POST };
