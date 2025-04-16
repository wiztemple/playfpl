import NextAuth, { AuthOptions, Session as NextAuthSession } from "next-auth"; // Import necessary types
import { JWT as NextAuthJWT } from "next-auth/jwt"; // Import JWT type
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";



export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // If using Google, you might need a profile callback here
      // to fetch/assign the isAdmin flag based on the Google profile/email
      // async profile(profile) {
      //    const dbUser = await prisma.user.findUnique({where: { email: profile.email }});
      //    return {
      //       id: profile.sub, // Or dbUser.id if using adapter? Check adapter behavior
      //       name: profile.name,
      //       email: profile.email,
      //       image: profile.picture,
      //       isAdmin: dbUser?.isAdmin || false, // <<< Get isAdmin from DB
      //    }
      // }
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
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
            // No need to select here, authorize needs the password
          });

          if (!user || !user.password) {
            console.log("Authorize failed: User not found or no password set.");
            return null;
          }
          // Removed email verified check - add back if needed
          // if (!user.emailVerified) { throw new Error("Email not verified."); }

          const passwordMatch = await bcrypt.compare(credentials.password, user.password);

          if (!passwordMatch) {
            console.log("Authorize failed: Password mismatch.");
            return null;
          }

          console.log(`Authorize success for ${user.email}, isAdmin=${user.isAdmin}`);
          // --- Return user object INCLUDING isAdmin ---
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            isAdmin: user.isAdmin, // <<< Include isAdmin flag
          };
        } catch (error) {
          console.error("Authorize error:", error);
          // Don't throw the raw error back to the client in production
          // Throwing here might expose details, returning null is safer for login failures
          return null; // Indicate failure
        }
      }
    })
  ],
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/signin",
    verifyRequest: "/auth/verify-request",
    newUser: "/auth/new-user"
  },
  callbacks: {
    async jwt({ token, user, trigger, session: sessionUpdateData }) { // Add trigger/session params
      let userIdForLookup: string | undefined = token?.id ?? user?.id;

      // 1. Initial sign-in: Copy essential info from user object
      if (user) {
        console.log(`[JWT Callback] Initial sign-in for user ${user.id}. isAdmin from user obj: ${user.isAdmin}`);
        token.id = user.id;
        token.isAdmin = (user as any).isAdmin ?? false; // Use user obj on sign-in
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        userIdForLookup = user.id; // Ensure we have the ID for potential DB lookup next
      }

      // 2. Ensure we have an ID to look up the user
      if (!userIdForLookup) {
        console.warn("[JWT Callback] No user ID available in token or user object. Returning existing token.");
        return token;
      }

      // 3. Refresh critical data (like isAdmin) from DB on every call
      // This ensures direct DB changes are reflected relatively quickly.
      // Can be optimized later if DB load is a concern.
      try {
        // console.log(`[JWT Callback] Refreshing data from DB for userId: ${userIdForLookup}`);
        const dbUser = await prisma.user.findUnique({
          where: { id: userIdForLookup },
          select: { isAdmin: true, name: true, email: true, image: true } // Select fields to keep fresh
        });

        if (dbUser) {
          // Update token with the latest data from the database
          token.isAdmin = dbUser.isAdmin ?? false; // <<< Update isAdmin
          // Optionally update other fields that might change
          token.name = dbUser.name;
          token.email = dbUser.email; // Email generally shouldn't change, but good practice
          token.picture = dbUser.image;
        } else {
          console.warn(`[JWT Callback] User ${userIdForLookup} not found in DB during refresh.`);
          // Consider what to do if user deleted - maybe invalidate token? For now, keep existing.
        }
      } catch (dbError) {
        console.error(`[JWT Callback] Failed to fetch user ${userIdForLookup} from DB during refresh:`, dbError);
        // Return the existing token if DB lookup fails to avoid breaking session
      }

      console.log("[JWT Callback] Returning token:", { id: token.id, isAdmin: token.isAdmin, email: token.email });
      return token; // Return the potentially updated token
    },

    // --- Session Callback: Shapes the client-side session object ---
    async session({ session, token }) { // token is the result of the jwt callback above
      // Copy necessary fields FROM the potentially updated token TO the session
      if (token && session.user) {
        session.user.id = token.id;
        session.user.isAdmin = token.isAdmin; // <<< Copy updated isAdmin
        // Copy other fields if needed and defined on your augmented Session['user'] type
        // session.user.name = token.name; // DefaultSession usually includes these
        // session.user.email = token.email;
        // session.user.image = token.picture;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt", // Ensure JWT strategy is used for middleware compatibility with getToken
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

// Export handler correctly
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };