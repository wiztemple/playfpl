import { LeaderboardEntry, League, LeagueWithUserStatus, MyLeagueInfo, WeeklyLeague } from "@/app/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useDeadlineCheck } from "./useDeadlineCheck";
import { toast } from "sonner";
import { useMemo } from "react";

interface JoinLeagueSuccessData {
    success: boolean;
    message: string;
    entryId: string;
    newBalance: number;
}
interface JoinLeagueVariables {
    leagueId: string;
    fplTeamId: string; // API expects string FPL ID
}

interface MyLeaguesApiResponse {
    leagues: MyLeagueInfo[];
}

export function useAvailableLeagues(gameweek?: number) {
    return useQuery({
        queryKey: ['leagues', 'available', gameweek],
        queryFn: async () => {
            let url = '/api/leagues/weekly';

            if (gameweek) {
                url += `?gameweek=${gameweek}`;
            }

            console.log("Fetching leagues from:", url);
            const response = await fetch(url);

            if (!response.ok) {
                console.error(
                    "Response not OK:",
                    response.status,
                    response.statusText
                );
                throw new Error('Failed to fetch available leagues');
            }

            const data = await response.json();
            console.log("Leagues data:", data);
            return data;
        },
    });
}

// export function useMyLeagues() {
//     const { status } = useSession();

//     // Specify the expected return type for better type safety
//     return useQuery<League[]>({
//         queryKey: ['leagues', 'my-leagues', status],
//         queryFn: async (): Promise<League[]> => { // Add Promise<League[]> return type
//             // If not authenticated, throw an error that can be caught by the component
//             if (status === "unauthenticated") {
//                 console.warn("useMyLeagues: Unauthenticated access attempt.");
//                 throw new Error('AUTH_REQUIRED');
//             }

//             // Don't attempt to fetch until we know auth status
//             if (status === "loading") {
//                 return []; // Return empty array while loading auth status
//             }

//             const response = await fetch('/api/leagues/weekly?filter=my-leagues');

//             if (!response.ok) {
//                 if (response.status === 401) {
//                     console.warn("useMyLeagues: Received 401 from API.");
//                     throw new Error('AUTH_REQUIRED');
//                 }
//                 console.error(`useMyLeagues: API request failed with status ${response.status}`);
//                 throw new Error('Failed to fetch my leagues');
//             }
//             const data = await response.json();
//             // Assuming the API returns an array of objects matching the League type
//             return data as League[];
//         },
//         // Only run query when authentication status is known and not loading
//         enabled: status !== "loading",
//         // Don't automatically retry on AUTH_REQUIRED errors
//         retry: (failureCount, error) => {
//             return !(error instanceof Error && error.message === 'AUTH_REQUIRED') && failureCount < 3;
//         },
//         staleTime: 1000 * 60 * 5, // Optional: Keep data fresh for 5 minutes
//     });
// }


// --- useLeague (MODIFIED with cache invalidation and improved types) ---

export function useMyLeagues() {
    const { status } = useSession();
    const fetchMyLeagues = async (): Promise<MyLeaguesApiResponse> => { /* ... fetch logic ... */
        const response = await fetch("/api/leagues/weekly?filter=my-leagues");
        if (!response.ok) { /* ... error handling ... */ }
        const data = await response.json();
        return { leagues: data?.leagues ?? (Array.isArray(data) ? data : []) };
    };

    const { data, error, isLoading } = useQuery<MyLeaguesApiResponse, Error>({
        queryKey: ["myLeagues", status],
        queryFn: fetchMyLeagues,
        enabled: status === "authenticated",
        staleTime: 1000 * 60 * 2,
    });

    // Safely derive lists using useMemo
    const activeLeagues = useMemo(() => data?.leagues?.filter(l => l.status === "active" || l.status === "upcoming") ?? [], [data]);
    const completedLeagues = useMemo(() => data?.leagues?.filter(l => l.status === "completed") ?? [], [data]);

    return { activeLeagues, completedLeagues, isLoading, error }; // Return filtered lists
}

