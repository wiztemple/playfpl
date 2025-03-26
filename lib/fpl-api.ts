// // /lib/fpl-api.ts
// import { cache } from 'react';

// const FPL_API_BASE = 'https://fantasy.premierleague.com/api';
// const CACHE_DURATION = 60 * 5; // 5 minutes in seconds

// // Cache wrapper for API requests
// async function fetchWithCache(url: string, options: RequestInit = {}) {
//   // Simple in-memory cache implementation
//   const cacheKey = `fpl-cache:${url}`;

//   // Check if we have a recent cache entry
//   const cachedData = sessionStorage.getItem(cacheKey);
//   if (cachedData) {
//     const { data, timestamp } = JSON.parse(cachedData);
//     const age = (Date.now() - timestamp) / 1000; // age in seconds

//     if (age < CACHE_DURATION) {
//       return data;
//     }
//   }

//   // If not cached or cache expired, fetch fresh data
//   const response = await fetch(url, options);

//   if (!response.ok) {
//     throw new Error(`API request failed: ${response.status}`);
//   }

//   const data = await response.json();

//   // Cache the fresh data
//   sessionStorage.setItem(
//     cacheKey,
//     JSON.stringify({ data, timestamp: Date.now() })
//   );

//   return data;
// }

// // Get basic FPL game information (bootstrap static)
// export const getGameInfo = cache(async () => {
//   try {
//     return await fetchWithCache(`${FPL_API_BASE}/bootstrap-static/`);
//   } catch (error) {
//     console.error('Error fetching FPL game info:', error);
//     throw error;
//   }
// });

// // Get current gameweek information
// export const getCurrentGameweek = cache(async () => {
//   try {
//     const gameInfo = await getGameInfo();
//     return gameInfo.events.find((gw: any) => gw.is_current);
//   } catch (error) {
//     console.error('Error fetching current gameweek:', error);
//     throw error;
//   }
// });

// // Get specific gameweek information
// export const getGameweek = cache(async (gameweekId: number) => {
//   try {
//     const gameInfo = await getGameInfo();
//     return gameInfo.events.find((gw: any) => gw.id === gameweekId);
//   } catch (error) {
//     console.error(`Error fetching gameweek ${gameweekId}:`, error);
//     throw error;
//   }
// });

// // Get fixtures for a specific gameweek
// export const getGameweekFixtures = cache(async (gameweekId: number) => {
//   try {
//     return await fetchWithCache(`${FPL_API_BASE}/fixtures/?event=${gameweekId}`);
//   } catch (error) {
//     console.error(`Error fetching fixtures for gameweek ${gameweekId}:`, error);
//     throw error;
//   }
// });

// // Get team details by ID
// export const fetchFplTeam = cache(async (teamId: number | string) => {
//   try {
//     const response = await fetch(`${FPL_API_BASE}/entry/${teamId}/`);

//     if (!response.ok) {
//       if (response.status === 404) {
//         return null; // Team not found
//       }
//       throw new Error(`Failed to fetch team: ${response.status}`);
//     }

//     return await response.json();
//   } catch (error) {
//     console.error(`Error fetching FPL team ${teamId}:`, error);
//     throw error;
//   }
// });

// // Get team points for a specific gameweek
// export const getTeamGameweekPoints = cache(async (teamId: number | string, gameweekId: number) => {
//   try {
//     return await fetchWithCache(`${FPL_API_BASE}/entry/${teamId}/event/${gameweekId}/picks/`);
//   } catch (error) {
//     console.error(`Error fetching team ${teamId} points for gameweek ${gameweekId}:`, error);
//     throw error;
//   }
// });

// // Search for teams by name or manager name
// export const searchTeams = async (query: string) => {
//   // Note: FPL doesn't provide a search API, so this is a mock implementation
//   // In a real app, you might need to maintain your own database of teams
//   // For now, we'll return mock results

//   // Simulating API request delay
//   await new Promise(resolve => setTimeout(resolve, 500));

//   // Mock search results
//   const mockResults = [
//     {
//       id: 12345,
//       name: "Team Awesome",
//       player_name: "John Smith",
//       total_points: 1234
//     },
//     {
//       id: 67890,
//       name: "Fantasy Kings",
//       player_name: "Jane Doe",
//       total_points: 1345
//     },
//     {
//       id: 54321,
//       name: "Premier Stars",
//       player_name: "Mike Johnson",
//       total_points: 1122
//     }
//   ];

//   // Filter based on query
//   return mockResults.filter(team =>
//     team.name.toLowerCase().includes(query.toLowerCase()) ||
//     team.player_name.toLowerCase().includes(query.toLowerCase())
//   );
// };

// // API route implementations
// // /app/api/fpl/team/[id]/route.ts
// export async function fetchTeamApiHandler(teamId: string) {
//   try {
//     const team = await fetchFplTeam(teamId);

//     if (!team) {
//       return { status: 404, body: { error: 'Team not found' } };
//     }

//     return {
//       status: 200,
//       body: {
//         id: team.id,
//         name: team.name,
//         player_name: team.player_first_name + ' ' + team.player_last_name,
//         total_points: team.summary_overall_points
//       }
//     };
//   } catch (error) {
//     console.error(`Error in team API handler:`, error);
//     return { status: 500, body: { error: 'Server error' } };
//   }
// }

// // /app/api/fpl/search/route.ts
// export async function searchTeamsApiHandler(query: string) {
//   try {
//     if (!query || query.length < 3) {
//       return { status: 400, body: { error: 'Query must be at least 3 characters' } };
//     }

//     const results = await searchTeams(query);
//     return { status: 200, body: results };
//   } catch (error) {
//     console.error(`Error in search API handler:`, error);
//     return { status: 500, body: { error: 'Server error' } };
//   }
// }

// // /app/api/fpl/gameweek/current/route.ts
// export async function getCurrentGameweekApiHandler() {
//   try {
//     const currentGameweek = await getCurrentGameweek();
//     return { status: 200, body: currentGameweek };
//   } catch (error) {
//     console.error(`Error in current gameweek API handler:`, error);
//     return { status: 500, body: { error: 'Server error' } };
//   }
// }

// /lib/fpl-api.ts
import { cache } from "react";

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
export async function getGameweekInfo(gameweekId: number) {
  try {
    const data = await getBootstrapStatic();
    return data.events.find((gw: any) => gw.id === gameweekId) || null;
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
