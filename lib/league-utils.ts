// /lib/league-utils.ts
import { prisma } from "@/lib/db";

/**
 * Get prize distribution based on league prize structure type and participant count
 */
export function getPrizeDistribution(type: "tri" | "duo" | "jackpot", participantCount: number) {
    // Get the default distribution based on type
    const distribution = getDefaultPrizeDistribution(type);

    // Limit winners to the number of participants
    return distribution.filter(prize => prize.position <= participantCount);
}

/**
 * Get the default prize distribution based on type
 */
export function getDefaultPrizeDistribution(type: "tri" | "duo" | "jackpot") {
    switch (type) {
        case "tri":
            return [
                { position: 1, percentageShare: 50 },
                { position: 2, percentageShare: 30 },
                { position: 3, percentageShare: 20 },
            ];
        case "duo":
            return [
                { position: 1, percentageShare: 60 },
                { position: 2, percentageShare: 40 },
            ];
        case "jackpot":
            return [
                { position: 1, percentageShare: 100 },
            ];
    }
}

interface League {
    id: string;
    prizeStructureType?: 'tri' | 'duo' | 'jackpot';
    [key: string]: any;
}

interface User {
    id: string;
    name?: string | null;
    fplTeamId?: number | null;
    fplTeamName?: string | null;
    [key: string]: any;
}

interface LeagueEntry {
    id: string;
    userId: string;
    leagueId: string;
    fplTeamId?: number | null;
    finalPoints?: number | null;
    weeklyPoints?: number | null;
    pointsAtStart?: number | null;
    rank?: number | null;
    winnings?: number | null;
    payoutStatus?: string | null;
    joinedAt?: Date;
    user?: User;
    [key: string]: any;
}

interface FinalizedResult {
    finalizedEntries: LeagueEntry[];
    winners: LeagueEntry[];
}

/**
 * Finalize league standings and calculate winnings when a league is completed
 */
export async function finalizeLeagueStandings(
    league: League,
    entries: LeagueEntry[],
    prizePool: number
): Promise<FinalizedResult> {
    console.log(`[FINALIZE_LEAGUE] Calculating final standings for league ${league.id}`);

    try {
        // Sort entries by finalPoints in descending order
        const sortedEntries = [...entries].sort((a, b) =>
            (b.finalPoints || 0) - (a.finalPoints || 0)
        );

        // Calculate ranks (handling ties with same rank)
        let currentRank = 1;
        let previousPoints = -1;

        const rankedEntries = sortedEntries.map((entry, index) => {
            const points = entry.finalPoints || 0;

            // If this entry has different points than the previous one, update the rank
            if (points !== previousPoints) {
                currentRank = index + 1;
                previousPoints = points;
            }

            return {
                ...entry,
                rank: currentRank
            };
        });

        // Get prize distribution based on league type
        const prizeStructureType = league.prizeStructureType || "tri";
        const participantCount = entries.length;
        const prizeDistribution = getPrizeDistribution(prizeStructureType as "tri" | "duo" | "jackpot", participantCount);

        // Calculate winnings for each winner
        const winners: LeagueEntry[] = [];

        // Map of ranks to entries (to handle ties)
        const rankToEntries: Record<number, LeagueEntry[]> = {};
        rankedEntries.forEach(entry => {
            if (!entry.rank) return; // Skip entries with no rank

            if (!rankToEntries[entry.rank]) {
                rankToEntries[entry.rank] = [];
            }
            rankToEntries[entry.rank].push(entry);
        });

        // Process each prize position
        prizeDistribution.forEach(prize => {
            const entriesForPosition = rankToEntries[prize.position] || [];

            if (entriesForPosition.length > 0) {
                // If there are ties, split the prize equally
                const winningsPerEntry = (prizePool * (prize.percentageShare / 100)) / entriesForPosition.length;

                entriesForPosition.forEach(entry => {
                    winners.push({
                        ...entry,
                        winnings: Math.round(winningsPerEntry * 100) / 100, // Round to 2 decimal places
                        payoutStatus: 'pending'
                    });
                });
            }
        });

        // Update non-winners (ensure they have 0 winnings)
        const winnerIds = new Set(winners.map(w => w.id));
        const nonWinners = rankedEntries
            .filter(entry => !winnerIds.has(entry.id))
            .map(entry => ({
                ...entry,
                winnings: 0,
                payoutStatus: null
            }));

        // Combine all entries with updated ranks and winnings
        const finalizedEntries = [...winners, ...nonWinners];

        // Update all entries in the database
        await prisma.$transaction(
            finalizedEntries.map(entry =>
                prisma.leagueEntry.update({
                    where: { id: entry.id },
                    data: {
                        rank: entry.rank,
                        finalPoints: entry.finalPoints,
                        winnings: entry.winnings ?? undefined,
                        payoutStatus: entry.payoutStatus
                    }
                })
            )
        );

        console.log(`[FINALIZE_LEAGUE] Successfully finalized standings for league ${league.id}`);
        console.log(`[FINALIZE_LEAGUE] Winners: ${winners.map(w => `${w.rank}. ${w.user?.name || 'Unknown'} (${w.winnings})`).join(', ')}`);

        return {
            finalizedEntries,
            winners
        };
    } catch (error) {
        console.error(`[FINALIZE_LEAGUE] Error finalizing standings:`, error);
        throw error;
    }
}