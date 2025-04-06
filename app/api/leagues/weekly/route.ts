// /api/leagues/weekly/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameweek = searchParams.get("gameweek");
    const status = searchParams.get("status");
    const filter = searchParams.get("filter");

    // Get the user session - make this optional so unauthenticated users can view leagues
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // Handle 'my-leagues' filter which requires authentication
    if (filter === "my-leagues") {
      if (!userId) {
        return NextResponse.json(
          { error: "Authentication required to view your leagues" },
          { status: 401 }
        );
      }

      const myLeagues = await prisma.weeklyLeague.findMany({
        where: {
          entries: {
            some: {
              userId,
            },
          },
        },
        include: {
          prizeDistribution: {
            orderBy: {
              position: "asc",
            },
          },
          _count: {
            select: { entries: true },
          },
          entries: {
            where: { userId },
            select: { id: true },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const formattedLeagues = myLeagues.map((league) => ({
        ...league,
        currentParticipants: league._count.entries,
        hasJoined: true, // By definition, these are leagues the user has joined
        _count: undefined,
        entries: undefined,
      }));

      return NextResponse.json(formattedLeagues);
    }

    // For regular league browsing - build filter criteria
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

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Check if the user is an admin using raw query
    const adminCheck = await prisma.$queryRaw`
      SELECT "isAdmin" FROM "User" WHERE id = ${session.user.id}
    `;
    
    const isAdmin = (adminCheck as any[])[0]?.isAdmin === true;
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only administrators can create leagues" },
        { status: 403 }
      );
    }
    
    const data = await request.json();
    
    // Create the league with all fields including description
    const league = await prisma.weeklyLeague.create({
      data: {
        name: data.name,
        description: data.description, // This should work after regenerating the client
        gameweek: data.gameweek,
        entryFee: data.entryFee,
        maxParticipants: data.maxParticipants,
        status: "upcoming",
        startDate: new Date(), // Required field
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Required field, set to 7 days from now
        prizeDistribution: {
          create: data.prizeDistribution.map((prize: any) => ({
            position: prize.position,
            percentageShare: prize.percentage
          }))
        }
      } as any // Type assertion as a last resort if regenerating doesn't work
    });
    
    return NextResponse.json(league);
  } catch (error) {
    console.error("Error creating league:", error);
    return NextResponse.json(
      { error: "Failed to create league" },
      { status: 500 }
    );
  }
}