export function useLeague(leagueId: string | undefined | null) {
    const { data: session } = useSession();
    const userId = session?.user?.id;

    // Specify the richer return type 'LeagueWithUserStatus | null'
    return useQuery<LeagueWithUserStatus | null>({
        queryKey: ['league', leagueId, userId], // Include userId if fetch logic depends on it
        queryFn: async (): Promise<LeagueWithUserStatus | null> => {
            // Return null early if leagueId is missing, don't throw here
            if (!leagueId) {
                console.log("useLeague: Skipping fetch, leagueId is missing.");
                return null;
            }

            console.log(`useLeague: Fetching league ${leagueId}`);
            const timestamp = new Date().getTime();
            const response = await fetch(`/api/leagues/weekly/${leagueId}?_=${timestamp}`);

            if (!response.ok) {
                if (response.status === 404) {
                    console.log(`useLeague: League ${leagueId} not found (404).`);
                    return null; // Return null if league doesn't exist
                }
                console.error(`useLeague: API request failed for league ${leagueId} with status ${response.status}`);
                throw new Error(`Failed to fetch league details (status ${response.status})`);
            }

            // Assuming API response *now* correctly includes description, currentHighestGwPoints, etc.
            const leagueData = await response.json();

            // Perform a basic check - ensure it's an object with an ID
            if (typeof leagueData !== 'object' || leagueData === null || !leagueData.id) {
                console.error(`useLeague: Invalid data structure received from API for league ${leagueId}.`, leagueData);
                throw new Error("Invalid data structure received for league.");
            }

            // Type assertion is slightly safer now we know the API *should* be fixed
            const baseLeagueData = leagueData as League;

            let hasJoined = false;
            let hasPaid = false;

            // Check if the current user has joined this league only if logged in
            if (userId) {
                console.log(`useLeague: Checking entry status for user ${userId}, league ${leagueId}`);
                try {
                    // Consider adding timestamp to this fetch too if needed
                    const userEntryResponse = await fetch(`/api/leagues/entry?userId=${userId}&leagueId=${leagueId}`);
                    if (userEntryResponse.ok) {
                        const userEntryData = await userEntryResponse.json();
                        hasJoined = !!userEntryData.entry;
                        hasPaid = userEntryData.entry?.paid || false;
                        console.log(`useLeague: User entry status for ${leagueId}: joined=${hasJoined}, paid=${hasPaid}`);
                    } else {
                        console.warn(`useLeague: Failed to fetch entry status for user ${userId}, league ${leagueId}. Status: ${userEntryResponse.status}`);
                        // Keep defaults (false, false)
                    }
                } catch (entryError) {
                    console.error(`useLeague: Network error fetching entry status for user ${userId}, league ${leagueId}:`, entryError);
                    // Keep defaults (false, false)
                }
            } else {
                console.log(`useLeague: No user session, skipping entry status check for league ${leagueId}.`);
            }

            // Combine base league data with user status
            const result: LeagueWithUserStatus = {
                ...baseLeagueData,
                hasJoined,
                hasPaid
            };

            return result;
        },
        // Only run query if leagueId is available
        enabled: !!leagueId,
        // --- Options To Force Refetch / Disable Cache ---
        refetchOnMount: true,  // Re-fetches when the component using the hook mounts
        gcTime: 0,          // How long inactive query data is kept (0 = discard immediately)
        staleTime: 0,          // How long data is considered fresh (0 = always stale, triggers background refetch)
        // --- End Options ---
    });
}

export function useGameweekInfo(gameweek?: number) {
    return useQuery({
        queryKey: ['gameweek', gameweek],
        queryFn: async () => {
            const response = await fetch(`/api/gameweek/${gameweek}`);
            if (!response.ok) {
                throw new Error('Failed to fetch gameweek info');
            }
            return response.json();
        },
        enabled: !!gameweek,
    });
}

