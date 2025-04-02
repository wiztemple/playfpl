// // /app/api/leagues/weekly/[id]/leaderboard/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/db";
// import { LeaderboardEntry } from "@/app/types";
// import { fetchLiveGameweekPoints, checkGameweekStatus } from "@/lib/fpl-api";
// import { finalizeLeagueStandings } from "@/lib/league-utils";

// export async function GET(
//   request: Request,
//   context: { params: { id: string } }
// ) {
//   try {
//     const params = await context.params;
//     const leagueId = params.id;

//     console.log(`[LEADERBOARD] Processing request for league ${leagueId}`);

//     // Get the league to check if it exists, its status and gameweek
//     const league = await prisma.weeklyLeague.findUnique({
//       where: { id: leagueId },
//       include: {
//         entries: {
//           include: {
//             user: {
//               select: {
//                 id: true,
//                 name: true,
//                 fplTeamId: true,
//                 fplTeamName: true,
//               },
//             },
//           },
//         },
//       },
//     });

//     if (!league) {
//       return NextResponse.json(
//         { error: "League not found" },
//         { status: 404 }
//       );
//     }

//     // Check gameweek status for both upcoming and active leagues
//     if (league.status === 'upcoming' || league.status === 'active') {
//       const gameweekStatus = await checkGameweekStatus(league.gameweek);

//       // If any matches have started but league is still upcoming, update to active
//       if (gameweekStatus.hasStarted && league.status === 'upcoming') {
//         console.log(`[LEADERBOARD] Gameweek ${league.gameweek} has started, updating league status to active`);

//         await prisma.weeklyLeague.update({
//           where: { id: leagueId },
//           data: { status: 'active' },
//         });

//         // Update the league object for this request
//         league.status = 'active';
//       }

//       // If all matches have finished and league is still active, update to completed
//       if (gameweekStatus.isComplete && league.status === 'active') {
//         console.log(`[LEADERBOARD] Gameweek ${league.gameweek} has completed, updating league status to completed`);

//         await prisma.weeklyLeague.update({
//           where: { id: leagueId },
//           data: { status: 'completed' },
//         });

//         // Update the league object for this request
//         league.status = 'completed';
//       }
//     }

//     let dataRefreshed = false;
//     let entriesWithUsers = league.entries;

//     // For active leagues, fetch live points from the FPL API
//     if (league.status === 'active') {
//       console.log(`[LEADERBOARD] League ${leagueId} is active, fetching live points for gameweek ${league.gameweek}`);

//       // Extract the FPL team IDs
//       const fplTeamIds = entriesWithUsers
//         .map(entry => entry.user.fplTeamId)
//         .filter((id): id is number => id !== null && id !== undefined);

//       console.log(`[LEADERBOARD] Extracted ${fplTeamIds.length} valid FPL team IDs`);

//       if (fplTeamIds.length > 0) {
//         // Fetch live points for all FPL teams with improved error handling
//         console.log(`[LEADERBOARD] Calling fetchLiveGameweekPoints for gameweek ${league.gameweek}...`);
//         const livePoints = await fetchLiveGameweekPoints(fplTeamIds, league.gameweek);
//         console.log(`[LEADERBOARD] Received live points:`, livePoints);

//         if (Object.keys(livePoints).length > 0) {
//           // Update entries with the latest points using a transaction for consistency
//           await prisma.$transaction(
//             entriesWithUsers.map((entry) => {
//               const fplTeamId = entry.user.fplTeamId;
//               if (!fplTeamId || !(fplTeamId in livePoints)) return prisma.$executeRaw`SELECT 1`;

//               const points = livePoints[fplTeamId];
//               console.log(`Updating entry ${entry.id} with ${points} points`);

//               return prisma.leagueEntry.update({
//                 where: {
//                   id: entry.id
//                 },
//                 data: {
//                   weeklyPoints: points,
//                   finalPoints: (entry.pointsAtStart || 0) + points, // Add starting points to current GW points
//                 }
//               });
//             })
//           );

//           dataRefreshed = true;

