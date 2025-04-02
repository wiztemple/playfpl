"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar,
  Users,
  ChevronRight,
  CheckCircle
} from "lucide-react";
import { Button } from "../ui/button";
import {
  Card
} from "../ui/card";
import {
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
  // Generate a random color palette for each card
  const [colorPalette] = useState(() => {
    const palettes = [
      { from: "from-indigo-900/20", to: "to-purple-900/10", accent: "bg-indigo-600/20", accent2: "bg-purple-600/10" },
      { from: "from-blue-900/20", to: "to-cyan-900/10", accent: "bg-blue-600/20", accent2: "bg-cyan-600/10" },
      { from: "from-emerald-900/20", to: "to-teal-900/10", accent: "bg-emerald-600/20", accent2: "bg-teal-600/10" },
      { from: "from-amber-900/20", to: "to-orange-900/10", accent: "bg-amber-600/20", accent2: "bg-orange-600/10" },
      { from: "from-rose-900/20", to: "to-pink-900/10", accent: "bg-rose-600/20", accent2: "bg-pink-600/10" },
      { from: "from-violet-900/20", to: "to-purple-900/10", accent: "bg-violet-600/20", accent2: "bg-purple-600/10" },
      { from: "from-fuchsia-900/20", to: "to-pink-900/10", accent: "bg-fuchsia-600/20", accent2: "bg-pink-600/10" },
    ];
    
    return palettes[Math.floor(Math.random() * palettes.length)];
  });

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
      <Card className="backdrop-blur-md bg-gray-900/60 border border-gray-800 shadow-xl hover:shadow-indigo-500/20 hover:border-indigo-500/50 transition-all duration-300 relative overflow-hidden h-full">
        {/* Enhanced background effects with dynamic colors */}
        <div className={`absolute inset-0 bg-gradient-to-br ${colorPalette.from} ${colorPalette.to} rounded-xl pointer-events-none`}></div>
        <div className={`absolute -right-20 -top-20 w-40 h-40 ${colorPalette.accent} rounded-full blur-3xl`}></div>
        <div className={`absolute -left-20 -bottom-20 w-40 h-40 ${colorPalette.accent2} rounded-full blur-3xl`}></div>
        
        {/* Card hologram effect */}
        <div className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 opacity-70 blur-sm"></div>
        <div className="absolute top-5 right-5 w-6 h-6 rounded-full bg-gradient-to-r from-indigo-300 to-purple-400 opacity-90"></div>
        
        <div className="p-5">
          {/* Card Header - Enhanced chip design */}
          <div className="flex justify-between items-start mb-4">
            <div className="relative">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-7 w-12 rounded-md"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/30 to-purple-400/30 h-7 w-12 rounded-md blur-sm"></div>
              <div className="absolute top-1 left-1 h-1 w-4 bg-white/30 rounded-sm"></div>
            </div>
            <div className="text-xs font-medium px-2 py-1 rounded-full bg-gray-800/80 text-gray-300 backdrop-blur-sm border border-gray-700/50">
              {league.status === "active" ? (
                <span className="flex items-center text-green-400">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-1.5 animate-pulse"></span>
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

          {/* League Name with subtle embossed effect */}
          <h3 className="font-bold text-gray-100 text-lg mb-3 truncate drop-shadow-sm">{league.name}</h3>

          {/* Prize & Entry - Credit card number style */}
          <div className="flex justify-between items-center mb-4 bg-gradient-to-r from-gray-800/50 to-gray-800/30 p-2 rounded-md backdrop-blur-sm border border-gray-700/30">
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

          {/* Progress Bar - Enhanced with gradient and glow */}
          <div className="w-full bg-gray-800/80 rounded-full h-1.5 mb-4 overflow-hidden backdrop-blur-sm">
            <div
              className={`bg-gradient-to-r ${getStatusColors()} h-1.5 rounded-full relative`}
              style={{ width: `${(league.currentParticipants / league.maxParticipants) * 100}%` }}
            >
              <div className="absolute inset-0 bg-white/20 h-0.5"></div>
            </div>
          </div>
          
          {/* Countdown and Joined Status */}
          <div className="mb-4 flex justify-between items-center">
            {league.status === "upcoming" && gameweekInfo && gameweekInfo.deadline_time ? (
              <div className="flex-grow">
                <Countdown
                  targetDate={gameweekInfo.deadline_time}
                  label="Deadline"
                  variant="card"
                />
              </div>
            ) : (
              <div></div>
            )}
            
            {league.hasJoined && (
              <div className="flex items-center bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-medium px-2 py-1 rounded-full ml-2 shadow-sm">
                <CheckCircle className="w-3 h-3 mr-1" />
                Joined
              </div>
            )}
          </div>

          {/* Action Button - Enhanced with gradient and glow */}
          <Button
            onClick={onView}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 flex items-center justify-center py-2 h-auto rounded-md shadow-md hover:shadow-indigo-500/50 transition-all duration-300"
          >
            View League
            <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
