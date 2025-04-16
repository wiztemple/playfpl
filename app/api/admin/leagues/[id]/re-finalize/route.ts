// app/api/admin/leagues/[id]/re-finalize/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { PrismaClient, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path if needed
import { fetchLiveGameweekPoints } from "@/lib/fpl-api";
import { finalizeLeagueStandings } from '@/lib/league-utils';
import type { Session } from "next-auth";
import type { LeagueEntry, WeeklyLeague } from '@prisma/client';

interface SessionWithAdmin extends Omit<Session, 'user'> {
    user?: { id?: string; email?: string; name?: string; isAdmin?: boolean; };
}

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const leagueId = context.params.id;
  const functionStartTime = Date.now();
  console.log(`[ADMIN_REFINALIZE] Request received for League ID: ${leagueId}`);

  try {
    // 1. --- Authorization ---
    const session = await getServerSession(authOptions as any) as SessionWithAdmin;
    const currentUserId = session?.user?.id;
    if (!currentUserId) { /* ... return 401 ... */
        console.warn(`[ADMIN_REFINALIZE] Unauthorized: No session user ID.`);
        return NextResponse.json({ error: "Unauthorized: Not signed in" }, { status: 401 });
    }
    const adminUser = await prisma.user.findUnique({ where: { id: currentUserId }, select: { isAdmin: true } });
    if (!adminUser?.isAdmin) { /* ... return 403 ... */
       console.warn(`[ADMIN_REFINALIZE] Forbidden: User ${currentUserId} is not admin.`);
       return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }
    console.log(`[ADMIN_REFINALIZE] Authorized Admin: ${currentUserId}`);

    // 2. --- Fetch League & Validate ---
    // Fetch all fields needed throughout the process
    const leagueToRefinalize = await prisma.weeklyLeague.findUnique({ where: { id: leagueId } });
    if (!leagueToRefinalize) { /* ... return 404 ... */
        console.warn(`[ADMIN_REFINALIZE] League ${leagueId} not found.`);
        return NextResponse.json({ error: "League not found" }, { status: 404 });
    }
    if (leagueToRefinalize.status !== 'completed' && leagueToRefinalize.status !== 'active') { /* ... return 400 ... */
       console.warn(`[ADMIN_REFINALIZE] League ${leagueId} status is '${leagueToRefinalize.status}', cannot re-finalize.`);
       return NextResponse.json({ error: `League status is '${leagueToRefinalize.status}', cannot re-finalize.` }, { status: 400 });
    }
    const gameweek = leagueToRefinalize.gameweek;
    console.log(`[ADMIN_REFINALIZE] League ${leagueId} found. GW: ${gameweek}. Proceeding with re-sync...`);

    // --- 3. Transaction 1: Sync Points & Ranks ---
    let finalHighestPoints = leagueToRefinalize.currentHighestGwPoints ?? 0;
    let entriesUpdatedCount = 0;
    let ranksUpdatedCount = 0;
    console.log(`[ADMIN_REFINALIZE] Starting Transaction 1: Point/Rank Sync for ${leagueId}...`);

    await prisma.$transaction(async (tx) => {
        // a. Fetch entries
        const entriesToUpdate = await tx.leagueEntry.findMany({
            where: { leagueId: leagueId },
            select: { id: true, fplTeamId: true, pointsAtStart: true, joinedAt: true, weeklyPoints: true }
        });
        const fplTeamIds = entriesToUpdate.map(e => e.fplTeamId).filter((id): id is number => id != null);

        // b. Fetch latest points
        let finalPointsData: Record<number, number> = {};
        if (fplTeamIds.length > 0) {
            finalPointsData = await fetchLiveGameweekPoints(fplTeamIds, gameweek);
            console.log(`[ADMIN_REFINALIZE-TX1] Fetched final points for ${Object.keys(finalPointsData).length} teams.`);
        }

        // c. Prepare & Apply Point Updates
        finalHighestPoints = 0; // Reset for final calculation
        const finalPointUpdates = entriesToUpdate.map(entry => {
            const weeklyPoints = finalPointsData[entry.fplTeamId] ?? entry.weeklyPoints ?? 0;
            const finalPoints = (entry.pointsAtStart || 0) + weeklyPoints;
            if (weeklyPoints > finalHighestPoints) finalHighestPoints = weeklyPoints;
            return { where: { id: entry.id }, data: { weeklyPoints, finalPoints, updatedAt: new Date() } };
        }).filter(Boolean);

        if (finalPointUpdates.length > 0) {
            console.log(`[ADMIN_REFINALIZE-TX1] Applying ${finalPointUpdates.length} final point updates...`);
            await Promise.all(finalPointUpdates.map(update => tx.leagueEntry.update(update)));
            entriesUpdatedCount = finalPointUpdates.length;
        }

        // d. Prepare & Apply Rank Updates
        const entriesForFinalRanking = await tx.leagueEntry.findMany({
            where: { leagueId: leagueId },
            select: { id: true, finalPoints: true, joinedAt: true },
            orderBy: [{ finalPoints: 'desc' }, { joinedAt: 'asc' }]
        });

        const finalRankUpdates: Prisma.PrismaPromise<any>[] = [];
        let finalRank = 0; let lastFinalPoints = -Infinity;
        for (let i = 0; i < entriesForFinalRanking.length; i++) {
            const entry = entriesForFinalRanking[i];
            const currentPoints = entry.finalPoints ?? -Infinity;
            if (currentPoints !== lastFinalPoints) { finalRank = i + 1; lastFinalPoints = currentPoints; }
            finalRankUpdates.push(tx.leagueEntry.update({ where: { id: entry.id }, data: { rank: finalRank } }));
        }

        if (finalRankUpdates.length > 0) {
            console.log(`[ADMIN_REFINALIZE-TX1] Applying ${finalRankUpdates.length} final rank updates...`);
            await Promise.all(finalRankUpdates);
            ranksUpdatedCount = finalRankUpdates.length;
        }

        // e. Update league timestamp and highest points (but NOT status)
        await tx.weeklyLeague.update({
            where: { id: leagueId },
            data: {
                currentHighestGwPoints: finalHighestPoints,
                updatedAt: new Date()
                // DO NOT set status: 'completed' here
            }
        });
      },
      // Use a reasonable timeout for the point/rank sync itself
      { timeout: 30000 } // 30 seconds should be enough for points/ranks usually
    );
    console.log(`[ADMIN_REFINALIZE] Transaction 1 (Point/Rank Sync) complete for ${leagueId}.`);

    // --- 4. Step B: Call finalizeLeagueStandings (outside the first transaction) ---
    console.log(`[ADMIN_REFINALIZE] Fetching data for finalizeLeagueStandings call...`);
    // Fetch data needed AFTER points/ranks are committed
    const leagueForFinalize = await prisma.weeklyLeague.findUnique({ where: {id: leagueId }}); // Re-fetch potentially updated league data
    const finalEntriesForStandings = await prisma.leagueEntry.findMany({
        where: { leagueId: leagueId },
        // Ensure this includes user data if needed by finalizeLeagueStandings
        include: { user: { select: { id: true, name: true, fplTeamId: true, fplTeamName: true }} }
    });

    if (!leagueForFinalize) throw new Error("League disappeared after rank sync.");

    const totalParticipants = finalEntriesForStandings.length;
    const totalPot = leagueForFinalize.entryFee * totalParticipants;
    const platformFee = totalPot * (leagueForFinalize.platformFeePercentage / 100);
    const prizePool = Math.max(0, totalPot - platformFee);

    console.log(`[ADMIN_REFINALIZE] Calling finalizeLeagueStandings (outside transaction) for ${leagueId}...`);
    // This function now runs its own logic/transaction using global prisma
    await finalizeLeagueStandings(leagueForFinalize, finalEntriesForStandings, prizePool);
    console.log(`[ADMIN_REFINALIZE] finalizeLeagueStandings function completed for ${leagueId}.`);

    // --- 5. Step C: Final League Status Update ---
    console.log(`[ADMIN_REFINALIZE] Setting league status to 'completed' for ${leagueId}...`);
    await prisma.weeklyLeague.update({
         where: { id: leagueId },
         data: { status: 'completed', updatedAt: new Date() } // Set status to completed
    });
    console.log(`[ADMIN_REFINALIZE] League ${leagueId} status successfully set to 'completed'.`);

    // --- 6. Return Success ---
    const duration = Date.now() - functionStartTime;
    console.log(`[ADMIN_REFINALIZE] League ${leagueId} re-synchronized and finalized successfully. Duration: ${duration}ms`);
    return NextResponse.json({
        success: true,
        message: `League ${leagueId} re-finalized successfully.`,
        entriesUpdated: entriesUpdatedCount, // Report counts from Tx1
        ranksUpdated: ranksUpdatedCount,     // Report counts from Tx1
    });

  } catch (error) {
      const duration = Date.now() - functionStartTime;
      console.error(`[ADMIN_REFINALIZE] Error re-finalizing league ${context.params.id}:`, error);
      // Handle specific errors if needed, otherwise generic 500
      return NextResponse.json(
        { error: "Failed to re-finalize league", details: error instanceof Error ? error.message : "Unknown error" },
        { status: 500 }
      );
  }
}