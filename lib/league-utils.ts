// /lib/league-utils.ts

import { prisma } from "@/lib/db";
import { Prisma, PrismaClient } from "@prisma/client";
// Import necessary Prisma types directly
import type { WeeklyLeague, LeagueEntry as LeagueEntryPrisma, User, Wallet, Transaction } from '@prisma/client';

// --- Prize Distribution Helpers ---
// Assume these helpers exist and return the correct structure:
// export function getPrizeDistribution(...)
// export function getDefaultPrizeDistribution(...)
// Example (ensure this matches your actual logic):
function getDefaultPrizeDistribution(type: WeeklyLeague["leagueType"]) {
    switch (type) {
        case "tri": return [{ position: 1, percentageShare: 50 }, { position: 2, percentageShare: 30 }, { position: 3, percentageShare: 20 },];
        case "duo": return [{ position: 1, percentageShare: 60 }, { position: 2, percentageShare: 40 },];
        case "jackpot": return [{ position: 1, percentageShare: 100 },];
        default: return [{ position: 1, percentageShare: 100 },];
    }
}
function getPrizeDistribution(type: WeeklyLeague["leagueType"], participantCount: number): { position: number, percentageShare: number }[] {
    console.log(`[UTILS] Getting prize distribution for type: ${type}, participants: ${participantCount}`);
    const distribution = getDefaultPrizeDistribution(type);
    const applicableDistribution = distribution.filter(prize => prize.position <= participantCount);
    if (applicableDistribution.length === 0 && participantCount > 0) {
        return [{ position: 1, percentageShare: 100 }]; // Fallback
    }
    return applicableDistribution;
}
// --- End Prize Distribution Helpers ---


// --- Type Definitions ---
// Type for the entries array expected by this function
// Must include fields needed for prize calculation and wallet/transaction updates
type EntryForFinalize = Pick<LeagueEntryPrisma,
    'id' | 'userId' | 'rank' | 'finalPoints' | 'winnings' | 'payoutStatus'
> & {
    user?: Pick<User, 'id' | 'name' | 'email'> | null // Optional user for logging
};

// Define return type
interface FinalizedResult {
    finalizedEntries: LeagueEntryPrisma[]; // Return full entries after update
    winners: EntryForFinalize[]; // Entries that won > 0
}

// Define the type for the Prisma Transaction Client
type TxClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

// --- Main Finalization Function ---

/**
 * Calculates and saves final winnings, credits user wallets, and creates payout transactions.
 * Assumes 'entries' provided have the correct final 'rank' already set.
 * Runs its own database transaction.
 * Call this AFTER final points/ranks have been synced.
 */
