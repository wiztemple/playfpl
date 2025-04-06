"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
    Calendar,
    Users,
    ChevronRight,
    Trophy,
    Clock,
    Star,
    Zap,
    CurrencyIcon,
    Banknote,
} from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { formatCurrency } from "@/lib/utils";
import { League } from "@/app/types";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Countdown from "../shared/Countdown";

interface MyLeagueCardProps {
    league: League;
}

export default function MyLeagueCard({ league }: MyLeagueCardProps) {
    const isActive = league.status === "active" || league.status === "upcoming";
    const userPosition = league.userRank || (league.myResults?.rank ?? null);

    // Calculate prize pool
    const calculatePrizePool = () => {
        const totalEntries = league.currentParticipants;
        const totalPool = totalEntries * league.entryFee;
        // Assuming 10% platform fee if not specified
        const platformFee = totalPool * 0.1;
        return totalPool - platformFee;
    };

    const prizePool = calculatePrizePool();

    // Get status-based styling
    const getStatusConfig = () => {
        switch (league.status) {
            case "upcoming":
                return {
                    gradient: "from-violet-500 to-indigo-600",
                    hoverGradient: "from-violet-600 to-indigo-700",
                    bgGlow: "bg-indigo-600/20",
                    icon: <Zap className="h-4 w-4 text-indigo-300" />,
                    label: "Upcoming",
                    statusColor: "text-indigo-300",
                    dotColor: "bg-indigo-400",
                };
            case "active":
                return {
                    gradient: "from-emerald-500 to-teal-600",
                    hoverGradient: "from-emerald-600 to-teal-700",
                    bgGlow: "bg-emerald-600/20",
                    icon: <Clock className="h-4 w-4 text-emerald-300" />,
                    label: "Active",
                    statusColor: "text-emerald-300",
                    dotColor: "bg-emerald-400",
                };
            case "completed":
                return {
                    gradient: "from-amber-500 to-orange-600",
                    hoverGradient: "from-amber-600 to-orange-700",
                    bgGlow: "bg-amber-600/20",
                    icon: <Trophy className="h-4 w-4 text-amber-300" />,
                    label: "Completed",
                    statusColor: "text-amber-300",
                    dotColor: "bg-amber-400",
                };
            default:
                return {
                    gradient: "from-gray-500 to-slate-600",
                    hoverGradient: "from-gray-600 to-slate-700",
                    bgGlow: "bg-gray-600/20",
                    icon: <Clock className="h-4 w-4 text-gray-300" />,
                    label: "Unknown",
                    statusColor: "text-gray-300",
                    dotColor: "bg-gray-400",
                };
        }
    };

    const statusConfig = getStatusConfig();

    // Get position styling
    const getPositionConfig = () => {
        if (!userPosition) return null;

        switch (userPosition) {
            case 1:
                return {
                    icon: <Trophy className="h-5 w-5 text-yellow-400" />,
                    text: "1st Place",
                    textColor: "text-yellow-400",
                    bgColor: "bg-yellow-900/30",
                    borderColor: "border-yellow-500/50",
                };
            case 2:
                return {
                    icon: <Trophy className="h-5 w-5 text-gray-300" />,
                    text: "2nd Place",
                    textColor: "text-gray-300",
                    bgColor: "bg-gray-700/30",
                    borderColor: "border-gray-500/50",
                };
            case 3:
                return {
                    icon: <Trophy className="h-5 w-5 text-amber-700" />,
                    text: "3rd Place",
                    textColor: "text-amber-700",
                    bgColor: "bg-amber-900/30",
                    borderColor: "border-amber-700/50",
                };
            default:
                return {
                    icon: <Star className="h-5 w-5 text-indigo-400" />,
                    text: `${userPosition}th Place`,
                    textColor: "text-indigo-400",
                    bgColor: "bg-indigo-900/30",
                    borderColor: "border-indigo-500/50",
                };
        }
    };

    const positionConfig = getPositionConfig();

    // Format date for display
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
        }).format(date);
    };

    // Fetch gameweek info for countdown
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
            transition={{ duration: 0.4 }}
            className="h-full"
        >
            <Card className="backdrop-blur-md bg-gray-900/60 border border-gray-800 shadow-xl hover:shadow-lg hover:shadow-indigo-500/20 hover:border-indigo-500/40 transition-all duration-300 relative overflow-hidden h-full">
                {/* Enhanced background effects with multiple layers - lighter colors */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800/80 to-gray-900/90 rounded-xl pointer-events-none"></div>
                <div className={cn("absolute -right-20 -top-20 w-40 h-40 rounded-full blur-3xl opacity-50", statusConfig.bgGlow)}></div>
                <div className={cn("absolute -left-20 -bottom-20 w-40 h-40 rounded-full blur-3xl opacity-40", statusConfig.bgGlow)}></div>

                {/* Add subtle pattern overlay with increased opacity */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:20px_20px] pointer-events-none opacity-40"></div>

                {/* Card hologram effect with increased brightness */}
                <div className={cn("absolute top-5 left-5 w-8 h-8 rounded-full opacity-80 blur-sm bg-gradient-to-r", statusConfig.gradient)}></div>
                <div className={cn("absolute top-5 left-5 w-6 h-6 rounded-full opacity-90 bg-gradient-to-r", statusConfig.gradient)}></div>

                {/* Enhanced status ribbon with glow */}
                <div className={cn("absolute top-0 right-0 w-24 h-24 overflow-hidden")}>
                    <div className={cn("absolute top-0 right-0 transform rotate-45 translate-y-[-50%] translate-x-[50%] w-24 text-center py-1 text-xs font-bold bg-gradient-to-r shadow-lg", statusConfig.gradient)}>
                        {statusConfig.label}
                    </div>
                </div>

                <div className="p-5 relative z-10">
                    {/* League type badge with enhanced styling */}
                    <div className="flex justify-between items-start mb-4">
                        <div className={cn("px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r shadow-sm border border-white/20", statusConfig.gradient)}>
                            {league.leagueType === "tri" ? "Triple Prize" :
                                league.leagueType === "duo" ? "Double Prize" : "Jackpot"}
                        </div>
                        <div className={cn("flex items-center text-xs font-medium px-2 py-1 rounded-full bg-gray-800/70 backdrop-blur-sm", statusConfig.statusColor)}>
                            <span className={cn("w-2 h-2 rounded-full mr-1.5 animate-pulse", statusConfig.dotColor)}></span>
                            {statusConfig.label}
                        </div>
                    </div>

                    {/* League Name with text shadow */}
                    <h3 className="font-bold text-gray-100 text-xl mb-3 truncate drop-shadow-sm">{league.name}</h3>

                    {/* Prize & Entry with enhanced card-like styling - lighter backgrounds */}
                    <div className="flex justify-between items-center mb-4">
                        <div className="bg-gradient-to-br from-gray-800/70 to-gray-800/60 backdrop-blur-sm rounded-lg px-3 py-2 flex-1 mr-2 border border-gray-700/40 shadow-sm">
                            <p className="text-xs text-gray-300 flex items-center">
                                <CurrencyIcon className="h-3 w-3 mr-1 text-green-400" />
                                Prize Pool
                            </p>
                            <p className="text-md font-semibold text-green-400">{formatCurrency(prizePool)}</p>
                        </div>
                        <div className="bg-gradient-to-br from-gray-800/70 to-gray-800/60 backdrop-blur-sm rounded-lg px-3 py-2 flex-1 border border-gray-700/40 shadow-sm">
                            <p className="text-xs text-gray-300 flex items-center">
                                <Banknote className="h-3 w-3 mr-1 text-purple-400" />
                                Entry Fee
                            </p>
                            <p className="text-md font-semibold text-purple-400">{formatCurrency(league.entryFee)}</p>
                        </div>
                    </div>

                    {/* Rest of the component remains the same */}

                    {/* Gameweek & Participants with enhanced styling */}
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center bg-gradient-to-br from-gray-800/90 to-gray-900/80 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-gray-700/30">
                            <Calendar className="h-3.5 w-3.5 text-indigo-400 mr-1.5" />
                            <span className="text-xs text-gray-300">GW {league.gameweek}</span>
                        </div>
                        <div className="flex items-center bg-gradient-to-br from-gray-800/90 to-gray-900/80 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-gray-700/30">
                            <Users className="h-3.5 w-3.5 text-purple-400 mr-1.5" />
                            <span className="text-xs text-gray-300">
                                {league.currentParticipants}/{league.maxParticipants}
                            </span>
                        </div>
                    </div>

                    {/* Date range with enhanced styling */}
                    <div className="flex items-center justify-center mb-4 text-xs text-gray-400 bg-gradient-to-br from-gray-800/70 to-gray-900/60 backdrop-blur-sm rounded-lg py-1.5 border border-gray-700/30">
                        <Calendar className="h-3 w-3 mr-1.5" />
                        <span>{formatDate(league.startDate)} - {formatDate(league.endDate)}</span>
                    </div>

                    {/* Progress Bar with enhanced styling */}
                    <div className="w-full bg-gray-800/70 rounded-full h-1.5 mb-4 overflow-hidden backdrop-blur-sm">
                        <div
                            className={cn("bg-gradient-to-r h-1.5 rounded-full relative", statusConfig.gradient)}
                            style={{ width: `${(league.currentParticipants / league.maxParticipants) * 100}%` }}
                        >
                            <div className="absolute inset-0 bg-white/20 h-0.5"></div>
                        </div>
                    </div>

                    {/* Countdown for upcoming leagues with enhanced styling */}
                    {league.status === "upcoming" && gameweekInfo && gameweekInfo.deadline_time && (
                        <div className="mb-4 bg-gradient-to-br from-gray-800/70 to-gray-900/60 backdrop-blur-sm rounded-lg p-2 border border-gray-700/30">
                            <Countdown
                                targetDate={gameweekInfo.deadline_time}
                                label="Deadline"
                                variant="card"
                            />
                        </div>
                    )}

                    {/* Position badge for completed leagues with enhanced styling */}
                    {!isActive && positionConfig && (
                        <div className={cn("flex items-center justify-center mb-4 py-2 rounded-lg border backdrop-blur-sm shadow-sm",
                            positionConfig.bgColor, positionConfig.borderColor)}>
                            {positionConfig.icon}
                            <span className={cn("ml-2 font-bold", positionConfig.textColor)}>
                                {positionConfig.text}
                            </span>
                            {league.myResults && league.myResults.winnings > 0 && (
                                <span className="ml-2 text-green-400 font-semibold flex items-center">
                                    <Banknote className="h-3 w-3 mr-0.5" />
                                    {formatCurrency(league.myResults.winnings)}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Action Button with enhanced styling */}
                    <Link href={`/leagues/weekly/${league.id}`} className="w-full">
                        <Button
                            className={cn("w-full text-white border-0 flex items-center justify-center py-2 h-auto bg-gradient-to-r shadow-md hover:shadow-lg transition-all duration-300",
                                statusConfig.gradient, "hover:bg-gradient-to-r", statusConfig.hoverGradient)}
                        >
                            View Details
                            <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
                        </Button>
                    </Link>
                </div>
            </Card>
        </motion.div>
    );
}