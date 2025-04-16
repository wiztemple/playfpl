// app/api/admin/leagues/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path
import { checkGameweekStatus } from "@/lib/fpl-api"; // Import your checker
import type { Session } from "next-auth";
import type { WeeklyLeague } from "@prisma/client";

// Session type with Admin flag
interface SessionWithAdmin extends Omit<Session, 'user'> {
    user?: { id?: string; isAdmin?: boolean; };
}

// Type for the league data returned by this endpoint
export type AdminLeagueData = WeeklyLeague & {
    isReadyToFinalize?: boolean; // Add flag
};

export async function GET(request: NextRequest) {
    console.log("[API ADMIN/LEAGUES] Request received.");
    // --- Authorization ---
    const session = await getServerSession(authOptions as any) as SessionWithAdmin;
    const currentUserId = session?.user?.id;
    if (!currentUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const adminUser = await prisma.user.findUnique({ where: { id: currentUserId }, select: { isAdmin: true } });
    if (!adminUser?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    console.log(`[API ADMIN/LEAGUES] Authorized Admin: ${currentUserId}`);

    try {
        const leagues = await prisma.weeklyLeague.findMany({
            orderBy: [
                { status: 'asc' }, // Show upcoming, then active, then completed
                { gameweek: 'desc' },
                { createdAt: 'desc' }
            ],
            include: { // Include participant count efficiently
                _count: { select: { entries: true } }
            }
        });

        const leaguesWithStatus: AdminLeagueData[] = [];

        // Check readiness for finalization for active leagues
        for (const league of leagues) {
            let isReady = false;
            if (league.status === 'active') {
                try {
                    const gwStatus = await checkGameweekStatus(league.gameweek);
                    // Ready if FPL GW is complete and bonus added
                    isReady = gwStatus.isComplete && gwStatus.bonusPointsAdded;
                } catch (gwError) {
                    console.error(`Error checking GW status for league ${league.id} (GW ${league.gameweek}):`, gwError);
                    // Default to not ready if status check fails
                }
            }
            leaguesWithStatus.push({
                ...league,
                currentParticipants: league._count.entries, // Add participant count directly
                isReadyToFinalize: isReady
            });
        }

        console.log(`[API ADMIN/LEAGUES] Returning ${leaguesWithStatus.length} leagues.`);
        return NextResponse.json(leaguesWithStatus);

    } catch (error) {
        console.error("[API ADMIN/LEAGUES] Error fetching leagues:", error);
        return NextResponse.json({ error: "Failed to fetch leagues" }, { status: 500 });
    }
}