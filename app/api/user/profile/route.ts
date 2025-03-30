import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Session } from "next-auth";

// Define a proper type for the session
interface CustomSession extends Omit<Session, 'user'> {
  user?: {
    id?: string;
    email?: string;
    name?: string;
    image?: string;
    fplTeamId?: number;
    fplTeamName?: string;
    username?: string;
  };
}

export async function GET() {
  try {
    // Use the custom session type
    const session = await getServerSession(authOptions as any) as CustomSession;

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        username: true,
        fplTeamId: true,
        fplTeamName: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}