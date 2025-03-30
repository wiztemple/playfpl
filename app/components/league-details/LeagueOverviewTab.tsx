"use client";

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
  DollarSign,
  Users,
  Trophy,
  Shield,
  Info,
  AlertTriangle,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import PrizePoolCard from "./PrizePoolCard";
import LeaderboardCard from "./LeaderBoardCard";
import JoinWarning from "./JoinWarning";

interface LeagueOverviewTabProps {
  league: any;
  prizePool: number;
  isJoinDisabled: boolean;
  minutesUntilFirstKickoff: number | null;
  leaderboard: any[];
}

export default function LeagueOverviewTab({
  league,
  prizePool,
  isJoinDisabled,
  minutesUntilFirstKickoff,
  leaderboard,
}: LeagueOverviewTabProps) {
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
                { icon: <DollarSign className="h-5 w-5 mr-3 text-pink-400" />, label: "Entry Fee", value: formatCurrency(league.entryFee) },
                { icon: <Users className="h-5 w-5 mr-3 text-cyan-400" />, label: "Participants", value: `${league.currentParticipants}/${league.maxParticipants}` },
                { icon: <Calendar className="h-5 w-5 mr-3 text-emerald-400" />, label: "Start Date", value: formatDate(league.startDate) },
                { icon: <Calendar className="h-5 w-5 mr-3 text-amber-400" />, label: "End Date", value: formatDate(league.endDate) },
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
                    <div className={`font-medium ${item.capitalize ? 'capitalize' : ''}`}>{item.value}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* League description */}
            <div className="mt-6 p-4 rounded-lg bg-gray-800/30 border border-gray-800">
              <h3 className="text-lg font-medium mb-2 flex items-center">
                <Info className="h-5 w-5 mr-2 text-indigo-400" />
                About This League
              </h3>
              <p className="text-gray-400">
                This is a weekly league for Gameweek {league.gameweek}. Compete against other FPL managers and win cash prizes based on your performance.
                The league starts on {formatDate(league.startDate)} and ends on {formatDate(league.endDate)}.
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

      <PrizePoolCard
        league={league} 
        prizePool={prizePool} 
        isJoinDisabled={isJoinDisabled}
        minutesUntilFirstKickoff={minutesUntilFirstKickoff}
        handleJoinLeague={() => {}}  // This will be passed from parent
      />

      <LeaderboardCard
        league={league} 
        leaderboard={leaderboard} 
      />
    </div>
  );
}