// // app/api/admin/trigger-cron/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from "next-auth/next";
// import { prisma } from "@/lib/db";
// import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path
// import { headers } from "next/headers"; // Only needed if checking CRON_SECRET
// import { PrismaClient, Session } from "@prisma/client"; // Import if using processLeagueUpdate from cron file

// // IMPORTANT: Import or Copy the 'processLeagueUpdate' function and related types/constants
// // from your actual /app/api/cron/update-leaderboards/route.ts file
// import { processLeagueUpdate, UpdateResult, CONCURRENT_LEAGUE_UPDATES } from "@/app/api/cron/update-leaderboards/route"; // Adjust path & ensure export

// // Session type
// interface SessionWithAdmin extends Omit<Session, 'user'> {
//     user?: { id?: string; isAdmin?: boolean; };
// }

// export async function POST(request: NextRequest) { // Use POST for actions
//     console.log(`[API ADMIN/TRIGGER_CRON] Manual trigger received at ${new Date().toISOString()}`);

//     // --- Authorization: Check for Admin Session ---
//     const session = await getServerSession(authOptions as any) as SessionWithAdmin;
//     const currentUserId = session?.user?.id;
//     if (!currentUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     const adminUser = await prisma.user.findUnique({ where: { id: currentUserId }, select: { isAdmin: true } });
//     if (!adminUser?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
//     console.log(`[API ADMIN/TRIGGER_CRON] Authorized Admin: ${currentUserId}`);

//     // --- Re-use the core logic from the cron job's GET handler ---
//     const overallStartTime = Date.now();
//     let totalLeaguesProcessed = 0;
//     let totalEntriesUpdated = 0;
//     let totalRanksUpdated = 0;
//     let errorsEncountered: { leagueId: string, error: string }[] = [];

//     try {
//         const activeLeagues = await prisma.weeklyLeague.findMany({
//             where: { status: 'active' },
//             select: { id: true, gameweek: true, currentHighestGwPoints: true }
//         });

//         if (!activeLeagues || activeLeagues.length === 0) {
//             return NextResponse.json({ message: "No active leagues found to update." });
//         }
//         console.log(`[API ADMIN/TRIGGER_CRON] Found ${activeLeagues.length} active leagues to update.`);

//         // Process in chunks (same as cron job)
//         for (let i = 0; i < activeLeagues.length; i += CONCURRENT_LEAGUE_UPDATES) {
//             const chunk = activeLeagues.slice(i, i + CONCURRENT_LEAGUE_UPDATES);
//             console.log(`[API ADMIN/TRIGGER_CRON] Processing chunk ${Math.floor(i / CONCURRENT_LEAGUE_UPDATES) + 1}`);

//             // Call the same update function used by the cron job
//             const promises = chunk.map(league => processLeagueUpdate(league, prisma));
//             const results = await Promise.allSettled(promises);

//             // Aggregate results (same as cron job)
//             results.forEach((result, index) => {
//                  const leagueId = chunk[index].id;
//                  totalLeaguesProcessed++;
//                  if (result.status === 'fulfilled' && result.value.success) {
//                     totalEntriesUpdated += result.value.entriesUpdated || 0;
//                     totalRanksUpdated += result.value.ranksUpdated || 0;
//                  } else {
//                     const errorMsg = result.status === 'rejected'
//                        ? (result.reason instanceof Error ? result.reason.message : "Unknown rejection")
//                        : (result.value.error || "Unknown processing error");
//                     console.error(`[API ADMIN/TRIGGER_CRON] Error/Rejection league ${leagueId}: ${errorMsg}`);
//                     errorsEncountered.push({ leagueId: leagueId, error: errorMsg });
//                  }
//             });
//         } // End chunk loop

//     } catch (error) {
//         // Catch top-level errors
//          console.error("[API ADMIN/TRIGGER_CRON] Critical error during trigger execution:", error);
//          const errorMessage = error instanceof Error ? error.message : "Unknown top-level error";
//          return NextResponse.json({
//              message: "Trigger failed with critical errors.",
//              processedLeagues: totalLeaguesProcessed, totalEntriesUpdated, totalRanksUpdated,
//              errors: [...errorsEncountered, { leagueId: 'GLOBAL', error: errorMessage }],
//          }, { status: 500 });
//     }

//     const overallDuration = Date.now() - overallStartTime;
//     console.log(`[API ADMIN/TRIGGER_CRON] Trigger finished. Processed: ${totalLeaguesProcessed}. Duration: ${overallDuration}ms. Errors: ${errorsEncountered.length}`);

//     // Return summary
//     return NextResponse.json({
//         message: `Manual update finished. Processed ${totalLeaguesProcessed} leagues.`,
//         processedLeagues: totalLeaguesProcessed,
//         totalEntriesUpdated,
//         totalRanksUpdated,
//         errors: errorsEncountered,
//     });
// }

// app/api/admin/trigger-cron/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path
import type { Session } from "next-auth";
import { runActivationAndUpdates } from "@/lib/fpl-api";

// --- Import the SHARED logic function ---
// Make sure processLeagueUpdate is also exported/imported if needed by runActivationAndUpdates

// Session type
interface SessionWithAdmin extends Omit<Session, 'user'> { user?: { id?: string; isAdmin?: boolean; }; }

export async function POST(request: NextRequest) {
    console.log(`[API ADMIN/TRIGGER_CRON] Manual trigger received at ${new Date().toISOString()}`);

    // --- Authorization ---
    const session = await getServerSession(authOptions as any) as SessionWithAdmin;
    const currentUserId = session?.user?.id;
    if (!currentUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const adminUser = await prisma.user.findUnique({ where: { id: currentUserId }, select: { isAdmin: true } });
    if (!adminUser?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    console.log(`[API ADMIN/TRIGGER_CRON] Authorized Admin: ${currentUserId}`);

    // --- Call the Shared Logic ---
    try {
        const results = await runActivationAndUpdates(); // <<< Call shared function

        // Check for critical errors from the shared function
        if (results.errors.some(e => e.leagueId === 'GLOBAL')) {
            return NextResponse.json({ message: "Manual trigger finished with critical errors.", ...results }, { status: 500 });
        }

        // Return summary results
        return NextResponse.json({
            message: `Manual update finished. Activated ${results.activatedCount}, processed ${results.processedCount} active leagues.`,
            processedLeagues: results.processedCount, // Keep consistent naming maybe
            totalLeaguesActivated: results.activatedCount,
            totalEntriesUpdated: results.entriesCount,
            totalRanksUpdated: results.ranksCount,
            errors: results.errors,
        });

    } catch (error) { // Catch errors *calling* the shared function (less likely)
        console.error("[API ADMIN/TRIGGER_CRON] Critical error calling job logic:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown top-level error";
        return NextResponse.json({ message: "Trigger failed with critical errors.", errors: [{ leagueId: 'GLOBAL', error: errorMessage }] }, { status: 500 });
    }
}