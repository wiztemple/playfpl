
"use client";

import Link from "next/link";
import { ChevronLeft, AlertTriangle, Calendar, Users, Clock, Trophy, Info, ArrowRight } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import { Separator } from "@/app/components/ui/separator";
import { WeeklyLeague } from "@/app/types";
import { useAdminStatus } from "@/app/hooks/user/index"
import Countdown from "@/app/components/shared/Countdown";
import AdminLeagueActions from "../leagues/AdminLeagueAction";

interface LeagueHeaderProps {
    league: WeeklyLeague;
    gameweekInfo: any;
    isJoinDisabled: boolean;
    minutesUntilFirstKickoff: number | null;
    handleJoinLeague: () => void;
    deadlinePassed?: boolean;
}

export default function LeagueHeader({
    league,
    gameweekInfo,
    isJoinDisabled,
    minutesUntilFirstKickoff,
    handleJoinLeague,
}: LeagueHeaderProps) {

    // Get admin status
    const adminStatusQuery = useAdminStatus();
    const isAdmin = adminStatusQuery.data?.isAdmin || false;

    // Check if deadline has passed directly in the component
    const now = new Date();
    const deadlineTime = gameweekInfo?.deadline_time ? new Date(gameweekInfo.deadline_time) : null;
    const isDeadlinePassed = deadlineTime ? now > deadlineTime : false;

    // Use either the passed prop or our direct check
    const joinDisabled = isJoinDisabled || isDeadlinePassed;

    const getButtonText = () => {
        if (isDeadlinePassed) return "Gameweek Started";
        if (isJoinDisabled) return "Joining Closed";
        return "Join League";
    };

    // Calculate prize pool
    const calculatePrizePool = () => {
        const totalEntries = league.currentParticipants;
        const totalPool = totalEntries * league.entryFee;
        const platformFee = totalPool * (league.platformFeePercentage / 100);
        return totalPool - platformFee;
    };

    const prizePool = calculatePrizePool();

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
        >
            <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                    <Link href="/leagues/weekly">
                        <Button variant="ghost" className="pl-0 text-gray-400 hover:text-indigo-400 hover:bg-transparent">
                            <ChevronLeft className="mr-1 h-4 w-4" />
                            Back to Leagues
                        </Button>
                    </Link>

                    {/* Admin Actions */}
                    {isAdmin && <AdminLeagueActions league={league} isAdmin={!!isAdmin} />}
                </div>

                <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
                >
                    {league.name}
                </motion.h1>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-2 mb-4 gap-4">
                    <div className="grid grid-cols-2 sm:flex gap-4 sm:gap-6">
                        <div className="flex items-center text-purple-400">
                            <Calendar className="h-4 w-4 mr-1.5" />
                            <span className="text-sm text-gray-300">Gameweek {league.gameweek}</span>
                        </div>
                        <div className="flex items-center text-indigo-400">
                            <Users className="h-4 w-4 mr-1.5" />
                            <span className="text-sm text-gray-300">
                                {league.currentParticipants}/{league.maxParticipants} Players
                            </span>
                        </div>
                        <div className="flex items-center text-cyan-400">
                            <Clock className="h-4 w-4 mr-1.5" />
                            <span className="text-sm text-gray-300">
                                {league.status === "upcoming"
                                    ? "Upcoming"
                                    : league.status === "active"
                                        ? "Live"
                                        : "Completed"}
                            </span>
                        </div>
                        <div className="flex items-center text-green-400">
                            <Trophy className="h-4 w-4 mr-1.5" />
                            <span className="text-sm text-gray-300">
                                Prize: {formatCurrency(prizePool)}
                            </span>
                        </div>
                    </div>

                    {league.status === "upcoming" && !league.hasJoined && (
                        <Button
                            className={`text-white bg-gradient-to-r ${joinDisabled
                                ? "from-gray-500 to-gray-600 cursor-not-allowed opacity-70"
                                : "from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                                } border-0 shadow-lg`}
                            onClick={handleJoinLeague}
                            disabled={joinDisabled}
                        >
                            {getButtonText()}
                            {!joinDisabled && <ArrowRight className="ml-2 h-4 w-4" />}
                        </Button>
                    )}

                    {league.hasJoined && (
                        <div className="px-3 py-1.5 rounded-full bg-green-600/20 border border-green-500/30 text-green-400 flex items-center text-sm font-medium">
                            <Trophy className="h-4 w-4 mr-1.5" />
                            You have joined this league
                        </div>
                    )}
                </div>

                {/* Countdown Timer */}
                {league.status === "upcoming" && gameweekInfo && gameweekInfo.deadline_time && (
                    <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                        <Countdown
                            targetDate={gameweekInfo.deadline_time}
                            label="Gameweek Deadline"
                        />
                    </div>
                )}

                {/* Add a message when deadline has passed */}
                {league.status === "upcoming" && isDeadlinePassed && (
                    <div className="p-3 bg-red-900/30 border border-red-800/50 rounded-lg flex items-center mt-2">
                        <AlertTriangle className="h-5 w-5 mr-2 text-red-400 flex-shrink-0" />
                        <p className="text-sm text-red-200">
                            Joining is no longer available because the gameweek deadline has passed.
                        </p>
                    </div>
                )}

                {/* Existing message for when joining is disabled due to kickoff time */}
                {league.status === "upcoming" && isJoinDisabled && minutesUntilFirstKickoff !== null && (
                    <div className="p-3 bg-amber-900/30 border border-amber-800/50 rounded-lg flex items-center mt-2">
                        <AlertTriangle className="h-5 w-5 mr-2 text-amber-400 flex-shrink-0" />
                        <p className="text-sm text-amber-200">
                            Joining is closed because the first match starts in{" "}
                            {minutesUntilFirstKickoff < 60
                                ? `${minutesUntilFirstKickoff} minutes`
                                : `${Math.floor(minutesUntilFirstKickoff / 60)} hours ${minutesUntilFirstKickoff % 60
                                } minutes`}
                            .
                        </p>
                    </div>
                )}

                {league.status === "upcoming" && gameweekInfo && (
                    <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg flex items-center">
                        <Info className="h-5 w-5 mr-2 text-gray-400 flex-shrink-0" />
                        <p className="text-sm text-gray-300">
                            Gameweek {league.gameweek} deadline:{" "}
                            {new Date(gameweekInfo.deadline_time).toLocaleString()}
                        </p>
                    </div>
                )}

                <Separator className="bg-gray-800 my-6" />
            </div>
        </motion.div>
    );
}