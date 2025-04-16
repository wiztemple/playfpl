// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/db";
// import type { DisplayedLeaderboardEntry, League } from "@/app/types";
// import { checkGameweekStatus } from "@/lib/fpl-api";
// import { finalizeLeagueStandings } from '@/lib/league-utils';
// import type { LeagueEntry, User } from '@prisma/client';

// interface EntryWithUser extends LeagueEntry {
//   user: Pick<User, 'id' | 'name' | 'fplTeamId' | 'fplTeamName'>;
// }

// export async function GET(
//   request: NextRequest,
//   context: { params: { id: string } }
// ) {
//   const functionStartTime = Date.now();
//   try {
//     const url = request.nextUrl;
//     const page = parseInt(url.searchParams.get('page') || '1');
//     const limit = parseInt(url.searchParams.get('limit') || '20');
//     const offset = (page - 1) * limit;
//     const params = await context.params;
//     const leagueId = params.id;

//     if (!leagueId) {
//       return NextResponse.json({ error: "League ID is required" }, { status: 400 });
//     }

//     console.log(`[API_LEADERBOARD] Request: League ${leagueId}, Page ${page}, Limit ${limit}`);

//     // --- 1. Fetch League Info ---
//     // Still fetch the league to get its status, highest points etc.
//     let league: League | null = await prisma.weeklyLeague.findUnique({
//       where: { id: leagueId },
//     });

//     if (!league) {
//       console.warn(`[API_LEADERBOARD] League ${leagueId} not found.`);
//       return NextResponse.json({ error: "League not found" }, { status: 404 });
//     }

//     // --- 2. Check Status & Handle Completion Transition (Optional Here) ---
//     // You might still want to check status here to potentially trigger
//     // finalization *if* the cron job hasn't run yet after GW completion.
//     // Or, rely solely on the cron job to eventually mark it as completed.
//     // Keeping the completion check here provides faster finalization upon viewing.
//     if (league.status === 'active') {
//       const gameweekStatus = await checkGameweekStatus(league.gameweek);
//       const isTrulyComplete = gameweekStatus.isComplete && gameweekStatus.bonusPointsAdded;

//       if (isTrulyComplete) {
//         console.log(`[API_LEADERBOARD] GW ${league.gameweek} completed. Finalizing League ${leagueId} via API request.`);
//         // --- Finalization Logic (Copied from previous version) ---
//         const finalEntriesForStandings = await prisma.leagueEntry.findMany({
//           where: { leagueId: leagueId },
//           include: { user: { select: { id: true, name: true, fplTeamId: true, fplTeamName: true } } }
//         });
//         const totalParticipants = finalEntriesForStandings.length;

//         const totalPot = league.entryFee * totalParticipants;
//         const platformFee = totalPot * (league.platformFeePercentage / 100);
//         const prizePool = Math.max(0, totalPot - platformFee);
//         console.log(`[API_LEADERBOARD] Finalizing: Participants=${totalParticipants}, Pot=${totalPot}, Fee%=${league.platformFeePercentage}, Fee=${platformFee}, Pool=${prizePool}`);
//         try {
//           await finalizeLeagueStandings(league, finalEntriesForStandings, prizePool);
//           league = await prisma.weeklyLeague.update({
//             where: { id: leagueId }, data: { status: 'completed' },
//           });
//           console.log(`[API_LEADERBOARD] League ${leagueId} status updated to completed via API request.`);
//         } catch (finalizationError) {
//           console.error(`[API_LEADERBOARD] CRITICAL ERROR during finalizeLeagueStandings for League ${leagueId} triggered by API request:`, finalizationError);
//           // Log but continue, maybe cron job will fix it
//         }
//       }
//     }
//     // Note: We removed the 'upcoming' -> 'active' transition here, assuming
//     // the cron job or another mechanism handles that, or it's less critical
//     // for the leaderboard view itself. Add it back if needed.

//     // --- !! REMOVED POINT FETCHING AND UPDATING LOGIC !! ---

//     // --- 3. Fetch Paginated Data (Points/Rank assumed up-to-date) ---
//     const totalCount = await prisma.leagueEntry.count({
//       where: { leagueId: leagueId }
//     });

//     // Determine sort order (same logic, relying on DB values)
//     let sortOrder: any;
//     if (league.status === 'upcoming') {
//       sortOrder = [{ joinedAt: 'asc' as const }];
//     } else if (league.status === 'completed') {
//       // Use stored rank. Remove 'nulls' fix if DB handles it now.
//       sortOrder = [{ rank: 'asc' as const }, { finalPoints: 'desc' as const }, { id: 'asc' as const }];
//     } else { // active
//       // Use stored rank. Remove 'nulls' fix if DB handles it now.
//       sortOrder = [{ rank: 'asc' as const }, { finalPoints: 'desc' as const }, { id: 'asc' as const }];
//     }

