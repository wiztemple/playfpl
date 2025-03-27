// /app/api/leagues/weekly/[id]/leaderboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const leagueId = params.id;
    
    if (!leagueId) {
      return NextResponse.json(
        { error: "League ID is required" },
        { status: 400 }
      );
    }

    // Get the league to check if it exists and its status
    const league = await prisma.weeklyLeague.findUnique({
      where: { id: leagueId },
    });

    if (!league) {
      return NextResponse.json(
        { error: "League not found" },
        { status: 404 }
      );
    }

    // Fetch all entries for this league with user information
    const entries = await prisma.leagueEntry.findMany({
      where: {
        leagueId: leagueId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        // Order by rank if available (for completed leagues)
        { rank: 'asc' },
        // Then by points (for active leagues)
        { finalPoints: 'desc' },
        // Then by join date (for upcoming leagues)
        { joinedAt: 'asc' },
      ],
    });

    // Transform the data for the frontend
    const leaderboard = entries.map((entry) => ({
      userId: entry.userId,
      userName: entry.user.name,
      teamName: `Team ${entry.fplTeamId}`,
      fplTeamId: entry.fplTeamId,
      rank: entry.rank,
      startPoints: entry.pointsAtStart,
      weeklyPoints: entry.weeklyPoints,
      finalPoints: entry.finalPoints,
      winnings: entry.winnings,
      joinedAt: entry.joinedAt,
    }));

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}