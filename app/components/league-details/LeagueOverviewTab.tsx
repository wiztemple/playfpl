"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/app/components/ui/card";
import {
  Calendar,
  Clock,
  Users,
  Trophy,
  Shield,
  Info,
  Banknote,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import PrizePoolCard from "./PrizePoolCard";
import LeaderboardCard from "./LeaderBoardCard"; // Ensure correct path/casing
import JoinWarning from "./JoinWarning";
import { useSession } from "next-auth/react";
import type { League } from "@/app/types"; // Import the specific League type

// --- Updated Props Interface (Removed leaderboard) ---
interface LeagueOverviewTabProps {
  league: League; // Use the specific League type instead of any
  prizePool: number;
  isJoinDisabled: boolean;
  minutesUntilFirstKickoff: number | null;
  // leaderboard: any[]; // REMOVED
}

export default function LeagueOverviewTab({
  league,
  prizePool,
  isJoinDisabled,
  minutesUntilFirstKickoff,
  // leaderboard, // REMOVED
}: LeagueOverviewTabProps) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  // Helper function for formatting dates (ensure it handles Date objects)
  const safeFormatDate = (dateInput: Date | string | undefined | null): string => {
    if (!dateInput) return "-";
     // If it's already a string, use it, otherwise assume Date and check validity
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (date instanceof Date && !isNaN(date.getTime())) {
        // Use the imported formatDate or implement inline
        // return formatDate(date); // If formatDate from utils handles Date object
        // OR implement inline:
         return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
    }
    console.warn("Invalid date passed to safeFormatDate:", dateInput);
    return "Invalid Date";
  };


  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <Card className="bg-gray-900/80 border border-gray-800 overflow-hidden backdrop-blur-sm shadow-lg h-full">
          <CardHeader>
            <CardTitle className="text-xl text-gray-100">League Details</CardTitle>
            <CardDescription className="text-gray-400">
              Compete against other managers in this exciting one-week contest.
              Join now to test your FPL skills and win cash prizes based on your
              gameweek performance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {[
                { icon: <Calendar className="h-5 w-5 mr-3 text-indigo-400" />, label: "Gameweek", value: league.gameweek },
                { icon: <Clock className="h-5 w-5 mr-3 text-purple-400" />, label: "Status", value: league.status, capitalize: true },
                { icon: <Banknote className="h-5 w-5 mr-3 text-pink-400" />, label: "Entry Fee", value: formatCurrency(league.entryFee) },
                { icon: <Users className="h-5 w-5 mr-3 text-cyan-400" />, label: "Participants", value: `${league.currentParticipants}/${league.maxParticipants}` },
                // Use the safe date formatter
                { icon: <Calendar className="h-5 w-5 mr-3 text-emerald-400" />, label: "Start Date", value: safeFormatDate(league.startDate) },
                { icon: <Calendar className="h-5 w-5 mr-3 text-amber-400" />, label: "End Date", value: safeFormatDate(league.endDate) },
                { icon: <Trophy className="h-5 w-5 mr-3 text-yellow-400" />, label: "Prize Pool", value: formatCurrency(prizePool) },
                { icon: <Shield className="h-5 w-5 mr-3 text-blue-400" />, label: "Platform Fee", value: `${league.platformFeePercentage}%` }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="flex items-center p-4 rounded-lg bg-gray-800/30 border border-gray-800 backdrop-blur-sm"
                  whileHover={{
                    boxShadow: "0 0 15px 0 rgba(79, 70, 229, 0.2)",
                    borderColor: "rgba(99, 102, 241, 0.4)",
                    transition: { duration: 0.2 }
                  }}
                >
                  {item.icon}
                  <div>
                    <div className="text-sm text-gray-500">{item.label}</div>
                    <div className={`font-medium text-gray-200 ${item.capitalize ? 'capitalize' : ''}`}>{item.value}</div> {/* Added text-gray-200 */}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* League description */}
            <div className="mt-6 p-4 rounded-lg bg-gray-800/30 border border-gray-800">
              <h3 className="text-lg font-medium mb-2 flex items-center text-gray-100"> {/* Added text-gray-100 */}
                <Info className="h-5 w-5 mr-2 text-indigo-400" />
                About This League
              </h3>
              <p className="text-gray-400">
                {/* Use safe date formatter */}
                This is a weekly league for Gameweek {league.gameweek}. Compete against other FPL managers and win cash prizes based on your performance.
                The league starts on {safeFormatDate(league.startDate)} and ends on {safeFormatDate(league.endDate)}.
              </p>

              {league.status === "upcoming" && (
                <JoinWarning
                  isJoinDisabled={isJoinDisabled}
                  minutesUntilFirstKickoff={minutesUntilFirstKickoff}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PrizePoolCard usage remains the same */}
      <PrizePoolCard
        league={league}
        prizePool={prizePool}
        isJoinDisabled={isJoinDisabled}
        minutesUntilFirstKickoff={minutesUntilFirstKickoff}
        handleJoinLeague={() => { }} // Placeholder - Ensure parent passes actual handler
      />

      {/* --- LeaderboardCard usage updated --- */}
      <LeaderboardCard
        league={league} // Pass the league object
        // leaderboard={leaderboard} // REMOVED this prop
        currentUserId={currentUserId} // Pass the user ID
        // Optionally add pageSize or refreshInterval if needed
        // pageSize={15}
        // refreshInterval={300000} // 5 minutes
        // Optionally pass initialData if using SSR/ISR for the first page
        // initialData={/* { leaderboard: ..., meta: ... } */}
      />
    </div>
  );
}