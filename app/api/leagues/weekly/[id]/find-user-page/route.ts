// // app/api/leagues/weekly/[id]/find-user-page/route.ts

// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/db";
// import { Prisma } from '@prisma/client'; // Import Prisma namespace for types
// import type { WeeklyLeague, LeagueEntry } from '@prisma/client'; // Import specific model types

// // Define sorting type helper matching Prisma's input type
// type LeagueOrderByInput = Prisma.LeagueEntryOrderByWithRelationInput | Prisma.LeagueEntryOrderByWithRelationInput[];


// export async function GET(
//   request: NextRequest,
//   context: { params: { id: string } }
// ) {
//   const functionStartTime = Date.now();
//   try {
//     const params = await context.params;
//     const leagueId = params.id;
//     const url = request.nextUrl;
//     const userId = url.searchParams.get('userId');
//     // Ensure default limit matches LeaderboardCard or is reasonable
//     const limit = parseInt(url.searchParams.get('limit') || '30');

//     console.log(`[FIND_USER_PAGE] Request: League ${leagueId}, User ${userId}, Limit ${limit}`);

//     // Validate inputs
//     if (!userId) {
//       return NextResponse.json({ error: "userId parameter is required" }, { status: 400 });
//     }
//     if (!leagueId) {
//        return NextResponse.json({ error: "leagueId parameter is required" }, { status: 400 });
//     }
//     if (isNaN(limit) || limit <= 0) {
//          return NextResponse.json({ error: "Invalid limit parameter" }, { status: 400 });
//     }

//     // 1. Fetch league to determine status for sorting
//     const league = await prisma.weeklyLeague.findUnique({
//       where: { id: leagueId },
//       select: { status: true } // Only need status
//     });

//     if (!league) {
//       console.warn(`[FIND_USER_PAGE] League ${leagueId} not found.`);
//       return NextResponse.json({ error: "League not found" }, { status: 404 });
//     }

//     // 2. Determine Sort Order (MUST **EXACTLY** MATCH the main leaderboard route)
//     let sortOrder: LeagueOrderByInput;
//     if (league.status === 'upcoming') {
//       sortOrder = [{ joinedAt: 'asc' as const }];
//     } else if (league.status === 'completed') {
//       // Use rank, then points/id as tie-breaker (No 'nulls' option as per previous fix)
//       sortOrder = [{ rank: 'asc' as const }, { finalPoints: 'desc' as const }, { id: 'asc' as const }];
//     } else { // active
//        // Use rank, then points/id as tie-breaker (No 'nulls' option)
//        sortOrder = [{ rank: 'asc' as const }, { finalPoints: 'desc' as const }, { id: 'asc' as const }];
//     }
//     console.log(`[FIND_USER_PAGE] Determined sort order for status '${league.status}':`, JSON.stringify(sortOrder));


//     // 3. Find ALL entries, sorted, selecting only minimal fields needed
//     const allSortedEntries = await prisma.leagueEntry.findMany({
//         where: { leagueId: leagueId },
//         select: { userId: true }, // Only need userId to find the index
//         orderBy: sortOrder,
//     });

//      if (allSortedEntries.length === 0) {
//          console.log(`[FIND_USER_PAGE] No entries found for league ${leagueId}.`);
//          return NextResponse.json({ page: null, message: "No entries in this league." });
//      }

//     // 4. Find the 0-based index of the current user
//     const userIndex = allSortedEntries.findIndex(entry => entry.userId === userId);

//     if (userIndex === -1) {
//       console.log(`[FIND_USER_PAGE] User ${userId} not found in league ${leagueId}.`);
//       return NextResponse.json({ page: null, message: "User not found in this league." });
//     }
//     console.log(`[FIND_USER_PAGE] User ${userId} found at index ${userIndex} (0-based).`);


//     // 5. Calculate the page number (1-based index)
//     const pageNumber = Math.floor(userIndex / limit) + 1;

//     const duration = Date.now() - functionStartTime;
//     console.log(`[FIND_USER_PAGE] Calculated page ${pageNumber} for user ${userId}. Duration: ${duration}ms`);

//     // Return the calculated page number
//     return NextResponse.json({ page: pageNumber });

