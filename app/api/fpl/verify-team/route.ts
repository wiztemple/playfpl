
import { NextRequest, NextResponse } from "next/server";
import { fetchBootstrapStatic, fetchFplEntry, fetchFplEntryHistory, fetchLiveGameweekPoints as fetchLiveGwPointsInternal } from "@/lib/fpl-api";

async function fetchLiveGameweekPointsApi(teamIds: number[], gameweek: number): Promise<Record<number, number>> {
  return await fetchLiveGwPointsInternal(teamIds, gameweek);
}

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl;
    const teamId = url.searchParams.get('teamId') || url.searchParams.get('id');

    if (!teamId || isNaN(Number(teamId))) {
      return NextResponse.json({ valid: false, error: "Valid FPL Team ID required" }, { status: 400 });
    }
    const fplTeamId = Number(teamId);
    console.log(`[VERIFY_FPL] Verifying team ID: ${fplTeamId}`);

    // Fetch data concurrently
    const [entryData, historyData, bootstrapData] = await Promise.all([
      fetchFplEntry(fplTeamId),
      fetchFplEntryHistory(fplTeamId),
      fetchBootstrapStatic()
    ]);

    // 1. Validate basic entry data first
    if (!entryData?.name || !entryData?.player_first_name) {
      console.warn(`[VERIFY_FPL] Team ID ${fplTeamId} not found or invalid entry data.`);
      return NextResponse.json({ valid: false, error: 'FPL Team ID not found or invalid.' }, { status: 404 });
    }

    // 2. Extract details from fetched data
    const currentGameweekEvent = bootstrapData?.events?.find((event: any) => event.is_current);
    const currentGameweek = currentGameweekEvent?.id || null;

    const latestHistoryEntry = historyData?.current?.slice(-1)[0];
    const currentGwHistoryEntry = currentGameweek ? historyData?.current?.find((gw: any) => gw.event === currentGameweek) : null;

    const overallRank = currentGwHistoryEntry?.overall_rank ?? latestHistoryEntry?.overall_rank ?? null;
    // Ensure totalPoints is taken from the absolute latest entry in history
    const totalPoints = latestHistoryEntry?.total_points ?? 0;
    const teamValue = latestHistoryEntry ? (latestHistoryEntry.value / 10).toFixed(1) : '0.0';
    // Transfers made *in* the current gameweek
    const transfersMade = currentGwHistoryEntry?.event_transfers ?? 0;

    // 3. Get Gameweek points (prefer live, fallback to history)
    let gameweekPoints = currentGwHistoryEntry?.points ?? 0; // Default to history
    if (currentGameweek) {
      try {
        const livePointsResult = await fetchLiveGameweekPointsApi([fplTeamId], currentGameweek);
        if (livePointsResult[fplTeamId] !== undefined) {
          // Use live points directly, might be lower than history if points were removed live
          gameweekPoints = livePointsResult[fplTeamId];
          console.log(`[VERIFY_FPL] Using live points (${gameweekPoints}) for team ${fplTeamId} GW ${currentGameweek}`);
        } else {
          console.log(`[VERIFY_FPL] No live points found for team ${fplTeamId}. Using history points (${gameweekPoints}) for GW ${currentGameweek}`);
        }
      } catch (liveFetchError) {
        console.error(`[VERIFY_FPL] Error fetching live points for ${fplTeamId}:`, liveFetchError);
        // Keep points from history if live fails
        console.log(`[VERIFY_FPL] Using history points (${gameweekPoints}) due to live fetch error for team ${fplTeamId}.`);
      }
    }

    // 4. Construct the response object
    const responsePayload = {
      verified: true, // Kept for compatibility? Might not be needed if returning data.
      valid: true,    // Use 'valid' consistent with ProfilePage useEffect check
      teamName: entryData.name,
      managerName: `${entryData.player_first_name} ${entryData.player_last_name}`,
      overallRank: overallRank,
      // --- ADDED FIELDS ---
      totalPoints: totalPoints,
      teamValue: teamValue,
      currentGameweek: currentGameweek,
      gameweekPoints: gameweekPoints,
      transfersMade: transfersMade,
      transfersAvailable: null, // FPL API doesn't easily provide this here
    };

    console.log(`[VERIFY_FPL] Successfully verified team ${fplTeamId}. Returning data.`);
    return NextResponse.json(responsePayload);

  } catch (error) {
    console.error(`[VERIFY_FPL] General error verifying FPL team ID ${request.url}:`, error);
    // Generic error for client
    return NextResponse.json(
      { valid: false, error: "Failed to verify FPL Team ID. Please try again later." },
      { status: 500 }
    );
  }
}
