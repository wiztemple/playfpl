// /app/api/leagues/weekly/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const id = context.params.id;

    // Find the league by ID
    const league = await prisma.weeklyLeague.findUnique({
      where: { id },
      include: {
        prizeDistribution: {
          orderBy: {
            position: "asc",
          },
        },
        _count: {
          select: { entries: true },
        },
      },
    });

    if (!league) {
      return NextResponse.json({ error: "League not found" }, { status: 404 });
    }

    // Format the response
    const formattedLeague = {
      ...league,
      currentParticipants: league._count.entries,
      _count: undefined,
    };

    return NextResponse.json(formattedLeague);
  } catch (error) {
    console.error("Error fetching league:", error);
    return NextResponse.json(
      { error: "Failed to fetch league details" },
      { status: 500 }
    );
  }
}
