// // app/api/admin/leagues/[id]/finalize/route.ts

// import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from "next-auth/next";
// import { prisma } from "@/lib/db";
// import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path
// import { checkGameweekStatus, fetchLiveGameweekPoints } from "@/lib/fpl-api";
// import { finalizeLeagueStandings } from '@/lib/league-utils';
// import type { Session } from "next-auth";
// import type { LeagueEntry, WeeklyLeague } from '@prisma/client';

// // Helper type for session
// interface SessionWithAdmin extends Omit<Session, 'user'> {
//     user?: { id?: string; email?: string; name?: string; isAdmin?: boolean; };
// }

// // Main handler for POST request
// export async function POST(
//     request: NextRequest, // Use NextRequest
//     context: { params: { id: string } }
// ) {
//     const leagueId = context.params.id;
//     const functionStartTime = Date.now();
//     console.log(`[ADMIN_FINALIZE] Request received for League ID: ${leagueId}`);

//     try {
//         // 1. --- Authorization ---
//         const session = await getServerSession(authOptions as any) as SessionWithAdmin;
//         const currentUserId = session?.user?.id;
//         if (!currentUserId) return NextResponse.json({ error: "Unauthorized: Not signed in" }, { status: 401 });

//         const adminUser = await prisma.user.findUnique({ where: { id: currentUserId }, select: { isAdmin: true } });
//         if (!adminUser?.isAdmin) return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
//         console.log(`[ADMIN_FINALIZE] Authorized Admin: ${currentUserId}`);

//         // 2. --- Fetch League & Validate ---
//         const leagueToFinalize = await prisma.weeklyLeague.findUnique({ where: { id: leagueId } });
//         if (!leagueToFinalize) return NextResponse.json({ error: "League not found" }, { status: 404 });

//         // Optional: Allow finalizing only 'active' leagues, or allow re-finalizing 'completed'?
//         // Let's allow both for flexibility, but log a warning if already completed.
//         if (leagueToFinalize.status === 'completed') {
//             console.warn(`[ADMIN_FINALIZE] League ${leagueId} is already completed, proceeding with re-finalization.`);
//         } else if (leagueToFinalize.status !== 'active') {
//             return NextResponse.json({ error: `League status is '${leagueToFinalize.status}', cannot finalize.` }, { status: 400 });
//         }

//         // 3. --- Check FPL Gameweek Status (Crucial!) ---
//         // Ensure FPL has actually finished processing before allowing manual finalize
//         const gameweek = leagueToFinalize.gameweek;
//         const fplGwStatus = await checkGameweekStatus(gameweek);
//         const isReadyForFinalization = fplGwStatus.isComplete; // Use the strict check

//         if (!isReadyForFinalization) {
//             console.warn(`[ADMIN_FINALIZE] Attempted to finalize league ${leagueId} but FPL GW <span class="math-inline">\{gameweek\} is not complete \(isComplete\=</span>{fplGwStatus.isComplete}, bonusAdded=${fplGwStatus.bonusPointsAdded}).`);
//             return NextResponse.json(
//                 { error: `Gameweek ${gameweek} is not yet fully finalized by FPL (Bonus Added: ${fplGwStatus.bonusPointsAdded}). Wait until official confirmation.` },
//                 { status: 400 }
//             );
//         }
//         console.log(`[ADMIN_FINALIZE] FPL GW ${gameweek} confirmed complete. Proceeding to finalize league ${leagueId}.`);


//         // --- 4. Perform Final Sync & Finalize (Transaction 1 + Step B + Step C from previous logic) ---
//         let finalHighestPoints = leagueToFinalize.currentHighestGwPoints ?? 0;
//         let entriesUpdatedCount = 0;
//         let ranksUpdatedCount = 0;

