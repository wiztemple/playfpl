"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import { Button } from "@/app/components/ui/button";
import {
  useLeague,
  useGameweekInfo,
  useLeaderboard,
  useLeagueJoinability,
} from "@/app/hooks/leagues";
import { useDeadlineCheck } from "@/app/hooks/leagues/useDeadlineCheck";
import Loading from "@/app/components/shared/Loading";
import LeagueHeader from "@/app/components/league-details/LeagueHeader";
import RulesTab from "@/app/components/league-details/RulesTab";
import PrizesTab from "@/app/components/league-details/PrizesTab";
import { ArrowRight, Trophy } from "lucide-react";
import LeagueOverviewTab from "@/app/components/league-details/LeagueOverviewTab";
import WinnersDialog from "@/app/components/leagues/WinnersDialog";

export default function LeagueDetailsPage() {
  const router = useRouter();
  const { id: leagueId } = useParams() as { id: string };
  const [activeTab, setActiveTab] = useState("overview");
  const [showWinners, setShowWinners] = useState(false);
  const [winners, setWinners] = useState([]);

  // Fetch league data
  const {
    data: league,
    isLoading: leagueLoading,
    error: leagueError,
    refetch: refetchLeague,
  } = useLeague(leagueId);

  // Fetch gameweek info
  const { data: gameweekInfo } = useGameweekInfo(league?.gameweek);

  // Check if deadline has passed and games are in progress
  const { isDeadlinePassed, gamesInProgress } = useDeadlineCheck(
    gameweekInfo?.deadline_time,
    gameweekInfo?.fixtures
  );

  // Check if joining is disabled
  const { isJoinDisabled, minutesUntilFirstKickoff } = useLeagueJoinability(
    league?.gameweek
  );

  // Determine the effective league status - if deadline has passed for an upcoming league, treat it as active
  const effectiveLeagueStatus =
    league?.status === "upcoming" && isDeadlinePassed
      ? "active"
      : league?.status;

  // Fetch leaderboard with our improved hook and the effective status
  const {
    data: leaderboard = [],
    refetch: refetchLeaderboard,
    isLoading: leaderboardLoading,
  } = useLeaderboard(leagueId, effectiveLeagueStatus);

  // Extract winners when leaderboard changes or when league is completed
  useEffect(() => {
    if (leaderboard.length > 0 && league?.status === "completed") {
      // Extract winners (those with winnings > 0)
      const extractedWinners = leaderboard
        .filter((entry: { winnings?: number }) => (entry.winnings || 0) > 0)
        .sort(
          (a: { rank?: number }, b: { rank?: number }) =>
            (a.rank || 0) - (b.rank || 0)
        );

      setWinners(extractedWinners);

      // Auto-show winners dialog if it's a completed league
      // and user hasn't seen it before in this session
      const hasSeenWinners = sessionStorage.getItem(`seen-winners-${leagueId}`);
      if (!hasSeenWinners && extractedWinners.length > 0) {
        setShowWinners(true);
        sessionStorage.setItem(`seen-winners-${leagueId}`, "true");
      }
    }
  }, [leaderboard, league?.status, leagueId]);

  // Force refetch when tab becomes active or when games are in progress
  useEffect(() => {
    // Refetch league data when deadline passes to get updated status from server
    if (isDeadlinePassed && league?.status === "upcoming") {
      refetchLeague();
    }

    // Refetch leaderboard when in overview tab and league is active or effectively active
    if (
      activeTab === "overview" &&
      (league?.status === "active" || effectiveLeagueStatus === "active")
    ) {
      console.log(
        `Forcing leaderboard refresh for ${effectiveLeagueStatus} league`
      );
      refetchLeaderboard();

      // Set up interval to refetch during games
      if (gamesInProgress) {
        const intervalId = setInterval(() => {
          console.log("Forcing leaderboard refresh during games");
          refetchLeaderboard();
        }, 60000); // Every minute

        return () => clearInterval(intervalId);
      }
    }
  }, [
    activeTab,
    league?.status,
    effectiveLeagueStatus,
    isDeadlinePassed,
    gamesInProgress,
    refetchLeaderboard,
    refetchLeague,
  ]);

  // // Calculate prize pool
  // const prizePool = league
  //   ? league.entryFee * league.currentParticipants * (1 - (league.platformFeePercentage || 5) / 100)
  //   : 0;
  // Calculate prize pool
  const prizePool =
    league && league.entryFee != null && league.currentParticipants != null // Check required values exist
      ? // --- FIX: Explicitly convert entryFee to number ---
        Number(league.entryFee) *
        league.currentParticipants *
        (1 - (league.platformFeePercentage || 10) / 100) // Use Number() for conversion
      : // --- END FIX ---
        0; // Default to 0 if league or necessary fields are missing

  // Handle joining a league
  const handleJoinLeague = () => {
    if (!leagueId || isJoinDisabled || isDeadlinePassed) return;
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
          <h1 className="text-2xl font-bold text-red-400 mb-4">
            League not found
          </h1>
          <Button onClick={() => router.push("/leagues/weekly")}>
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
          isJoinDisabled={isJoinDisabled || isDeadlinePassed}
          minutesUntilFirstKickoff={minutesUntilFirstKickoff}
          handleJoinLeague={handleJoinLeague}
          deadlinePassed={isDeadlinePassed}
        />

        {/* View Winners Button for completed leagues */}
        {league.status === "completed" && winners.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex justify-end mb-4"
          >
            <Button
              onClick={() => setShowWinners(true)}
              className="bg-gradient-to-r from-yellow-600 to-amber-500 hover:from-yellow-500 hover:to-amber-400 text-white"
            >
              <Trophy className="h-4 w-4 mr-2" />
              View Winners
            </Button>
          </motion.div>
        )}

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative backdrop-blur-sm rounded-xl border border-gray-800 bg-gray-900/50 shadow-xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-xl pointer-events-none"></div>

          {/* Show loading indicator when refreshing leaderboard during games */}
          {gamesInProgress &&
            leaderboardLoading &&
            activeTab === "overview" && (
              <div className="absolute top-2 right-2 z-20">
                <div className="flex items-center bg-indigo-900/50 text-indigo-200 text-xs px-2 py-1 rounded-full">
                  <Loading className="h-3 w-3 mr-1" />
                  <span>Updating scores...</span>
                </div>
              </div>
            )}

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
                  className={`text-white bg-gradient-to-r ${
                    isJoinDisabled
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
                // leaderboard={leaderboard}
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

        {/* Winners Dialog */}
        <WinnersDialog
          isOpen={showWinners}
          onClose={() => setShowWinners(false)}
          league={league}
          winners={winners}
        />
      </div>
    </div>
  );
}
