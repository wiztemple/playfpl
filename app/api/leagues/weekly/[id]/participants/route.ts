// /app/api/leagues/weekly/[id]/participants/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getTeamInfo } from "@/lib/fpl-api";

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const params = await context.params;
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

    // Format the participants data with proper team names
    const formattedParticipants = await Promise.all(participants.map(async (entry, index) => {
      let teamName = entry.user.fplTeamName;
      
      // If team name is not available in the user record, fetch it from FPL API
      if (!teamName) {
        try {
          const teamInfo = await getTeamInfo(entry.fplTeamId);
          teamName = teamInfo?.name || `Team ${entry.fplTeamId}`;
          
          // Update the user's fplTeamName in the database for future use
          if (teamInfo?.name) {
            await prisma.user.update({
              where: { id: entry.user.id },
              data: { fplTeamName: teamInfo.name }
            });
          }
        } catch (error) {
          console.error(`Error fetching team name for ID ${entry.fplTeamId}:`, error);
          teamName = `Team ${entry.fplTeamId}`;
        }
      }
      
      return {
        userId: entry.user.id,
        userName: entry.user.name,
        userImage: entry.user.image,
        teamName: teamName,
        fplTeamId: entry.fplTeamId,
        joinedAt: entry.joinedAt,
        rank: index + 1,
      };
    }));

    // Return the participants data with hasJoined flag
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