//         // --- Transaction 1: Sync Points & Ranks ---
//         console.log(`[ADMIN_FINALIZE] Starting Transaction 1: Point/Rank Sync...`);
//         await prisma.$transaction(async (tx) => {
//             const entriesToUpdate = await tx.leagueEntry.findMany({
//                 where: { leagueId: leagueId },
//                 select: { id: true, fplTeamId: true, pointsAtStart: true, joinedAt: true, weeklyPoints: true }
//             });


//             const fplTeamIds = entriesToUpdate.map(e => e.fplTeamId).filter((id): id is number => id != null);

//             let finalPointsData: Record<number, number> = {};
//             if (fplTeamIds.length > 0) {
//                 finalPointsData = await fetchLiveGameweekPoints(fplTeamIds, gameweek, true);
//                 console.log(`[ADMIN_FINALIZE-TX1] Fetched final points for ${Object.keys(finalPointsData).length} teams.`);
//                 console.log(`[CRON_DEBUG] League ${leagueId} - FINAL Re-Fetched Points Data:`, JSON.stringify(finalPointsData, null, 2)); // Reuse debug name
//             }

//             finalHighestPoints = 0;
//             const finalPointUpdates = entriesToUpdate.map(entry => {
//                 const weeklyPoints = finalPointsData[entry.fplTeamId] ?? entry.weeklyPoints ?? 0;
//                 const finalPoints = (entry.pointsAtStart || 0) + weeklyPoints;
//                 if (weeklyPoints > finalHighestPoints) finalHighestPoints = weeklyPoints;
//                 return { where: { id: entry.id }, data: { weeklyPoints, finalPoints, updatedAt: new Date() } };
//             }).filter(Boolean);

//             if (finalPointUpdates.length > 0) {
//                 console.log(`[ADMIN_FINALIZE-TX1] Applying ${finalPointUpdates.length} final point updates...`);
//                 await Promise.all(finalPointUpdates.map(update => tx.leagueEntry.update(update)));
//                 entriesUpdatedCount = finalPointUpdates.length;
//             }

//             const entriesForFinalRanking = await tx.leagueEntry.findMany({
//                 where: { leagueId: leagueId },
//                 select: { id: true, finalPoints: true, joinedAt: true },
//                 orderBy: [{ finalPoints: 'desc' }, { joinedAt: 'asc' }]
//             });
//             const finalRankUpdatesInput: { where: { id: string }, data: { rank: number } }[] = [];
//             let finalRank = 0; let lastFinalPoints = -Infinity;
//             for (let i = 0; i < entriesForFinalRanking.length; i++) { /* ... calculate rank ... */
//                 const entry = entriesForFinalRanking[i]; const currentPoints = entry.finalPoints ?? -Infinity;
//                 if (currentPoints !== lastFinalPoints) { finalRank = i + 1; lastFinalPoints = currentPoints; }
//                 finalRankUpdatesInput.push({ where: { id: entry.id }, data: { rank: finalRank } });
//             }
//             const finalRankUpdates = finalRankUpdatesInput.map(update => tx.leagueEntry.update(update));
//             if (finalRankUpdates.length > 0) {
//                 console.log(`[ADMIN_FINALIZE-TX1] Applying ${finalRankUpdates.length} final rank updates...`);
//                 await Promise.all(finalRankUpdates);
//                 ranksUpdatedCount = finalRankUpdates.length;
//             }

//             // Update league highest points and timestamp only
//             await tx.weeklyLeague.update({
//                 where: { id: leagueId },
//                 data: { currentHighestGwPoints: finalHighestPoints, updatedAt: new Date() }
//             });
//         },
//             { timeout: 30000 } // Timeout for sync transaction
//         ); // End Transaction 1
//         console.log(`[ADMIN_FINALIZE] Transaction 1 (Point/Rank Sync) complete.`);


