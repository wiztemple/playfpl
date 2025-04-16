import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options"; // Adjust path if needed
import { prisma } from "@/lib/db";
import { z } from "zod";
import { verifyFplTeam, fetchFplHistoryPointsBeforeGameweek } from "@/lib/fpl-api"; // Adjust path
import { Prisma } from "@prisma/client";
import type { Session } from "next-auth";
import type { WeeklyLeague, LeagueEntry, User, Wallet } from '@prisma/client'; // Import necessary types

// Define session type with user ID
interface SessionWithUser extends Omit<Session, 'user'> {
    user?: { id?: string };
}

// Validation schema for request body
const joinLeagueSchema = z.object({
    fplTeamId: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, {
        message: "FPL Team ID must be a positive number string"
    })
});

// Helper type for User with Wallet (from Prisma query)
type UserWithWallet = (Prisma.UserGetPayload<{
    select: { fplTeamId: true, fplTeamName: true, wallet: { select: { id: true, balance: true } } }
}>) | null;

// Helper type for League with count (from Prisma query)
type LeagueWithCount = (Prisma.WeeklyLeagueGetPayload<{
    select: { entryFee: true, status: true, maxParticipants: true, gameweek: true, name: true, _count: { select: { entries: true } } }
}>) | null;


export async function POST(
    request: NextRequest,
    context: { params: { id: string } }
) {
    const params = await context.params;
    const leagueId = params.id;
    console.log(`[API JOIN LEAGUE ${leagueId}] Received POST request.`);

    try {
        // 1. --- Authentication ---
        const session = await getServerSession(authOptions as any) as SessionWithUser;
        const userId = session?.user?.id;
        if (!userId) { return NextResponse.json({ error: "You must be signed in" }, { status: 401 }); }
        console.log(`[API JOIN LEAGUE ${leagueId}] User authenticated: ${userId}`);

        // 2. --- Input Validation ---
        let parsedTeamId: number;
        let validatedFplTeamIdString: string;
        try {
            const body = await request.json();
            const validationResult = joinLeagueSchema.safeParse(body);
            if (!validationResult.success) {
                return NextResponse.json({ error: "Invalid FPL Team ID", details: validationResult.error.format() }, { status: 400 });
            }
            validatedFplTeamIdString = validationResult.data.fplTeamId;
            parsedTeamId = parseInt(validatedFplTeamIdString);
        } catch (e) { return NextResponse.json({ error: "Invalid request body" }, { status: 400 }); }
        console.log(`[API JOIN LEAGUE ${leagueId}] Validated input FPL ID: ${parsedTeamId}`);

        // 3. --- Fetch User (with Wallet) & League Data ---
        const [user, league]: [UserWithWallet, LeagueWithCount] = await Promise.all([
            prisma.user.findUnique({ where: { id: userId }, select: { fplTeamId: true, fplTeamName: true, wallet: { select: { id: true, balance: true } } } }),
            prisma.weeklyLeague.findUnique({ where: { id: leagueId }, select: { entryFee: true, status: true, maxParticipants: true, gameweek: true, name: true, _count: { select: { entries: true } } } })
        ]);

        // 4. --- League Validation ---
        if (!league) return NextResponse.json({ error: "League not found" }, { status: 404 });
        if (league.status !== "upcoming") return NextResponse.json({ error: "League not open for joining" }, { status: 400 });
        if (league._count.entries >= league.maxParticipants) return NextResponse.json({ error: "League is full" }, { status: 400 });
        console.log(`[API JOIN LEAGUE ${leagueId}] League validation passed.`);

        // 5. --- FPL Team ID Validation ---
        if (user?.fplTeamId != null && user.fplTeamId !== parsedTeamId) { return NextResponse.json({ error: `Use linked FPL team ID: ${user.fplTeamId}` }, { status: 400 }); }
        let fplTeamNameFromApi: string | undefined;
        try {
            const teamVerification = await verifyFplTeam(validatedFplTeamIdString);
            if (!teamVerification.valid || !teamVerification.teamName) return NextResponse.json({ error: teamVerification.error || "Invalid FPL ID" }, { status: 400 });
            fplTeamNameFromApi = teamVerification.teamName;
            console.log(`[API JOIN LEAGUE ${leagueId}] FPL ID ${parsedTeamId} verified as '${fplTeamNameFromApi}'.`);
        } catch (error) { return NextResponse.json({ error: "Could not verify FPL Team ID" }, { status: 503 }); }
        if (!user?.fplTeamId || user.fplTeamId !== parsedTeamId) {
            const existingUser = await prisma.user.findFirst({ where: { fplTeamId: parsedTeamId, id: { not: userId } } });
            if (existingUser) return NextResponse.json({ error: "FPL ID linked to another account." }, { status: 409 });
        }

        // 6. --- Check if Already Joined ---
        const existingEntry = await prisma.leagueEntry.findUnique({ where: { userId_leagueId: { userId: userId, leagueId: leagueId } } });
        if (existingEntry) return NextResponse.json({ error: "Already joined this league" }, { status: 409 });

        // 7. --- Wallet Balance Check ---
        const entryFeeDecimal = league.entryFee; // Type: Decimal
        const userBalanceDecimal = user?.wallet?.balance ?? new Prisma.Decimal(0); // Type: Decimal
        const walletId = user?.wallet?.id;

        if (!walletId) { return NextResponse.json({ error: "User wallet not found." }, { status: 500 }); }

        // --- FIX: Use Decimal.comparedTo() for reliable comparison ---
        if (userBalanceDecimal.comparedTo(entryFeeDecimal) < 0) { // Checks if balance < fee
            // --- END FIX ---
            console.warn(`[API JOIN LEAGUE ${leagueId}] Insufficient balance: ${userBalanceDecimal} < ${entryFeeDecimal}`);
            return NextResponse.json({ error: "Insufficient wallet balance to join." }, { status: 400 });
        }
        console.log(`[API JOIN LEAGUE ${leagueId}] Balance check passed.`);

        // 8. --- Fetch pointsAtStart ---
        let pointsAtStart: number | null = 0; // Default to 0
        if (league.gameweek > 1) {
            try { pointsAtStart = await fetchFplHistoryPointsBeforeGameweek(parsedTeamId, league.gameweek); }
            catch (histError) { console.error(`Error fetching points history:`, histError); pointsAtStart = null; } // Allow null on error
            if (pointsAtStart === null) console.warn(`Could not fetch pointsAtStart for GW${league.gameweek}. Setting to NULL.`);
        } else { console.log(`GW1, setting pointsAtStart to 0.`); }

        console.log(`[API JOIN LEAGUE ${leagueId}] Starting join transaction...`);
        try {
            const [updatedWalletResult, newTransaction, newEntry] = await prisma.$transaction([
                prisma.wallet.update({ where: { id: walletId }, data: { balance: { decrement: entryFeeDecimal } }, select: { balance: true } }),
                prisma.transaction.create({ data: { userId, walletId, type: 'ENTRY_FEE', status: 'COMPLETED', amount: entryFeeDecimal, currency: 'NGN', description: `Entry fee: ${league.name} (GW${league.gameweek})`, metadata: { leagueId } } }),
                prisma.leagueEntry.create({ data: { userId, leagueId, fplTeamId: parsedTeamId, paid: true, pointsAtStart: pointsAtStart } }),
                prisma.weeklyLeague.update({ where: { id: leagueId }, data: { currentParticipants: { increment: 1 } } }),
                prisma.user.update({ where: { id: userId }, data: { fplTeamId: parsedTeamId, fplTeamName: fplTeamNameFromApi } })
            ]);

            console.log(`[API JOIN LEAGUE ${leagueId}] Transaction successful. User ${userId} joined.`);

            // Safely convert final balance to number for response
            let finalBalanceNumber: number = 0;
            try {
                const balanceValue = updatedWalletResult.balance;
                if (typeof balanceValue === 'number') finalBalanceNumber = balanceValue;
                else if (balanceValue && typeof (balanceValue as any).toNumber === 'function') finalBalanceNumber = (balanceValue as any).toNumber();
                else finalBalanceNumber = parseFloat(String(balanceValue) || '0');
                if (isNaN(finalBalanceNumber)) finalBalanceNumber = 0;
            } catch (e) { finalBalanceNumber = 0; }

            return NextResponse.json({ success: true, message: "Successfully joined league!", entryId: newEntry.id, newBalance: finalBalanceNumber }, { status: 201 });

        } catch (error) { /* ... handle transaction error ... */
            console.error(`[API JOIN LEAGUE ${leagueId}] Error during join transaction:`, error);
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return NextResponse.json({ error: "Already joined?" }, { status: 409 });
            return NextResponse.json({ error: "Failed to complete league join process." }, { status: 500 });
        }

    } catch (error) { /* ... handle top-level error ... */
        console.error(`[API JOIN LEAGUE ${leagueId}] Unexpected top-level error:`, error);
        return NextResponse.json({ error: "Failed to join league", details: error instanceof Error ? error.message : "Unknown server error" }, { status: 500 });
    }
}