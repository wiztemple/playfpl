import { useQuery } from "@tanstack/react-query";
import { League } from "@/app/types";

interface MyLeaguesResponse {
  leagues: League[];
}

export function useMyLeagues() {
  const fetchMyLeagues = async (): Promise<MyLeaguesResponse> => {
    const response = await fetch("/api/leagues/my-leagues");
    
    if (!response.ok) {
      throw new Error("Failed to fetch leagues");
    }
    
    return response.json();
  };

  const { data, error, isLoading } = useQuery<MyLeaguesResponse, Error>({
    queryKey: ["myLeagues"],
    queryFn: fetchMyLeagues,
  });

  // Separate active and completed leagues
  const activeLeagues = data?.leagues.filter(
    (league) => league.status === "active" || league.status === "upcoming"
  ) || [];

  const completedLeagues = data?.leagues.filter(
    (league) => league.status === "completed"
  ) || [];

  return {
    activeLeagues,
    completedLeagues,
    isLoading,
    error,
  };
}