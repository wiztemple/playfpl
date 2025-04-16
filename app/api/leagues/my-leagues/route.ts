// // app/api/leagues/weekly/route.ts

// import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from "next-auth/next";
// import { prisma } from "@/lib/db";
// import { authOptions } from "@/lib/auth-options"; // Ensure path is correct and authOptions is typed AuthOptions
// import { Session } from "next-auth"; // <<< Import the globally augmented Session type
// import { Prisma } from "@prisma/client"; // Import Prisma namespace

// // --- REMOVE THIS LOCAL INTERFACE ---
// // interface ExtendedSession extends Session { ... }

// export async function GET(request: NextRequest) {
//     try {
//         const { searchParams } = request.nextUrl;
//         const filter = searchParams.get('filter');
//         const gameweekParam = searchParams.get('gameweek'); // Optional filter

//         console.log(`[API /leagues/weekly] GET Request. Filter: ${filter}, Gameweek: ${gameweekParam}`);

//         // --- Use the globally augmented Session type ---
//         // Pass typed authOptions directly, remove unnecessary casts
//         const session: Session | null = await getServerSession(authOptions);
//         // --- End Type Fix ---
//         const currentUserId = session?.user?.id; // Get current user ID if logged in

//         let leagues = []; // Initialize empty array

//         // Prepare includes/selects needed in both branches
//         const leagueInclude = {
//             prizeDistribution: { orderBy: { position: "asc" as const } },
//             _count: { select: { entries: true } }
//         };
//         const leagueSelect = { // Fields needed for display
//             id: true, name: true, gameweek: true, entryFee: true, maxParticipants: true,
//             currentParticipants: true, startDate: true, endDate: true, status: true,
//             leagueType: true, description: true, currentHighestGwPoints: true,
//             // Include relations needed
//             prizeDistribution: true, // Fetch full related records based on include below
//             _count: true // Fetch count based on include below
//         };


//         // Build base filters
//         const whereFilters: Prisma.WeeklyLeagueWhereInput = {};
//         if (gameweekParam && !isNaN(parseInt(gameweekParam))) {
//             whereFilters.gameweek = parseInt(gameweekParam);
//         }


//         if (filter === 'my-leagues') {
//             // --- Fetch leagues joined by the current user ---
//             if (!currentUserId) {
//                 console.log("[API /leagues/weekly?filter=my-leagues] Unauthorized.");
//                 return NextResponse.json({ error: "Authentication required for my-leagues" }, { status: 401 });
//             }
//             console.log(`[API /leagues/weekly?filter=my-leagues] Fetching leagues for user ${currentUserId}`);

//             const leagueEntries = await prisma.leagueEntry.findMany({
//                 where: { userId: currentUserId },
//                 // Select specific fields from entry and include related league data
//                 select: {
//                     rank: true,
//                     finalPoints: true,
//                     weeklyPoints: true,
//                     winnings: true,
//                     payoutStatus: true,
//                     league: { // Select the needed league fields and relations
//                         select: leagueSelect,
//                         // You already included prizeDistribution and _count via leagueSelect/leagueInclude
//                         // If leagueSelect didn't exist, you'd use: include: leagueInclude,
//                     }
//                 }
//             });

//             // Map to desired output structure
//             leagues = leagueEntries.map((entry) => {
//                 const leagueData = entry.league;
//                 // Format data, converting Decimals/Dates for JSON safety
//                 return {
//                     ...leagueData,
//                     currentParticipants: leagueData._count?.entries ?? 0, // Use count
//                     // Add user-specific results
//                     userRank: entry.rank,
//                     myResults: {
//                         rank: entry.rank,
//                         points: entry.finalPoints,
//                         weeklyPoints: entry.weeklyPoints,
//                         winnings: entry.winnings?.toNumber() ?? 0, // Convert Decimal
//                         payoutStatus: entry.payoutStatus,
//                     },
//                     hasJoined: true, // User has joined these
//                     // Convert Decimals/Dates from leagueData
//                     entryFee: leagueData.entryFee.toNumber(),
//                     prizeDistribution: leagueData.prizeDistribution.map(pd => ({ ...pd, percentageShare: pd.percentageShare.toNumber() })),
//                     startDate: leagueData.startDate.toISOString(),
//                     endDate: leagueData.endDate.toISOString(),
//                     _count: undefined, // Remove count object
//                 };
//             });

