// /app/api/user/stats/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user's league entries
    const leagueEntries = await prisma.leagueEntry.findMany({
      where: { userId: session.user.id },
      include: {
        league: {
          select: {
            status: true,
            entryFee: true,
          },
        },
      },
    });

    // Calculate statistics
    const totalLeaguesJoined = leagueEntries.length;
    
    // Sum up winnings from all leagues
    const totalWinnings = leagueEntries.reduce(
      (sum, entry) => sum + (entry.winnings || 0),
      0
    );
    
    // Count active leagues (where status is 'active')
    const currentLeagues = leagueEntries.filter(
      (entry) => entry.league.status === "active"
    ).length;
    
    // Find the best rank achieved
    const ranks = leagueEntries
      .filter((entry) => entry.rank !== null && entry.rank !== undefined)
      .map((entry) => entry.rank as number);
    
    const bestRank = ranks.length > 0 ? Math.min(...ranks) : "-";
    
    // Calculate winning rate (entries with winnings > 0 / total completed entries)
    const completedEntries = leagueEntries.filter(
      (entry) => entry.league.status === "completed"
    );
    
    const winningEntries = leagueEntries.filter(
      (entry) => (entry.winnings || 0) > 0
    );
    
    const winningRate = completedEntries.length > 0
      ? `${Math.round((winningEntries.length / completedEntries.length) * 100)}%`
      : "0%";

    // Return the stats
    return NextResponse.json({
      totalLeaguesJoined,
      totalWinnings,
      bestRank,
      currentLeagues,
      winningRate,
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch user statistics" },
      { status: 500 }
    );
  }
}