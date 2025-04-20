// // app/api/admin/leagues/[id]/finalize/route.ts

// import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from "next-auth/next";
// import { prisma } from "@/lib/db";
// import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path
// import { checkGameweekStatus, fetchLiveGameweekPoints } from "@/lib/fpl-api"; // Adjust path
// import { finalizeLeagueStandings } from '@/lib/league-utils'; // Adjust path
// import type { Session } from "next-auth";
// import { Prisma, WeeklyLeague, LeagueEntry, User } from '@prisma/client';

// // Define session type
// interface SessionWithAdmin extends Omit<Session, 'user'> {
//     user?: { id?: string; isAdmin?: boolean; };
// }

// // Define type for Entry data needed by finalizeLeagueStandings
// // Ensure this matches the type definition expected IN finalizeLeagueStandings
// type EntryForFinalize = LeagueEntry & {
//     // Include user fields required by finalizeLeagueStandings (e.g., ID, maybe name/email for logs)
//     user?: Pick<User, 'id' | 'name' | 'email'> | null;
// };

// // Main handler for POST request
// export async function POST(
//     request: NextRequest,
//     context: { params: { id: string } }
// ) {
//     const leagueId = context.params.id;
//     const functionStartTime = Date.now();
//     console.log(`[ADMIN_FINALIZE] Request received for League ID: ${leagueId}`);

//     try {
//         // 1. --- Authorization ---
//         const session = await getServerSession(authOptions as any) as SessionWithAdmin; // Keep cast for now if needed
//         const adminUserId = session?.user?.id;
//         if (!adminUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//         const adminUser = await prisma.user.findUnique({ where: { id: adminUserId }, select: { isAdmin: true } });
//         if (!adminUser?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
//         console.log(`[ADMIN_FINALIZE] Authorized Admin: ${adminUserId}`);

//         // 2. --- Fetch League & Validate Status ---
//         // Fetch full league object needed later for finalizeLeagueStandings
//         const leagueToFinalize = await prisma.weeklyLeague.findUnique({ where: { id: leagueId } });
//         if (!leagueToFinalize) return NextResponse.json({ error: "League not found" }, { status: 404 });
//         if (leagueToFinalize.status === 'completed') console.warn(`[ADMIN_FINALIZE] League ${leagueId} already completed, re-finalizing.`);
//         else if (leagueToFinalize.status !== 'active') return NextResponse.json({ error: `League status is '${leagueToFinalize.status}', cannot finalize.` }, { status: 400 });

//         // 3. --- Check FPL Gameweek Status ---
//         const gameweek = leagueToFinalize.gameweek;
//         const fplGwStatus = await checkGameweekStatus(gameweek);
//         // Ensure the check confirms completion including bonus points
//         if (!fplGwStatus.isComplete || !fplGwStatus.bonusPointsAdded) {
//             return NextResponse.json({ error: `Gameweek ${gameweek} not fully finalized by FPL (Complete: ${fplGwStatus.isComplete}, Bonus Added: ${fplGwStatus.bonusPointsAdded}). Wait longer.` }, { status: 400 });
//         }
//         console.log(`[ADMIN_FINALIZE] FPL GW ${gameweek} confirmed complete. Proceeding.`);

//         // --- 4. Perform Final Sync & Finalize ---
//         let finalHighestPoints = leagueToFinalize.currentHighestGwPoints ?? 0;
//         let entriesUpdatedCount = 0;
//         let ranksUpdatedCount = 0;

//         // --- Transaction 1: Sync Final Points & Ranks ---
//         console.log(`[ADMIN_FINALIZE] Starting Transaction 1: Point/Rank Sync...`);
//         await prisma.$transaction(async (tx) => {
//             const entriesToUpdate = await tx.leagueEntry.findMany({
//                 where: { leagueId: leagueId },
//                 select: { id: true, fplTeamId: true, pointsAtStart: true, joinedAt: true, weeklyPoints: true } // Select current weekly points as fallback
//             });
//             const fplTeamIds = entriesToUpdate.map(e => e.fplTeamId).filter((id): id is number => id != null);

