// /app/api/leagues/user/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to view your leagues" },
        { status: 401 }
      );
    }
    
    // Get the user's league entries
    const entries = await prisma.leagueEntry.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        league: {
          include: {
            prizeDistribution: {
              orderBy: {
                position: 'asc'
              }
            },
            _count: {
              select: { entries: true }
            }
          }
        }
      },
      orderBy: {
        joinedAt: 'desc'
      }
    });
    
    // Transform the data to include league info and user results
    const userLeagues = entries.map(entry => ({
      ...entry.league,
      currentParticipants: entry.league._count.entries,
      _count: undefined,
      myResults: {
        rank: entry.rank,
        points: entry.finalPoints,
        weeklyPoints: entry.weeklyPoints,
        winnings: entry.winnings,
        payoutStatus: entry.payoutStatus,
        fplTeamId: entry.fplTeamId
      }
    }));
    
    return NextResponse.json(userLeagues);
  } catch (error) {
    console.error("Error fetching user leagues:", error);
    return NextResponse.json(
      { error: "Failed to fetch your leagues" },
      { status: 500 }
    );
  }
}