//         // --- Step B: Call finalizeLeagueStandings (outside transaction) ---
//         console.log(`[ADMIN_FINALIZE] Fetching data for finalizeLeagueStandings call...`);
//         // Use global prisma - data from Tx1 is committed now
//         const leagueForFinalize = await prisma.weeklyLeague.findUnique({ where: { id: leagueId } });
//         const finalEntriesForStandings = await prisma.leagueEntry.findMany({
//             where: { leagueId: leagueId },
//             include: { user: { select: { id: true, name: true, fplTeamId: true, fplTeamName: true } } }
//         });
//         if (!leagueForFinalize) throw new Error("League disappeared after rank sync.");

//         const totalParticipants = finalEntriesForStandings.length;
//         const totalPot = leagueForFinalize.entryFee * totalParticipants;
//         const platformFee = totalPot * (leagueForFinalize.platformFeePercentage / 100);
//         const prizePool = Math.max(0, totalPot - platformFee);

//         console.log(`[ADMIN_FINALIZE] Calling finalizeLeagueStandings (PrizePool=${prizePool})...`);
//         await finalizeLeagueStandings(leagueForFinalize, finalEntriesForStandings, prizePool);
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
//         console.log(`[ADMIN_FINALIZE] League ${leagueId} finalized successfully via admin action. Duration: ${duration}ms`);
//         return NextResponse.json({
//             success: true,
//             message: `League ${leagueId} finalized successfully.`,
//             entriesUpdated: entriesUpdatedCount,
//             ranksUpdated: ranksUpdatedCount,
//         });

//     } catch (error) {
//         const duration = Date.now() - functionStartTime;
//         console.error(`[ADMIN_FINALIZE] Error finalizing league ${context.params.id}:`, error);
//         return NextResponse.json(
//             { error: "Failed to finalize league", details: error instanceof Error ? error.message : "Unknown error" },
//             { status: 500 }
//         );
//     }
// }

// app/api/admin/leagues/[id]/finalize/route.ts

// import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from "next-auth/next";
// import { prisma } from "@/lib/db";
// import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path
// import { checkGameweekStatus, fetchLiveGameweekPoints } from "@/lib/fpl-api"; // Adjust path
// import { finalizeLeagueStandings } from '@/lib/league-utils'; // Adjust path
// import type { Session } from "next-auth";
// import { Prisma, WeeklyLeague, LeagueEntry, User } from '@prisma/client'; // Import needed types

// // Define session type
// interface SessionWithAdmin extends Omit<Session, 'user'> {
//     user?: { id?: string; isAdmin?: boolean; };
// }

// // Define type for Entry data needed by finalizeLeagueStandings
// // Ensure this matches the type definition expected IN finalizeLeagueStandings
// type EntryForFinalize = LeagueEntry & {
//     user?: Pick<User, 'id' | 'name' | 'email'> | null; // Make sure email is included if needed
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
//         const session = await getServerSession(authOptions as any) as SessionWithAdmin;
//         const adminUserId = session?.user?.id;
//         if (!adminUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//         const adminUser = await prisma.user.findUnique({ where: { id: adminUserId }, select: { isAdmin: true } });
//         if (!adminUser?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
//         console.log(`[ADMIN_FINALIZE] Authorized Admin: ${adminUserId}`);

//         // 2. --- Fetch League & Validate Status ---
//         const leagueToFinalize = await prisma.weeklyLeague.findUnique({ where: { id: leagueId } });
//         if (!leagueToFinalize) return NextResponse.json({ error: "League not found" }, { status: 404 });
//         if (leagueToFinalize.status === 'completed') console.warn(`[ADMIN_FINALIZE] League ${leagueId} already completed, re-finalizing.`);
//         else if (leagueToFinalize.status !== 'active') return NextResponse.json({ error: `League status is '${leagueToFinalize.status}', cannot finalize.` }, { status: 400 });

//         // 3. --- Check FPL Gameweek Status ---
//         const gameweek = leagueToFinalize.gameweek;
//         const fplGwStatus = await checkGameweekStatus(gameweek);
//         if (!fplGwStatus.isComplete) { // Use the strict check result
//             return NextResponse.json({ error: `Gameweek ${gameweek} not fully finalized by FPL (Bonus Added: ${fplGwStatus.bonusPointsAdded}). Wait longer.` }, { status: 400 });
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
//                 select: { id: true, fplTeamId: true, pointsAtStart: true, joinedAt: true, weeklyPoints: true }
//             });
//             const fplTeamIds = entriesToUpdate.map(e => e.fplTeamId).filter((id): id is number => id != null);