//             let finalPointsData: Record<number, number> = {};
//             if (fplTeamIds.length > 0) {
//                 // --- FIX: Call fetch with prioritizeApiPoints = true ---
//                 // Fetch points prioritizing the official /picks API score for final accuracy
//                 finalPointsData = await fetchLiveGameweekPoints(fplTeamIds, gameweek);
//                 // --- END FIX ---
//                 console.log(`[ADMIN_FINALIZE-TX1] Fetched final points (API priority) for ${Object.keys(finalPointsData).length} teams.`);
//             }

//             // Prepare/Apply Point Updates
//             finalHighestPoints = 0; // Recalculate based on final points
//             const finalPointUpdatesPromises: Prisma.PrismaPromise<any>[] = [];
//             entriesToUpdate.forEach(entry => {
//                 // Use fetched points, fallback to existing only if fetch failed for that ID
//                 const weeklyPoints = (entry.fplTeamId != null && entry.fplTeamId in finalPointsData)
//                     ? finalPointsData[entry.fplTeamId]
//                     : (entry.weeklyPoints ?? 0);
//                 const finalPoints = (entry.pointsAtStart || 0) + weeklyPoints;

//                 if (finalPoints > finalHighestPoints) finalHighestPoints = finalPoints; // Track highest FINAL points

//                 finalPointUpdatesPromises.push(tx.leagueEntry.update({
//                     where: { id: entry.id },
//                     data: { weeklyPoints, finalPoints, updatedAt: new Date() }
//                 }));
//             });
//             if (finalPointUpdatesPromises.length > 0) {
//                 console.log(`[ADMIN_FINALIZE-TX1] Applying ${finalPointUpdatesPromises.length} final point updates...`);
//                 await Promise.all(finalPointUpdatesPromises);
//                 entriesUpdatedCount = finalPointUpdatesPromises.length;
//             }

//             // Calculate Final Ranks (based on FINAL points)
//             console.log(`[ADMIN_FINALIZE-TX1] Calculating final ranks based on finalPoints...`);
//             const entriesForFinalRanking = await tx.leagueEntry.findMany({
//                 where: { leagueId: leagueId },
//                 select: { id: true, finalPoints: true, joinedAt: true }, // Use finalPoints
//                 orderBy: [{ finalPoints: 'desc' }, { joinedAt: 'asc' }] // Sort by final points
//             });

//             const finalRankUpdatesPromises: Prisma.PrismaPromise<any>[] = [];
//             let finalRank = 0; let rankCounter = 0; let lastFinalPoints = -Infinity;
//             for (const entry of entriesForFinalRanking) {
//                 rankCounter++;
//                 const currentPoints = entry.finalPoints ?? -Infinity;
//                 if (currentPoints !== lastFinalPoints) { finalRank = rankCounter; lastFinalPoints = currentPoints; }
//                 finalRankUpdatesPromises.push(tx.leagueEntry.update({ where: { id: entry.id }, data: { rank: finalRank } }));
//             }
//             if (finalRankUpdatesPromises.length > 0) {
//                 console.log(`[ADMIN_FINALIZE-TX1] Applying ${finalRankUpdatesPromises.length} final rank updates...`);
//                 await Promise.all(finalRankUpdatesPromises);
//                 ranksUpdatedCount = finalRankUpdatesPromises.length;
//             }

//             // Update league highest points (using FINAL points) and timestamp
//             await tx.weeklyLeague.update({
//                 where: { id: leagueId },
//                 data: { currentHighestGwPoints: finalHighestPoints, updatedAt: new Date() }
//             });
//         }
//         // --- FIX: Remove timeout option from batch transaction overload ---
//         // Removed options object: , { timeout: 30000 }
//         ); // End Transaction 1
//         console.log(`[ADMIN_FINALIZE] Transaction 1 (Point/Rank Sync) complete.`);

//         // --- Step B: Call finalizeLeagueStandings (outside transaction) ---
//         console.log(`[ADMIN_FINALIZE] Fetching data for finalizeLeagueStandings call...`);
//         // Re-fetch league data AFTER transaction if finalizeLeagueStandings needs potentially updated fields
//         const leagueForFinalize = await prisma.weeklyLeague.findUniqueOrThrow({ where: { id: leagueId } });
//         // Fetch entries with final ranks and user data needed by finalizeLeagueStandings
//         const finalEntriesForStandings = await prisma.leagueEntry.findMany({
//             where: { leagueId: leagueId },
//             // --- FIX: Include user email if EntryForFinalize type requires it ---
//             include: { user: { select: { id: true, name: true, email: true } } }
//         });

