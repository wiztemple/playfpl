// app/api/leagues/weekly/create/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path if needed
import { z } from "zod";
import { Prisma } from "@prisma/client";
import type { Session } from "next-auth";
import { calculateEndDate } from "@/lib/fpl-api";

// --- Type Definitions ---
interface SessionWithAdmin extends Omit<Session, 'user'> {
    user?: { id?: string; isAdmin?: boolean; };
}

const prizeDistributionSchema = z.object({
    position: z.number().int().positive(),
    percentageShare: z.number().positive().max(100),
});

const createLeagueSchema = z.object({
    name: z.string().min(3, "League name must be at least 3 characters").max(100, "League name too long"),
    gameweek: z.number().int().min(1).max(38, "Invalid Gameweek"),
    entryFee: z.number().positive("Entry fee must be positive").max(100000, "Entry fee seems too high"),
    maxParticipants: z.number().int().min(2, "Minimum participants is 2").max(10000, "Maximum participants too high"),
    startDate: z.string().datetime({ message: "Invalid start date format (ISO required)" }),
    leagueType: z.enum(["tri", "duo", "jackpot"]),
    prizeDistribution: z.array(prizeDistributionSchema).min(1, "At least one prize position required"),
    description: z.string().max(500, "Description too long").optional().nullable(),
}).refine(data => {
    const totalPercentage = data.prizeDistribution.reduce((sum, p) => sum + p.percentageShare, 0);
    return Math.abs(totalPercentage - 100) < 0.01;
}, { message: "Prize percentages must add up to 100%", path: ["prizeDistribution"] });

// --- POST Handler ---
export async function POST(request: NextRequest) {
    console.log("[API CREATE LEAGUE] POST request received.");
    try {
        // 1. Authorization (Admin only)
        const session = await getServerSession(authOptions as any) as SessionWithAdmin;
        const adminUserId = session?.user?.id;
        if (!adminUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const adminUser = await prisma.user.findUnique({ where: { id: adminUserId }, select: { isAdmin: true } });
        // Ensure the check for isAdmin is strict
        if (!adminUser?.isAdmin) {
             console.warn(`[API CREATE LEAGUE] Forbidden access attempt by user ${adminUserId}`);
             return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
        }
        console.log(`[API CREATE LEAGUE] Authorized Admin: ${adminUserId}`);

        // 2. Input Validation
        let requestBody;
        try { requestBody = await request.json(); }
        catch (e) { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

        const validationResult = createLeagueSchema.safeParse(requestBody);
        if (!validationResult.success) {
            console.warn("[API CREATE LEAGUE] Validation failed:", validationResult.error.format());
            return NextResponse.json({ error: "Invalid input data.", details: validationResult.error.format() }, { status: 400 });
        }
        const leagueData = validationResult.data;
        const startDateObj = new Date(leagueData.startDate);

        // Optional: Add check to ensure start date is not too far in the past/future relative to GW deadline

        // Calculate End Date
        const endDateObj = await calculateEndDate(startDateObj, leagueData.gameweek);

        // 3. Database Creation (Transaction)
        console.log(`[API CREATE LEAGUE] Creating league '${leagueData.name}' (GW${leagueData.gameweek})...`);
        const newLeague = await prisma.$transaction(async (tx) => {
            const createdLeague = await tx.weeklyLeague.create({
                data: {
                    name: leagueData.name,
                    gameweek: leagueData.gameweek,
                    entryFee: new Prisma.Decimal(leagueData.entryFee.toFixed(2)),
                    maxParticipants: leagueData.maxParticipants,
                    startDate: startDateObj,
                    endDate: endDateObj,
                    leagueType: leagueData.leagueType,
                    description: leagueData.description, // Include description if provided
                    platformFeePercentage: 10, // Default or from config
                    minParticipantsRequired: 2, // Default or from config
                    status: 'upcoming',
                }
            });

            await tx.prizeDistribution.createMany({
                data: leagueData.prizeDistribution.map(p => ({
                    leagueId: createdLeague.id,
                    position: p.position,
                    percentageShare: new Prisma.Decimal(p.percentageShare.toFixed(2))
                }))
            });

            console.log(`[API CREATE LEAGUE] League ${createdLeague.id} and prize distribution created.`);
            // Fetch again to include the relation in the returned object
             const leagueWithPrizes = await tx.weeklyLeague.findUniqueOrThrow({
                 where: { id: createdLeague.id },
                 include: { prizeDistribution: { orderBy: { position: 'asc' } } }
             });
            return leagueWithPrizes;

        }, { timeout: 10000 }); // 10s timeout for creation

        // 4. Return Success Response
        console.log(`[API CREATE LEAGUE] Successfully created league ${newLeague.id}.`);
        // Convert Decimal fields to string/number for JSON safety if necessary, though Prisma handles most serialization
        const responseLeague = {
            ...newLeague,
            entryFee: newLeague.entryFee.toNumber(), // Example conversion
            prizeDistribution: newLeague.prizeDistribution.map(pd => ({
                ...pd,
                percentageShare: pd.percentageShare.toNumber() // Example conversion
            }))
        };
        return NextResponse.json(responseLeague, { status: 201 });

    } catch (error) {
        console.error("[API CREATE LEAGUE] Error:", error);
         if (error instanceof Prisma.PrismaClientKnownRequestError) { /* ... */ return NextResponse.json({ error: "Database error.", details: error.message }, { status: 500 });}
        return NextResponse.json({ error: "Failed to create league.", details: error instanceof Error ? error.message : "Unknown server error." }, { status: 500 });
    }
}

// Note: If you only export POST, GET requests to this route will correctly result in 405 Method Not Allowed.