//             let finalPointsData: Record<number, number> = {};
//             if (fplTeamIds.length > 0) {
//                 // --- Call fetch with prioritizeApiPoints = true ---
//                 finalPointsData = await fetchLiveGameweekPoints(fplTeamIds, gameweek);
//                 console.log(`[ADMIN_FINALIZE-TX1] Fetched final points (API priority) for ${Object.keys(finalPointsData).length} teams.`);
//             }

//             // Prepare/Apply Point Updates
//             finalHighestPoints = 0;
//             const finalPointUpdates = entriesToUpdate.map(entry => { /* ... create update data ... */
//                 const weeklyPoints = finalPointsData[entry.fplTeamId] ?? entry.weeklyPoints ?? 0;
//                 const finalPoints = (entry.pointsAtStart || 0) + weeklyPoints;
//                 if (weeklyPoints > finalHighestPoints) finalHighestPoints = weeklyPoints; // Use highest WEEKLY points here maybe? Or highest FINAL? Let's use final.
//                 if (finalPoints > finalHighestPoints) finalHighestPoints = finalPoints; // Track highest FINAL points
//                 return { where: { id: entry.id }, data: { weeklyPoints, finalPoints, updatedAt: new Date() } };
//             }).filter(Boolean);
//             if (finalPointUpdates.length > 0) {
//                 console.log(`[ADMIN_FINALIZE-TX1] Applying ${finalPointUpdates.length} final point updates...`);
//                 await Promise.all(finalPointUpdates.map(update => tx.leagueEntry.update(update)));
//                 entriesUpdatedCount = finalPointUpdates.length;
//             }

//             // Calculate Final Ranks (based on FINAL points for completed leagues)
//             const entriesForFinalRanking = await tx.leagueEntry.findMany({
//                 where: { leagueId: leagueId },
//                 select: { id: true, finalPoints: true, joinedAt: true }, // Use finalPoints for final ranking
//                 orderBy: [{ finalPoints: 'desc' }, { joinedAt: 'asc' }] // Sort by final points
//             });
//             const finalRankUpdatesInput: { where: { id: string }, data: { rank: number } }[] = [];
//             let finalRank = 0; let rankCounter = 0; let lastFinalPoints = -Infinity;
//             for (const entry of entriesForFinalRanking) {
//                 rankCounter++;
//                 const currentPoints = entry.finalPoints ?? -Infinity;
//                 if (currentPoints !== lastFinalPoints) { finalRank = rankCounter; lastFinalPoints = currentPoints; }
//                 finalRankUpdatesInput.push({ where: { id: entry.id }, data: { rank: finalRank } });
//             }
//             const finalRankUpdates = finalRankUpdatesInput.map(update => tx.leagueEntry.update(update));
//             if (finalRankUpdates.length > 0) {
//                 console.log(`[ADMIN_FINALIZE-TX1] Applying ${finalRankUpdates.length} final rank updates (based on finalPoints)...`);
//                 await Promise.all(finalRankUpdates);
//                 ranksUpdatedCount = finalRankUpdates.length;
//             }

//             // Update league highest points (using final points now) and timestamp
//             await tx.weeklyLeague.update({
//                 where: { id: leagueId },
//                 data: { currentHighestGwPoints: finalHighestPoints, updatedAt: new Date() }
//             });
//         },
//             { timeout: 30000 } // Timeout for sync transaction
//         ); // End Transaction 1
//         console.log(`[ADMIN_FINALIZE] Transaction 1 (Point/Rank Sync) complete.`);