//   } catch (error) {
//     const duration = Date.now() - functionStartTime;
//     const userIdParam = request.nextUrl.searchParams.get('userId'); // Get again for error log
//     console.error(`[FIND_USER_PAGE] Error finding user page for league ${context.params.id}, user ${userIdParam}:`, error);
//     return NextResponse.json(
//       { error: "Failed to find user page", details: error instanceof Error ? error.message : String(error) },
//       { status: 500 }
//     );
//   }
// }

// app/api/leagues/weekly/[id]/find-user-page/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from '@prisma/client'; // Import Prisma namespace for types
// Removed unused WeeklyLeague/LeagueEntry imports here

// Define sorting type helper matching Prisma's input type
type LeagueOrderByInput = Prisma.LeagueEntryOrderByWithRelationInput | Prisma.LeagueEntryOrderByWithRelationInput[];


export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const functionStartTime = Date.now();
  try {
    const leagueId = context.params.id;
    const url = request.nextUrl;
    const userId = url.searchParams.get('userId');
    const limit = parseInt(url.searchParams.get('limit') || '30'); // Use same default as LeaderboardCard

    console.log(`[FIND_USER_PAGE] Request: League ${leagueId}, User ${userId}, Limit ${limit}`);

    // Validate inputs
    if (!userId) { return NextResponse.json({ error: "userId parameter is required" }, { status: 400 }); }
    if (!leagueId) { return NextResponse.json({ error: "leagueId parameter is required" }, { status: 400 }); }
    if (isNaN(limit) || limit <= 0) { return NextResponse.json({ error: "Invalid limit parameter" }, { status: 400 }); }

    // 1. Fetch league status for sorting logic
    const league = await prisma.weeklyLeague.findUnique({
      where: { id: leagueId },
      select: { status: true } // Only need status
    });

    if (!league) {
      console.warn(`[FIND_USER_PAGE] League ${leagueId} not found.`);
      return NextResponse.json({ error: "League not found" }, { status: 404 });
    }

    // 2. Determine Sort Order (MUST MATCH Leaderboard API)
    let sortOrder: LeagueOrderByInput;
    if (league.status === 'upcoming') {
      sortOrder = [{ joinedAt: 'asc' }];
    } else if (league.status === 'completed') {
      // Completed uses final rank
      sortOrder = [{ rank: 'asc' }, { finalPoints: 'desc' }, { id: 'asc' }];
    } else { // status === 'active'
      // --- FIX: Sort active leagues by weeklyPoints descending ---
      sortOrder = [{ weeklyPoints: 'desc' }, { joinedAt: 'asc' }];
      // --- END FIX ---
    }
    console.log(`[FIND_USER_PAGE] Determined sort order for status '${league.status}':`, JSON.stringify(sortOrder));


    // 3. Find ALL entry IDs/UserIDs sorted correctly
    // Need id only if using it as a final tie-breaker, otherwise userId is enough
    const allSortedEntries = await prisma.leagueEntry.findMany({
      where: { leagueId: leagueId },
      select: { userId: true }, // Only need userId to find the index
      orderBy: sortOrder,
    });

    if (allSortedEntries.length === 0) {
      console.log(`[FIND_USER_PAGE] No entries found for league ${leagueId}.`);
      // Return page 1 if no entries? Or null? Null seems clearer.
      return NextResponse.json({ page: null, message: "No entries in this league." });
    }

    // 4. Find the 0-based index of the requested user
    const userIndex = allSortedEntries.findIndex(entry => entry.userId === userId);

    if (userIndex === -1) {
      console.log(`[FIND_USER_PAGE] User ${userId} not found in league ${leagueId}.`);
      return NextResponse.json({ page: null, message: "User not found in this league." });
    }
    console.log(`[FIND_USER_PAGE] User ${userId} found at index ${userIndex} (0-based).`);


    // 5. Calculate the page number (1-based index)
    const pageNumber = Math.floor(userIndex / limit) + 1;

    const duration = Date.now() - functionStartTime;
    console.log(`[FIND_USER_PAGE] Calculated page ${pageNumber} for user ${userId}. Duration: ${duration}ms`);

    // Return the calculated page number
    return NextResponse.json({ page: pageNumber });

  } catch (error) {
    const duration = Date.now() - functionStartTime;
    const userIdParam = request.nextUrl.searchParams.get('userId');
    console.error(`[FIND_USER_PAGE] Error finding user page for league ${context.params.id}, user ${userIdParam}:`, error);
    return NextResponse.json(
      { error: "Failed to find user page", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}