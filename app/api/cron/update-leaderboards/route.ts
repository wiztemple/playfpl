// app/api/cron/update-leaderboards/route.ts
// (Or /api/admin/trigger-cron/route.ts if using separate file for POST)

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { runActivationAndUpdates } from "@/lib/fpl-api";

export async function isCronAuthorized(request: NextRequest): Promise<boolean> {
    try {
        if (process.env.NODE_ENV !== 'production') {
            console.warn("[CRON_AUTH] Allowing DEV request.");
            return true; // Returns boolean
        }
        const expectedSecret = process.env.CRON_SECRET;
        if (!expectedSecret) {
            console.error("[CRON_AUTH] CRON_SECRET missing.");
            return false; // Returns boolean
        }
        // This could potentially throw
        const headerList = await headers();
        const authHeader = headerList.get("authorization");
        const providedSecret = authHeader?.split("Bearer ")[1];
        const authorized = providedSecret === expectedSecret;
        if (!authorized) {
            console.warn("[CRON_AUTH] Unauthorized attempt.");
        }
        return authorized; // Returns boolean

    } catch (error) { // <<< Add catch
        console.error("[CRON_AUTH] Error during authorization check:", error);
        return false; // <<< Return boolean on error
    }
}

export async function GET(request: NextRequest) {
    console.log(`[CRON_UPDATE] Scheduled job received at ${new Date().toISOString()}`);
    if (!await isCronAuthorized(request)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const results = await runActivationAndUpdates(); // <<< Call shared function

    if (results.errors.some(e => e.leagueId === 'GLOBAL')) {
        return NextResponse.json({ message: "Cron job finished with critical errors.", ...results }, { status: 500 });
    }

    return NextResponse.json({
        message: `Cron job finished. Activated ${results.activatedCount}, processed ${results.processedCount} active leagues.`,
        ...results
    });
}