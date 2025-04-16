import React, { useState } from "react";
import Link from "next/link";
import {
    Calendar, Users, ChevronRight, Trophy, Clock, Star, Zap, Banknote, CheckCircle
} from "lucide-react";
import { Button } from "../ui/button"; // Adjust path if needed
import { Card } from "../ui/card"; // Adjust path if needed
import { Badge } from "@/app/components/ui/badge"; // Adjust path if needed
import { formatCurrency } from "@/lib/utils"; // Adjust path if needed
// --- Import the specific, unified type ---
import type { MyLeagueInfo } from "@/app/types"; // Adjust path if needed
import { motion } from "framer-motion";
import { cn } from "@/lib/utils"; // Adjust path if needed

// Type for position styling config
interface PositionConfig { icon: React.ReactElement; text: string; textColor: string; bgColor: string; borderColor: string; }
// Type for status styling config
interface StatusConfig { gradient: string; hoverGradient: string; bgGlow: string; label: string; }

// Props Interface uses the unified type
interface LeagueCardProps {
  league: MyLeagueInfo;
  onJoin: () => void;   // Callback when Join button is clicked
  onView: () => void;   // Callback when View button is clicked
  mode: "available" | "joined"; // Determines context ("available" for general lists, "joined" for MyLeaguesPage)
}