export async function finalizeLeagueStandings(
    league: WeeklyLeague, // Expect full league object
    entries: EntryForFinalize[],
    prizePool: number // Expect calculated prize pool (Pot - Platform Fee)
): Promise<FinalizedResult> {
    const functionStartTime = Date.now();
    const leagueId = league.id;
    console.log(`[FINALIZE_LEAGUE] Finalizing league ${leagueId}. Prize Pool: ${prizePool.toFixed(2)}, Participants: ${entries.length}`);

    // Use the global prisma instance imported at the top
    const db = prisma;

    try {
        if (entries.length === 0) {
            console.log(`[FINALIZE_LEAGUE] No entries in league ${leagueId}. Skipping finalize process.`);
            return { finalizedEntries: [], winners: [] };
        }

        // --- STEP 1: Group entries by the FINAL RANK provided ---
        const rankToEntries: Record<number, EntryForFinalize[]> = {};
        entries.forEach(entry => {
            if (entry.rank != null && entry.rank > 0) {
                if (!rankToEntries[entry.rank]) rankToEntries[entry.rank] = [];
                rankToEntries[entry.rank].push(entry);
            } else {
                console.warn(`[FINALIZE_LEAGUE] Entry ${entry.id} (User ${entry.userId}) has invalid rank (${entry.rank}) and is excluded from prize calculation.`);
            }
        });

        // --- STEP 2: Get prize distribution rules ---
        const prizeStructureType = league.leagueType as "tri" | "duo" | "jackpot" || "duo"; // Use leagueType field
        const participantCount = entries.length;
        const prizeDistribution = getPrizeDistribution(prizeStructureType, participantCount);
        console.log(`[FINALIZE_LEAGUE] Prize Structure: ${prizeStructureType}, Distribution Rules Used:`, prizeDistribution);

        // --- STEP 3: Calculate winnings data ---
        const winnersDataForUpdate: {
            entryId: string;
            userId: string;
            rank: number;
            winningsAmount: Prisma.Decimal; // Use Decimal for precision
            payoutStatus: string | null;
        }[] = [];

        if (prizePool > 0) {
            const prizePoolDecimal = new Prisma.Decimal(prizePool.toFixed(2)); // Work with Decimal
            prizeDistribution.forEach(prize => {
                const entriesForPosition = rankToEntries[prize.position] || [];
                // Calculate total prize for this position using Decimal
                const prizeAmountForPosition = prizePoolDecimal.times(prize.percentageShare).dividedBy(100);

                console.log(`[FINALIZE_LEAGUE] Position ${prize.position}: Share=${prize.percentageShare}%, Total Prize=${prizeAmountForPosition.toFixed(2)}, Tied Entries=${entriesForPosition.length}`);

                if (entriesForPosition.length > 0) {
                    // Split prize among tied entries using Decimal division
                    const winningsPerEntryDecimal = prizeAmountForPosition.dividedBy(entriesForPosition.length);
                    // Round to 2 decimal places for currency
                    const roundedWinnings = winningsPerEntryDecimal.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
                    console.log(`[FINALIZE_LEAGUE] Position ${prize.position}: Calculated Winnings per entry = ${roundedWinnings}`);

                    entriesForPosition.forEach(entry => {
                        if (roundedWinnings.greaterThan(0)) { // Process only actual winners
                            winnersDataForUpdate.push({
                                entryId: entry.id,
                                userId: entry.userId,
                                rank: entry.rank!, // Rank is guaranteed non-null here
                                winningsAmount: roundedWinnings,
                                payoutStatus: 'PAID_TO_WALLET' // Set status for actual winners
                            });
                        }
                        // No need for else here, non-winners handled next
                    });
                }
            });
        } else {
            console.log(`[FINALIZE_LEAGUE] Prize pool is 0, skipping winner calculation.`);
        }

        // --- STEP 4: Prepare updates for all entries (winners and non-winners) ---
        const winnerEntryIds = new Set(winnersDataForUpdate.map(w => w.entryId));
        const allEntryUpdatesData = entries.map(entry => {
            const winnerData = winnersDataForUpdate.find(w => w.entryId === entry.id);
            if (winnerData) {
                // This entry is a winner
                return {
                    id: entry.id,
                    winnings: winnerData.winningsAmount, // Use the precise Decimal value
                    payoutStatus: winnerData.payoutStatus
                };
            } else {
                // This entry is not a winner
                return {
                    id: entry.id,
                    winnings: new Prisma.Decimal(0), // Set winnings to 0 Decimal
                    payoutStatus: null // Clear payout status
                };
            }
        });

        // --- STEP 5: Update Database (Winnings, Status, Wallet Balance, Transaction) ---
        if (allEntryUpdatesData.length > 0) {
            console.log(`[FINALIZE_LEAGUE] Preparing DB transaction for ${allEntryUpdatesData.length} entries and ${winnersDataForUpdate.length} potential wallet credits.`);

            await db.$transaction(async (tx) => {
                // --- 5a. Update LeagueEntry Winnings and Status ---
                console.log(`[FINALIZE_LEAGUE-TX] Updating LeagueEntry records...`);
                const entryUpdatePromises = allEntryUpdatesData.map(update =>
                    tx.leagueEntry.update({
                        where: { id: update.id },
                        data: {
                            winnings: update.winnings,
                            payoutStatus: update.payoutStatus
                            // DO NOT update rank or finalPoints here
                        }
                    })
                );
                await Promise.all(entryUpdatePromises); // Wait for entry updates

                // --- 5b. Update Wallets and Create Transactions for Winners ---
                console.log(`[FINALIZE_LEAGUE-TX] Processing ${winnersDataForUpdate.length} winners for wallet credit...`);
                const walletAndTransactionPromises: Prisma.PrismaPromise<any>[] = [];
                for (const winner of winnersDataForUpdate) {
                    // Find the winner's wallet ID within the transaction
                    const wallet = await tx.wallet.findUnique({
                        where: { userId: winner.userId },
                        select: { id: true } // Select only ID
                    });

                    if (!wallet) {
                        console.error(`[FINALIZE_LEAGUE-TX] Wallet not found for winner user ${winner.userId}! Cannot credit winnings ${winner.winningsAmount} for entry ${winner.entryId}.`);
                        // Mark entry as failed payout?
                        await tx.leagueEntry.update({ where: { id: winner.entryId }, data: { payoutStatus: 'PAYOUT_FAILED_NO_WALLET' } });
                        continue; // Skip wallet/transaction ops for this winner
                    }

                    // Add Wallet Balance Increment Promise
                    walletAndTransactionPromises.push(
                        tx.wallet.update({
                            where: { id: wallet.id },
                            data: { balance: { increment: winner.winningsAmount } } // Increment by Decimal amount
                        })
                    );
                    // Add WINNINGS_PAYOUT Transaction Creation Promise
                    walletAndTransactionPromises.push(
                        tx.transaction.create({
                            data: {
                                userId: winner.userId,
                                walletId: wallet.id,
                                type: 'WINNINGS_PAYOUT', // Use String value (or Enum if schema uses Enum)
                                status: 'COMPLETED',    // Use String value (or Enum)
                                amount: winner.winningsAmount, // Use Decimal amount (positive)
                                currency: 'NGN', // Assuming NGN
                                description: `Winnings: ${league.name} (GW${league.gameweek}) - Rank ${winner.rank}`,
                                metadata: { leagueId: league.id, leagueEntryId: winner.entryId, rank: winner.rank }
                            }
                        })
                    );
                } // End for loop

                // Execute wallet/transaction updates if any
                if (walletAndTransactionPromises.length > 0) {
                    console.log(`[FINALIZE_LEAGUE-TX] Executing ${walletAndTransactionPromises.length / 2} wallet credits and transaction records...`);
                    await Promise.all(walletAndTransactionPromises);
                } else {
                    console.log(`[FINALIZE_LEAGUE-TX] No wallet credits/transactions to process.`);
                }

            }, { timeout: 30000 }); // 30 second timeout for the entire finalize transaction

            console.log(`[FINALIZE_LEAGUE] Database updated successfully.`);
        } else {
            console.log(`[FINALIZE_LEAGUE] No entry updates were required.`);
        }

        // --- STEP 6: Prepare and Return Results ---
        console.log(`[FINALIZE_LEAGUE] Fetching final state of entries for league ${leagueId}...`);
        // Fetch the latest state AFTER updates are committed
        // Ensure this includes the necessary fields for the EntryForFinalize type
        const finalizedEntries = await db.leagueEntry.findMany({
            where: { leagueId: league.id },
            include: { user: { select: { id: true, name: true, email: true } } }, // Include user if needed by EntryForFinalize
            orderBy: { rank: 'asc' } // Order by final rank
        });

        // --- FIX: Filter the finalized entries based on the committed Decimal winnings ---
        // Create the finalWinners array from the data just fetched from the DB
        const finalWinners = finalizedEntries.filter(entry =>
            // Use Decimal's comparison method .greaterThan()
            entry.winnings !== null && entry.winnings.greaterThan(0)
        );

        const duration = Date.now() - functionStartTime;
        console.log(`[FINALIZE_LEAGUE] Successfully finalized standings for league ${league.id}. Duration: ${duration}ms`);
        console.log(`[FINALIZE_LEAGUE] Winners (${finalWinners.length}): ${finalWinners.map(w => `${w.rank}. User ${w.user?.name || w.userId.substring(0, 4)} (${w.winnings})`).join(', ')}`);

        return {
            finalizedEntries, // Return entries with updated winnings/status
            winners: finalWinners as EntryForFinalize[]
        };
    } catch (error) {
        const duration = Date.now() - functionStartTime;
        console.error(`[FINALIZE_LEAGUE] Error finalizing standings for league ${league.id}. Duration: ${duration}ms`, error);
        // Re-throw or handle error as needed by the caller
        throw new Error(`Failed to finalize league standings: ${error instanceof Error ? error.message : String(error)}`);
    }
}