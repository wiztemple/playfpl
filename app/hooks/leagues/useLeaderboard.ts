import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

export function useLeaderboard(leagueId: string | undefined, leagueStatus?: string) {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ['leaderboard', leagueId],
    queryFn: async () => {
      if (!leagueId) return [];
      
      const response = await fetch(`/api/leagues/weekly/${leagueId}/leaderboard`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }
      
      const data = await response.json();
      
      // Find the entry with the highest GW points (if any have weeklyPoints)
      let highestGwPoints = 0;
      let gwWinnerId: string | null = null;
      
      // First pass to find highest GW points
      data.forEach((entry: any) => {
        const gwPoints = entry.weeklyPoints || entry.gwPoints || entry.event_total || 0;
        if (gwPoints > highestGwPoints) {
          highestGwPoints = gwPoints;
          gwWinnerId = entry.userId;
        }
      });
      
      // Process the data to add client-side flags
      return data.map((entry: any) => {
        const isCurrentUser = entry.userId === userId;
        const isGwWinner = highestGwPoints > 0 && entry.userId === gwWinnerId;
        
        return {
          ...entry,
          // Set current user flag
          isCurrentUser,
          is_current_user: isCurrentUser,
          current_user: isCurrentUser,
          isHighlighted: isCurrentUser,
          highlighted: isCurrentUser,
          is_highlighted: isCurrentUser,
          
          // Add GW winner flags
          isGwWinner,
          is_gw_winner: isGwWinner,
          gw_winner: isGwWinner,
          
          // Ensure GW points are consistently available
          gwPoints: entry.weeklyPoints || entry.gwPoints || entry.event_total || 0,
          event_total: entry.weeklyPoints || entry.gwPoints || entry.event_total || 0,
          
          // Ensure manager name is available
          managerName: entry.userName || entry.player_name || entry.name || "Unknown Manager",
          player_name: entry.userName || entry.player_name || entry.name || "Unknown Manager",
        };
      });
    },
    enabled: !!leagueId,
    staleTime: 60 * 1000, // 1 minute
  });
}