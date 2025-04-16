"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import LeagueCard from "./LeagueCard";
import { useAvailableLeagues } from "@/app/hooks/leagues";
import type { League, MyLeagueInfo } from "@/app/types";
import { Skeleton } from "@/app/components/ui/skeleton";
import { useSession } from "next-auth/react";

interface LeagueListProps {
  gameweek?: number; // Optional filter by gameweek
}

export default function LeagueList({
  gameweek,
}: LeagueListProps) {
  const router = useRouter();
  const { status: authStatus } = useSession();

  const { data: leagues = [], isLoading, error } = useAvailableLeagues(gameweek);

  useEffect(() => {
    if (error instanceof Error && error.message === 'AUTH_REQUIRED') {
      // This shouldn't happen if available leagues are public, but handle defensively
      console.warn("Auth error encountered fetching available leagues?");
      // Decide how to handle this, maybe show logged-out view or specific error
    }
  }, [error, router]);

  // Handle authentication errors from the hook
  useEffect(() => {
    if (error instanceof Error && error.message === 'AUTH_REQUIRED') {
      router.push('/api/auth/signin');
    }
  }, [error, router]);

  const handleJoinLeague = (leagueId: string) => {
    // Check authentication before trying to join
    if (authStatus !== "authenticated") {
      router.push('/api/auth/signin');
      return;
    }
    router.push(`/leagues/weekly/${leagueId}/join`);
  };

  const handleViewLeague = (leagueId: string) => {
    router.push(`/leagues/weekly/${leagueId}`);
  };

  // Show regular loading state
  if (isLoading) {
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
  // Show error state (except for auth errors which are handled above)
  if (error && !(error instanceof Error && error.message === 'AUTH_REQUIRED')) {
    return <div className="p-4 text-red-500">
      Failed to load leagues. Please try again later.
    </div>;
  }

  // Show empty state
  if (leagues.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        No leagues available at the moment. Check back soon!
      </div>
    );
  }

  // Show leagues
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {leagues.map((league: MyLeagueInfo) => ( // Use League type
        <LeagueCard
          key={league.id} // Use ID as key
          league={league}
          // Ensure onJoin/onView handlers exist and work
          onJoin={() => handleJoinLeague(league.id)}
          onView={() => handleViewLeague(league.id)}
          mode="available"
        />
      ))}
    </div>
  );
}