//         // --- Step B: Call finalizeLeagueStandings (outside transaction) ---
//         console.log(`[ADMIN_FINALIZE] Fetching data for finalizeLeagueStandings call...`);
//         const leagueForFinalize = await prisma.weeklyLeague.findUnique({ where: { id: leagueId } }); // Re-fetch full league needed by finalize
//         // --- FIX: Fetch entries WITH USER EMAIL for finalize function ---
//         const finalEntriesForStandings = await prisma.leagueEntry.findMany({
//             where: { leagueId: leagueId },
//             include: { user: { select: { id: true, name: true, email: true } } } // Ensure email is selected if EntryForFinalize requires it
//         });
//         if (!leagueForFinalize) throw new Error("League disappeared after rank sync.");

//         const totalParticipants = finalEntriesForStandings.length;
//         // --- FIX: Convert entryFee to number for calculation ---
//         const totalPot = Number(leagueForFinalize.entryFee) * totalParticipants;
//         const platformFeePercentageNumber = typeof leagueForFinalize.platformFeePercentage === 'number' ? leagueForFinalize.platformFeePercentage : 10;
//         const platformFee = totalPot * (platformFeePercentageNumber / 100);
//         const prizePool = Math.max(0, totalPot - platformFee);

//         console.log(`[ADMIN_FINALIZE] Calling finalizeLeagueStandings (PrizePool=${prizePool})...`);
//         // --- FIX: Ensure finalEntriesForStandings matches EntryForFinalize[] type ---
//         // If EntryForFinalize is just LeagueEntry & { user: { select...}}, this cast should work
//         await finalizeLeagueStandings(leagueForFinalize, finalEntriesForStandings as any, prizePool); // Use 'as any' temporarily if type mismatch persists, but fix type ideally
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
//         return NextResponse.json({ /* ... success response ... */ });

//     } catch (error) {
//         console.error(`[ADMIN_FINALIZE] Error finalizing league ${context.params.id}:`, error);
//         return NextResponse.json(
//             { error: "Failed to finalize league", details: error instanceof Error ? error.message : "Unknown error" },
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
import { finalizeLeagueStandings } from '@/lib/league-utils'; // Adjust path
import type { Session } from "next-auth";
import { Prisma, WeeklyLeague, LeagueEntry, User } from '@prisma/client';

// Define session type
interface SessionWithAdmin extends Omit<Session, 'user'> {
    user?: { id?: string; isAdmin?: boolean; };
}