//         const totalParticipants = finalEntriesForStandings.length;
//         // --- FIX: Convert entryFee to number for calculation ---
//         const totalPot = Number(leagueForFinalize.entryFee) * totalParticipants;
//         const platformFeePercentageNumber = typeof leagueForFinalize.platformFeePercentage === 'number' ? leagueForFinalize.platformFeePercentage : 10;
//         const platformFee = totalPot * (platformFeePercentageNumber / 100);
//         const prizePool = Math.max(0, totalPot - platformFee);

//         console.log(`[ADMIN_FINALIZE] Calling finalizeLeagueStandings (PrizePool=${prizePool})...`);
//         // --- FIX: Ensure finalEntriesForStandings matches EntryForFinalize[] type ---
//         await finalizeLeagueStandings(leagueForFinalize, finalEntriesForStandings as EntryForFinalize[], prizePool); // Adjust type assertion if needed
//         console.log(`[ADMIN_FINALIZE] finalizeLeagueStandings function completed.`);

//         // --- Step C: Final League Status Update ---
//         console.log(`[ADMIN_FINALIZE] Setting league status to 'completed'...`);
//         await prisma.weeklyLeague.update({
//             where: { id: leagueId },
//             data: { status: 'completed', updatedAt: new Date() }
//         });
//         console.log(`[ADMIN_FINALIZE] League ${leagueId} status set to 'completed'.`);

//         // --- 5. Return Success ---
//         const duration = Date.now() - functionStartTime;
//         console.log(`[ADMIN_FINALIZE] League ${leagueId} finalized successfully. Duration: ${duration}ms`);
//         return NextResponse.json({
//             success: true,
//             message: `League ${leagueId} finalized successfully.`,
//             entriesUpdated: entriesUpdatedCount,
//             ranksUpdated: ranksUpdatedCount,
//         }, { status: 200 }); // OK status

//     } catch (error) {
//         const duration = Date.now() - functionStartTime;
//         console.error(`[ADMIN_FINALIZE] Error finalizing league ${context.params.id}:`, error);
//         return NextResponse.json(
//             { error: "Failed to finalize league", details: error instanceof Error ? error.message : "Unknown server error" },
//             { status: 500 }
//         );
//     }
// }

// app/api/admin/leagues/[id]/finalize/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path
import { checkGameweekStatus, fetchLiveGameweekPoints } from "@/lib/fpl-api"; // Adjust path
import { finalizeLeagueStandings } from "@/lib/league-utils"; // Adjust path
import type { Session } from "next-auth";
import { Prisma, WeeklyLeague, LeagueEntry, User } from "@prisma/client";

// Define session type
interface SessionWithAdmin extends Omit<Session, "user"> {
  user?: { id?: string; isAdmin?: boolean };
}

// Define type for Entry data needed by finalizeLeagueStandings
type EntryForFinalize = LeagueEntry & {
  user?: Pick<User, "id" | "name" | "email"> | null;
};