//           // Refresh entries with updated data
//           entriesWithUsers = await prisma.leagueEntry.findMany({
//             where: {
//               leagueId: leagueId,
//             },
//             include: {
//               user: {
//                 select: {
//                   id: true,
//                   name: true,
//                   fplTeamId: true,
//                   fplTeamName: true,
//                 },
//               },
//             },
//           });

//           // Check again if the gameweek has completed
//           const updatedGameweekStatus = await checkGameweekStatus(league.gameweek);

//           if (updatedGameweekStatus.isComplete) {
//             console.log(`[LEADERBOARD] Gameweek ${league.gameweek} has completed after points update, finalizing league`);

//             // Update league status
//             await prisma.weeklyLeague.update({
//               where: { id: leagueId },
//               data: { status: 'completed' },
//             });

//             // Update the league object for this request
//             league.status = 'completed';

//             // Calculate prize pool
//             const prizePool = league.entryFee * entriesWithUsers.length * (1 - (league.platformFeePercentage || 5) / 100);

//             // Finalize standings and calculate winnings

//             await finalizeLeagueStandings(league, entriesWithUsers, prizePool);

//             // Refresh entries again to get final rankings and winnings
//             entriesWithUsers = await prisma.leagueEntry.findMany({
//               where: {
//                 leagueId: leagueId,
//               },
//               include: {
//                 user: {
//                   select: {
//                     id: true,
//                     name: true,
//                     fplTeamId: true,
//                     fplTeamName: true,
//                   },
//                 },
//               },
//             });
//           }
//         }
//       }
//     }

//     // Transform the data for the frontend
//     const leaderboardWithTeamNames: LeaderboardEntry[] = entriesWithUsers.map((entry) => {
//       // Use the user data already included in the query
//       const user = entry.user;
//       const startPoints = entry.pointsAtStart || 0; // Use existing pointsAtStart field
//       const weeklyPoints = entry.weeklyPoints || 0;
//       const finalPoints = entry.finalPoints || (startPoints + weeklyPoints);

//       // Format the entry for the frontend
//       return {
//         id: entry.id,
//         userId: entry.userId,
//         rank: entry.rank || 0,
//         position: entry.rank || 0, // Ensure position is set
//         points: finalPoints,
//         finalPoints: finalPoints,

//         // Starting points - stored separately now
//         startPoints: startPoints,
//         startingPoints: startPoints,
//         starting_points: startPoints,

//         // GW points - ensure this is properly set
//         weeklyPoints: weeklyPoints,
//         gwPoints: weeklyPoints,
//         event_total: weeklyPoints, // Add FPL API format

//         // Total points
//         total: finalPoints,

//         // Team and manager names - ensure all variations are included
//         userName: user?.name || `Manager ${entry.id.substring(0, 4)}`,
//         teamName: user?.fplTeamName || `Team ${entry.id.substring(0, 4)}`,
//         team_name: user?.fplTeamName || `Team ${entry.id.substring(0, 4)}`,
//         entry_name: user?.fplTeamName || `Team ${entry.id.substring(0, 4)}`,

//         managerName: user?.name || `Manager ${entry.id.substring(0, 4)}`,
//         manager_name: user?.name || `Manager ${entry.id.substring(0, 4)}`,
//         player_name: user?.name || `Manager ${entry.id.substring(0, 4)}`,
//         displayName: user?.name || `Manager ${entry.id.substring(0, 4)}`,
//         display_name: user?.name || `Manager ${entry.id.substring(0, 4)}`,
//         name: user?.name || `Manager ${entry.id.substring(0, 4)}`,

//         // User info
//         user: {
//           id: user?.id || entry.userId,
//           name: user?.name || `Manager ${entry.id.substring(0, 4)}`,
//         },

//         // Entry info for FPL API compatibility
//         entry: {
//           name: user?.fplTeamName || `Team ${entry.id.substring(0, 4)}`,
//           player_name: user?.name || `Manager ${entry.id.substring(0, 4)}`,
//         },

//         // Include joined timestamp
//         joinedAt: entry.joinedAt ? entry.joinedAt.toISOString() : new Date().toISOString(),

//         // Track winnings if available
//         winnings: entry.winnings || 0,

