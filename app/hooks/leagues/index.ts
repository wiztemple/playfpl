import { LeaderboardEntry, WeeklyLeague } from "@/app/types";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

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
    return useQuery({
        queryKey: ['leagues', 'my-leagues'],
        queryFn: async () => {
            const response = await fetch('/api/leagues/weekly?filter=my-leagues');
            if (!response.ok) {
                throw new Error('Failed to fetch my leagues');
            }
            return response.json() as Promise<WeeklyLeague[]>;
        },
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

export function useLeagueJoinability(gameweek?: number, minutesThreshold: number = 20) {
    const gameweekQuery = useGameweekInfo(gameweek);

    const isJoinDisabled = () => {
        if (!gameweekQuery.data?.fixtures || gameweekQuery.data.fixtures.length === 0) {
            return false;
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

        // Return true if joining should be disabled (less than threshold minutes until kickoff)
        return minutesUntilKickoff <= minutesThreshold;
    };

    return {
        ...gameweekQuery,
        isJoinDisabled: isJoinDisabled(),
        minutesUntilFirstKickoff: gameweekQuery.data?.fixtures ?
            Math.floor((new Date(gameweekQuery.data.fixtures[0]?.kickoff_time).getTime() - new Date().getTime()) / (1000 * 60)) :
            null
    };
}


export function useLeaderboard(leagueId: string, leagueStatus?: string) {
    return useQuery({
        queryKey: ['leaderboard', leagueId, leagueStatus],
        queryFn: async () => {
            if (leagueStatus === 'active' || leagueStatus === 'completed') {
                const response = await fetch(`/api/leagues/weekly/${leagueId}/leaderboard`);
                if (!response.ok) {
                    throw new Error('Failed to fetch leaderboard');
                }
                return response.json() as Promise<LeaderboardEntry[]>;
            } else {
                const response = await fetch(`/api/leagues/weekly/${leagueId}/participants`);
                if (!response.ok) {
                    throw new Error('Failed to fetch participants');
                }
                const data = await response.json();
                return data.participants as LeaderboardEntry[];
            }
        },
        enabled: !!leagueId && !!leagueStatus,
    });
}