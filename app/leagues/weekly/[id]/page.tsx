"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Button } from "@/app/components/ui/button";
import { useLeague, useGameweekInfo, useLeaderboard, useLeagueJoinability } from "@/app/hooks/leagues";
import Loading from "@/app/components/shared/Loading";
import LeagueHeader from "@/app/components/league-details/LeagueHeader";
import RulesTab from "@/app/components/league-details/RulesTab";
import PrizesTab from "@/app/components/league-details/PrizesTab";
import { ArrowRight } from "lucide-react";
import LeagueOverviewTab from "@/app/components/league-details/LeagueOverviewTab";

export default function LeagueDetailsPage() {
  const router = useRouter();
  const { id: leagueId } = useParams() as { id: string };
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch league data
  const {
    data: league,
    isLoading: leagueLoading,
    error: leagueError,
  } = useLeague(leagueId);

  // Fetch gameweek info
  const {
    data: gameweekInfo,
  } = useGameweekInfo(league?.gameweek);

  // Check if joining is disabled
  const { isJoinDisabled, minutesUntilFirstKickoff } = useLeagueJoinability(league?.gameweek);

  // Fetch leaderboard
  const {
    data: leaderboard = [],
    isLoading: leaderboardLoading
  } = useLeaderboard(leagueId, league?.status);

  // Log leaderboard data for debugging
  useEffect(() => {
    if (leaderboard && leaderboard.length > 0) {
      console.log("Leaderboard data:", leaderboard);
    }
  }, [leaderboard]);

  // Calculate prize pool
  const prizePool = league
    ? league.entryFee * league.currentParticipants
    : 0;

  // Handle joining a league
  const handleJoinLeague = () => {
    if (!leagueId || isJoinDisabled) return;
    sessionStorage.setItem("joiningLeague", leagueId);
    router.push(`/leagues/weekly/${leagueId}/join`);
  };

  // Show loading state
  if (leagueLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <Loading className="text-indigo-400 h-8 w-8" />
      </div>
    );
  }

  // Show error state
  if (leagueError || !league) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">League not found</h1>
          <Button onClick={() => router.push('/leagues/weekly')}>
            Back to Leagues
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="container mx-auto py-12 px-4 max-w-6xl">
        {/* League Header */}
        <LeagueHeader
          league={league}
          gameweekInfo={gameweekInfo}
          isJoinDisabled={isJoinDisabled}
          minutesUntilFirstKickoff={minutesUntilFirstKickoff}
          handleJoinLeague={handleJoinLeague}
        />

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative backdrop-blur-sm rounded-xl border border-gray-800 bg-gray-900/50 shadow-xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-xl pointer-events-none"></div>

          <Tabs
            defaultValue="overview"
            value={activeTab}
            onValueChange={setActiveTab}
            className="relative z-10"
          >
            <div className="flex flex-col md:flex-row justify-between items-center p-4 border-b border-gray-800">
              <TabsList className="bg-gray-800/50 border border-gray-700">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=inactive]:text-gray-400"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="rules"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=inactive]:text-gray-400"
                >
                  Rules
                </TabsTrigger>
                <TabsTrigger
                  value="prizes"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=inactive]:text-gray-400"
                >
                  Prizes
                </TabsTrigger>
              </TabsList>

              {league.status === "upcoming" && !league.hasJoined && (
                <Button
                  className={`text-white bg-gradient-to-r ${isJoinDisabled
                    ? "from-gray-500 to-gray-600 cursor-not-allowed opacity-70"
                    : "from-orange-500 to-red-500 hover:from-indigo-600 hover:to-purple-600"
                    } border-0 shadow-lg hidden md:flex`}
                  onClick={handleJoinLeague}
                  disabled={isJoinDisabled}
                >
                  {isJoinDisabled ? "Joining Closed" : "Join League"}
                  {!isJoinDisabled && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              )}
            </div>

            <TabsContent value="overview" className="p-6">
              <LeagueOverviewTab
                league={league}
                prizePool={prizePool}
                isJoinDisabled={isJoinDisabled}
                minutesUntilFirstKickoff={minutesUntilFirstKickoff}
                leaderboard={leaderboard}
              />
            </TabsContent>

            <TabsContent value="rules" className="p-6">
              <RulesTab league={league} />
            </TabsContent>

            <TabsContent value="prizes" className="p-6">
              <PrizesTab
                league={league}
                prizePool={prizePool}
                isJoinDisabled={isJoinDisabled}
                minutesUntilFirstKickoff={minutesUntilFirstKickoff}
                handleJoinLeague={handleJoinLeague}
              />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
