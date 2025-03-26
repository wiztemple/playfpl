// app/api/user/check-team-ownership/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Validation schema
const checkTeamSchema = z.object({
  fplTeamId: z.number().int().positive("Team ID must be a positive number"),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validationResult = checkTeamSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { fplTeamId } = validationResult.data;
    
    // Check if team ID is claimed by any user
    const existingUser = await prisma.user.findFirst({
      where: { fplTeamId }
    });
    
    // Team is owned if there's a user with this team ID
    const isOwned = existingUser !== null;
    
    // Current user is the owner if the team is owned by them
    const isOwner = isOwned && existingUser.id === session.user.id;
    
    return NextResponse.json({ isOwned, isOwner });
    
  } catch (error) {
    console.error("Error checking team ownership:", error);
    return NextResponse.json(
      { error: "Failed to check team ownership" },
      { status: 500 }
    );
  }
}