//         // Add has_played flag for FPL API compatibility
//         has_played: weeklyPoints > 0,

//         // Add current user flag
//         isCurrentUser: false, // Will be set on the client side
//         is_current_user: false, // Will be set on the client side
//       };
//     });

//     // Sort the leaderboard based on league status
//     let sortedLeaderboard: LeaderboardEntry[];

//     if (league.status === 'upcoming') {
//       // For upcoming leagues, sort by join date
//       sortedLeaderboard = leaderboardWithTeamNames.sort((a, b) => {
//         // Safely handle potentially invalid date strings
//         try {
//           const dateA = a.joinedAt ? new Date(a.joinedAt).getTime() : 0;
//           const dateB = b.joinedAt ? new Date(b.joinedAt).getTime() : 0;
//           return dateA - dateB;
//         } catch {
//           return 0; // If date parsing fails, maintain order
//         }
//       });
//     } else if (league.status === 'completed') {
//       // For completed leagues, sort by rank
//       sortedLeaderboard = leaderboardWithTeamNames.sort((a, b) =>
//         (a.rank || 0) - (b.rank || 0)
//       );
//     } else {
//       // For active leagues, sort by points
//       sortedLeaderboard = leaderboardWithTeamNames.sort((a, b) =>
//         (b.points || 0) - (a.points || 0)
//       );
//     }

//     // Calculate positions for active leagues based on points
//     if (league.status === 'active') {
//       let currentPosition = 1;
//       let lastPoints = -1;
//       let samePointsCount = 0;

//       sortedLeaderboard.forEach((entry, index) => {
//         if (entry.points !== lastPoints) {
//           currentPosition = index + 1;
//           lastPoints = entry.points || 0;
//           samePointsCount = 0;
//         } else {
//           samePointsCount++;
//         }

//         entry.position = currentPosition;
//         entry.rank = currentPosition; // Update rank to match position

//         // Find the entry with the highest GW points
//         const highestGwPoints = Math.max(...sortedLeaderboard.map(e => e.weeklyPoints || 0));
//         entry.isGwWinner = entry.weeklyPoints === highestGwPoints && highestGwPoints > 0;
//         entry.is_gw_winner = entry.isGwWinner;
//         entry.gw_winner = entry.isGwWinner;
//       });

//       // Update ranks in the database if data has been refreshed
//       if (dataRefreshed) {
//         await Promise.all(
//           sortedLeaderboard.map(entry =>
//             prisma.leagueEntry.update({
//               where: { id: entry.id },
//               data: { rank: entry.rank }
//             })
//           )
//         );
//       }
//     }

//     // Add timestamp and refresh info for client
//     const responseData = {
//       leaderboard: sortedLeaderboard,
//       meta: {
//         refreshed: dataRefreshed,
//         timestamp: new Date().toISOString(),
//         count: sortedLeaderboard.length,
//         leagueStatus: league.status
//       }
//     };

//     console.log(`Returning leaderboard at ${new Date().toISOString()} with ${sortedLeaderboard.length} entries. Data refreshed: ${dataRefreshed}`);

//     return NextResponse.json(responseData);
//   } catch (error) {
//     console.error("Error fetching leaderboard:", error);
//     return NextResponse.json(
//       { error: "Failed to fetch leaderboard", details: error instanceof Error ? error.message : String(error) },
//       { status: 500 }
//     );
//   }
// }

