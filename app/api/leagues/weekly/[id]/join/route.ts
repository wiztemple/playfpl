import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { verifyFplTeam } from "@/lib/fpl-api";

// Validation schema
const joinLeagueSchema = z.object({
  fplTeamId: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, {
    message: "FPL Team ID must be a positive number"
  })
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to join a league" },
        { status: 401 }
      );
    }
    
    const { id } = params;
    
    // Get user profile to check if they already have a connected team
    const userProfile = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { fplTeamId: true, fplTeamName: true }
    });
    
    // Parse and validate request body
    const body = await request.json();
    const validationResult = joinLeagueSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid FPL Team ID", details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { fplTeamId } = validationResult.data;
    const parsedTeamId = parseInt(fplTeamId);
    
    // If user already has a connected team, ensure they're using that team
    if (userProfile?.fplTeamId !== null && userProfile?.fplTeamId !== undefined) {
      if (userProfile.fplTeamId !== parsedTeamId) {
        return NextResponse.json(
          { error: "You can only join leagues with your connected FPL team (ID: " + userProfile.fplTeamId + ")" },
          { status: 400 }
        );
      }
    }
    
    // Check if team ID is already connected to another user
    if (!userProfile?.fplTeamId || userProfile.fplTeamId !== parsedTeamId) {
      const existingUser = await prisma.user.findFirst({
        where: { 
          fplTeamId: parsedTeamId,
          id: { not: session.user.id } // Exclude current user
        }
      });
      
      if (existingUser) {
        return NextResponse.json(
          { error: "This FPL team ID is already connected to another account" },
          { status: 400 }
        );
      }
    }
    
    // Verify FPL team exists and get team details
    let teamVerification;
    try {
      teamVerification = await verifyFplTeam(fplTeamId);
      
      if (!teamVerification.valid) {
        return NextResponse.json(
          { error: teamVerification.error || "Invalid FPL Team ID" },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error("Error verifying FPL team:", error);
      // Continue without verification if API is down
      console.warn("Skipping FPL team verification due to API error");
    }
    
    // Verify league exists and can be joined
    const league = await prisma.weeklyLeague.findUnique({
      where: { id },
      include: {
        _count: {
          select: { entries: true }
        }
      }
    });
    
    if (!league) {
      return NextResponse.json(
        { error: "League not found" },
        { status: 404 }
      );
    }
    
    if (league.status !== "upcoming") {
      return NextResponse.json(
        { error: "League cannot be joined at this time" },
        { status: 400 }
      );
    }
    
    if (league._count.entries >= league.maxParticipants) {
      return NextResponse.json(
        { error: "League is full" },
        { status: 400 }
      );
    }
    
    // Check if user already joined
    const existingEntry = await prisma.leagueEntry.findFirst({
      where: {
        userId: session.user.id,
        leagueId: id
      }
    });
    
    if (existingEntry) {
      return NextResponse.json(
        { error: "You have already joined this league" },
        { status: 400 }
      );
    }
    
    // Create a league entry with team info
    const entryData = {
      userId: session.user.id,
      leagueId: id,
      fplTeamId: parsedTeamId,
      paid: true, // Simplified for demo purposes
    };
    
    // Always update the user's FPL team info if we have valid team data
    if (teamVerification?.teamName) {
      try {
        // Use upsert to handle race conditions and ensure consistent team data
        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            fplTeamId: parsedTeamId,
            fplTeamName: teamVerification.teamName
          }
        });
      } catch (error) {
        // If updating fails due to uniqueness constraint
        if (error instanceof Error && 'code' in error && error.code === 'P2002') {
          return NextResponse.json(
            { error: "This FPL team ID is already connected to another account" },
            { status: 400 }
          );
        }
        throw error; // Re-throw other errors
      }
    }
    
    const entry = await prisma.leagueEntry.create({
      data: entryData
    });
    
    // For a real app, you would process payment here with Stripe
    
    return NextResponse.json({
      success: true,
      entry,
      teamInfo: teamVerification ? {
        name: teamVerification.teamName,
        manager: teamVerification.managerName
      } : null
    });
  } catch (error) {
    console.error("Error joining league:", error);
    return NextResponse.json(
      { error: "Failed to join league" },
      { status: 500 }
    );
  }
}