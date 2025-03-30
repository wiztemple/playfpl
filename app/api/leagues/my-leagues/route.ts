import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { Session } from "next-auth";

// Define a proper session type that includes the user property
interface ExtendedSession extends Session {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export async function GET() {
    try {
        // Fix the TypeScript error by passing authOptions correctly and typing the session
        const session = await getServerSession(authOptions as any) as ExtendedSession | null;

        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const userId = session.user.id;

        // Get all leagues the user has joined
        const leagueEntries = await prisma.leagueEntry.findMany({
            where: {
                userId: userId,
            },
            include: {
                league: {
                    include: {
                        prizeDistribution: true,
                    },
                },
            },
        });

        // Format the leagues with additional information
        const leagues = leagueEntries.map((entry) => {
            return {
                id: entry.league.id,
                name: entry.league.name,
                gameweek: entry.league.gameweek,
                entryFee: entry.league.entryFee,
                maxParticipants: entry.league.maxParticipants,
                currentParticipants: entry.league.currentParticipants,
                startDate: entry.league.startDate,
                endDate: entry.league.endDate,
                status: entry.league.status,
                leagueType: entry.league.leagueType,
                userRank: entry.rank,
                myResults: {
                    rank: entry.rank,
                    points: entry.finalPoints,
                    weeklyPoints: entry.weeklyPoints,
                    winnings: entry.winnings,
                    payoutStatus: entry.payoutStatus,
                },
                hasJoined: true,
            };
        });

        return NextResponse.json({ leagues });
    } catch (error) {
        console.error("Error fetching user leagues:", error);
        return NextResponse.json(
            { error: "Failed to fetch leagues" },
            { status: 500 }
        );
    }
}