// Main handler for POST request
export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const leagueId = context.params.id;
  const functionStartTime = Date.now();
  console.log(`[ADMIN_FINALIZE] Request received for League ID: ${leagueId}`);

  try {
    // 1. --- Authorization ---
    const session = (await getServerSession(
      authOptions as any
    )) as SessionWithAdmin;
    const adminUserId = session?.user?.id;
    if (!adminUserId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const adminUser = await prisma.user.findUnique({
      where: { id: adminUserId },
      select: { isAdmin: true },
    });
    if (!adminUser?.isAdmin)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    console.log(`[ADMIN_FINALIZE] Authorized Admin: ${adminUserId}`);

    // 2. --- Fetch League & Validate Status ---
    const leagueToFinalize = await prisma.weeklyLeague.findUnique({
      where: { id: leagueId },
    });
    if (!leagueToFinalize)
      return NextResponse.json({ error: "League not found" }, { status: 404 });
    if (leagueToFinalize.status === "completed")
      console.warn(
        `[ADMIN_FINALIZE] Re-finalizing already completed league ${leagueId}.`
      );
    else if (leagueToFinalize.status !== "active")
      return NextResponse.json(
        {
          error: `League status is '${leagueToFinalize.status}', cannot finalize.`,
        },
        { status: 400 }
      );

    // 3. --- Check FPL Gameweek Status ---
    const gameweek = leagueToFinalize.gameweek;
    const fplGwStatus = await checkGameweekStatus(gameweek);
    if (!fplGwStatus.isComplete || !fplGwStatus.bonusPointsAdded) {
      return NextResponse.json(
        {
          error: `Gameweek ${gameweek} not fully finalized by FPL (Complete: ${fplGwStatus.isComplete}, Bonus Added: ${fplGwStatus.bonusPointsAdded}). Wait longer.`,
        },
        { status: 400 }
      );
    }
    console.log(`[ADMIN_FINALIZE] FPL GW ${gameweek} confirmed complete.`);

    // --- 4. Fetch FINAL Points (BEFORE Database Transaction) ---
    console.log(
      `[ADMIN_FINALIZE] Fetching final points data (API priority)...`
    );
    const entriesForPoints = await prisma.leagueEntry.findMany({
      where: { leagueId: leagueId },
      select: {
        id: true,
        fplTeamId: true,
        pointsAtStart: true,
        weeklyPoints: true,
      },
    });
    const fplTeamIds = entriesForPoints
      .map((e) => e.fplTeamId)
      .filter((id): id is number => id != null);
    let finalPointsData: Record<number, number> = {};
    if (fplTeamIds.length > 0) {
      finalPointsData = await fetchLiveGameweekPoints(fplTeamIds, gameweek); // Prioritize official API score
      console.log(
        `[ADMIN_FINALIZE] Fetched final points for ${
          Object.keys(finalPointsData).length
        } teams.`
      );
    }

    // --- 5. Perform Database Updates in Transaction ---
    console.log(
      `[ADMIN_FINALIZE] Starting DB Transaction: Update points, ranks, highest score...`
    );
    let entriesUpdatedCount = 0;
    let ranksUpdatedCount = 0;
    let finalHighestWeeklyPoints = 0; // Track highest WEEKLY points

    await prisma.$transaction(
      async (tx) => {
        // a. Prepare and Apply Point Updates
        const pointUpdatePromises: Prisma.PrismaPromise<any>[] = [];
        entriesForPoints.forEach((entry) => {
          const weeklyPoints =
            entry.fplTeamId != null && entry.fplTeamId in finalPointsData
              ? finalPointsData[entry.fplTeamId]
              : entry.weeklyPoints ?? 0;
          const finalPoints = (entry.pointsAtStart || 0) + weeklyPoints; // Still calculate final points

          // Track highest WEEKLY points for the league record (if needed)
          if (weeklyPoints > finalHighestWeeklyPoints)
            finalHighestWeeklyPoints = weeklyPoints;

          pointUpdatePromises.push(
            tx.leagueEntry.update({
              where: { id: entry.id },
              data: { weeklyPoints, finalPoints, updatedAt: new Date() },
            })
          );
        });
        if (pointUpdatePromises.length > 0) {
          const pointUpdateResults = await Promise.all(pointUpdatePromises);
          entriesUpdatedCount = pointUpdateResults.length;
          console.log(
            `[ADMIN_FINALIZE-TX] Applied ${entriesUpdatedCount} final point updates.`
          );
        }

        // --- FIX: Calculate Final Ranks based on WEEKLY points ---
        console.log(
          `[ADMIN_FINALIZE-TX] Calculating final ranks based on weeklyPoints...`
        );
        const entriesForFinalRanking = await tx.leagueEntry.findMany({
          where: { leagueId: leagueId },
          select: { id: true, weeklyPoints: true, joinedAt: true }, // <<< Use weeklyPoints
          orderBy: [{ weeklyPoints: "desc" }, { joinedAt: "asc" }], // <<< Sort by weeklyPoints
        });
        const finalRankUpdatesPromises: Prisma.PrismaPromise<any>[] = [];
        let finalRank = 0;
        let rankCounter = 0;
        let lastWeeklyPoints = -Infinity; // <<< Compare weeklyPoints
        for (const entry of entriesForFinalRanking) {
          rankCounter++;
          const currentPoints = entry.weeklyPoints ?? -Infinity; // <<< Use weeklyPoints
          if (currentPoints !== lastWeeklyPoints) {
            // <<< Compare weeklyPoints
            finalRank = rankCounter;
            lastWeeklyPoints = currentPoints;
          }
          finalRankUpdatesPromises.push(
            tx.leagueEntry.update({
              where: { id: entry.id },
              data: { rank: finalRank },
            })
          );
        }
        // --- END FIX ---

        // d. Apply Rank Updates
        if (finalRankUpdatesPromises.length > 0) {
          const rankUpdateResults = await Promise.all(finalRankUpdatesPromises);
          ranksUpdatedCount = rankUpdateResults.length;
          console.log(
            `[ADMIN_FINALIZE-TX] Applied ${ranksUpdatedCount} final rank updates (based on weeklyPoints).`
          );
        }

        // e. Update league highest points (use weekly points now) and timestamp
        console.log(
          `[ADMIN_FINALIZE-TX] Updating league highest points to ${finalHighestWeeklyPoints}`
        );
        await tx.weeklyLeague.update({
          where: { id: leagueId },
          // Use the highest WEEKLY points found
          data: {
            currentHighestGwPoints: finalHighestWeeklyPoints,
            updatedAt: new Date(),
          },
        });
      },
      { timeout: 30000 }
    ); // Keep timeout for DB part
    console.log(`[ADMIN_FINALIZE] DB Transaction complete.`);

    // --- 6. Call finalizeLeagueStandings (outside transaction) ---
    console.log(
      `[ADMIN_FINALIZE] Fetching data for finalizeLeagueStandings call...`
    );
    const leagueForFinalize = await prisma.weeklyLeague.findUniqueOrThrow({
      where: { id: leagueId },
    });
    // Fetch entries with final ranks and user data needed
    const finalEntriesForStandings = await prisma.leagueEntry.findMany({
      where: { leagueId: leagueId },
      // Include user data required by finalizeLeagueStandings
      include: { user: { select: { id: true, name: true, email: true } } }, // Adjust select as needed
    });

    const totalParticipants = finalEntriesForStandings.length;
    const totalPot = Number(leagueForFinalize.entryFee) * totalParticipants;
    const platformFeePercentageNumber =
      typeof leagueForFinalize.platformFeePercentage === "number"
        ? leagueForFinalize.platformFeePercentage
        : 10;
    const platformFee = totalPot * (platformFeePercentageNumber / 100);
    const prizePool = Math.max(0, totalPot - platformFee);

    console.log(
      `[ADMIN_FINALIZE] Calling finalizeLeagueStandings (PrizePool=${prizePool})...`
    );
    // finalizeLeagueStandings uses the RANK calculated above (now based on weeklyPoints)
    await finalizeLeagueStandings(
      leagueForFinalize,
      finalEntriesForStandings as EntryForFinalize[],
      prizePool
    );
    console.log(`[ADMIN_FINALIZE] finalizeLeagueStandings function completed.`);

    // --- 7. Final League Status Update ---
    console.log(`[ADMIN_FINALIZE] Setting league status to 'completed'...`);
    await prisma.weeklyLeague.update({
      where: { id: leagueId },
      data: { status: "completed", updatedAt: new Date() },
    });
    console.log(
      `[ADMIN_FINALIZE] League ${leagueId} status set to 'completed'.`
    );

    // --- 8. Return Success ---
    const duration = Date.now() - functionStartTime;
    console.log(
      `[ADMIN_FINALIZE] League ${leagueId} finalized successfully. Duration: ${duration}ms`
    );
    return NextResponse.json(
      {
        success: true,
        message: `League ${leagueId} finalized successfully.`,
        entriesUpdated: entriesUpdatedCount,
        ranksUpdated: ranksUpdatedCount,
      },
      { status: 200 }
    );
  } catch (error) {
    const duration = Date.now() - functionStartTime;
    console.error(
      `[ADMIN_FINALIZE] Error finalizing league ${leagueId}:`,
      error
    ); // Use leagueId variable
    return NextResponse.json(
      {
        error: "Failed to finalize league",
        details:
          error instanceof Error ? error.message : "Unknown server error",
      },
      { status: 500 }
    );
  }
}

// --- Placeholder fetchFplHistoryPointsBeforeGameweek ---
// Ensure this helper is defined or imported correctly if needed elsewhere in this file (not currently used here)
async function fetchFplHistoryPointsBeforeGameweek(
  fplTeamId: number,
  gameweek: number
): Promise<number | null> {
  return 0;
}