export default function LeagueCard({ league, onJoin, onView, mode }: LeagueCardProps) {

  // --- State for random palette ---
  const [colorPalette] = useState(() => {
    const palettes = [
        { from: "from-indigo-900/20", to: "to-purple-900/10", accent: "bg-indigo-600/20", accent2: "bg-purple-600/10", grad: "from-indigo-500 to-purple-500", hovGrad: "hover:from-indigo-600 hover:to-purple-600" },
        { from: "from-blue-900/20", to: "to-cyan-900/10", accent: "bg-blue-600/20", accent2: "bg-cyan-600/10", grad: "from-blue-500 to-cyan-500", hovGrad: "hover:from-blue-600 hover:to-cyan-600" },
        { from: "from-emerald-900/20", to: "to-teal-900/10", accent: "bg-emerald-600/20", accent2: "bg-teal-600/10", grad: "from-emerald-500 to-teal-500", hovGrad: "hover:from-emerald-600 hover:to-teal-600" },
        { from: "from-amber-900/20", to: "to-orange-900/10", accent: "bg-amber-600/20", accent2: "bg-orange-600/10", grad: "from-amber-500 to-orange-500", hovGrad: "hover:from-amber-600 hover:to-orange-600" },
        { from: "from-rose-900/20", to: "to-pink-900/10", accent: "bg-rose-600/20", accent2: "bg-pink-600/10", grad: "from-rose-500 to-pink-500", hovGrad: "hover:from-rose-600 hover:to-pink-600" },
        { from: "from-violet-900/20", to: "to-fuchsia-900/10", accent: "bg-violet-600/20", accent2: "bg-fuchsia-600/10", grad: "from-violet-500 to-fuchsia-500", hovGrad: "hover:from-violet-600 hover:to-fuchsia-600" },
    ];
    // Ensure index is valid
    const index = Math.floor(Math.random() * palettes.length);
    return palettes[index >= 0 && index < palettes.length ? index : 0]; // Fallback to first palette
  });

  // --- Derived Data & Status Flags ---
  const isUpcoming = league.status === "upcoming";
  const isCompleted = league.status === "completed";
  const isActive = league.status === "active"; // Defined as requested
  const userPosition = league.myResults?.rank ?? null;
  const userWinnings = league.myResults?.winnings ?? 0; // Should be number from API
  const entryFeeNumber = league.entryFee ?? 0; // Should be number from API
  const platformFeePercent = league.platformFeePercentage ?? 10; // Should be number from API

  // Calculate prize pool
  const prizePool = Math.max(0, (league.currentParticipants ?? 0) * entryFeeNumber * (1 - platformFeePercent / 100));

  // --- Config Functions ---
  const getStatusConfig = (): StatusConfig => {
    switch (league.status) {
        case "upcoming": return { gradient: colorPalette.grad, hoverGradient: colorPalette.hovGrad, bgGlow: colorPalette.accent, label: "Upcoming" };
        case "active": return { gradient: "from-emerald-500 to-teal-500", hoverGradient: "hover:from-emerald-600 hover:to-teal-700", bgGlow: "bg-emerald-600/20", label: "Active" };
        case "completed": return { gradient: "from-amber-500 to-orange-600", hoverGradient: "hover:from-amber-600 hover:to-orange-700", bgGlow: "bg-amber-600/20", label: "Completed" };
        default: return { gradient: "from-gray-500 to-slate-600", hoverGradient: "hover:from-gray-600 hover:to-slate-700", bgGlow: "bg-gray-600/20", label: league.status || "Unknown" };
    }
  };
  const statusConfig = getStatusConfig();

  const getPositionConfig = (position: number | null | undefined): PositionConfig | null => {
    if (position == null || position <= 0) return null;
    switch (position) {
        case 1: return { icon: <Trophy className="h-4 w-4 text-yellow-400" />, text: "1st", textColor: "text-yellow-400", bgColor: "bg-yellow-900/30", borderColor: "border-yellow-500/50" };
        case 2: return { icon: <Trophy className="h-4 w-4 text-gray-300" />, text: "2nd", textColor: "text-gray-300", bgColor: "bg-gray-700/30", borderColor: "border-gray-500/50" };
        case 3: return { icon: <Trophy className="h-4 w-4 text-amber-700" />, text: "3rd", textColor: "text-amber-700", bgColor: "bg-amber-900/30", borderColor: "border-amber-700/50" };
        default: return { icon: <Star className="h-4 w-4 text-indigo-400" />, text: `${position}th`, textColor: "text-indigo-400", bgColor: "bg-indigo-900/30", borderColor: "border-indigo-500/50" };
    }
  };
  const positionConfig = getPositionConfig(userPosition);

  // --- Formatters ---
  const safeFormatDate = (dateInput: string | undefined | null): string => {
      if (!dateInput) return "-";
      try { const date = new Date(dateInput); if (isNaN(date.getTime())) return "Invalid Date"; return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(date); }
      catch (e) { console.error("Date formatting error:", e); return "Error Date"; }
  };

  // --- Icons ---
  const PoolIcon = Banknote;
  const EntryIcon = Banknote;

  // --- Render Logic ---
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="h-full flex" >
      <Card className="w-full backdrop-blur-md bg-gray-900/60 border border-gray-800 shadow-xl hover:shadow-lg hover:shadow-indigo-500/20 hover:border-indigo-500/40 transition-all duration-300 relative overflow-hidden h-full flex flex-col">
        {/* Background effects */}
        <div className={`absolute inset-0 bg-gradient-to-br ${colorPalette.from} ${colorPalette.to} rounded-xl pointer-events-none opacity-70`}></div>
        <div className={`absolute -right-16 -top-16 w-32 h-32 ${colorPalette.accent} rounded-full blur-3xl opacity-40`}></div>
        <div className={`absolute -left-16 -bottom-16 w-32 h-32 ${colorPalette.accent2} rounded-full blur-3xl opacity-30`}></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:15px_15px] pointer-events-none opacity-50"></div>

        {/* Ribbon */}
        <div className={cn("absolute top-0 right-0 w-24 h-24 overflow-hidden z-10")}>
            <div className={cn("absolute top-0 right-0 transform rotate-45 translate-y-[20px] translate-x-[30px] w-28 text-center py-1 text-xs font-bold bg-gradient-to-r shadow-lg", statusConfig.gradient, "text-white")}>
                {statusConfig.label}
            </div>
        </div>

        {/* Card content area */}
        <div className="p-4 md:p-5 relative z-10 flex flex-col flex-grow">
             {/* League Type Badge */}
            <div className="mb-3">
                 <Badge variant="outline" className={cn("px-2 py-0.5 rounded-full text-xs font-semibold border-white/20", colorPalette.grad, "text-white")}>
                      {league.leagueType?.toUpperCase() || "Unknown Type"}
                 </Badge>
            </div>
            {/* League Name */}
            <h3 className="font-bold text-gray-100 text-lg mb-3 truncate drop-shadow-sm" title={league.name}>{league.name}</h3>
            {/* Prize & Entry section */}
            <div className="flex justify-between items-center mb-3 space-x-2">
                <div className="bg-gradient-to-br from-gray-800/70 to-gray-800/50 backdrop-blur-sm rounded-lg px-3 py-1.5 flex-1 border border-gray-700/40 shadow-sm text-center"> <p className="text-[11px] text-gray-300 flex items-center justify-center truncate"> <PoolIcon className="h-3 w-3 mr-1 text-green-400 flex-shrink-0" /> Prize Pool </p> <p className="text-sm font-semibold text-green-400 truncate">{formatCurrency(prizePool)}</p> </div>
                <div className="bg-gradient-to-br from-gray-800/70 to-gray-800/50 backdrop-blur-sm rounded-lg px-3 py-1.5 flex-1 border border-gray-700/40 shadow-sm text-center"> <p className="text-[11px] text-gray-300 flex items-center justify-center truncate"> <EntryIcon className="h-3 w-3 mr-1 text-purple-400 flex-shrink-0" /> Entry Fee </p> <p className="text-sm font-semibold text-purple-400 truncate">{formatCurrency(league.entryFee)}</p> </div>
             </div>
            {/* Gameweek & Participants section */}
            <div className="flex justify-between items-center mb-4 text-xs text-gray-400">
                <div className="flex items-center"> <Calendar className="h-3.5 w-3.5 text-indigo-400 mr-1" /> GW {league.gameweek} </div>
                <div className="flex items-center"> <Users className="h-3.5 w-3.5 text-purple-400 mr-1" /> {league.currentParticipants ?? '?'}/{league.maxParticipants ?? '?'} Players </div>
                <div className="flex items-center"> <Clock className="h-3.5 w-3.5 text-amber-400 mr-1" /> Ends {safeFormatDate(league.endDate)} </div>
             </div>
            {/* Progress Bar */}
            <div className="w-full bg-gray-800/70 rounded-full h-1.5 mb-4 overflow-hidden"> <div className={cn("bg-gradient-to-r h-1.5 rounded-full", statusConfig.gradient)} style={{ width: `${league.maxParticipants > 0 ? ((league.currentParticipants ?? 0) / league.maxParticipants) * 100 : 0}%` }} ></div> </div>

            {/* Position & Winnings Badge */}
            {/* Show only in 'joined' mode and if league is completed */}
            {mode === 'joined' && isCompleted && positionConfig && (
                <div className={cn("flex items-center justify-center mb-4 py-1.5 px-3 rounded-lg border backdrop-blur-sm shadow-sm", positionConfig.bgColor, positionConfig.borderColor)}>
                    {positionConfig.icon}
                    <span className={cn("ml-1.5 font-bold text-sm", positionConfig.textColor)}> {positionConfig.text} </span>
                    {userWinnings > 0 && ( <span className="ml-2 text-green-400 font-semibold flex items-center text-sm"> <Banknote className="h-4 w-4 mr-1" /> {formatCurrency(userWinnings)} </span> )}
                </div>
            )}

            {/* Spacer */}
            <div className="flex-grow"></div>

            {/* Action Button */}
            <div className="w-full mt-auto pt-4 border-t border-gray-800/50">
                 {mode === 'available' && isUpcoming && !league.hasJoined ? (
                    <Button onClick={onJoin} className={cn("w-full text-white border-0 flex items-center justify-center bg-gradient-to-r", colorPalette.grad, colorPalette.hovGrad)} > Join Now </Button>
                 ) : (
                    <Button onClick={onView} variant="outline" className="w-full border-indigo-600/30 text-indigo-300 bg-indigo-950/20 hover:bg-indigo-950/50 hover:border-indigo-500/50" > View Details </Button>
                 )}
                 {/* Optional "Joined" indicator for available list */}
                 {mode === 'available' && league.hasJoined && !isUpcoming && ( <div className="text-center text-xs text-green-400 pt-2 flex items-center justify-center"> <CheckCircle className="w-3 h-3 mr-1"/> Joined </div> )}
             </div>
        </div>
      </Card>
    </motion.div>
  );
}