//         } else {
//             // --- Fetch all public/upcoming/active leagues ---
//             console.log("[API /leagues/weekly] Fetching public leagues.");
//             // Add default filters if needed (e.g., only upcoming/active)
//             if (!whereFilters.status) { // Only add default if no status filter applied via URL
//                 whereFilters.status = { in: ['upcoming', 'active'] };
//             }

//             const allPublicLeagues = await prisma.weeklyLeague.findMany({
//                 where: whereFilters,
//                 include: leagueInclude, // Include needed relations
//                 orderBy: [{ status: 'asc' }, { gameweek: 'desc' }, { createdAt: 'desc' }]
//             });

//             // Check join status for logged-in users
//             let userJoinedLeagueIds = new Set<string>();
//             if (currentUserId && allPublicLeagues.length > 0) {
//                 const userEntries = await prisma.leagueEntry.findMany({
//                     where: { userId: currentUserId, leagueId: { in: allPublicLeagues.map(l => l.id) } },
//                     select: { leagueId: true }
//                 });
//                 userJoinedLeagueIds = new Set(userEntries.map(e => e.leagueId));
//             }

//             // Format the leagues
//             leagues = allPublicLeagues.map((league) => ({
//                 ...league,
//                 currentParticipants: league._count.entries,
//                 hasJoined: currentUserId ? userJoinedLeagueIds.has(league.id) : false,
//                 // Convert Decimals/Dates for JSON safety
//                 entryFee: league.entryFee.toNumber(),
//                 prizeDistribution: league.prizeDistribution.map(pd => ({ ...pd, percentageShare: pd.percentageShare.toNumber() })),
//                 startDate: league.startDate.toISOString(),
//                 endDate: league.endDate.toISOString(),
//                 _count: undefined, // Remove count object
//             }));
//         }

//         console.log(`[API /leagues/weekly] Returning ${leagues.length} leagues.`);
//         // Return the array directly (assuming hooks/components expect this)
//         return NextResponse.json(leagues);

//     } catch (error) {
//         console.error("[API /leagues/weekly] Error fetching leagues:", error);
//         if (error instanceof Prisma.PrismaClientKnownRequestError) {
//             console.error(`[API /leagues/weekly] Prisma Error Code: ${error.code}`, error.meta);
//         }
//         return NextResponse.json({ error: "Failed to fetch leagues", details: error instanceof Error ? error.message : "Unknown server error" }, { status: 500 });
//     }
// }

// app/api/leagues/weekly/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth-options"; // Ensure path is correct
import { Session } from "next-auth";
import { Prisma } from "@prisma/client";

// Augmented Session type
interface SessionWithUser extends Omit<Session, 'user'> {
    user?: { id?: string };
}

// Consistent selection/include options
const leagueInclude = { // Include needed for public leagues & prizes
    prizeDistribution: { orderBy: { position: "asc" as const } },
    _count: { select: { entries: true } }
};
const leagueSelect = { // Select needed for myLeagues mapping
    id: true, name: true, gameweek: true, entryFee: true, maxParticipants: true,
    // Removed currentParticipants, use _count instead
    startDate: true, endDate: true, status: true, leagueType: true,
    description: true, currentHighestGwPoints: true,
    platformFeePercentage: true, // <<< ADDED HERE
    prizeDistribution: true, // Fetch relation data based on include
    _count: true // Fetch count based on include
};


