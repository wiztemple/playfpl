// /app/api/leagues/weekly/[id]/participants/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { params } = context;
    const { id } = params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

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

    // Update the currentParticipants count in the WeeklyLeague table
    await prisma.weeklyLeague.update({
      where: { id },
      data: {
        currentParticipants: participants.length,
      },
    });

    // Check if current user has joined
    const hasJoined = userId ? participants.some(entry => entry.user.id === userId) : false;

    // Format the participants data
    const formattedParticipants = participants.map((entry, index) => ({
      userId: entry.user.id,
      userName: entry.user.name,
      userImage: entry.user.image,
      teamName: entry.user.fplTeamName || `Team ID: ${entry.fplTeamId}`,
      fplTeamId: entry.fplTeamId,
      joinedAt: entry.joinedAt,
      rank: index + 1,
    }));

    return NextResponse.json({
      participants: formattedParticipants,
      hasJoined
    });
  } catch (error) {
    console.error("Error fetching participants:", error);
    return NextResponse.json(
      { error: "Failed to fetch participants" },
      { status: 500 }
    );
  }
}
