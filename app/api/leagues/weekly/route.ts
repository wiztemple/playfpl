// /app/api/leagues/weekly/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameweek = searchParams.get("gameweek");
    const status = searchParams.get("status");

    // Get the user session
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // Build filter criteria
    const filters: any = {};

    if (gameweek) {
      filters.gameweek = parseInt(gameweek);
    }

    if (status) {
      filters.status = status;
    }

    // Query the database
    const leagues = await prisma.weeklyLeague.findMany({
      where: filters,
      include: {
        prizeDistribution: {
          orderBy: {
            position: "asc",
          },
        },
        _count: {
          select: { entries: true },
        },
        entries: userId
          ? {
              where: { userId },
              select: { id: true },
            }
          : undefined,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Format response
    const formattedLeagues = leagues.map((league) => ({
      ...league,
      currentParticipants: league._count.entries,
      hasJoined: userId ? league.entries.length > 0 : false,
      _count: undefined,
      entries: undefined,
    }));

    return NextResponse.json(formattedLeagues);
  } catch (error) {
    console.error("Error fetching leagues:", error);
    return NextResponse.json(
      { error: "Failed to fetch leagues" },
      { status: 500 }
    );
  }
}
