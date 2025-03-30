import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getBootstrapStatic, getGameweekInfo, getTeamInfo, getTeamPicks } from "@/lib/fpl-api";
import { fetchWithSessionCheck } from "@/lib/api-utils";
import { toast } from "sonner";


// Update your existing hook
export function useFplTeamInfo(teamId: number | undefined) {
    return useQuery({
        queryKey: ['fpl-team', teamId],
        queryFn: async () => {
            if (!teamId) return null;
            return getTeamInfo(teamId);
        },
        enabled: !!teamId,
        staleTime: 24 * 60 * 60 * 1000, // 24 hours
        gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
}

// Add a new hook for handling API requests with session checks
export function useApiWithSessionCheck() {
    return {
        fetch: fetchWithSessionCheck
    };
}

// Get FPL bootstrap static data (players, teams, etc.)
export function useBootstrapStatic() {
    return useQuery({
        queryKey: ['fpl-bootstrap'],
        queryFn: getBootstrapStatic,
        staleTime: 60 * 60 * 1000, // 1 hour
        gcTime: 24 * 60 * 60 * 1000, // 24 hours
    });
}

// Get specific gameweek info from FPL API
export function useFplGameweekInfo(gameweekId: number | undefined) {
    return useQuery({
        queryKey: ['fpl-gameweek', gameweekId],
        queryFn: async () => {
            if (!gameweekId) return null;
            return getGameweekInfo(gameweekId);
        },
        enabled: !!gameweekId,
        staleTime: 30 * 60 * 1000, // 30 minutes
        gcTime: 24 * 60 * 60 * 1000, // 24 hours
    });
}

// Get team picks for a specific gameweek
export function useTeamPicks(teamId: number | undefined, gameweekId: number | undefined) {
    return useQuery({
        queryKey: ['fpl-team-picks', teamId, gameweekId],
        queryFn: async () => {
            if (!teamId || !gameweekId) return null;
            return getTeamPicks(teamId, gameweekId);
        },
        enabled: !!teamId && !!gameweekId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 24 * 60 * 60 * 1000, // 24 hours
    });
}

// Check if a team ID is already connected to another user
export function useCheckTeamOwnership() {
    return useMutation({
        mutationFn: async (fplTeamId: number) => {
            const response = await fetch('/api/user/check-team-ownership', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fplTeamId }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "Failed to verify team ownership");
            }
            return data;
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to check team ownership');
        }
    });
}

// Verify FPL team
export function useVerifyFplTeam() {
  return useMutation({
    mutationFn: async (teamId: string) => {
      // Update to use GET request with query parameters
      const response = await fetch(`/api/fpl/verify-team?id=${encodeURIComponent(teamId)}`);
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify team');
      }
      
      return {
        verified: true,
        teamName: data.teamName,
        playerName: data.playerName,
        overallRank: data.overallRank || 0,
        ...data
      };
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to verify team. Please try again.');
    }
  });
}