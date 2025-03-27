"use client";

// /components/leagues/LeagueList.tsx
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LeagueCard from "./LeagueCard";
import Loading from "../shared/Loading";
import { WeeklyLeague } from "@/app/types";

interface LeagueListProps {
  filter?: "available" | "my-leagues";
  gameweek?: number;
}

export default function LeagueList({
  filter = "available",
  gameweek,
}: LeagueListProps) {
  const [leagues, setLeagues] = useState<WeeklyLeague[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        setLoading(true);
        let url = "/api/leagues/weekly";

        if (filter === "my-leagues") {
          url = "/api/leagues/user";
        }

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
          throw new Error("Failed to fetch leagues");
        }

        const data = await response.json();
        console.log("Leagues data:", data);
        setLeagues(data);
      } catch (error) {
        console.error("Error fetching leagues:", error);
        setError("Failed to load leagues. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchLeagues();
  }, [filter, gameweek]);

  const handleJoinLeague = (leagueId: string) => {
    router.push(`/leagues/weekly/${leagueId}/join`);
  };

  const handleViewLeague = (leagueId: string) => {
    router.push(`/leagues/weekly/${leagueId}`);
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  if (leagues.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        {filter === "available"
          ? "No leagues available at the moment. Check back soon!"
          : "You haven't joined any leagues yet."}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {leagues.map((league) => (
        <LeagueCard
          key={league.id}
          league={league}
          onJoin={() => handleJoinLeague(league.id)}
          onView={() => handleViewLeague(league.id)}
          mode={filter === "my-leagues" ? "joined" : "available"}
        />
      ))}
    </div>
  );
}