export function useLeaderboard(leagueId: string, leagueStatus?: string) {
    // Get gameweek info for the league to check if games are in progress
    const { data: league } = useLeague(leagueId);
    const { data: gameweekInfo } = useGameweekInfo(league?.gameweek);

    // Use our new hook to check if games are in progress
    const { isDeadlinePassed, gamesInProgress } = useDeadlineCheck(
        gameweekInfo?.deadline_time,
        gameweekInfo?.fixtures
    );

    return useQuery({
        queryKey: ['leaderboard', leagueId, leagueStatus, isDeadlinePassed, gamesInProgress],
        queryFn: async () => {
            // Add timestamp to prevent caching
            const timestamp = new Date().getTime();
            console.log(`Fetching leaderboard for league ${leagueId} (status: ${leagueStatus}, games in progress: ${gamesInProgress})`);

            if (leagueStatus === 'active' || leagueStatus === 'completed') {
                const response = await fetch(`/api/leagues/weekly/${leagueId}/leaderboard?_=${timestamp}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch leaderboard');
                }
                const data = await response.json();
                // Handle both formats (array or object with leaderboard property)
                return Array.isArray(data) ? data : data.leaderboard || [];
            } else {
                const response = await fetch(`/api/leagues/weekly/${leagueId}/participants?_=${timestamp}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch participants');
                }
                const data = await response.json();
                return data.participants as LeaderboardEntry[];
            }
        },
        enabled: !!leagueId && !!leagueStatus,
        // For active leagues with games in progress, refresh more frequently
        refetchInterval: (leagueStatus === 'active' && gamesInProgress) ? 30000 : // Every 30 seconds during games
            (leagueStatus === 'active') ? 60000 : // Every minute for active leagues
                false, // No auto-refresh for other leagues
        // Always refetch when window regains focus
        refetchOnWindowFocus: true,
        // Shorter stale time during games
        staleTime: (leagueStatus === 'active' && gamesInProgress) ? 15000 : // 15s during games
            (leagueStatus === 'active') ? 30000 : // 30s for active leagues
                300000, // 5min for others
    });
}

export function useLeagueJoinability(gameweek?: number, minutesThreshold: number = 10) {
    const gameweekQuery = useGameweekInfo(gameweek);

    // Only calculate if we have fixtures data
    if (!gameweekQuery.data?.fixtures || gameweekQuery.data.fixtures.length === 0) {
        return {
            ...gameweekQuery,
            isJoinDisabled: false,
            minutesUntilFirstKickoff: null
        };
    }

    // Sort fixtures by kickoff time
    const sortedFixtures = [...gameweekQuery.data.fixtures].sort(
        (a, b) => new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime()
    );

    // Get the first fixture
    const firstFixture = sortedFixtures[0];
    const firstKickoff = new Date(firstFixture.kickoff_time);
    const now = new Date();

    // Calculate minutes until kickoff
    const minutesUntilKickoff = (firstKickoff.getTime() - now.getTime()) / (1000 * 60);

    // Determine if joining should be disabled
    const isJoinDisabled = minutesUntilKickoff <= minutesThreshold;

    return {
        ...gameweekQuery,
        isJoinDisabled,
        minutesUntilFirstKickoff: Math.floor(minutesUntilKickoff)
    };
}

export function useJoinLeagueWithWallet(onSuccessCallback?: (data: JoinLeagueSuccessData) => void) {
    const queryClient = useQueryClient();

    return useMutation<JoinLeagueSuccessData, Error, JoinLeagueVariables>({
        mutationFn: async ({ leagueId, fplTeamId }: JoinLeagueVariables): Promise<JoinLeagueSuccessData> => {
            console.log(`[JOIN_LEAGUE_MUTATION] Calling POST /api/leagues/weekly/${leagueId}/join`);
            const response = await fetch(`/api/leagues/weekly/${leagueId}/join`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fplTeamId }), // Send FPL ID in body
            });

            const data = await response.json();
            if (!response.ok) {
                console.error(`[JOIN_LEAGUE_MUTATION] API Error for ${leagueId}:`, data);
                throw new Error(data.error || `Failed to join league (${response.status})`);
            }
            console.log(`[JOIN_LEAGUE_MUTATION] API Success for ${leagueId}:`, data);
            return data as JoinLeagueSuccessData;
        },
        onSuccess: (data, variables) => {
            toast.success("Successfully joined league!");
            // Invalidate queries to reflect changes
            queryClient.invalidateQueries({ queryKey: ['walletBalance'] }); // Update balance display
            queryClient.invalidateQueries({ queryKey: ['transactions'] }); // Show new ENTRY_FEE transaction
            queryClient.invalidateQueries({ queryKey: ['leagues', 'my-leagues'] }); // Update list of joined leagues
            queryClient.invalidateQueries({ queryKey: ['league', variables.leagueId] }); // Update specific league details (e.g., participant count)
            queryClient.invalidateQueries({ queryKey: ['leaderboard', variables.leagueId] }); // Update leaderboard if viewing it
            // Call optional external callback if provided (e.g., for navigation)
            if (onSuccessCallback) onSuccessCallback(data);
        },
        onError: (error: Error, variables) => {
            console.error(`[JOIN_LEAGUE_MUTATION] Error joining league ${variables.leagueId}:`, error);
            toast.error("Failed to join league", { description: error.message });
        }
    });
}