// /app/api/leagues/weekly/[id]/leaderboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { LeaderboardEntry } from "@/app/types";
import { fetchLiveGameweekPoints, checkGameweekStatus } from "@/lib/fpl-api";

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const params = await context.params;
    const leagueId = params.id;

    console.log(`[LEADERBOARD] Processing request for league ${leagueId}`);

    // Get the league to check if it exists, its status and gameweek
    const league = await prisma.weeklyLeague.findUnique({
      where: { id: leagueId },
      include: {
        entries: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                fplTeamId: true,
                fplTeamName: true,
              },
            },
          },
        },
      },
    });

    if (!league) {
      return NextResponse.json(
        { error: "League not found" },
        { status: 404 }
      );
    }

    // Check gameweek status for both upcoming and active leagues
    if (league.status === 'upcoming' || league.status === 'active') {
      const gameweekStatus = await checkGameweekStatus(league.gameweek);

      // If any matches have started but league is still upcoming, update to active
      if (gameweekStatus.hasStarted && league.status === 'upcoming') {
        console.log(`[LEADERBOARD] Gameweek ${league.gameweek} has started, updating league status to active`);

        await prisma.weeklyLeague.update({
          where: { id: leagueId },
          data: { status: 'active' },
        });

        // Update the league object for this request
        league.status = 'active';
      }

      // If all matches have finished and league is still active, update to completed
      if (gameweekStatus.isComplete && league.status === 'active') {
        console.log(`[LEADERBOARD] Gameweek ${league.gameweek} has completed, updating league status to completed`);

        await prisma.weeklyLeague.update({
          where: { id: leagueId },
          data: { status: 'completed' },
        });

        // Update the league object for this request
        league.status = 'completed';
      }
    }

    let dataRefreshed = false;
    let entriesWithUsers = league.entries;

    // For active leagues, fetch live points from the FPL API
    if (league.status === 'active') {
      console.log(`[LEADERBOARD] League ${leagueId} is active, fetching live points for gameweek ${league.gameweek}`);

      // Extract the FPL team IDs
      const fplTeamIds = entriesWithUsers
        .map(entry => entry.user.fplTeamId)
        .filter((id): id is number => id !== null && id !== undefined);

      console.log(`[LEADERBOARD] Extracted ${fplTeamIds.length} valid FPL team IDs`);

      if (fplTeamIds.length > 0) {
        // Fetch live points for all FPL teams with improved error handling
        console.log(`[LEADERBOARD] Calling fetchLiveGameweekPoints for gameweek ${league.gameweek}...`);
        const livePoints = await fetchLiveGameweekPoints(fplTeamIds, league.gameweek);
        console.log(`[LEADERBOARD] Received live points:`, livePoints);

        if (Object.keys(livePoints).length > 0) {
          // Update entries with the latest points using a transaction for consistency
          await prisma.$transaction(
            entriesWithUsers.map((entry) => {
              const fplTeamId = entry.user.fplTeamId;
              if (!fplTeamId || !(fplTeamId in livePoints)) return prisma.$executeRaw`SELECT 1`;

              const points = livePoints[fplTeamId];
              console.log(`Updating entry ${entry.id} with ${points} points`);

              return prisma.leagueEntry.update({
                where: {
                  id: entry.id
                },
                data: {
                  weeklyPoints: points,
                  finalPoints: (entry.pointsAtStart || 0) + points, // Add starting points to current GW points
                }
              });
            })
          );

          dataRefreshed = true;

          // Refresh entries with updated data
          entriesWithUsers = await prisma.leagueEntry.findMany({
            where: {
              leagueId: leagueId,
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  fplTeamId: true,
                  fplTeamName: true,
                },
              },
            },
          });

          // Check again if the gameweek has completed
          const updatedGameweekStatus = await checkGameweekStatus(league.gameweek);

          if (updatedGameweekStatus.isComplete) {
            console.log(`[LEADERBOARD] Gameweek ${league.gameweek} has completed after points update, finalizing league`);

            // Update league status
            await prisma.weeklyLeague.update({
              where: { id: leagueId },
              data: { status: 'completed' },
            });

            // Update the league object for this request
            league.status = 'completed';

            // Calculate prize pool
            const prizePool = league.entryFee * entriesWithUsers.length * (1 - (league.platformFeePercentage || 5) / 100);

            // Finalize standings and calculate winnings
            const { finalizeLeagueStandings } = await import('@/lib/league-utils');
            await finalizeLeagueStandings(league, entriesWithUsers as any, prizePool);

            // Refresh entries again to get final rankings and winnings
            entriesWithUsers = await prisma.leagueEntry.findMany({
              where: {
                leagueId: leagueId,
              },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    fplTeamId: true,
                    fplTeamName: true,
                  },
                },
              },
            });
          }
        }
      }
    }

    // Transform the data for the frontend
    const leaderboardWithTeamNames: LeaderboardEntry[] = entriesWithUsers.map((entry) => {
      // Use the user data already included in the query
      const user = entry.user;
      const startPoints = entry.pointsAtStart || 0; // Use existing pointsAtStart field
      const weeklyPoints = entry.weeklyPoints || 0;
      const finalPoints = entry.finalPoints || (startPoints + weeklyPoints);

      // Format the entry for the frontend
      return {
        id: entry.id,
        userId: entry.userId,
        rank: entry.rank || 0,
        position: entry.rank || 0, // Ensure position is set
        points: finalPoints,
        finalPoints: finalPoints,

        // Starting points - stored separately now
        startPoints: startPoints,
        startingPoints: startPoints,
        starting_points: startPoints,

        // GW points - ensure this is properly set
        weeklyPoints: weeklyPoints,
        gwPoints: weeklyPoints,
        event_total: weeklyPoints, // Add FPL API format

        // Total points
        total: finalPoints,

        // Team and manager names - ensure all variations are included
        userName: user?.name || `Manager ${entry.id.substring(0, 4)}`,
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

        // Include joined timestamp
        joinedAt: entry.joinedAt ? entry.joinedAt.toISOString() : new Date().toISOString(),

        // Track winnings if available
        winnings: entry.winnings || 0,

        // Add has_played flag for FPL API compatibility
        has_played: weeklyPoints > 0,

        // Add current user flag
        isCurrentUser: false, // Will be set on the client side
        is_current_user: false, // Will be set on the client side
      };
    });

    // Sort the leaderboard based on league status
    let sortedLeaderboard: LeaderboardEntry[];

    if (league.status === 'upcoming') {
      // For upcoming leagues, sort by join date
      sortedLeaderboard = leaderboardWithTeamNames.sort((a, b) => {
        // Safely handle potentially invalid date strings
        try {
          const dateA = a.joinedAt ? new Date(a.joinedAt).getTime() : 0;
          const dateB = b.joinedAt ? new Date(b.joinedAt).getTime() : 0;
          return dateA - dateB;
        } catch {
          return 0; // If date parsing fails, maintain order
        }
      });
    } else if (league.status === 'completed') {
      // For completed leagues, sort by rank
      sortedLeaderboard = leaderboardWithTeamNames.sort((a, b) =>
        (a.rank || 0) - (b.rank || 0)
      );
    } else {
      // For active leagues, sort by points
      sortedLeaderboard = leaderboardWithTeamNames.sort((a, b) =>
        (b.points || 0) - (a.points || 0)
      );
    }

    // Calculate positions for active leagues based on points
    if (league.status === 'active') {
      let currentPosition = 1;
      let lastPoints = -1;
      let samePointsCount = 0;

      sortedLeaderboard.forEach((entry, index) => {
        if (entry.points !== lastPoints) {
          currentPosition = index + 1;
          lastPoints = entry.points || 0;
          samePointsCount = 0;
        } else {
          samePointsCount++;
        }

        entry.position = currentPosition;
        entry.rank = currentPosition; // Update rank to match position

        // Find the entry with the highest GW points
        const highestGwPoints = Math.max(...sortedLeaderboard.map(e => e.weeklyPoints || 0));
        entry.isGwWinner = entry.weeklyPoints === highestGwPoints && highestGwPoints > 0;
        entry.is_gw_winner = entry.isGwWinner;
        entry.gw_winner = entry.isGwWinner;
      });

      // Update ranks in the database if data has been refreshed
      if (dataRefreshed) {
        await Promise.all(
          sortedLeaderboard.map(entry =>
            prisma.leagueEntry.update({
              where: { id: entry.id },
              data: { rank: entry.rank }
            })
          )
        );
      }
    }

    // Add timestamp and refresh info for client
    const responseData = {
      leaderboard: sortedLeaderboard,
      meta: {
        refreshed: dataRefreshed,
        timestamp: new Date().toISOString(),
        count: sortedLeaderboard.length,
        leagueStatus: league.status
      }
    };

    console.log(`Returning leaderboard at ${new Date().toISOString()} with ${sortedLeaderboard.length} entries. Data refreshed: ${dataRefreshed}`);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}