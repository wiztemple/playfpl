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

// Modify the existing getGameweekInfo function
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

    // Find the last fixture of the gameweek
    const sortedFixtures = fixturesData.sort((a: any, b: any) => 
      new Date(b.kickoff_time).getTime() - new Date(a.kickoff_time).getTime()
    );

    return {
      ...gameweek,
      fixtures: fixturesData,
      gameweek_end: sortedFixtures[0]?.kickoff_time // Last fixture's kickoff time
    };
  } catch (error) {
    console.error(`Error getting gameweek ${gameweekId} info:`, error);
    throw error;
  }
}

// Get a specific team's details
export async function getTeamInfo(teamId: number) {
  try {
    const response = await fetch(`${FPL_API_BASE}/entry/${teamId}/`);

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Team not found
      }
      throw new Error(`FPL API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error getting team ${teamId} info:`, error);
    throw error;
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