//     // Fetch the page data
//     const entriesForPage: EntryWithUser[] = await prisma.leagueEntry.findMany({
//       where: { leagueId: leagueId },
//       include: {
//         user: {
//           select: { id: true, name: true, fplTeamId: true, fplTeamName: true },
//         },
//       },
//       orderBy: sortOrder,
//       skip: offset,
//       take: limit
//     });

//     // --- 4. Transform Data ---
//     const highestGwPointsForLeague = league.currentHighestGwPoints ?? 0;
//     const leaderboardData: DisplayedLeaderboardEntry[] = entriesForPage.map((entry) => {
//       const user = entry.user;
//       const weeklyPoints = entry.weeklyPoints ?? 0;
//       const rank = entry.rank;
//       const isWinner = league.status === 'active' &&
//         weeklyPoints > 0 &&
//         weeklyPoints === highestGwPointsForLeague;

//       // Mapping logic remains largely the same, using fields directly from 'entry'
//       const mappedEntry: DisplayedLeaderboardEntry = {
//         id: entry.id, userId: entry.userId, leagueId: entry.leagueId, fplTeamId: entry.fplTeamId,
//         joinedAt: entry.joinedAt.toISOString(), paid: entry.paid, paymentId: entry.paymentId,
//         pointsAtStart: entry.pointsAtStart, finalPoints: entry.finalPoints, weeklyPoints: weeklyPoints,
//         rank: rank, winnings: entry.winnings || 0, payoutStatus: entry.payoutStatus,
//         userName: user?.name, teamName: user?.fplTeamName, position: rank, isGwWinner: isWinner,
//         isCurrentUser: false, points: entry.finalPoints, gwPoints: weeklyPoints, startPoints: entry.pointsAtStart,
//       };
//       return mappedEntry;
//     });

//     // --- 5. Prepare and Return Response ---
//     const responseData = {
//       leaderboard: leaderboardData,
//       meta: {
//         refreshed: false, // Data is as fresh as the last cron run, not refreshed *by this request*
//         timestamp: new Date().toISOString(), // Timestamp of the API response
//         count: totalCount, page: page, limit: limit, totalPages: Math.ceil(totalCount / limit),
//         leagueStatus: league.status,
//         highestGwPoints: league.status === 'active' ? highestGwPointsForLeague : null
//       }
//     };

//     const duration = Date.now() - functionStartTime;
//     console.log(`[API_LEADERBOARD] Response Sent: League ${leagueId}, Page ${page}. Status: ${league.status}. Duration: ${duration}ms`);

//     return NextResponse.json(responseData);

//   } catch (error) {
//     const duration = Date.now() - functionStartTime;
//     console.error(`[API_LEADERBOARD] FATAL ERROR for league ${context?.params?.id}:`, error);
//     const errorMessage = error instanceof Error ? error.message : "Unknown error";
//     return NextResponse.json(
//       { error: "Failed to fetch leaderboard", details: "An internal server error occurred." },
//       { status: 500 }
//     );
//   }
// }

// app/api/leagues/weekly/[id]/leaderboard/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth-options"; // Adjust path if needed
import type { Session } from "next-auth";
import { Prisma } from "@prisma/client";
// Import the specific type expected by the LeaderboardCard component
import type { DisplayedLeaderboardEntry } from "@/app/types"; // Adjust path if needed

// Define session type
interface SessionWithUser extends Omit<Session, 'user'> { user?: { id?: string }; }

// Define structure fetched from DB (includes user relation)
type FetchedLeagueEntry = Prisma.LeagueEntryGetPayload<{
  include: { user: { select: { id: true, name: true, fplTeamId: true, fplTeamName: true } } }
}>;