export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const filter = searchParams.get('filter');
        const gameweekParam = searchParams.get('gameweek');

        console.log(`[API /leagues/weekly] GET Request. Filter: ${filter}, Gameweek: ${gameweekParam}`);

        const session: Session | null = await getServerSession(authOptions);
        const currentUserId = session?.user?.id;

        let leagues = []; // Initialize empty array

        const whereFilters: Prisma.WeeklyLeagueWhereInput = {};
        if (gameweekParam && !isNaN(parseInt(gameweekParam))) {
            whereFilters.gameweek = parseInt(gameweekParam);
        }


        if (filter === 'my-leagues') {
            // --- Fetch leagues joined by the current user ---
            if (!currentUserId) {
                return NextResponse.json({ error: "Authentication required for my-leagues" }, { status: 401 });
            }
            console.log(`[API /leagues/weekly?filter=my-leagues] Fetching leagues for user ${currentUserId}`);

            const leagueEntries = await prisma.leagueEntry.findMany({
                where: { userId: currentUserId },
                select: {
                    rank: true, finalPoints: true, weeklyPoints: true,
                    winnings: true, payoutStatus: true,
                    league: { // Use the refined select including platformFeePercentage
                        select: leagueSelect
                    }
                }
            });

            // Map to desired output structure
            leagues = leagueEntries.map((entry) => {
                const leagueData = entry.league;
                // Handle potential null league data defensiveley
                if (!leagueData) return null;

                // Format data
                return {
                    // Spread scalar fields first (ensure all expected fields are selected in leagueSelect)
                    id: leagueData.id,
                    name: leagueData.name,
                    gameweek: leagueData.gameweek,
                    maxParticipants: leagueData.maxParticipants,
                    currentParticipants: leagueData._count?.entries ?? 0,
                    status: leagueData.status,
                    leagueType: leagueData.leagueType,
                    description: leagueData.description,
                    currentHighestGwPoints: leagueData.currentHighestGwPoints,
                    // Include platformFeePercentage (selected via leagueSelect)
                    platformFeePercentage: leagueData.platformFeePercentage,
                    // Convert Decimal/Date types
                    entryFee: leagueData.entryFee.toNumber(), // Convert Decimal
                    winnings: entry.winnings?.toNumber() ?? 0, // Convert Decimal from entry
                    prizeDistribution: leagueData.prizeDistribution.map(pd => ({
                        id: pd.id, // Select needed fields if full object not required
                        position: pd.position,
                        percentageShare: pd.percentageShare.toNumber(), // Convert Decimal
                        leagueId: pd.leagueId,
                    })),
                    startDate: leagueData.startDate.toISOString(), // Convert Date
                    endDate: leagueData.endDate.toISOString(), // Convert Date
                    // Add user-specific results
                    userRank: entry.rank,
                    myResults: {
                        rank: entry.rank,
                        points: entry.finalPoints,
                        weeklyPoints: entry.weeklyPoints,
                        // Use already converted winnings
                        winnings: entry.winnings?.toNumber() ?? 0,
                        payoutStatus: entry.payoutStatus,
                    },
                    hasJoined: true,
                };
            }).filter(Boolean); // Filter out any null results if leagueData was missing

        } else {
            // --- Fetch all public/upcoming/active leagues ---
            console.log("[API /leagues/weekly] Fetching public leagues.");
            if (!whereFilters.status) { // Default filter
                whereFilters.status = { in: ['upcoming', 'active'] };
            }

            const allPublicLeagues = await prisma.weeklyLeague.findMany({
                where: whereFilters,
                include: leagueInclude, // Use include to get relations
                orderBy: [{ status: 'asc' }, { gameweek: 'desc' }, { createdAt: 'desc' }]
            });

            // Check join status for logged-in users
            let userJoinedLeagueIds = new Set<string>();
            if (currentUserId && allPublicLeagues.length > 0) { /* ... fetch userEntries ... */
                const userEntries = await prisma.leagueEntry.findMany({ where: { userId: currentUserId, leagueId: { in: allPublicLeagues.map(l => l.id) } }, select: { leagueId: true } }); userJoinedLeagueIds = new Set(userEntries.map(e => e.leagueId));
            }

            // Format the leagues
            leagues = allPublicLeagues.map((league) => ({
                // Spread all scalar fields first
                ...league,
                // Overwrite/add specific fields
                currentParticipants: league._count.entries,
                hasJoined: currentUserId ? userJoinedLeagueIds.has(league.id) : false,
                // Convert Decimal/Date types
                entryFee: league.entryFee.toNumber(),
                platformFeePercentage: league.platformFeePercentage, // Already number (Float) or convert if Decimal
                prizeDistribution: league.prizeDistribution.map(pd => ({ ...pd, percentageShare: pd.percentageShare.toNumber() })), // Convert Decimal share
                startDate: league.startDate.toISOString(),
                endDate: league.endDate.toISOString(),
                // Add null for user-specific fields when viewing public list
                userRank: null,
                myResults: null,
                // Remove Prisma helper fields
                _count: undefined,
            }));
        }

        console.log(`[API /leagues/weekly] Returning ${leagues.length} leagues.`);
        // IMPORTANT: Check if API should return { leagues: [...] } or just [...]
        // Based on useMyLeagues hook, it expects { leagues: [...] }
        return NextResponse.json({ leagues }); // Wrap in leagues object

    } catch (error) {
        console.error("[API /leagues/weekly] Error fetching leagues:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            console.error(`[API /leagues/weekly] Prisma Error Code: ${error.code}`, error.meta);
        }
        return NextResponse.json({ error: "Failed to fetch leagues" }, { status: 500 });
    }
}