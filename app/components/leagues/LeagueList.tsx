"use client";

import React from "react";
import { useRouter } from "next/navigation";
import LeagueCard from "./LeagueCard";
import { useAvailableLeagues, useMyLeagues } from "@/app/hooks/leagues";
import { WeeklyLeague } from "@/app/types";
import { Skeleton } from "@/app/components/ui/skeleton";

interface LeagueListProps {
  filter?: "available" | "my-leagues";
  gameweek?: number;
}

export default function LeagueList({
  filter = "available",
  gameweek,
}: LeagueListProps) {
  const router = useRouter();

  // Use the appropriate hook based on the filter
  const availableLeaguesQuery = useAvailableLeagues(gameweek);
  console.log(gameweek, 'game weeek')
  const myLeaguesQuery = useMyLeagues();

  // Select the query based on the filter
  const { data: leagues = [], isLoading: loading, error } =
    filter === "available" ? availableLeaguesQuery : myLeaguesQuery;

  const handleJoinLeague = (leagueId: string) => {
    router.push(`/leagues/weekly/${leagueId}/join`);
  };

  const handleViewLeague = (leagueId: string) => {
    router.push(`/leagues/weekly/${leagueId}`);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-7 w-3/5 bg-gray-800" />
                <Skeleton className="h-6 w-16 rounded-full bg-gray-800" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-full bg-gray-800" />
                  <Skeleton className="h-4 w-1/3 bg-gray-800" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-full bg-gray-800" />
                  <Skeleton className="h-4 w-2/5 bg-gray-800" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-full bg-gray-800" />
                  <Skeleton className="h-4 w-1/4 bg-gray-800" />
                </div>
              </div>
              <div className="pt-3 flex justify-between">
                <Skeleton className="h-9 w-2/5 rounded-md bg-gray-800" />
                <Skeleton className="h-9 w-2/5 rounded-md bg-gray-800" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-red-500">
      Failed to load leagues. Please try again later.
    </div>;
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
      {leagues.map((league: WeeklyLeague) => (
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
