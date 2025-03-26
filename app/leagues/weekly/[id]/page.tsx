"use client";

// /app/leagues/weekly/[id]/page.tsx
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

export default function LeagueDetailsPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const [league, setLeague] = useState<WeeklyLeague | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const leagueId = params?.id
    ? Array.isArray(params.id)
      ? params.id[0]
      : params.id
    : "";

  useEffect(() => {
    const fetchLeague = async () => {
      if (!leagueId) {
        setError("League ID is missing");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/leagues/weekly/${leagueId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch league details");
        }

        const leagueData = await response.json();
        setLeague(leagueData);

        // Fetch participants or leaderboard based on league status
        if (
          leagueData.status === "active" ||
          leagueData.status === "completed"
        ) {
          fetchLeaderboard(leagueId);
        } else {
          // For upcoming leagues, fetch participants instead
          fetchParticipants(leagueId);
        }
      } catch (error) {
        console.error("Error fetching league:", error);
        setError("Failed to load league information. Please try again.");
      } finally {
        setLoading(false);
      }
    };

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
        setLeaderboard(data);
      } catch (error) {
        console.error("Error fetching participants:", error);
      }
    };

    fetchLeague();
  }, [leagueId]);

  const handleJoinLeague = () => {
    if (!leagueId) return;
    router.push(`/leagues/weekly/${leagueId}/join`);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <div className="p-4 text-red-500 text-center">
          <p>{error}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push("/leagues/weekly")}
          >
            Back to Leagues
          </Button>
        </div>
      </div>
    );
  }

  if (!league) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <div className="p-4 text-center">
          <p>League not found or no longer available.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push("/leagues/weekly")}
          >
            Back to Leagues
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <Link href="/leagues/weekly">
          <Button variant="ghost" className="pl-0">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to All Leagues
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="md:w-2/3">
          <h1 className="text-2xl font-bold mb-4">{league.name}</h1>
          <p className="text-gray-600 mb-6">
            Compete against other managers in this exciting one-week contest.
            Join now to test your FPL skills and win cash prizes based on your
            gameweek performance.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">Gameweek</div>
                <div className="font-medium">{league.gameweek}</div>
              </div>
            </div>
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">Status</div>
                <div className="font-medium capitalize">{league.status}</div>
              </div>
            </div>
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">Entry Fee</div>
                <div className="font-medium">
                  {formatCurrency(league.entryFee)}
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">Participants</div>
                <div className="font-medium">
                  {league.currentParticipants}/{league.maxParticipants}
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">Start Date</div>
                <div className="font-medium">
                  {formatDate(league.startDate)}
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">End Date</div>
                <div className="font-medium">{formatDate(league.endDate)}</div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-2">Rules</h2>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
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
          </div>
        </div>

        <div className="md:w-1/3">
          <Card>
            <CardHeader>
              <CardTitle>Prize Pool</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Calculate total prize pool */}
              {(() => {
                const totalEntries = league.currentParticipants;
                const totalPool = totalEntries * league.entryFee;
                const platformFee =
                  totalPool * (league.platformFeePercentage / 100);
                const prizePool = totalPool - platformFee;

                return (
                  <>
                    <div className="text-2xl font-bold mb-4">
                      {formatCurrency(prizePool)}
                    </div>

                    <div className="space-y-3">
                      {league.prizeDistribution.map((prize) => (
                        <div
                          key={prize.position}
                          className="flex justify-between items-center"
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
                            <span>
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
                          <div className="font-medium">
                            {formatCurrency(
                              prizePool * (prize.percentageShare / 100)
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}

              {league.status === "upcoming" && (
                <div className="mt-6">
                  {/* {league.hasJoined ? (
                    <div className="bg-green-50 p-4 rounded-md border border-green-100 flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <div>
                        <p className="font-medium text-green-700">
                          You've joined this league
                        </p>
                        <p className="text-sm text-green-600">
                          Your team is ready to compete when the gameweek begins
                        </p>
                      </div>
                    </div>
                  ) : (
                    <Button className="w-full" onClick={handleJoinLeague}>
                      Join League
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )} */}
                  {league.hasJoined ? (
                    <div className="bg-green-50 p-4 rounded-md border border-green-100 flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <div>
                        <p className="font-medium text-green-700">
                          You've joined this league
                        </p>
                        <p className="text-sm text-green-600">
                          {league.status === "upcoming"
                            ? "Your team is ready to compete when the gameweek begins"
                            : league.status === "active"
                            ? "Your team is currently competing in this league"
                            : "Your team participated in this league"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    league.status === "upcoming" && (
                      <Button className="w-full" onClick={handleJoinLeague}>
                        Join League
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="leaderboard">
        <TabsList>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left">Rank</th>
                      <th className="px-4 py-3 text-left">Manager</th>
                      <th className="px-4 py-3 text-left">Team</th>
                      {league.status === "upcoming" ? (
                        <th className="px-4 py-3 text-right">Joined</th>
                      ) : (
                        <>
                          <th className="px-4 py-3 text-right">
                            Starting Points
                          </th>
                          <th className="px-4 py-3 text-right">GW Points</th>
                          <th className="px-4 py-3 text-right">Final Points</th>
                          <th className="px-4 py-3 text-right">Winnings</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.length > 0 ? (
                      leaderboard.map((entry) => (
                        <tr
                          key={entry.userId}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="px-4 py-3">{entry.rank || "-"}</td>
                          <td className="px-4 py-3">{entry.userName}</td>
                          <td className="px-4 py-3">{entry.teamName}</td>
                          {league.status === "upcoming" ? (
                            <td className="px-4 py-3 text-right">
                              {entry.joinedAt
                                ? new Date(entry.joinedAt).toLocaleDateString()
                                : "-"}
                            </td>
                          ) : (
                            <>
                              <td className="px-4 py-3 text-right">
                                {entry.startPoints || "-"}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {entry.weeklyPoints || "-"}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {entry.finalPoints || "-"}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {formatCurrency(entry.winnings || 0)}
                              </td>
                            </>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={league.status === "upcoming" ? 4 : 7}
                          className="px-4 py-8 text-center text-gray-500"
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
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center h-40">
                <div className="text-center text-gray-500">
                  <BarChart3 className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                  <p>Statistics will be available when the league is active</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
