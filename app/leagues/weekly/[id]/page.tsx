"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ChevronLeft,
  Trophy,
  Clock,
  DollarSign,
  Calendar,
  Users,
  CheckCircle,
  BarChart3,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import Loading from "@/app/components/shared/Loading";
import { formatCurrency, formatDate } from "@/lib/utils";
import { WeeklyLeague } from "@/app/types";
import CountdownTimer from "@/app/components/CountdownTimer";
import { getGameweekInfo } from "@/lib/fpl-api";
import { motion } from "framer-motion";

export default function LeagueDetailsPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const [league, setLeague] = useState<WeeklyLeague | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameweekInfo, setGameweekInfo] = useState<any>(null);
  const leagueId = params?.id
    ? Array.isArray(params.id)
      ? params.id[0]
      : params.id
    : "";

  useEffect(() => {
    const fetchLeaderboard = async (id: string) => {
      try {
        const response = await fetch(`/api/leagues/weekly/${id}/leaderboard`);
        if (!response.ok) {
          throw new Error("Failed to fetch leaderboard");
        }
        const data = await response.json();
        setLeaderboard(data);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      }
    };

    const fetchParticipants = async (id: string) => {
      try {
        const response = await fetch(`/api/leagues/weekly/${id}/participants`);
        if (!response.ok) {
          throw new Error("Failed to fetch participants");
        }
        const data = await response.json();
        setLeaderboard(data.participants);
        setLeague(prev => prev ? { ...prev, hasJoined: data.hasJoined } : null);
      } catch (error) {
        console.error("Error fetching participants:", error);
      }
    };

    const fetchLeague = async () => {
      if (!leagueId) {
        setError("League ID is missing");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch league data
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/leagues/weekly/${leagueId}?_=${timestamp}`);

        if (!response.ok) {
          throw new Error("Failed to fetch league details");
        }

        const leagueData = await response.json();

        // Fetch gameweek info through our API endpoint
        const gwResponse = await fetch(`/api/gameweek/${leagueData.gameweek}`);
        if (!gwResponse.ok) {
          throw new Error("Failed to fetch gameweek info");
        }
        const gwInfo = await gwResponse.json();
        setGameweekInfo(gwInfo);

        // Set league data and handle participants
        setLeague(leagueData);
        
        if (leagueData.status === "active" || leagueData.status === "completed") {
          fetchLeaderboard(leagueId);
        } else {
          fetchParticipants(leagueId);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load league information. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchLeague();
  }, [leagueId]);

  const handleJoinLeague = () => {
    if (!leagueId) return;
    sessionStorage.setItem("joiningLeague", leagueId);
    router.push(`/leagues/weekly/${leagueId}/join`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <div className="container mx-auto py-12 px-4 max-w-5xl flex justify-center items-center min-h-[60vh]">
          <Loading className="text-indigo-400" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <div className="container mx-auto py-12 px-4 max-w-5xl">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6 rounded-xl border border-red-800 bg-gray-900/50 backdrop-blur-sm text-center"
          >
            <p className="text-red-400 mb-4">{error}</p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-indigo-400"
                onClick={() => router.push("/leagues/weekly")}
              >
                Back to Leagues
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  // League not found state
  if (!league) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <div className="container mx-auto py-12 px-4 max-w-5xl">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6 rounded-xl border border-gray-800 bg-gray-900/50 backdrop-blur-sm text-center"
          >
            <p className="text-gray-400 mb-4">League not found or no longer available.</p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-indigo-400"
                onClick={() => router.push("/leagues/weekly")}
              >
                Back to Leagues
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="container mx-auto py-12 px-4 max-w-5xl">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <Link href="/leagues/weekly">
            <Button variant="ghost" className="pl-0 text-gray-400 hover:text-indigo-400 hover:bg-transparent">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to All Leagues
            </Button>
          </Link>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-col md:flex-row gap-8 mb-10"
        >
          <div className="md:w-2/3">
            <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              {league.name}
            </h1>
            <p className="text-gray-400 mb-8">
              Compete against other managers in this exciting one-week contest.
              Join now to test your FPL skills and win cash prizes based on your
              gameweek performance.
            </p>

            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {[
                { icon: <Calendar className="h-5 w-5 mr-3 text-indigo-400" />, label: "Gameweek", value: league.gameweek },
                { icon: <Clock className="h-5 w-5 mr-3 text-purple-400" />, label: "Status", value: league.status, capitalize: true },
                { icon: <DollarSign className="h-5 w-5 mr-3 text-pink-400" />, label: "Entry Fee", value: formatCurrency(league.entryFee) },
                { icon: <Users className="h-5 w-5 mr-3 text-cyan-400" />, label: "Participants", value: `${league.currentParticipants}/${league.maxParticipants}` },
                { icon: <Calendar className="h-5 w-5 mr-3 text-emerald-400" />, label: "Start Date", value: formatDate(league.startDate) },
                { icon: <Calendar className="h-5 w-5 mr-3 text-amber-400" />, label: "End Date", value: formatDate(league.endDate) }
              ].map((item, index) => (
                <motion.div 
                  key={index}
                  className="flex items-center p-4 rounded-lg bg-gray-900/50 border border-gray-800 backdrop-blur-sm"
                  whileHover={{ 
                    boxShadow: "0 0 15px 0 rgba(79, 70, 229, 0.2)",
                    borderColor: "rgba(99, 102, 241, 0.4)",
                    transition: { duration: 0.2 }
                  }}
                >
                  {item.icon}
                  <div>
                    <div className="text-sm text-gray-500">{item.label}</div>
                    <div className={`font-medium ${item.capitalize ? 'capitalize' : ''}`}>{item.value}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {league.status === "upcoming" && (
              <motion.div 
                className="mb-8 space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700 p-5 rounded-lg backdrop-blur-sm">
                  <h2 className="text-lg font-semibold mb-3 flex items-center">
                    <Sparkles className="h-4 w-4 mr-2 text-indigo-400" />
                    <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                      Gameweek Starts In
                    </span>
                  </h2>
                  <CountdownTimer targetDate={league.startDate} />
                </div>

                {gameweekInfo && (
                  <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700 p-5 rounded-lg backdrop-blur-sm">
                    <h2 className="text-lg font-semibold mb-3 flex items-center">
                      <Sparkles className="h-4 w-4 mr-2 text-purple-400" />
                      <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Gameweek Deadline
                      </span>
                    </h2>
                    <CountdownTimer targetDate={gameweekInfo.deadline_time} />
                  </div>
                )}
              </motion.div>
            )}

            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700 p-5 rounded-lg backdrop-blur-sm">
                <h2 className="text-lg font-semibold mb-3 flex items-center">
                  <Sparkles className="h-4 w-4 mr-2 text-cyan-400" />
                  <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    Rules
                  </span>
                </h2>
                <ul className="list-disc pl-5 space-y-2 text-gray-400">
                  <li>Entry is open until the gameweek deadline</li>
                  <li>
                    Points are calculated based on your team's performance in
                    Gameweek {league.gameweek}
                  </li>
                  <li>
                    Prizes are distributed within 24 hours of gameweek completion
                  </li>
                  <li>
                    Platform fee of {league.platformFeePercentage}% is applied to
                    the total prize pool
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>

          <motion.div 
            className="md:w-1/3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-gray-900 border border-gray-800 overflow-hidden backdrop-blur-sm relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-xl pointer-events-none"></div>
              
              <CardHeader className="relative z-10 border-b border-gray-800">
                <CardTitle className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Prize Pool
                </CardTitle>
              </CardHeader>
              
              <CardContent className="relative z-10 pt-6">
                {/* Calculate total prize pool */}
                {(() => {
                  const totalEntries = league.currentParticipants;
                  const totalPool = totalEntries * league.entryFee;
                  const platformFee =
                    totalPool * (league.platformFeePercentage / 100);
                  const prizePool = totalPool - platformFee;

                  return (
                    <>
                      <div className="text-3xl font-bold mb-6 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                        {formatCurrency(prizePool)}
                      </div>

                      <div className="space-y-4">
                        {league.prizeDistribution.map((prize, index) => (
                          <motion.div
                            key={prize.position}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 * index }}
                            className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-800"
                            whileHover={{ 
                              scale: 1.02,
                              boxShadow: "0 0 10px 0 rgba(79, 70, 229, 0.2)",
                              borderColor: "rgba(99, 102, 241, 0.4)",
                              transition: { duration: 0.2 }
                            }}
                          >
                            <div className="flex items-center">
                              <Trophy
                                className={`h-5 w-5 mr-2 ${
                                  prize.position === 1
                                    ? "text-yellow-500"
                                    : prize.position === 2
                                    ? "text-gray-400"
                                    : prize.position === 3
                                    ? "text-amber-700"
                                    : "text-gray-500"
                                }`}
                              />
                              <span className="text-gray-300">
                                {prize.position}
                                {prize.position === 1
                                  ? "st"
                                  : prize.position === 2
                                  ? "nd"
                                  : prize.position === 3
                                  ? "rd"
                                  : "th"}{" "}
                                Place
                              </span>
                            </div>
                            <div className="font-medium bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                              {formatCurrency(
                                prizePool * (prize.percentageShare / 100)
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </>
                  );
                })()}

                {league.status === "upcoming" && (
                  <div className="mt-8">
                    {league.hasJoined ? (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 p-4 rounded-lg border border-green-800/50 flex items-center"
                      >
                        <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                        <div>
                          <p className="font-medium text-green-400">
                            You've joined this league
                          </p>
                          <p className="text-sm text-green-500/80">
                            {league.status === "upcoming"
                              ? "Your team is ready to compete when the gameweek begins"
                              : league.status === "active"
                              ? "Your team is currently competing in this league"
                              : "Your team participated in this league"}
                          </p>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button 
                          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-0 shadow-lg" 
                          onClick={handleJoinLeague}
                        >
                          Join League
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </motion.div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="relative backdrop-blur-sm rounded-xl border border-gray-800 p-6 bg-gray-900/50 shadow-xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-xl pointer-events-none"></div>
          
          <Tabs defaultValue="leaderboard" className="relative z-10">
            <TabsList className="mb-6 bg-gray-800/50 border border-gray-700">
              <TabsTrigger 
                value="leaderboard" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=inactive]:text-gray-400"
              >
                Leaderboard
              </TabsTrigger>
              <TabsTrigger 
                value="stats"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=inactive]:text-gray-400"
              >
                Stats
              </TabsTrigger>
            </TabsList>

            <TabsContent value="leaderboard">
              <Card className="bg-gray-900 border border-gray-800 overflow-hidden backdrop-blur-sm">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-800 bg-gray-900/80">
                          <th className="px-4 py-3 text-left text-gray-400">Rank</th>
                          <th className="px-4 py-3 text-left text-gray-400">Manager</th>
                          <th className="px-4 py-3 text-left text-gray-400">Team</th>
                          {league.status === "upcoming" ? (
                            <th className="px-4 py-3 text-right text-gray-400">Joined</th>
                          ) : (
                            <>
                              <th className="px-4 py-3 text-right text-gray-400">
                                Starting Points
                              </th>
                              <th className="px-4 py-3 text-right text-gray-400">GW Points</th>
                              <th className="px-4 py-3 text-right text-gray-400">Final Points</th>
                              <th className="px-4 py-3 text-right text-gray-400">Winnings</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard.length > 0 ? (
                          leaderboard.map((entry, index) => (
                            <motion.tr
                              key={entry.userId}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: 0.05 * index }}
                              className="border-b border-gray-800 hover:bg-gray-800/30"
                            >
                              <td className="px-4 py-3 text-gray-300">{entry.rank || "-"}</td>
                              <td className="px-4 py-3 text-gray-300">{entry.userName}</td>
                              <td className="px-4 py-3 text-gray-300">{entry.teamName}</td>
                              {league.status === "upcoming" ? (
                                <td className="px-4 py-3 text-right text-gray-300">
                                  {entry.joinedAt
                                    ? new Date(entry.joinedAt).toLocaleDateString()
                                    : "-"}
                                </td>
                              ) : (
                                <>
                                  <td className="px-4 py-3 text-right text-gray-300">
                                    {entry.startPoints || "-"}
                                  </td>
                                  <td className="px-4 py-3 text-right text-gray-300">
                                    {entry.weeklyPoints || "-"}
                                  </td>
                                  <td className="px-4 py-3 text-right text-gray-300">
                                    {entry.finalPoints || "-"}
                                  </td>
                                  <td className="px-4 py-3 text-right bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent font-medium">
                                    {formatCurrency(entry.winnings || 0)}
                                  </td>
                                </>
                              )}
                            </motion.tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={league.status === "upcoming" ? 4 : 7}
                              className="px-4 py-12 text-center text-gray-500"
                            >
                              {league.status === "upcoming"
                                ? "No one has joined this league yet"
                                : "No participants yet"}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stats">
              <Card className="bg-gray-900 border border-gray-800 overflow-hidden backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center h-40">
                    <div className="text-center text-gray-500">
                      <BarChart3 className="h-10 w-10 mx-auto mb-2 text-gray-600" />
                      <p>Statistics will be available when the league is active</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
