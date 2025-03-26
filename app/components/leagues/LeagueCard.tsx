"use client";

import React, { useState } from "react";
import {
  Calendar,
  DollarSign,
  Users,
  Award,
  Clock,
  ArrowRight,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  formatDate,
  calculateTimeRemaining,
  formatCurrency,
} from "@/lib/utils";
import { WeeklyLeague } from "@/app/types";
import CountdownTimer from "../CountdownTimer";
import { motion } from "framer-motion";

interface LeagueCardProps {
  league: WeeklyLeague;
  onJoin: () => void;
  onView: () => void;
  mode: "available" | "joined";
}

export default function LeagueCard({
  league,
  onJoin,
  onView,
  mode,
}: LeagueCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Simple function to calculate prize pool without complex logic
  const calculatePrizePool = () => {
    const totalEntries = league.currentParticipants;
    const totalPool = totalEntries * league.entryFee;
    const platformFee = totalPool * (league.platformFeePercentage / 100);
    return totalPool - platformFee;
  };

  const prizePool = calculatePrizePool();
  const isJoinable =
    mode === "available" &&
    league.status === "upcoming" &&
    !league.hasJoined &&
    league.currentParticipants < league.maxParticipants;

  const getStatusColors = () => {
    switch (league.status) {
      case "upcoming":
        return "from-indigo-500 to-purple-500";
      case "active":
        return "from-indigo-500 to-blue-500";
      case "completed":
        return "from-gray-600 to-slate-600";
      default:
        return "from-red-500 to-rose-500";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="transition-all duration-300"
    >
      <Card className="bg-gray-900 border border-gray-800 overflow-hidden backdrop-blur-sm relative transition-all duration-300 hover:border-gray-700 hover:shadow-md">
        {/* Glassmorphism effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-[2px] pointer-events-none"></div>
        
        <CardHeader className="pb-2 relative z-10">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              {league.name}
            </CardTitle>
            <div
              className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getStatusColors()} text-white shadow-lg`}
            >
              {league.status.charAt(0).toUpperCase() + league.status.slice(1)}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pb-2 relative z-10">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-indigo-400" />
              <span className="text-sm text-gray-300">
                Gameweek {league.gameweek}
              </span>
            </div>
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-purple-400" />
              <span className="text-sm text-gray-300">
                Entry: {formatCurrency(league.entryFee)}
              </span>
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2 text-pink-400" />
              <span className="text-sm text-gray-300">
                {league.currentParticipants}/{league.maxParticipants} Players
              </span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-cyan-400" />
              <span className="text-sm text-gray-300">
                {league.status === "upcoming"
                  ? `Starts: ${new Date(league.startDate).toLocaleDateString()}`
                  : `Ends: ${new Date(league.endDate).toLocaleDateString()}`}
              </span>
            </div>
          </div>

          {league.status === "upcoming" && (
            <div className="space-y-3 mb-4">
              <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700 p-3 rounded-lg backdrop-blur-sm transition-all duration-300 hover:border-gray-600">
                <div className="text-sm text-gray-400 mb-1 flex items-center">
                  <Sparkles className="h-3 w-3 mr-1 text-indigo-400" />
                  League Starts In
                </div>
                <div className="font-mono text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  <CountdownTimer targetDate={league.startDate} />
                </div>
              </div>
              
              {league.gameweekInfo && (
                <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700 p-3 rounded-lg backdrop-blur-sm transition-all duration-300 hover:border-gray-600">
                  <div className="text-sm text-gray-400 mb-1 flex items-center">
                    <Sparkles className="h-3 w-3 mr-1 text-purple-400" />
                    Gameweek Deadline
                  </div>
                  <div className="font-mono text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    <CountdownTimer targetDate={league.gameweekInfo.deadline_time} />
                  </div>
                </div>
              )}
            </div>
          )}

          {league.prizeDistribution && (
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700 p-3 rounded-lg backdrop-blur-sm mb-4 transition-all duration-300 hover:border-gray-600">
              <h4 className="font-medium text-sm mb-2 text-gray-200 flex items-center">
                <Award className="h-4 w-4 mr-1 text-yellow-400" />
                Prize Pool: {formatCurrency(prizePool, "NGN")}
              </h4>
              <div className="flex flex-wrap gap-2">
                {league.prizeDistribution.map((prize) => (
                  <span
                    key={prize.position}
                    className="flex items-center bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border border-indigo-800/30 px-2 py-1 rounded-md text-xs text-gray-200 transition-all duration-300 hover:border-indigo-700/50"
                  >
                    <Award className="h-3 w-3 mr-1 text-yellow-400" />
                    {prize.position}
                    {prize.position === 1
                      ? "st"
                      : prize.position === 2
                      ? "nd"
                      : prize.position === 3
                      ? "rd"
                      : "th"}
                    : {formatCurrency(prizePool * (prize.percentageShare / 100), "NGN")}
                  </span>
                ))}
              </div>
            </div>
          )}

          {mode === "joined" &&
            league.myResults &&
            league.status === "completed" && (
              <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700 p-3 rounded-lg backdrop-blur-sm mb-4 transition-all duration-300 hover:border-gray-600">
                <h4 className="font-medium text-sm mb-2 text-gray-200 flex items-center">
                  <Sparkles className="h-4 w-4 mr-1 text-indigo-400" />
                  Your Results
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-sm">
                    <div className="text-gray-400">Position</div>
                    <div className="font-bold text-gray-200">
                      {league.myResults.rank}/{league.currentParticipants}
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="text-gray-400">Points</div>
                    <div className="font-bold text-gray-200">{league.myResults.points}</div>
                  </div>
                  <div className="text-sm">
                    <div className="text-gray-400">Weekly Points</div>
                    <div className="font-bold text-gray-200">
                      {league.myResults.weeklyPoints}
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="text-gray-400">Winnings</div>
                    <div className="font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                      {formatCurrency(league.myResults.winnings)}
                    </div>
                  </div>
                </div>
              </div>
            )}
        </CardContent>
        
        <CardFooter className="flex justify-between items-center pt-0 relative z-10 border-t border-gray-800">
          <div className="text-xs text-gray-500">
            {league.status === "upcoming"
              ? `Starts: ${formatDate(league.startDate)}`
              : `Ends: ${formatDate(league.endDate)}`}
          </div>
          {league.hasJoined ? (
            <div className="flex items-center text-green-400 font-medium">
              <CheckCircle className="h-4 w-4 mr-1" />
              Joined
            </div>
          ) : isJoinable ? (
            <Button 
              onClick={onJoin} 
              className="flex items-center bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-0 transition-all duration-300"
            >
              Join League
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={onView}
              variant={mode === "joined" ? "default" : "outline"}
              className={`flex items-center transition-all duration-300 ${
                mode === "joined" 
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-0" 
                  : "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-indigo-400"
              }`}
            >
              View Details
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}
