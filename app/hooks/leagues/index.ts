import { LeaderboardEntry, WeeklyLeague } from "@/app/types";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useDeadlineCheck } from "./useDeadlineCheck";

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

export function useMyLeagues() {
    const { data: session, status } = useSession();

    return useQuery({
        queryKey: ['leagues', 'my-leagues', status],
        queryFn: async () => {
            // If not authenticated, throw an error that can be caught by the component
            if (status === "unauthenticated") {
                throw new Error('AUTH_REQUIRED');
            }

            // Don't attempt to fetch until we know auth status
            if (status === "loading") {
                return [];
            }

            const response = await fetch('/api/leagues/weekly?filter=my-leagues');

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('AUTH_REQUIRED');
                }
                throw new Error('Failed to fetch my leagues');
            }

            return response.json() as Promise<WeeklyLeague[]>;
        },
        // Only refetch when authentication status changes
        enabled: status !== "loading",
        // Don't retry on AUTH_REQUIRED errors
        retry: (failureCount, error) => {
            return !(error instanceof Error && error.message === 'AUTH_REQUIRED') && failureCount < 3;
        }
    });
}

export function useLeague(leagueId: string) {
    const { data: session } = useSession();

    return useQuery({
        queryKey: ['league', leagueId, session?.user?.id],
        queryFn: async () => {
            if (!leagueId) throw new Error('League ID is missing');

            const timestamp = new Date().getTime();
            const response = await fetch(`/api/leagues/weekly/${leagueId}?_=${timestamp}`);

            if (!response.ok) {
                throw new Error('Failed to fetch league details');
            }

            const leagueData = await response.json() as WeeklyLeague;

            // Check if the current user has joined this league
            if (session?.user?.id) {
                const userEntryResponse = await fetch(`/api/leagues/entry?userId=${session.user.id}&leagueId=${leagueId}`);
                if (userEntryResponse.ok) {
                    const userEntryData = await userEntryResponse.json();
                    leagueData.hasJoined = !!userEntryData.entry;
                    leagueData.hasPaid = userEntryData.entry?.paid || false;
                } else {
                    leagueData.hasJoined = false;
                    leagueData.hasPaid = false;
                }
            } else {
                leagueData.hasJoined = false;
                leagueData.hasPaid = false;
            }

            return leagueData;
        },
        enabled: !!leagueId,
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