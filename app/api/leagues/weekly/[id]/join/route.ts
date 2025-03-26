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
      
      // Create a league entry with team info if available
      const entryData = {
        userId: session.user.id,
        leagueId: id,
        fplTeamId: parseInt(fplTeamId),
        paid: true, // Simplified for demo purposes
      };
      
      // If we have team data, store team name
      if (teamVerification?.teamName) {
        // Update the user's FPL team info in their profile
        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            fplTeamId: parseInt(fplTeamId),
            fplTeamName: teamVerification.teamName
          }
        });
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