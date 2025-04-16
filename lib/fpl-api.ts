import { prisma } from "@/lib/db";
import { Prisma, PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";
const FPL_API_BASE = "https://fantasy.premierleague.com/api";

// Cache FPL API responses to reduce API calls
// let bootstrapCache: any = null;
// let bootstrapCacheTime: number = 0;
// const CACHE_DURATION = 3600000;
interface FplPick {
  element: number;
  position: number;
  multiplier: number;
  is_captain: boolean;
  is_vice_captain: boolean;
}
interface FplEntryHistory {
  points: number | null; // Points can be null from API
  event_transfers_cost: number | null; // Hits can be null
  // other fields like rank, overall_rank etc. could be added
}
interface FplPicksResponse {
  entry_history?: FplEntryHistory | null;
  picks?: FplPick[] | null;
  detail?: string; // For error messages like "Not found"
}
interface FplLiveElementStat {
  total_points?: number | null;
  // other stats like minutes, goals_scored etc.
}
interface FplLiveElement {
  id: number;
  stats?: FplLiveElementStat | null;
}
interface FplLiveData {
  elements?: FplLiveElement[] | null;
}
// Get general FPL game information
export async function getBootstrapStatic() {
  // Return cached data if available and fresh
  // if (bootstrapCache && Date.now() - bootstrapCacheTime < CACHE_DURATION) {
  //   return bootstrapCache;
  // }
  const url = `${FPL_API_BASE}/bootstrap-static/`;
  try {
    // const response = await fetch(`${FPL_API_BASE}/bootstrap-static/`);
    console.log(`[FPL_HELPER] Fetching Bootstrap Static: ${url}`);
    const response = await fetch(url, {
      headers: { 'User-Agent': 'YourAppName/1.0 (YourContactInfo)' }, // Use a descriptive User-Agent
      // --- Use Next.js fetch revalidation (e.g., 60 seconds) ---
      next: { revalidate: 60 }
      // --- End Change ---
    });

    if (!response.ok) {
      console.error(`[FPL_HELPER] Failed Bootstrap Static fetch: ${response.status} ${response.statusText}`);
      // Throw or return null depending on how callers handle it
      throw new Error(`FPL Bootstrap API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[FPL_HELPER] Bootstrap Static fetched successfully. is_current GW: ${data?.events?.find((e: any) => e.is_current)?.id}`);


    return data;
  } catch (error) {
    console.error("Error fetching FPL bootstrap data:", error);
    throw error;
  }
}

export async function getCurrentGameweek() {
  console.log("[FPL_HELPER] Getting current gameweek (using heuristic)...");
  try {
    const bootstrapData = await getBootstrapStatic();
    if (!bootstrapData?.events || !Array.isArray(bootstrapData.events)) {
      throw new Error("Invalid bootstrap data: events array missing");
    }

    const events: any[] = bootstrapData.events; // Consider defining a proper Event type

    const officialCurrent = events.find(gw => gw.is_current === true);
    const officialNext = events.find(gw => gw.is_next === true);

    let effectiveCurrentGameweek = null;

    // --- Heuristic: If official current is marked finished, use the next one ---
    if (officialCurrent && officialCurrent.finished === true) {
      const likelyCurrentId = officialCurrent.id + 1;
      console.log(`[FPL_HELPER] Official current GW (${officialCurrent.id}) is finished. Checking for GW ${likelyCurrentId}.`);
      if (likelyCurrentId <= 38) { // Max FPL Gameweek
        effectiveCurrentGameweek = events.find(gw => gw.id === likelyCurrentId);
        if (effectiveCurrentGameweek) {
          console.log(`[FPL_HELPER] Using HEURISTIC: GW ${likelyCurrentId} is now considered current.`);
        } else {
          // If next GW data isn't found (highly unlikely mid-season), fallback
          console.warn(`[FPL_HELPER] Heuristic failed: Could not find event data for GW ${likelyCurrentId}. Falling back to official current (GW ${officialCurrent.id}).`);
          effectiveCurrentGameweek = officialCurrent;
        }
      } else {
        // If GW38 finished, keep GW38 as current
        console.log(`[FPL_HELPER] End of season (GW38 finished). Using official current GW ${officialCurrent.id}.`);
        effectiveCurrentGameweek = officialCurrent;
      }
    }
    // --- End Heuristic ---
    else if (officialCurrent) {
      // If official current is not finished, it's the correct one
      console.log(`[FPL_HELPER] Using official current GW: ${officialCurrent.id} (not finished).`);
      effectiveCurrentGameweek = officialCurrent;
    } else if (officialNext) {
      // If no official current, use the official next one (start of season or transition)
      console.log(`[FPL_HELPER] No official current GW found. Using official next GW: ${officialNext.id}.`);
      effectiveCurrentGameweek = officialNext;
    }

    if (!effectiveCurrentGameweek) {
      // Fallback if nothing is found (shouldn't happen in a normal season)
      console.error("[FPL_HELPER] Failed to determine ANY current or next gameweek!");
      // Maybe return the last event? Or throw error?
      effectiveCurrentGameweek = events[events.length - 1]; // Risky fallback
      if (effectiveCurrentGameweek) console.warn(`[FPL_HELPER] Falling back to last known event: GW ${effectiveCurrentGameweek.id}`);
      else return null; // Return null if even fallback fails
    }

    console.log(`[FPL_HELPER] Effective Current Gameweek determined as ID: ${effectiveCurrentGameweek.id}`);
    // Return the full event object for the determined current GW
    // Ensure your API route `/api/gameweek/current` returns just the ID or the whole object as needed by the frontend
    return effectiveCurrentGameweek;

  } catch (error) {
    console.error("[FPL_HELPER] Error getting current gameweek:", error);
    // Depending on how severe, either return null or re-throw
    // Returning null might be handled more gracefully by callers
    return null;
    // throw error; // Or re-throw if callers expect to handle it
  }
}

// Get details for a specific gameweek
// Add this new function to fetch fixtures
async function getGameweekFixtures(gameweekId: number) {
  try {
    const response = await fetch(`${FPL_API_BASE}/fixtures/?event=${gameweekId}`);

    if (!response.ok) {
      throw new Error(`FPL API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error getting fixtures for gameweek ${gameweekId}:`, error);
    throw error;
  }
}

// Get details for a specific gameweek
export async function getGameweekInfo(gameweekId: number) {
  try {
    const [bootstrapData, fixturesData] = await Promise.all([
      getBootstrapStatic(),
      getGameweekFixtures(gameweekId)
    ]);

    const gameweek = bootstrapData.events.find((gw: any) => gw.id === gameweekId);

    if (!gameweek) {
      return null;
    }

    // Find the first and last fixture of the gameweek
    const sortedFixturesByTime = [...fixturesData].sort((a: any, b: any) =>
      new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime()
    );

    const firstFixture = sortedFixturesByTime[0];
    const lastFixture = sortedFixturesByTime[sortedFixturesByTime.length - 1];

    return {
      ...gameweek,
      fixtures: fixturesData,
      gameweek_start: firstFixture?.kickoff_time, // First fixture's kickoff time
      gameweek_end: lastFixture?.kickoff_time, // Last fixture's kickoff time
      fixture_count: fixturesData.length,
      has_started: firstFixture ? new Date(firstFixture.kickoff_time) < new Date() : false,
      has_finished: lastFixture ? new Date(lastFixture.kickoff_time) < new Date() : false
    };
  } catch (error) {
    console.error(`Error getting gameweek ${gameweekId} info:`, error);
    throw error;
  }
}

// Get a specific team's details - simplified version without manual caching
export async function getTeamInfo(teamId: number) {
  try {
    const response = await fetch(`${FPL_API_BASE}/entry/${teamId}/`);

    if (!response.ok) {
      throw new Error(`Failed to fetch team info: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching team info for ID ${teamId}:`, error);
    return null;
  }
}

// Get a specific team's picks for a gameweek
export async function getTeamPicks(teamId: number, gameweekId: number) {
  try {
    const response = await fetch(
      `${FPL_API_BASE}/entry/${teamId}/event/${gameweekId}/picks/`
    );

    if (!response.ok) {
      throw new Error(`FPL API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(
      `Error getting team ${teamId} picks for gameweek ${gameweekId}:`,
      error
    );
    throw error;
  }
}

// /lib/fpl-api.ts
// Add this function to your existing FPL API utilities

export async function verifyFplTeam(teamId: string) {
  try {
    const response = await fetch(
      `https://fantasy.premierleague.com/api/entry/${teamId}/`
    );

    if (!response.ok) {
      if (response.status === 404) {
        return { valid: false, error: "FPL team not found" };
      }
      throw new Error(`FPL API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      valid: true,
      teamName: data.name,
      managerName: `${data.player_first_name} ${data.player_last_name}`,
      teamData: data,
    };
  } catch (error) {
    console.error("Error verifying FPL team:", error);
    throw error;
  }
}

/**
 * Check the status of a gameweek including which matches have started and finished
 */
// Inside your fpl-api.ts or wherever checkGameweekStatus is defined

// Inside your fpl-api.ts or wherever checkGameweekStatus is defined

// --- Helper function to fetch event status (add error handling) ---
async function fetchEventStatus(): Promise<any | null> {
  try {
    const timestamp = Date.now();
    const url = `https://fantasy.premierleague.com/api/event-status/?_=${timestamp}`;
    console.log(`[FPL_FETCH] Fetching Event Status: ${url}`);
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (YourApp/1.0)', 'Cache-Control': 'no-cache, no-store, must-revalidate' },
      cache: 'no-store', next: { revalidate: 60 } // Cache slightly longer, maybe 1-5 mins
    });
    if (!response.ok) {
      console.error(`[FPL_FETCH] Failed Event Status fetch: ${response.status}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error(`[FPL_FETCH] Error fetching Event Status:`, error);
    return null;
  }
}
// --- End Helper ---


export async function checkGameweekStatus(gameweek: number) {
  console.log(`[CHECK_GW_STATUS] Checking status for gameweek ${gameweek}`);
  try {
    // Fetch both fixtures and event status concurrently
    const [fixturesResponse, eventStatusData] = await Promise.all([
      fetch(`https://fantasy.premierleague.com/api/fixtures/?event=${gameweek}&_=${Date.now()}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (YourApp/1.0)', 'Cache-Control': 'no-cache, no-store, must-revalidate' },
        cache: 'no-store', next: { revalidate: 0 }
      }),
      fetchEventStatus() // Fetch the new endpoint
    ]);

    // --- Process Fixtures ---
    if (!fixturesResponse.ok) {
      console.error(`[CHECK_GW_STATUS] Error fetching fixtures: ${fixturesResponse.status} ${fixturesResponse.statusText}`);
      // Return a default/error state - maybe indicate fixtures couldn't be checked
      return { hasStarted: false, isComplete: false, bonusPointsAdded: false, /* ... other fields zeroed ... */ error: `Failed to fetch fixtures: ${fixturesResponse.status}` };
    }
    const fixtures = await fixturesResponse.json();
    if (!Array.isArray(fixtures)) {
      console.error(`[CHECK_GW_STATUS] Invalid fixture data format`);
      return { hasStarted: false, isComplete: false, bonusPointsAdded: false, /* ... other fields zeroed ... */ error: 'Invalid fixture data format' };
    }

    const now = new Date();
    const totalMatches = fixtures.length;
    const matchesStarted = fixtures.filter(fixture => new Date(fixture.kickoff_time) < now);
    const matchesFinished = fixtures.filter(fixture => fixture.finished === true); // Official FPL finished flag

    const hasStarted = matchesStarted.length > 0;
    const allMatchesOfficiallyFinished = totalMatches > 0 && matchesFinished.length === totalMatches;

    // --- Process Event Status ---
    let finalBonusAdded = false; // Default to false
    if (eventStatusData?.status && Array.isArray(eventStatusData.status)) {
      // Find the latest date a match was scheduled for this GW from fixtures
      let lastMatchDateStr: string | null = null;
      if (fixtures.length > 0) {
        const lastKickoffTime = Math.max(...fixtures.map(f => new Date(f.kickoff_time).getTime()));
        if (!isNaN(lastKickoffTime)) {
          // Format as YYYY-MM-DD
          const lastDate = new Date(lastKickoffTime);
          lastMatchDateStr = `${lastDate.getFullYear()}-${String(lastDate.getMonth() + 1).padStart(2, '0')}-${String(lastDate.getDate()).padStart(2, '0')}`;
        }
      }
      console.log(`[CHECK_GW_STATUS] Last match date string for GW ${gameweek}: ${lastMatchDateStr}`);

      // Find the status entry for the last match day (or latest for the event)
      let relevantStatusEntry = null;
      if (lastMatchDateStr) {
        relevantStatusEntry = eventStatusData.status.find((s: any) => s.date === lastMatchDateStr && s.event === gameweek);
      }
      // If specific date not found, try the latest entry for the event
      if (!relevantStatusEntry) {
        relevantStatusEntry = eventStatusData.status
          .filter((s: any) => s.event === gameweek)
          .sort((a: any, b: any) => b.date.localeCompare(a.date))[0]; // Get the latest date entry for the GW
        if (relevantStatusEntry) {
          console.warn(`[CHECK_GW_STATUS] Status for exact date ${lastMatchDateStr} not found, using latest entry for GW${gameweek}: Date=${relevantStatusEntry.date}`);
        }
      }

      if (relevantStatusEntry) {
        finalBonusAdded = relevantStatusEntry.bonus_added === true;
        console.log(`[CHECK_GW_STATUS] Event status check: bonus_added=${finalBonusAdded} (from entry date ${relevantStatusEntry.date})`);
      } else {
        console.warn(`[CHECK_GW_STATUS] No relevant event status entry found for GW ${gameweek}. Assuming bonus not added.`);
      }
    } else {
      console.warn("[CHECK_GW_STATUS] Event status data missing or invalid. Assuming bonus not added.");
    }

    // --- Final Completion Check ---
    // Gameweek is strictly complete ONLY if all matches are officially finished AND bonus points are confirmed added via event-status
    const isComplete = allMatchesOfficiallyFinished && finalBonusAdded;

    // Log summary
    console.log(`[CHECK_GW_STATUS] Gameweek ${gameweek} final status: ` +
      `Started: ${hasStarted}, ` +
      `Completed (Strict): ${isComplete}, ` + // Reflects the strict check
      `Matches Finished (Official): ${matchesFinished.length}/${totalMatches}, ` +
      `Bonus Added (Event Status): ${finalBonusAdded ? 'yes' : 'no'}`);

    // Return object using the strict values derived from both endpoints
    return {
      hasStarted,
      isComplete, // This now requires official finish + bonus confirmation
      bonusPointsAdded: finalBonusAdded, // The confirmed status from event-status
      matchesStarted: matchesStarted.length,
      matchesFinished: matchesFinished.length, // Official FPL flag count
      // practicallyFinishedCount and totalFinishedCount might be less relevant now but can be kept for info
      practicallyFinishedCount: fixtures.filter((fixture: any) => !fixture.finished && new Date(new Date(fixture.kickoff_time).getTime() + (115 * 60 * 1000)) < now).length,
      totalMatches,
      // finishedWithBonus count from fixture stats might still be useful for cross-checking
      finishedWithBonus: fixtures.filter((fixture: any) => fixture.finished === true && fixture.stats?.some((stat: any) => stat.identifier === 'bonus' && ((stat.h && stat.h.length > 0) || (stat.a && stat.a.length > 0)))).length,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error(`[CHECK_GW_STATUS] Error checking gameweek status for GW ${gameweek}:`, error);
    return { hasStarted: false, isComplete: false, bonusPointsAdded: false, matchesStarted: 0, matchesFinished: 0, practicallyFinishedCount: 0, totalFinishedCount: 0, finishedWithBonus: 0, totalMatches: 0, error: error instanceof Error ? error.message : String(error) };
  }
}
/**
 * Fetch live gameweek points with enhanced error handling and multiple data sources
 */

/**
 * Fetches live points for a list of FPL team IDs for a specific gameweek.
 * Prioritizes live calculation unless prioritizeApiPoints is true (for final results).
 *
 * @param teamIds Array of FPL Team IDs.
 * @param gameweek The target gameweek number.
 * @param prioritizeApiPoints If true, uses points from /picks API first (for finalized data). Defaults to false (prioritizes live calculation).
 * @returns A record mapping teamId to fetched points. Defaults to 0 on error.
 */
export async function fetchLiveGameweekPoints(
  teamIds: number[],
  gameweek: number
  // Removed prioritizeApiPoints parameter
): Promise<Record<number, number>> {

  const logPrefix = "[FETCH_POINTS_API_PRIORITY]"; // Prefix indicating logic used
  console.log(`${logPrefix} Starting for GW ${gameweek}, ${teamIds.length} teams. Logic: API Priority (calc if API=0).`);
  const points: Record<number, number> = {};

  // --- Input validation ---
  if (!teamIds || teamIds.length === 0) { return points; }
  if (!gameweek || gameweek <= 0 || gameweek > 38) { return points; }

  try {
      // 1. Check Gameweek Status
      const gameweekStatus = await checkGameweekStatus(gameweek);
      console.log(`${logPrefix} GW Status for ${gameweek}:`, gameweekStatus);
      if (!gameweekStatus || !gameweekStatus.hasStarted) {
          console.log(`${logPrefix} GW ${gameweek} not started/status unavailable. Returning zeros.`);
          teamIds.forEach(id => { points[id] = 0; });
          return points;
      }

      // 2. Fetch Bulk Live Data (potentially needed for fallback calculation)
      let liveData: FplLiveData | null = null;
      try {
          const timestamp = Date.now();
          const liveDataUrl = `https://fantasy.premierleague.com/api/event/${gameweek}/live/?_=${timestamp}`;
          console.log(`${logPrefix} Fetching bulk live data: ${liveDataUrl}`);
          const liveResponse = await fetch(liveDataUrl, { headers: { 'User-Agent': 'YourAppName/1.0 (ContactInfo)' }, next: { revalidate: 30 } }); // Revalidate slightly more often
          if (liveResponse.ok) liveData = await liveResponse.json();
          else console.warn(`${logPrefix} Failed fetch bulk live data: ${liveResponse.status}`);
      } catch (liveDataError) { console.error(`${logPrefix} Error fetching bulk live data:`, liveDataError); }

      // 3. Process Teams
      const batchSize = 5; const maxRetries = 2;
      const batches = []; for (let i = 0; i < teamIds.length; i += batchSize) batches.push(teamIds.slice(i, i + batchSize));
      console.log(`${logPrefix} Processing ${batches.length} batches.`);

      for (const [batchIndex, batch] of batches.entries()) {
          console.log(`${logPrefix} Batch ${batchIndex + 1}/${batches.length}`);
          const batchPromises = batch.map(async (teamId) => {
              let retries = 0; let success = false; let assignedPoints: number | null = null;
              let apiPoints: number = 0; // Default to 0
              let transferCost: number = 0;
              let picksData: FplPicksResponse | null = null;

              while (!success && retries < maxRetries) {
                  try {
                      // a. Fetch individual picks/history data
                      const timestamp = Date.now();
                      const url = `https://fantasy.premierleague.com/api/entry/${teamId}/event/${gameweek}/picks/?_=${timestamp}`;
                      const response = await fetch(url, { headers: { 'User-Agent': 'YourAppName/1.0 (ContactInfo)', 'Cache-Control': 'no-cache' }, cache: 'no-store'});

                      if (!response.ok) {
                           const errorText = await response.text().catch(() => '');
                           if (response.status === 404 || picksData?.detail === 'Not found.') {
                               console.warn(`${logPrefix} Team ${teamId} (Try ${retries+1}): Entry/Picks not found (404). Treating API points as 0.`);
                               apiPoints = 0; transferCost = 0; success = true; assignedPoints = 0;
                               continue; // Stop retrying for 404
                           }
                           console.error(`${logPrefix} Error entry ${teamId} (Try ${retries+1}): ${response.status} - ${errorText.slice(0,100)}`);
                           throw new Error(`FPL API Error ${response.status}`);
                       }

                      // b. Process successful picks response
                      picksData = await response.json();
                      apiPoints = picksData?.entry_history?.points ?? 0;
                      transferCost = picksData?.entry_history?.event_transfers_cost ?? 0;
                      console.log(`${logPrefix} Team ${teamId} - Fetched API Points: ${apiPoints}, Hits: ${transferCost}`);

                      // --- REVERTED DECISION LOGIC ---
                      assignedPoints = apiPoints; // Default to official API points

                      // Calculation fallback ONLY if API points is exactly 0
                      if (assignedPoints === 0 && liveData?.elements && picksData?.picks) {
                           console.log(`${logPrefix} Team ${teamId} - API points 0, attempting calculation fallback...`);
                           try {
                              let calculatedRawPoints = 0;
                              for (const pick of picksData.picks) {
                                   const playerLiveData = liveData.elements.find(e => e.id === pick.element);
                                   calculatedRawPoints += (playerLiveData?.stats?.total_points ?? 0) * (pick.multiplier || 1);
                               }
                              const calculatedNetPoints = calculatedRawPoints - transferCost;
                               console.log(`${logPrefix} Team ${teamId} - Calculated Raw: ${calculatedRawPoints}, Net: ${calculatedNetPoints}`);

                              // Use calculated score ONLY if API was 0 AND calc > 0
                              // This prevents showing calculated negatives when API shows 0
                               if (calculatedNetPoints > 0) {
                                  console.log(`${logPrefix} Team ${teamId} - Using calculated fallback points: ${calculatedNetPoints}.`);
                                   assignedPoints = calculatedNetPoints;
                               } else {
                                    console.log(`${logPrefix} Team ${teamId} - Calculation fallback resulted in <= 0, keeping points as 0.`);
                                    // assignedPoints remains 0
                               }
                           } catch (calcError) {
                               console.error(`${logPrefix} Error calculating fallback points for ${teamId}:`, calcError);
                               // assignedPoints remains 0
                           }
                      } else if (assignedPoints !== 0) {
                           console.log(`${logPrefix} Team ${teamId} - Using non-zero API points: ${assignedPoints}`);
                      } else { // assignedPoints is 0, but calculation not possible/attempted
                           console.log(`${logPrefix} Team ${teamId} - API points 0, calculation skipped. Using 0.`);
                           // assignedPoints remains 0
                      }
                      // --- END REVERTED DECISION LOGIC ---

                      success = true; // Mark attempt success

                  } catch (error) {
                       console.error(`${logPrefix} Error processing team ${teamId} (Try ${retries+1}):`, error);
                       retries++;
                       if (retries >= maxRetries) {
                           console.warn(`${logPrefix} Max retries/final error processing team ${teamId}. Assigning 0.`);
                           assignedPoints = 0;
                           success = true; // Mark attempts as finished (failed)
                       } else { await new Promise(r => setTimeout(r, 800 * retries)); }
                  }
              } // end while

              return { teamId, points: assignedPoints ?? 0 }; // Return final point

          }); // End map

          // Wait for batch and assign points
          const batchResults = await Promise.all(batchPromises);
          batchResults.forEach(result => {
               points[result.teamId] = result.points;
               console.log(`${logPrefix} Team ${result.teamId} assigned final points ${result.points} for GW ${gameweek}`);
           });

          // Delay between batches
          if (batchIndex < batches.length - 1) { await new Promise(r => setTimeout(r, 500 + Math.random() * 200)); }
      } // end for batch loop

      console.log(`${logPrefix} Completed GW ${gameweek}. Points collected for ${Object.keys(points).length}/${teamIds.length} teams.`);
      return points;

  } catch (error) {
      console.error(`${logPrefix} UNEXPECTED TOP-LEVEL ERROR for GW ${gameweek}:`, error);
      teamIds.forEach(id => { if (points[id] === undefined) points[id] = 0; }); // Ensure all IDs have a value
      return points;
  }
}

export async function fetchFplEntry(fplTeamId: number): Promise<any | null> {
  // Replace with your actual fetch implementation
  const url = `${process.env.FPL_API_ENTRY_BASE_URL}${fplTeamId}/`;
  try {
    console.log(`[FPL_FETCH] Fetching Entry: ${url}`);
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }, // Add appropriate headers
      next: { revalidate: 60 } // Cache for 1 minute? Adjust as needed
    });
    if (!response.ok) {
      console.error(`[FPL_FETCH] Failed Entry fetch for ${fplTeamId}: ${response.status}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error(`[FPL_FETCH] Error fetching Entry for ${fplTeamId}:`, error);
    return null;
  }
}

// Example: Fetches https://fantasy.premierleague.com/api/entry/{teamId}/history/
export async function fetchFplEntryHistory(fplTeamId: number): Promise<any | null> {
  // Replace with your actual fetch implementation
  const url = `${process.env.FPL_API_ENTRY_BASE_URL}${fplTeamId}/history/`;
  try {
    console.log(`[FPL_FETCH] Fetching History: ${url}`);
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 300 } // Cache for 5 minutes? Adjust as needed
    });
    if (!response.ok) {
      console.error(`[FPL_FETCH] Failed History fetch for ${fplTeamId}: ${response.status}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error(`[FPL_FETCH] Error fetching History for ${fplTeamId}:`, error);
    return null;
  }
}

// Example: Fetches https://fantasy.premierleague.com/api/bootstrap-static/
export async function fetchBootstrapStatic(): Promise<any | null> {
  // Replace with your actual fetch implementation
  const url = `${process.env.FPL_API_STATIC_BASE_URL}`; // Use correct env var if different
  try {
    console.log(`[FPL_FETCH] Fetching Bootstrap Static: ${url}`);
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 3600 } // Cache for 1 hour? Adjust as needed
    });
    if (!response.ok) {
      console.error(`[FPL_FETCH] Failed Bootstrap Static fetch: ${response.status}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error(`[FPL_FETCH] Error fetching Bootstrap Static:`, error);
    return null;
  }
}

export async function fetchFplHistoryPointsBeforeGameweek(fplTeamId: number, gameweek: number): Promise<number | null> {
  console.warn(`[fetchFplHistoryPointsBeforeGameweek] Called for ${fplTeamId}, GW${gameweek}. Needs implementation!`);
  // 1. Construct URL for FPL entry history API
  const url = `https://fantasy.premierleague.com/api/entry/${fplTeamId}/history/`;
  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (YourApp/1.0)' } });
    if (!response.ok) { throw new Error(`FPL History API Error: ${response.status}`); }
    const data = await response.json();

    // 2. Find the entry for the *previous* gameweek
    const targetGameweek = gameweek - 1;
    if (targetGameweek < 1) return 0; // Score before GW1 is 0

    const previousGwEntry = data?.current?.find((gw: any) => gw.event === targetGameweek);

    // 3. Return the 'total_points' from that entry
    if (previousGwEntry && typeof previousGwEntry.total_points === 'number') {
      return previousGwEntry.total_points;
    } else {
      console.warn(`Could not find history points for FPL ID ${fplTeamId} for GW${targetGameweek}`);
      return null; // Indicate points couldn't be found
    }
  } catch (error) {
    console.error(`Error in fetchFplHistoryPointsBeforeGameweek for ${fplTeamId}, GW${gameweek}:`, error);
    return null; // Return null on error
  }
}

// --- Robust End Date Calculation ---
export async function calculateEndDate(startDate: Date, gameweek: number): Promise<Date> {
  console.log(`[UTILS] Calculating End Date for GW ${gameweek}`);
  try {
    const bootstrapData = await fetchBootstrapStatic();
    const eventData = bootstrapData?.events?.find((event: any) => event.id === gameweek);

    if (eventData?.deadline_time) {
      const deadlineDate = new Date(eventData.deadline_time);
      // Estimate end date: 3 days after the deadline, end of that day UTC
      const endDate = new Date(Date.UTC(
        deadlineDate.getUTCFullYear(),
        deadlineDate.getUTCMonth(),
        deadlineDate.getUTCDate() + 3, // ~Covers Monday Night Football
        23, 59, 59, 999 // End of day UTC
      ));
      console.log(`[UTILS] Calculated End Date based on GW${gameweek} deadline (${deadlineDate.toISOString()}): ${endDate.toISOString()}`);
      if (endDate > startDate) return endDate; // Return if valid
      console.warn(`[UTILS] Calculated end date is not after start date. Using fallback.`);
    } else {
      console.warn(`[UTILS] Could not get deadline time for GW${gameweek}. Using fallback.`);
    }
  } catch (e) {
    console.error("[UTILS] Error during end date calculation using FPL data:", e);
  }
  // Fallback: Start date + 6 days, end of day (local time)
  console.warn(`[UTILS] Using fallback End Date calculation: Start Date + 6 days.`);
  const fallbackEndDate = new Date(startDate);
  fallbackEndDate.setDate(fallbackEndDate.getDate() + 6);
  fallbackEndDate.setHours(23, 59, 59, 999);
  return fallbackEndDate;
}


// --- END CORRECTION ---
export interface UpdateResult {
  success: boolean;
  entriesUpdated?: number;
  ranksUpdated?: number;
  error?: string;
}
// Function to process updates for ONE active league
export async function processLeagueUpdate(
  league: { id: string; gameweek: number; currentHighestGwPoints: number | null },
  prismaInstance: PrismaClient
): Promise<UpdateResult> {
  const leagueStartTime = Date.now();
  let entriesUpdatedCount = 0;
  let ranksUpdatedCount = 0;
  console.log(`[LEAGUE_UPDATE_PROCESS] Updating League ID: ${league.id}, GW: ${league.gameweek}`);

  try {
    // a. Get FPL IDs and current data
    const entriesToUpdate = await prismaInstance.leagueEntry.findMany({
      where: { leagueId: league.id },
      select: { id: true, fplTeamId: true, pointsAtStart: true, joinedAt: true, weeklyPoints: true }
    });
    const fplTeamIds = entriesToUpdate.map(e => e.fplTeamId).filter((id): id is number => id != null);

    if (fplTeamIds.length === 0) {
      console.log(`[LEAGUE_UPDATE_PROCESS] No FPL IDs for league ${league.id}.`);
      return { success: true, entriesUpdated: 0, ranksUpdated: 0 };
    }

    // b. Fetch Live Points
    const livePointsData = await fetchLiveGameweekPoints(fplTeamIds, league.gameweek);
    console.log(`[LEAGUE_UPDATE_PROCESS] League ${league.id} - Fetched points for ${Object.keys(livePointsData).length} teams.`);

    // c. Prepare & Apply Point Updates + Calculate Highest Points
    let currentUpdateHighestPoints = league.currentHighestGwPoints ?? 0;
    const pointUpdatePromises: Prisma.PrismaPromise<any>[] = [];
    entriesToUpdate.forEach(entry => {
      const fplId = entry.fplTeamId;
      const weeklyPoints = (fplId != null && fplId in livePointsData) ? livePointsData[fplId] : (entry.weeklyPoints ?? 0);
      const finalPoints = (entry.pointsAtStart || 0) + weeklyPoints;
      if (weeklyPoints > currentUpdateHighestPoints) currentUpdateHighestPoints = weeklyPoints;
      pointUpdatePromises.push(prismaInstance.leagueEntry.update({ where: { id: entry.id }, data: { weeklyPoints: weeklyPoints, finalPoints: finalPoints, updatedAt: new Date() } }));
    });

    if (pointUpdatePromises.length > 0) {
      await prismaInstance.$transaction(pointUpdatePromises);
      entriesUpdatedCount = pointUpdatePromises.length;
      console.log(`[LEAGUE_UPDATE_PROCESS] League ${league.id} - Updated points for ${entriesUpdatedCount} entries.`);
    }

    // d. Update League Highest Points (based on weekly)
    if (currentUpdateHighestPoints > (league.currentHighestGwPoints ?? 0)) {
      await prismaInstance.weeklyLeague.update({ where: { id: league.id }, data: { currentHighestGwPoints: currentUpdateHighestPoints } });
      console.log(`[LEAGUE_UPDATE_PROCESS] League ${league.id} - Updated highest GW points to ${currentUpdateHighestPoints}.`);
    }

    // --- CORRECTED Rank Calculation ---
    console.log(`[LEAGUE_UPDATE_PROCESS] Calculating ranks based on weeklyPoints for league ${league.id}...`);
    // Fetch entries again ORDERED BY weeklyPoints descending
    const entriesForRanking = await prismaInstance.leagueEntry.findMany({
      where: { leagueId: league.id },
      // Select fields needed for ranking comparison
      select: { id: true, weeklyPoints: true, joinedAt: true },
      // --- Sort by weeklyPoints DESC ---
      orderBy: [{ weeklyPoints: 'desc' }, { joinedAt: 'asc' }]
    });

    const rankUpdatePromises: Prisma.PrismaPromise<any>[] = [];
    let currentRank = 0;
    let rankCounter = 0; // Tracks position in sorted list
    let lastWeeklyPoints = -Infinity; // Compare against weeklyPoints

    for (const entry of entriesForRanking) {
      rankCounter++;
      // --- Compare weeklyPoints (handle nulls safely) ---
      const currentPoints = entry.weeklyPoints ?? -Infinity;
      if (currentPoints !== lastWeeklyPoints) {
        currentRank = rankCounter; // Assign rank based on position in sorted list
        lastWeeklyPoints = currentPoints;
      }
      // --- End Compare weeklyPoints ---
      rankUpdatePromises.push(
        prismaInstance.leagueEntry.update({
          where: { id: entry.id },
          data: { rank: currentRank } // Update rank field
        })
      );
    }

    // Apply Rank Updates Transaction
    if (rankUpdatePromises.length > 0) {
      await prismaInstance.$transaction(rankUpdatePromises);
      ranksUpdatedCount = rankUpdatePromises.length;
      console.log(`[LEAGUE_UPDATE_PROCESS] League ${league.id} - Updated ranks for ${ranksUpdatedCount} entries (based on weekly points).`);
    }
    // --- END CORRECTED Rank Calculation ---

    const leagueDuration = Date.now() - leagueStartTime;
    console.log(`[LEAGUE_UPDATE_PROCESS] Finished update for League ID: ${league.id}. Duration: ${leagueDuration}ms`);
    return { success: true, entriesUpdated: entriesUpdatedCount, ranksUpdated: ranksUpdatedCount };

  } catch (leagueError) {
    const errorMessage = leagueError instanceof Error ? leagueError.message : "Unknown error updating league";
    console.error(`[LEAGUE_UPDATE_PROCESS] Error updating league ${league.id}:`, leagueError);
    const leagueDuration = Date.now() - leagueStartTime;
    console.log(`[LEAGUE_UPDATE_PROCESS] Failed update for League ID: ${league.id}. Duration: ${leagueDuration}ms`);
    return { success: false, error: errorMessage };
  }
}

export const CONCURRENT_LEAGUE_UPDATES = 3;


export async function runActivationAndUpdates() {
  const jobStartTime = Date.now();
  let activatedCount = 0;
  let processedCount = 0;
  let entriesCount = 0;
  let ranksCount = 0;
  let errors: { leagueId: string, error: string }[] = [];

  try {
    // --- Activate Upcoming Leagues ---
    console.log("[JOB_LOGIC] Checking upcoming leagues...");
    const upcomingLeagues = await prisma.weeklyLeague.findMany({
      where: { status: 'upcoming' }, select: { id: true, gameweek: true, name: true }
    });
    const leaguesToActivate: string[] = [];
    if (upcomingLeagues.length > 0) {
      const uniqueGameweeks = [...new Set(upcomingLeagues.map(l => l.gameweek))];
      const gameweekStatuses: Record<number, { hasStarted: boolean }> = {};
      for (const gw of uniqueGameweeks) {
        try { const statusResult = await checkGameweekStatus(gw); gameweekStatuses[gw] = { hasStarted: statusResult.hasStarted }; }
        catch (gwError) { console.error(`Error checking GW${gw}: ${gwError}`); gameweekStatuses[gw] = { hasStarted: false }; }
        await new Promise(res => setTimeout(res, 50)); // Small delay
      }
      for (const league of upcomingLeagues) {
        if (gameweekStatuses[league.gameweek]?.hasStarted) { leaguesToActivate.push(league.id); }
      }
      if (leaguesToActivate.length > 0) {
        const updateResult = await prisma.weeklyLeague.updateMany({ where: { id: { in: leaguesToActivate } }, data: { status: 'active', updatedAt: new Date() } });
        activatedCount = updateResult.count;
        console.log(`[JOB_LOGIC] Activated ${activatedCount} leagues.`);
      } else { console.log("[JOB_LOGIC] No upcoming leagues needed activation."); }
    } else { console.log("[JOB_LOGIC] No upcoming leagues found."); }

    // --- Process Active Leagues ---
    console.log("[JOB_LOGIC] Fetching active leagues...");
    const activeLeagues = await prisma.weeklyLeague.findMany({
      where: { status: 'active' }, select: { id: true, gameweek: true, currentHighestGwPoints: true }
    });
    if (!activeLeagues || activeLeagues.length === 0) {
      console.log("[JOB_LOGIC] No active leagues found to process.");
    } else {
      console.log(`[JOB_LOGIC] Found ${activeLeagues.length} active leagues.`);
      for (let i = 0; i < activeLeagues.length; i += CONCURRENT_LEAGUE_UPDATES) {
        const chunk = activeLeagues.slice(i, i + CONCURRENT_LEAGUE_UPDATES);
        console.log(`[JOB_LOGIC] Processing chunk ${Math.floor(i / CONCURRENT_LEAGUE_UPDATES) + 1}`);
        const promises = chunk.map(league => processLeagueUpdate(league, prisma)); // Ensure processLeagueUpdate is defined/imported
        const results = await Promise.allSettled(promises);
        results.forEach((result, index) => {
          const leagueId = chunk[index].id; processedCount++;
          if (result.status === 'fulfilled' && result.value.success) { entriesCount += result.value.entriesUpdated || 0; ranksCount += result.value.ranksUpdated || 0; }
          else { const errorMsg = result.status === 'rejected' ? (result.reason instanceof Error ? result.reason.message : "Unknown rejection") : (result.value.error || "Update failed"); errors.push({ leagueId, error: errorMsg }); }
        });
      }
    }
  } catch (error) {
    console.error("[JOB_LOGIC] Critical error during activation/update:", error);
    errors.push({ leagueId: 'GLOBAL', error: error instanceof Error ? error.message : "Unknown error" });
  }

  const duration = Date.now() - jobStartTime;
  console.log(`[JOB_LOGIC] Finished. Activated: ${activatedCount}, Processed Active: ${processedCount}, Entries Updated: ${entriesCount}, Ranks Updated: ${ranksCount}, Duration: ${duration}ms, Errors: ${errors.length}`);
  // Return results object
  return { activatedCount, processedCount, entriesCount, ranksCount, errors, duration };
}