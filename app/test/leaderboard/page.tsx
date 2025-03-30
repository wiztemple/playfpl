"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import LeagueHeader from "@/app/components/league-details/LeagueHeader";
import LeagueOverviewTab from "@/app/components/league-details/LeagueOverviewTab";
import RulesTab from "@/app/components/league-details/RulesTab";
import PrizesTab from "@/app/components/league-details/PrizesTab";

export default function TestLeaderboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const searchParams = useSearchParams();
  
  // Get status from URL or default to "active"
  const status = searchParams.get("status") || "active";
  console.log("URL status parameter:", status);
  const userPosition = parseInt(searchParams.get("userPosition") || "3");
  const leagueType = searchParams.get("leagueType") || "standard"; // Add leagueType parameter

  // Mock league data with status from URL
  const mockLeague = {
    id: "test-league-id",
    name: "Test Premier League",
    description: "A test league for visualization purposes",
    gameweek: 10,
    entryFee: 1000,
    maxParticipants: 100,
    currentParticipants: 75,
    status: status, // Use status from URL
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    hasJoined: false,
    platformFeePercentage: 5,
    leagueType: leagueType, // Add league type property
    prizeDistribution: [
      { position: 1, percentageShare: 50 },
      { position: 2, percentageShare: 30 },
      { position: 3, percentageShare: 15 },
      { position: 4, percentageShare: 5 }
    ]
  };

  // Mock gameweek info
  const mockGameweekInfo = {
    id: 10,
    name: "Gameweek 10",
    deadline_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    finished: false,
    is_current: true,
    is_next: false,
    fixtures: [
      { id: 1, kickoff_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() }
    ]
  };

  // Generate mock leaderboard with proper ranking
  // Generate mock leaderboard with fixed data instead of random
  const generateMockLeaderboard = () => {
    console.log("Generating leaderboard with status:", status);
    
    // Fixed test data with predictable GW points and total points
    const fixedEntries = [
      {
        id: "entry-1",
        userId: "user-1",
        userName: "Manager One",
        userImage: null,
        teamName: "Team One",
        fplTeamId: 1000001,
        joinedAt: new Date().toISOString(),
        weeklyPoints: 68, // Highest GW points
        finalPoints: 1650,
      },
      {
        id: "entry-2",
        userId: "user-2",
        userName: "Manager Two",
        userImage: null,
        teamName: "Team Two",
        fplTeamId: 1000002,
        joinedAt: new Date().toISOString(),
        weeklyPoints: 52,
        finalPoints: 1750, // Highest total points
      },
      {
        id: "entry-3",
        userId: "user-3",
        userName: "Manager Three",
        userImage: null,
        teamName: "Team Three",
        fplTeamId: 1000003,
        joinedAt: new Date().toISOString(),
        weeklyPoints: 45,
        finalPoints: 1700,
      },
      {
        id: "entry-4",
        userId: "user-4",
        userName: "Manager Four",
        userImage: null,
        teamName: "Team Four",
        fplTeamId: 1000004,
        joinedAt: new Date().toISOString(),
        weeklyPoints: 61,
        finalPoints: 1600,
      },
      {
        id: "entry-5",
        userId: "user-5",
        userName: "Manager Five",
        userImage: null,
        teamName: "Team Five",
        fplTeamId: 1000005,
        joinedAt: new Date().toISOString(),
        weeklyPoints: 36,
        finalPoints: 1550,
      },
      {
        id: "entry-6",
        userId: "user-6",
        userName: "Manager Six",
        userImage: null,
        teamName: "Team Six",
        fplTeamId: 1000006,
        joinedAt: new Date().toISOString(),
        weeklyPoints: 59,
        finalPoints: 1500,
      },
      {
        id: "entry-7",
        userId: "user-7",
        userName: "Manager Seven",
        userImage: null,
        teamName: "Team Seven",
        fplTeamId: 1000007,
        joinedAt: new Date().toISOString(),
        weeklyPoints: 42,
        finalPoints: 1620,
      },
      {
        id: "entry-8",
        userId: "user-8",
        userName: "Manager Eight",
        userImage: null,
        teamName: "Team Eight",
        fplTeamId: 1000008,
        joinedAt: new Date().toISOString(),
        weeklyPoints: 50,
        finalPoints: 1580,
      },
      {
        id: "entry-9",
        userId: "user-9",
        userName: "Manager Nine",
        userImage: null,
        teamName: "Team Nine",
        fplTeamId: 1000009,
        joinedAt: new Date().toISOString(),
        weeklyPoints: 55,
        finalPoints: 1530,
      },
      {
        id: "entry-10",
        userId: "user-10",
        userName: "Manager Ten",
        userImage: null,
        teamName: "Team Ten",
        fplTeamId: 1000010,
        joinedAt: new Date().toISOString(),
        weeklyPoints: 48,
        finalPoints: 1510,
      },
    ];
    
    // Mark the current user
    const currentUserEntry = fixedEntries.find(entry => entry.id === `entry-${userPosition}`);
    if (currentUserEntry) {
      // Use type assertion to add properties
      (currentUserEntry as any).isCurrentUser = true;
      (currentUserEntry as any).is_current_user = true;
      (currentUserEntry as any).current_user = true;
    }
    
    // Add display fields to all entries
    const entriesWithDisplayFields = fixedEntries.map(entry => ({
      ...entry,
      // Points data
      gwPoints: entry.weeklyPoints,
      event_total: entry.weeklyPoints,
      points: entry.finalPoints,
      total: entry.finalPoints,
      
      // Display names
      player_name: entry.userName,
      managerName: entry.userName,
      manager_name: entry.userName,
      name: entry.userName,
      displayName: entry.userName,
      display_name: entry.userName,
      
      // Team names
      team_name: entry.teamName,
      entry_name: entry.teamName,
      
      // Initialize user flags properly
      isCurrentUser: (entry as any).isCurrentUser || false,
      is_current_user: (entry as any).is_current_user || false,
      current_user: (entry as any).current_user || false,
    }));
    
    // Sort by GW points for active leagues
    let sortedEntries;
    if (status === 'active') {
      // For active leagues, sort by GW points first
      sortedEntries = [...entriesWithDisplayFields].sort((a, b) => {
        // Debug the sort function
        console.log(`Comparing ${a.userName} (${a.weeklyPoints}) with ${b.userName} (${b.weeklyPoints})`);
        return b.weeklyPoints - a.weeklyPoints;
      });
      
      // Log the sorted entries to verify
      console.log("Sorted entries by GW points:", sortedEntries.map(e => `${e.userName}: ${e.weeklyPoints}`));
      
      // Assign ranks based on GW points for active leagues
      sortedEntries = sortedEntries.map((entry, index) => ({
        ...entry,
        rank: index + 1,
        position: index + 1,
      }));
      
      // Mark the GW winner (highest GW points)
      const highestGwPoints = Math.max(...sortedEntries.map(entry => entry.weeklyPoints));
      sortedEntries.forEach(entry => {
        entry.isGwWinner = entry.weeklyPoints === highestGwPoints;
        entry.is_gw_winner = entry.weeklyPoints === highestGwPoints;
        entry.gw_winner = entry.weeklyPoints === highestGwPoints;
      });
    } else if (status === 'completed') {
      // For completed leagues, also sort by GW points first (changed from finalPoints)
      sortedEntries = [...entriesWithDisplayFields].sort((a, b) => b.weeklyPoints - a.weeklyPoints);
      
      // Assign ranks based on GW points for completed leagues
      sortedEntries = sortedEntries.map((entry, index) => ({
        ...entry,
        rank: index + 1,
        position: index + 1,
      }));
      
      // Mark the GW winner for completed leagues too
      const highestGwPoints = Math.max(...sortedEntries.map(entry => entry.weeklyPoints));
      sortedEntries.forEach(entry => {
        entry.isGwWinner = entry.weeklyPoints === highestGwPoints;
        entry.is_gw_winner = entry.weeklyPoints === highestGwPoints;
        entry.gw_winner = entry.weeklyPoints === highestGwPoints;
      });
    } else {
      // For upcoming leagues, use as is
      sortedEntries = [...entriesWithDisplayFields];
    }
    
    // Process each entry for final display
    return sortedEntries.map((entry, index) => {
      // Calculate starting points
      const startingPoints = entry.finalPoints - entry.weeklyPoints;
      
      // Calculate winnings for top 4
      const winnings = entry.rank <= 4 
        ? mockLeague.entryFee * mockLeague.currentParticipants * 
          (1 - mockLeague.platformFeePercentage / 100) * 
          (mockLeague.prizeDistribution[entry.rank-1].percentageShare / 100) 
        : 0;
      
      return {
        ...entry,
        // Make sure starting points are defined
        startingPoints: startingPoints,
        starting_points: startingPoints,
        
        // Set winnings
        winnings: winnings,
        
        // Highlighting
        isHighlighted: entry.isCurrentUser,
        highlighted: entry.isCurrentUser,
        is_highlighted: entry.isCurrentUser,
      };
    });
  };

  const mockLeaderboard = generateMockLeaderboard();
  
  // Add debugging to verify the leaderboard is sorted correctly
  console.log("Status:", status);
  console.log("First entry:", mockLeaderboard[0]);
  console.log("First entry GW points:", mockLeaderboard[0].weeklyPoints);
  console.log("First entry rank:", mockLeaderboard[0].rank);
  
  // Calculate prize pool with platform fee deducted
  const totalPool = mockLeague.entryFee * mockLeague.currentParticipants;
  const prizePool = totalPool * (1 - mockLeague.platformFeePercentage / 100);
  
  // Mock functions
  const handleJoinLeague = () => {
    alert("Join league button clicked");
  };

  // Determine if joining is disabled based on league status
  const isJoinDisabled = status === "active" || status === "completed";
  const minutesUntilFirstKickoff = 120;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="container mx-auto py-12 px-4 max-w-6xl">
        <h1 className="text-2xl font-bold mb-8 text-center">Leaderboard Test Page</h1>
        
        <div className="mb-8 space-y-4">
          <div className="flex flex-wrap gap-4 justify-center">
            <button 
              onClick={() => {
                window.location.href = `/test/leaderboard?status=upcoming`;
              }}
              className={`px-4 py-2 rounded ${status === "upcoming" ? "bg-blue-800" : "bg-blue-600"}`}
            >
              Test Upcoming
            </button>
            <button 
              onClick={() => {
                // Force a full page reload to ensure the URL parameter is picked up
                window.location.href = `/test/leaderboard?status=active`;
              }}
              className={`px-4 py-2 rounded ${status === "active" ? "bg-green-800" : "bg-green-600"}`}
            >
              Test Active
            </button>
            <button 
              onClick={() => {
                window.location.href = `/test/leaderboard?status=completed`;
              }}
              className={`px-4 py-2 rounded ${status === "completed" ? "bg-purple-800" : "bg-purple-600"}`}
            >
              Test Completed
            </button>
            
            <div className="w-full mt-2"></div>
            
            <button 
              onClick={() => {
                window.location.href = `/test/leaderboard?status=${status}&leagueType=standard`;
              }}
              className={`px-4 py-2 rounded ${leagueType === "standard" ? "bg-indigo-800" : "bg-indigo-600"}`}
            >
              Standard (Top 4)
            </button>
            <button 
              onClick={() => {
                window.location.href = `/test/leaderboard?status=${status}&leagueType=tri`;
              }}
              className={`px-4 py-2 rounded ${leagueType === "tri" ? "bg-indigo-800" : "bg-indigo-600"}`}
            >
              Tri (Top 3)
            </button>
            <button 
              onClick={() => {
                window.location.href = `/test/leaderboard?status=${status}&leagueType=duo`;
              }}
              className={`px-4 py-2 rounded ${leagueType === "duo" ? "bg-indigo-800" : "bg-indigo-600"}`}
            >
              Duo (Top 2)
            </button>
            <button 
              onClick={() => {
                window.location.href = `/test/leaderboard?status=${status}&leagueType=jackpot`;
              }}
              className={`px-4 py-2 rounded ${leagueType === "jackpot" ? "bg-indigo-800" : "bg-indigo-600"}`}
            >
              Jackpot (Winner Only)
            </button>
            
            <div className="w-full mt-2"></div>
            
            <button 
              onClick={() => {
                window.location.href = `/test/leaderboard?status=${status}&userPosition=1`;
              }}
              className="px-4 py-2 bg-yellow-600 rounded"
            >
              User in 1st
            </button>
            <button 
              onClick={() => {
                window.location.href = `/test/leaderboard?status=${status}&userPosition=2`;
              }}
              className="px-4 py-2 bg-yellow-600 rounded"
            >
              User in 2nd
            </button>
            <button 
              onClick={() => {
                window.location.href = `/test/leaderboard?status=${status}&userPosition=10`;
              }}
              className="px-4 py-2 bg-yellow-600 rounded"
            >
              User in 10th
            </button>
          </div>
          
          <div className="text-center text-sm bg-gray-800 p-2 rounded">
            <p>Current Status: <span className="font-bold text-indigo-400 capitalize">{status}</span> | 
               League Type: <span className="font-bold text-purple-400 capitalize">{leagueType}</span> | 
               User Position: <span className="font-bold text-yellow-400">{userPosition}</span> | 
               Prize Pool: <span className="font-bold text-green-400">${prizePool.toFixed(2)}</span>
            </p>
          </div>
        </div>
        
        {/* League Header */}
        <LeagueHeader
          league={mockLeague}
          gameweekInfo={mockGameweekInfo}
          isJoinDisabled={isJoinDisabled}
          minutesUntilFirstKickoff={minutesUntilFirstKickoff}
          handleJoinLeague={handleJoinLeague}
        />

        {/* Main Content */}
        <div className="relative backdrop-blur-sm rounded-xl border border-gray-800 bg-gray-900/50 shadow-xl overflow-hidden mt-8">
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
            </div>

            <TabsContent value="overview" className="p-6">
              <LeagueOverviewTab
                league={mockLeague}
                prizePool={prizePool}
                isJoinDisabled={isJoinDisabled}
                minutesUntilFirstKickoff={minutesUntilFirstKickoff}
                leaderboard={mockLeaderboard}
              />
            </TabsContent>

            <TabsContent value="rules" className="p-6">
              <RulesTab league={mockLeague} />
            </TabsContent>

            <TabsContent value="prizes" className="p-6">
              <PrizesTab
                league={mockLeague}
                prizePool={prizePool}
                isJoinDisabled={isJoinDisabled}
                minutesUntilFirstKickoff={minutesUntilFirstKickoff}
                handleJoinLeague={handleJoinLeague}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}