// Define type for Entry data needed by finalizeLeagueStandings
// Ensure this matches the type definition expected IN finalizeLeagueStandings
type EntryForFinalize = LeagueEntry & {
    // Include user fields required by finalizeLeagueStandings (e.g., ID, maybe name/email for logs)
    user?: Pick<User, 'id' | 'name' | 'email'> | null;
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
        const session = await getServerSession(authOptions as any) as SessionWithAdmin; // Keep cast for now if needed
        const adminUserId = session?.user?.id;
        if (!adminUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const adminUser = await prisma.user.findUnique({ where: { id: adminUserId }, select: { isAdmin: true } });
        if (!adminUser?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        console.log(`[ADMIN_FINALIZE] Authorized Admin: ${adminUserId}`);

        // 2. --- Fetch League & Validate Status ---
        // Fetch full league object needed later for finalizeLeagueStandings
        const leagueToFinalize = await prisma.weeklyLeague.findUnique({ where: { id: leagueId } });
        if (!leagueToFinalize) return NextResponse.json({ error: "League not found" }, { status: 404 });
        if (leagueToFinalize.status === 'completed') console.warn(`[ADMIN_FINALIZE] League ${leagueId} already completed, re-finalizing.`);
        else if (leagueToFinalize.status !== 'active') return NextResponse.json({ error: `League status is '${leagueToFinalize.status}', cannot finalize.` }, { status: 400 });

        // 3. --- Check FPL Gameweek Status ---
        const gameweek = leagueToFinalize.gameweek;
        const fplGwStatus = await checkGameweekStatus(gameweek);
        // Ensure the check confirms completion including bonus points
        if (!fplGwStatus.isComplete || !fplGwStatus.bonusPointsAdded) {
            return NextResponse.json({ error: `Gameweek ${gameweek} not fully finalized by FPL (Complete: ${fplGwStatus.isComplete}, Bonus Added: ${fplGwStatus.bonusPointsAdded}). Wait longer.` }, { status: 400 });
        }
        console.log(`[ADMIN_FINALIZE] FPL GW ${gameweek} confirmed complete. Proceeding.`);


        // --- 4. Perform Final Sync & Finalize ---
        let finalHighestPoints = leagueToFinalize.currentHighestGwPoints ?? 0;
        let entriesUpdatedCount = 0;
        let ranksUpdatedCount = 0;

        // --- Transaction 1: Sync Final Points & Ranks ---
        console.log(`[ADMIN_FINALIZE] Starting Transaction 1: Point/Rank Sync...`);
        await prisma.$transaction(async (tx) => {
            const entriesToUpdate = await tx.leagueEntry.findMany({
                where: { leagueId: leagueId },
                select: { id: true, fplTeamId: true, pointsAtStart: true, joinedAt: true, weeklyPoints: true } // Select current weekly points as fallback
            });
            const fplTeamIds = entriesToUpdate.map(e => e.fplTeamId).filter((id): id is number => id != null);

            let finalPointsData: Record<number, number> = {};
            if (fplTeamIds.length > 0) {
                // --- FIX: Call fetch with prioritizeApiPoints = true ---
                // Fetch points prioritizing the official /picks API score for final accuracy
                finalPointsData = await fetchLiveGameweekPoints(fplTeamIds, gameweek);
                // --- END FIX ---
                console.log(`[ADMIN_FINALIZE-TX1] Fetched final points (API priority) for ${Object.keys(finalPointsData).length} teams.`);
            }

            // Prepare/Apply Point Updates
            finalHighestPoints = 0; // Recalculate based on final points
            const finalPointUpdatesPromises: Prisma.PrismaPromise<any>[] = [];
            entriesToUpdate.forEach(entry => {
                // Use fetched points, fallback to existing only if fetch failed for that ID
                const weeklyPoints = (entry.fplTeamId != null && entry.fplTeamId in finalPointsData)
                    ? finalPointsData[entry.fplTeamId]
                    : (entry.weeklyPoints ?? 0);
                const finalPoints = (entry.pointsAtStart || 0) + weeklyPoints;

                if (finalPoints > finalHighestPoints) finalHighestPoints = finalPoints; // Track highest FINAL points

                finalPointUpdatesPromises.push(tx.leagueEntry.update({
                    where: { id: entry.id },
                    data: { weeklyPoints, finalPoints, updatedAt: new Date() }
                }));
            });
            if (finalPointUpdatesPromises.length > 0) {
                console.log(`[ADMIN_FINALIZE-TX1] Applying ${finalPointUpdatesPromises.length} final point updates...`);
                await Promise.all(finalPointUpdatesPromises);
                entriesUpdatedCount = finalPointUpdatesPromises.length;
            }

            // Calculate Final Ranks (based on FINAL points)
            console.log(`[ADMIN_FINALIZE-TX1] Calculating final ranks based on finalPoints...`);
            const entriesForFinalRanking = await tx.leagueEntry.findMany({
                where: { leagueId: leagueId },
                select: { id: true, finalPoints: true, joinedAt: true }, // Use finalPoints
                orderBy: [{ finalPoints: 'desc' }, { joinedAt: 'asc' }] // Sort by final points
            });

            const finalRankUpdatesPromises: Prisma.PrismaPromise<any>[] = [];
            let finalRank = 0; let rankCounter = 0; let lastFinalPoints = -Infinity;
            for (const entry of entriesForFinalRanking) {
                rankCounter++;
                const currentPoints = entry.finalPoints ?? -Infinity;
                if (currentPoints !== lastFinalPoints) { finalRank = rankCounter; lastFinalPoints = currentPoints; }
                finalRankUpdatesPromises.push(tx.leagueEntry.update({ where: { id: entry.id }, data: { rank: finalRank } }));
            }
            if (finalRankUpdatesPromises.length > 0) {
                console.log(`[ADMIN_FINALIZE-TX1] Applying ${finalRankUpdatesPromises.length} final rank updates...`);
                await Promise.all(finalRankUpdatesPromises);
                ranksUpdatedCount = finalRankUpdatesPromises.length;
            }

            // Update league highest points (using FINAL points) and timestamp
            await tx.weeklyLeague.update({
                where: { id: leagueId },
                data: { currentHighestGwPoints: finalHighestPoints, updatedAt: new Date() }
            });
        }
        // --- FIX: Remove timeout option from batch transaction overload ---
        // Removed options object: , { timeout: 30000 }
        ); // End Transaction 1
        console.log(`[ADMIN_FINALIZE] Transaction 1 (Point/Rank Sync) complete.`);


        // --- Step B: Call finalizeLeagueStandings (outside transaction) ---
        console.log(`[ADMIN_FINALIZE] Fetching data for finalizeLeagueStandings call...`);
        // Re-fetch league data AFTER transaction if finalizeLeagueStandings needs potentially updated fields
        const leagueForFinalize = await prisma.weeklyLeague.findUniqueOrThrow({ where: { id: leagueId } });
        // Fetch entries with final ranks and user data needed by finalizeLeagueStandings
        const finalEntriesForStandings = await prisma.leagueEntry.findMany({
            where: { leagueId: leagueId },
            // --- FIX: Include user email if EntryForFinalize type requires it ---
            include: { user: { select: { id: true, name: true, email: true } } }
        });

        const totalParticipants = finalEntriesForStandings.length;
        // --- FIX: Convert entryFee to number for calculation ---
        const totalPot = Number(leagueForFinalize.entryFee) * totalParticipants;
        const platformFeePercentageNumber = typeof leagueForFinalize.platformFeePercentage === 'number' ? leagueForFinalize.platformFeePercentage : 10;
        const platformFee = totalPot * (platformFeePercentageNumber / 100);
        const prizePool = Math.max(0, totalPot - platformFee);

        console.log(`[ADMIN_FINALIZE] Calling finalizeLeagueStandings (PrizePool=${prizePool})...`);
        // --- FIX: Ensure finalEntriesForStandings matches EntryForFinalize[] type ---
        await finalizeLeagueStandings(leagueForFinalize, finalEntriesForStandings as EntryForFinalize[], prizePool); // Adjust type assertion if needed
        console.log(`[ADMIN_FINALIZE] finalizeLeagueStandings function completed.`);

        // --- Step C: Final League Status Update ---
        console.log(`[ADMIN_FINALIZE] Setting league status to 'completed'...`);
        await prisma.weeklyLeague.update({
            where: { id: leagueId },
            data: { status: 'completed', updatedAt: new Date() }
        });
        console.log(`[ADMIN_FINALIZE] League ${leagueId} status set to 'completed'.`);

        // --- 5. Return Success ---
        const duration = Date.now() - functionStartTime;
        console.log(`[ADMIN_FINALIZE] League ${leagueId} finalized successfully. Duration: ${duration}ms`);
        return NextResponse.json({
            success: true,
            message: `League ${leagueId} finalized successfully.`,
            entriesUpdated: entriesUpdatedCount,
            ranksUpdated: ranksUpdatedCount,
        }, { status: 200 }); // OK status

    } catch (error) {
        const duration = Date.now() - functionStartTime;
        console.error(`[ADMIN_FINALIZE] Error finalizing league ${context.params.id}:`, error);
        return NextResponse.json(
            { error: "Failed to finalize league", details: error instanceof Error ? error.message : "Unknown server error" },
            { status: 500 }
        );
    }
}
