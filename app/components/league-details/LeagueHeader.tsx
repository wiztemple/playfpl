"use client";

import { motion } from "framer-motion";
import { Tag } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import Countdown from "@/app/components/shared/Countdown";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface LeagueHeaderProps {
    league: any;
    gameweekInfo: any;
    isJoinDisabled: boolean;
    minutesUntilFirstKickoff: number | null;
    handleJoinLeague: () => void;
}

export default function LeagueHeader({
    league,
    gameweekInfo,
    isJoinDisabled,
    minutesUntilFirstKickoff,
    handleJoinLeague,
}: LeagueHeaderProps) {
    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-8"
            >
                <Link href="/leagues/weekly">
                    <Button variant="ghost" className="pl-0 text-gray-400 hover:text-indigo-400 hover:bg-transparent group transition-all duration-300">
                        <ChevronLeft className="mr-1 h-4 w-4 group-hover:transform group-hover:-translate-x-1 transition-transform duration-300" />
                        <span className="relative">
                            Back to All Leagues
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-500 group-hover:w-full transition-all duration-300"></span>
                        </span>
                    </Button>
                </Link>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="mb-8"
            >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Badge className={`
                ${league.status === "upcoming" ? "bg-blue-600" :
                                    league.status === "active" ? "bg-green-600" :
                                        league.status === "completed" ? "bg-purple-600" : "bg-gray-600"}
              `}>
                                {league.status === "upcoming" ? "Upcoming" :
                                    league.status === "active" ? "Active" :
                                        league.status === "completed" ? "Completed" : league.status}
                            </Badge>
                            <Badge className="bg-indigo-600">Gameweek {league.gameweek}</Badge>
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            {league.name}
                        </h1>
                    </div>
                    {league.status === "upcoming" && !league.hasJoined && (
                        <motion.div
                            whileHover={{ scale: isJoinDisabled ? 1 : 1.05 }}
                            whileTap={{ scale: isJoinDisabled ? 1 : 0.95 }}
                        >
                            <Button
                                className={`text-white bg-gradient-to-r ${isJoinDisabled
                                    ? "from-gray-500 to-gray-600 cursor-not-allowed opacity-70"
                                    : "from-orange-500 to-red-500 hover:from-indigo-600 hover:to-purple-600"
                                    } border-0 shadow-lg`}
                                onClick={handleJoinLeague}
                                size="lg"
                                disabled={isJoinDisabled}
                            >
                                {isJoinDisabled
                                    ? `Joining Closed (${minutesUntilFirstKickoff} mins to kickoff)`
                                    : "Join League"}
                                {!isJoinDisabled && <ArrowRight className="ml-2 h-4 w-4" />}
                            </Button>
                        </motion.div>
                    )}

                    {league.hasJoined && (
                        <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 p-3 rounded-lg border border-green-800/50 flex items-center">
                            <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                            <span className="font-medium text-green-400">You've joined this league</span>
                        </div>
                    )}
                </div>

                {/* Countdown timers */}
                {league.status === "upcoming" && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
                    >
                        {league.startDate && new Date(league.startDate) > new Date() && (
                            <Countdown
                                targetDate={league.startDate}
                                label="League Starts In"
                            />
                        )}

                        {gameweekInfo && gameweekInfo.deadline_time && (
                            <Countdown
                                targetDate={gameweekInfo.deadline_time}
                                label="Gameweek Deadline"
                            />
                        )}
                    </motion.div>
                )}
            </motion.div>
        </>
    );
}