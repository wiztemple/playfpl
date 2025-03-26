// /app/api/leagues/weekly/[id]/participants/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const id = context.params.id;

    // Fetch league entries with user info
    const participants = await prisma.leagueEntry.findMany({
      where: {
        leagueId: id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            fplTeamName: true,
          },
        },
      },
      orderBy: {
        joinedAt: "asc",
      },
    });

    // Format the participants data
    const formattedParticipants = participants.map((entry, index) => ({
      userId: entry.user.id,
      userName: entry.user.name,
      userImage: entry.user.image,
      teamName: entry.user.fplTeamName || `Team ID: ${entry.fplTeamId}`,
      fplTeamId: entry.fplTeamId,
      joinedAt: entry.joinedAt,
      // For upcoming leagues, use join order as temporary ranking
      rank: index + 1,
    }));

    return NextResponse.json(formattedParticipants);
  } catch (error) {
    console.error("Error fetching participants:", error);
    return NextResponse.json(
      { error: "Failed to fetch participants" },
      { status: 500 }
    );
  }
}
