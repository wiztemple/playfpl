"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar,
  Users,
  ChevronRight,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  Card
} from "../ui/card";
import {
  formatDate,
  calculateTimeRemaining,
  formatCurrency,
} from "@/lib/utils";
import { WeeklyLeague } from "@/app/types";
import { motion } from "framer-motion";
import Countdown from "../shared/Countdown";

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

  // Format time remaining for display
  const formatTimeRemaining = (date: string) => {
    const now = new Date();
    const target = new Date(date);

    if (target < now) {
      return "Active";
    }

    const diffTime = Math.abs(target.getTime() - now.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h`;
    } else {
      return `${diffHours}h`;
    }
  };

  { console.log("League start date:", league.startDate) }

  const [gameweekInfo, setGameweekInfo] = useState<any>(null);

  useEffect(() => {
    const fetchGameweekInfo = async () => {
      try {
        const response = await fetch(`/api/gameweek/${league.gameweek}`);
        if (response.ok) {
          const data = await response.json();
          setGameweekInfo(data);
        }
      } catch (error) {
        console.error("Error fetching gameweek info:", error);
      }
    };

    if (league.gameweek) {
      fetchGameweekInfo();
    }
  }, [league.gameweek]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Card className="backdrop-blur-md bg-gray-900/60 border border-gray-800 shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-500/50 transition-all duration-300 relative overflow-hidden h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/5 rounded-xl pointer-events-none"></div>
        <div className="absolute -right-20 -top-20 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl"></div>

        <div className="p-5">
          {/* Card Header - Like a debit card chip */}
          <div className="flex justify-between items-start mb-3">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-6 w-10 rounded-md"></div>
            <div className="text-xs font-medium px-2 py-1 rounded-full bg-gray-800/80 text-gray-300">
              {league.status === "active" ? (
                <span className="flex items-center text-green-400">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-1.5"></span>
                  Live
                </span>
              ) : (
                <span className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatTimeRemaining(league.startDate)}
                </span>
              )}
            </div>
          </div>

          {/* League Name */}
          <h3 className="font-bold text-gray-100 text-lg mb-2 truncate">{league.name}</h3>

          {/* Prize & Entry */}
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-xs text-gray-400">Prize Pool</p>
              <p className="text-md font-semibold text-gray-200">{formatCurrency(prizePool)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Entry Fee</p>
              <p className="text-md font-semibold text-gray-200">{formatCurrency(league.entryFee)}</p>
            </div>
          </div>

          {/* Gameweek & Participants */}
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center">
              <Calendar className="h-3.5 w-3.5 text-indigo-400 mr-1.5" />
              <span className="text-xs text-gray-300">GW {league.gameweek}</span>
            </div>
            <div className="flex items-center">
              <Users className="h-3.5 w-3.5 text-purple-400 mr-1.5" />
              <span className="text-xs text-gray-300">
                {league.currentParticipants}/{league.maxParticipants}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-800 rounded-full h-1.5 mb-4">
            <div
              className={`bg-gradient-to-r ${getStatusColors()} h-1.5 rounded-full`}
              style={{ width: `${(league.currentParticipants / league.maxParticipants) * 100}%` }}
            ></div>
          </div>
          {league.status === "upcoming" && gameweekInfo && gameweekInfo.deadline_time && (
            <div className="mb-4">
              <Countdown
                targetDate={gameweekInfo.deadline_time}
                label="Deadline"
                variant="card"
              />
            </div>
          )}

          {/* Action Button */}
          {league.hasJoined ? (
            <Button
              onClick={onView}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 flex items-center justify-center py-1.5 h-auto"
            >
              View League
              <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          ) : isJoinable ? (
            <Button
              onClick={onJoin}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 flex items-center justify-center py-1.5 h-auto"
            >
              Join League
              <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              onClick={onView}
              variant="outline"
              className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-indigo-400 flex items-center justify-center py-1.5 h-auto"
            >
              View Details
              <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
