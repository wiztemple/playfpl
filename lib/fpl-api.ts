const FPL_API_BASE = "https://fantasy.premierleague.com/api";

// Cache FPL API responses to reduce API calls
let bootstrapCache: any = null;
let bootstrapCacheTime: number = 0;
const CACHE_DURATION = 3600000; // 1 hour in ms

// Get general FPL game information
export async function getBootstrapStatic() {
  // Return cached data if available and fresh
  if (bootstrapCache && Date.now() - bootstrapCacheTime < CACHE_DURATION) {
    return bootstrapCache;
  }

  try {
    const response = await fetch(`${FPL_API_BASE}/bootstrap-static/`);

    if (!response.ok) {
      throw new Error(`FPL API error: ${response.status}`);
    }

    const data = await response.json();

    // Cache the response
    bootstrapCache = data;
    bootstrapCacheTime = Date.now();

    return data;
  } catch (error) {
    console.error("Error fetching FPL bootstrap data:", error);
    throw error;
  }
}

// Get the current active gameweek
export async function getCurrentGameweek() {
  try {
    const data = await getBootstrapStatic();

    // Find the current gameweek
    const currentGameweek = data.events.find((gw: any) => gw.is_current);

    // If no current gameweek, find the next one
    if (!currentGameweek) {
      return data.events.find((gw: any) => gw.is_next) || null;
    }

    return currentGameweek;
  } catch (error) {
    console.error("Error getting current gameweek:", error);
    throw error;
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

// /lib/fpl-api.ts (Add this to your existing file)

/**
 * Check if a gameweek has started or completed by examining fixture data
 */
export async function checkGameweekStatus(gameweek: number) {
  console.log(`[CHECK_GW_STATUS] Checking status for gameweek ${gameweek}`);

  try {
    // Fetch all fixtures for the current gameweek
    const response = await fetch(`https://fantasy.premierleague.com/api/fixtures/?event=${gameweek}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error(`[CHECK_GW_STATUS] Error fetching fixtures: ${response.status} ${response.statusText}`);
      return {
        hasStarted: false,
        isComplete: false,
        matchesPlayed: 0,
        totalMatches: 0,
        error: `Failed to fetch fixtures: ${response.status}`
      };
    }

    const fixtures = await response.json();

    if (!Array.isArray(fixtures)) {
      console.error(`[CHECK_GW_STATUS] Invalid fixture data format`);
      return {
        hasStarted: false,
        isComplete: false,
        matchesPlayed: 0,
        totalMatches: 0,
        error: 'Invalid fixture data format'
      };
    }

    // Count matches that have started (kickoff time in the past)
    const now = new Date();
    const matchesStarted = fixtures.filter(fixture => {
      const kickoffTime = new Date(fixture.kickoff_time);
      return kickoffTime < now;
    });

    // Count matches that have finished
    const matchesFinished = fixtures.filter(fixture => fixture.finished);

    const hasStarted = matchesStarted.length > 0;
    const totalMatches = fixtures.length;
    const isComplete = matchesFinished.length === totalMatches && totalMatches > 0;

    console.log(`[CHECK_GW_STATUS] Gameweek ${gameweek} status: ` +
      `${hasStarted ? 'started' : 'not started'}, ` +
      `${isComplete ? 'completed' : 'in progress'}, ` +
      `${matchesStarted.length}/${totalMatches} matches started, ` +
      `${matchesFinished.length}/${totalMatches} matches finished`);

    return {
      hasStarted,
      isComplete,
      matchesStarted: matchesStarted.length,
      matchesFinished: matchesFinished.length,
      totalMatches,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error(`[CHECK_GW_STATUS] Error checking gameweek status:`, error);
    return {
      hasStarted: false,
      isComplete: false,
      matchesPlayed: 0,
      totalMatches: 0,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Fetch live gameweek points with retry logic and improved error handling
 */
export async function fetchLiveGameweekPoints(teamIds: number[], gameweek: number) {
  console.log(`[FETCH_POINTS] Starting for gameweek ${gameweek} with ${teamIds.length} teams at ${new Date().toISOString()}`);
  const points: Record<number, number> = {};

  // Skip if no team IDs
  if (!teamIds.length) {
    console.log("[FETCH_POINTS] No team IDs provided, skipping fetch");
    return points;
  }

  // Skip if gameweek is invalid
  if (!gameweek || gameweek <= 0) {
    console.log(`[FETCH_POINTS] Invalid gameweek: ${gameweek}, skipping fetch`);
    return points;
  }

  try {
    // First, check if gameweek has started
    const gameweekStatus = await checkGameweekStatus(gameweek);

    if (!gameweekStatus.hasStarted) {
      console.log(`[FETCH_POINTS] Gameweek ${gameweek} has not started yet, skipping fetch`);
      return points;
    }

    // Process in smaller batches to avoid rate limiting
    const batchSize = 5;
    const batches = [];

    for (let i = 0; i < teamIds.length; i += batchSize) {
      batches.push(teamIds.slice(i, i + batchSize));
    }

    console.log(`[FETCH_POINTS] Processing ${batches.length} batches of team IDs`);

    // Maximum retry attempts
    const maxRetries = 3;

    for (const [batchIndex, batch] of batches.entries()) {
      console.log(`[FETCH_POINTS] Processing batch ${batchIndex + 1}/${batches.length}`);

      // Process each team in the batch sequentially
      for (const teamId of batch) {
        let retries = 0;
        let success = false;

        while (retries < maxRetries && !success) {
          try {
            const url = `https://fantasy.premierleague.com/api/entry/${teamId}/event/${gameweek}/picks/`;
            console.log(`[FETCH_POINTS] Fetching from: ${url} (attempt ${retries + 1})`);

            const response = await fetch(url, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
              },
              cache: 'no-store',
              next: { revalidate: 0 }
            });

            if (!response.ok) {
              const errorText = await response.text().catch(() => 'No response text');
              console.error(`[FETCH_POINTS] Error fetching data for team ${teamId}: ${response.status} ${response.statusText} - ${errorText}`);
              retries++;

              // Add exponential backoff
              if (retries < maxRetries) {
                const delay = Math.pow(2, retries) * 1000 + Math.random() * 1000;
                console.log(`[FETCH_POINTS] Retrying in ${Math.round(delay)}ms...`);
                await new Promise(r => setTimeout(r, delay));
              }
              continue;
            }

            const data = await response.json();

            // Make sure points are extracted correctly
            if (data.entry_history && typeof data.entry_history.points === 'number') {
              points[teamId] = data.entry_history.points;
              console.log(`[FETCH_POINTS] Team ${teamId} has ${points[teamId]} points for gameweek ${gameweek}`);
              success = true;
            } else if (data.detail && data.detail.includes("Not found")) {
              // This is likely a valid response indicating the entry doesn't exist for this gameweek
              console.log(`[FETCH_POINTS] Team ${teamId} not found for gameweek ${gameweek}`);
              success = true; // Mark as success to avoid retries
            } else {
              console.error(`[FETCH_POINTS] Invalid data structure for team ${teamId}:`, data);
              retries++;

              if (retries < maxRetries) {
                const delay = Math.pow(2, retries) * 1000 + Math.random() * 1000;
                console.log(`[FETCH_POINTS] Retrying in ${Math.round(delay)}ms...`);
                await new Promise(r => setTimeout(r, delay));
              }
            }
          } catch (error) {
            console.error(`[FETCH_POINTS] Error fetching points for team ${teamId}:`, error);
            retries++;

            if (retries < maxRetries) {
              const delay = Math.pow(2, retries) * 1000 + Math.random() * 1000;
              console.log(`[FETCH_POINTS] Retrying in ${Math.round(delay)}ms...`);
              await new Promise(r => setTimeout(r, delay));
            }
          }
        }

        // Add a small delay between requests to avoid rate limiting
        await new Promise(r => setTimeout(r, 400 + Math.random() * 200));
      }

      // Add a delay between batches
      if (batchIndex < batches.length - 1) {
        await new Promise(r => setTimeout(r, 1000 + Math.random() * 500));
      }
    }

    console.log(`[FETCH_POINTS] Completed. Points data collected for ${Object.keys(points).length}/${teamIds.length} teams`);
    return points;
  } catch (error) {
    console.error("[FETCH_POINTS] Unexpected error:", error);
    return points; // Return whatever points we've collected so far
  }
}