export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const functionStartTime = Date.now();
  const params = await context.params;
  const leagueId = params.id;
  const url = request.nextUrl;
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '30'); // Use consistent limit
  const offset = (page - 1) * limit;

  if (!leagueId) return NextResponse.json({ error: "League ID required" }, { status: 400 });
  if (isNaN(page) || page < 1) return NextResponse.json({ error: "Invalid page" }, { status: 400 });
  if (isNaN(limit) || limit < 1 || limit > 100) return NextResponse.json({ error: "Invalid limit" }, { status: 400 });

  console.log(`[API_LEADERBOARD] Request: League ${leagueId}, Page ${page}, Limit ${limit}`);

  try {
    // Fetch session to identify current user (optional, only needed for isCurrentUser flag)
    const session: Session | null = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;
    if (currentUserId) console.log(`[API_LEADERBOARD] Current User ID: ${currentUserId}`);

    // --- 1. Fetch League Info (Only necessary fields) ---
    const league = await prisma.weeklyLeague.findUnique({
      where: { id: leagueId },
      select: { id: true, status: true, gameweek: true, currentHighestGwPoints: true } // Select fields needed
    });

    if (!league) {
      console.warn(`[API_LEADERBOARD] League ${leagueId} not found.`);
      return NextResponse.json({ error: "League not found" }, { status: 404 });
    }

    // --- !! REMOVED AUTOMATIC FINALIZATION BLOCK !! ---

    // --- 2. Fetch Paginated Entries ---
    const totalCount = await prisma.leagueEntry.count({ where: { leagueId: leagueId } });

    // --- FIX: Determine sort order based on status AND user request ---
    let sortOrder: Prisma.LeagueEntryOrderByWithRelationInput[];
    if (league.status === 'upcoming') {
      sortOrder = [{ joinedAt: 'asc' }];
    } else if (league.status === 'completed') {
      // Completed leagues use final rank
      sortOrder = [{ rank: 'asc' }, { finalPoints: 'desc' }, { id: 'asc' }];
    } else { // active league - SORT BY WEEKLY POINTS!
      sortOrder = [{ weeklyPoints: 'desc' }, { joinedAt: 'asc' }]; // Primary: weeklyPoints DESC, Tiebreaker: joinedAt ASC
    }
    console.log(`[API_LEADERBOARD] Using sort order for status '${league.status}':`, JSON.stringify(sortOrder));


    // Fetch the page data including user relation
    const entriesForPage: FetchedLeagueEntry[] = await prisma.leagueEntry.findMany({
      where: { leagueId: leagueId },
      include: {
        user: { select: { id: true, name: true, fplTeamId: true, fplTeamName: true } },
      },
      orderBy: sortOrder,
      skip: offset,
      take: limit
    });

    // --- 3. Transform Data to Match DisplayedLeaderboardEntry Type ---
    const highestGwPointsForLeague = league.currentHighestGwPoints ?? 0;

    const leaderboardData: DisplayedLeaderboardEntry[] = entriesForPage.map((entry) => {
      const user = entry.user;
      const weeklyPoints = entry.weeklyPoints ?? 0;
      const rank = entry.rank; // This rank is now based on weeklyPoints if active (needs cron job update)
      const isWinner = league.status === 'active' && weeklyPoints > 0 && weeklyPoints === highestGwPointsForLeague;

      // Ensure structure matches DisplayedLeaderboardEntry defined in app/types.ts
      // Convert Decimal/Date to number/string
      return {
        id: entry.id, userId: entry.userId, leagueId: entry.leagueId, fplTeamId: entry.fplTeamId,
        joinedAt: entry.joinedAt.toISOString(), // Date -> string
        paid: entry.paid, paymentId: entry.paymentId,
        pointsAtStart: entry.pointsAtStart, // Keep as number | null
        finalPoints: entry.finalPoints, // Keep as number | null
        weeklyPoints: weeklyPoints, // Use calculated var (number)
        rank: rank, // Use rank from DB (number | null)
        // FIX: Convert winnings Decimal -> number
        winnings: entry.winnings?.toNumber() ?? 0,
        payoutStatus: entry.payoutStatus,
        // User details
        userName: user?.name ?? null,
        teamName: user?.fplTeamName ?? null,
        // Fields required by DisplayedLeaderboardEntry
        position: rank, // Use rank for position display
        isGwWinner: isWinner,
        isCurrentUser: entry.userId === currentUserId, // <<< FIX: Check against current user
        // Ensure consistent naming with DisplayedLeaderboardEntry type
        points: entry.finalPoints, // Assuming 'points' means finalPoints
        gwPoints: weeklyPoints, // Assuming 'gwPoints' means weeklyPoints
        startPoints: entry.pointsAtStart, // Assuming 'startPoints' means pointsAtStart
      };
    });

    // --- 4. Prepare and Return Response ---
    const responseData = {
      leaderboard: leaderboardData,
      meta: {
        refreshed: false,
        timestamp: new Date().toISOString(),
        count: totalCount,
        page: page,
        limit: limit,
        totalPages: Math.ceil(totalCount / limit),
        leagueStatus: league.status, // Pass current status
        highestGwPoints: league.status === 'active' ? highestGwPointsForLeague : null
      }
    };

    const duration = Date.now() - functionStartTime;
    console.log(`[API_LEADERBOARD] Response Sent: League ${leagueId}, Page ${page}. Status: ${league.status}. Duration: ${duration}ms`);
    return NextResponse.json(responseData);

  } catch (error) {
    // ... Error handling ...
    const duration = Date.now() - functionStartTime; console.error(`[API_LEADERBOARD] FATAL ERROR for league ${context?.params?.id}:`, error); return NextResponse.json({ error: "Failed to fetch leaderboard", details: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}