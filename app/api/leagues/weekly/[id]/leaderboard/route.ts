// /app/api/leagues/weekly/[id]/leaderboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { LeaderboardEntry } from "@/app/types";

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const leagueId = await context.params.id;
    
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
    const leaderboardWithTeamNames: LeaderboardEntry[] = await Promise.all(entries.map(async (entry) => {
      // Get the user's FPL team name from the User model
      const user = await prisma.user.findUnique({
        where: { id: entry.userId },
        select: { 
          fplTeamName: true,
          name: true,
          id: true
        }
      });
    
      // Format the entry for the frontend
      return {
        id: entry.id,
        userId: entry.userId,
        rank: entry.rank || 0,
        position: entry.rank || 0, // Ensure position is set
        points: entry.finalPoints || 0,
        finalPoints: entry.finalPoints || 0,
        
        // GW points - ensure this is properly set
        weeklyPoints: entry.weeklyPoints || 0,
        gwPoints: entry.weeklyPoints || 0,
        event_total: entry.weeklyPoints || 0, // Add FPL API format
        
        // Starting points
        startingPoints: (entry.finalPoints || 0) - (entry.weeklyPoints || 0),
        starting_points: (entry.finalPoints || 0) - (entry.weeklyPoints || 0),
        
        // Total points
        total: entry.finalPoints || 0,
        
        // Team and manager names - ensure all variations are included
        teamName: user?.fplTeamName || `Team ${entry.id.substring(0, 4)}`,
        team_name: user?.fplTeamName || `Team ${entry.id.substring(0, 4)}`,
        entry_name: user?.fplTeamName || `Team ${entry.id.substring(0, 4)}`,
        
        managerName: user?.name || `Manager ${entry.id.substring(0, 4)}`,
        manager_name: user?.name || `Manager ${entry.id.substring(0, 4)}`,
        player_name: user?.name || `Manager ${entry.id.substring(0, 4)}`,
        displayName: user?.name || `Manager ${entry.id.substring(0, 4)}`,
        display_name: user?.name || `Manager ${entry.id.substring(0, 4)}`,
        name: user?.name || `Manager ${entry.id.substring(0, 4)}`,
        
        // User info
        user: {
          id: user?.id || entry.userId,
          name: user?.name || `Manager ${entry.id.substring(0, 4)}`,
        },
        
        // Entry info for FPL API compatibility
        entry: {
          name: user?.fplTeamName || `Team ${entry.id.substring(0, 4)}`,
          player_name: user?.name || `Manager ${entry.id.substring(0, 4)}`,
        },
        
        // Add has_played flag for FPL API compatibility
        has_played: true,
        
        // Add current user flag
        isCurrentUser: false, // Will be set on the client side
        is_current_user: false, // Will be set on the client side
      };
    }));
    
    // Sort the leaderboard by points (for active leagues) or rank (for completed leagues)
    const sortedLeaderboard = league.status === 'completed'
      ? leaderboardWithTeamNames.sort((a, b) => (a.rank || 0) - (b.rank || 0))
      : leaderboardWithTeamNames.sort((a, b) => (b.points || 0) - (a.points || 0));
    
    // If the league is active, find the entry with the highest GW points
    if (league.status === 'active') {
      const highestGwPoints = Math.max(...sortedLeaderboard.map(entry => entry.weeklyPoints || 0));
      
      // Mark the GW winner
      sortedLeaderboard.forEach(entry => {
        entry.isGwWinner = entry.weeklyPoints === highestGwPoints && highestGwPoints > 0;
        entry.is_gw_winner = entry.weeklyPoints === highestGwPoints && highestGwPoints > 0;
        entry.gw_winner = entry.weeklyPoints === highestGwPoints && highestGwPoints > 0;
      });
    }
    
    return NextResponse.json(sortedLeaderboard);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
// Format the leaderboard data with proper team names
// const formattedLeaderboard = await Promise.all(entries.map(async (entry) => {
//   let teamName = entry.user.fplTeamName;
  
//   // If team name is not available in the user record, fetch it from FPL API
//   if (!teamName) {
//     try {
//       const teamInfo = await getTeamInfo(entry.fplTeamId);
//       teamName = teamInfo?.name || `Team ${entry.fplTeamId}`;
      
//       // Update the user's fplTeamName in the database for future use
//       if (teamInfo?.name) {
//         await prisma.user.update({
//           where: { id: entry.user.id },
//           data: { fplTeamName: teamInfo.name }
//         });
//       }
//     } catch (error) {
//       console.error(`Error fetching team name for ID ${entry.fplTeamId}:`, error);
//       teamName = `Team ${entry.fplTeamId}`;
//     }
//   }
  
//   return {
//     userId: entry.user.id,
//     userName: entry.user.name,
//     teamName: teamName,
//     rank: entry.rank,
//     startPoints: entry.pointsAtStart,
//     weeklyPoints: entry.weeklyPoints,
//     finalPoints: entry.finalPoints,
//     winnings: entry.winnings,
//   };
// }));
