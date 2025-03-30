"use client";

import { motion } from "framer-motion";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/app/components/ui/card";
import { Trophy, ArrowRight } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface PrizePoolCardProps {
    league: any;
    prizePool: number;
    isJoinDisabled: boolean;
    minutesUntilFirstKickoff: number | null;
    handleJoinLeague: () => void;
}

export default function PrizePoolCard({
    league,
    prizePool,
    isJoinDisabled,
    minutesUntilFirstKickoff,
    handleJoinLeague,
}: PrizePoolCardProps) {
    return (
        <div>
            <Card className="bg-gray-900/80 border border-gray-800 overflow-hidden backdrop-blur-sm shadow-lg h-full">
                <CardHeader className="border-b border-gray-800">
                    <CardTitle className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent flex items-center">
                        <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                        Prize Pool
                    </CardTitle>
                </CardHeader>

                <CardContent className="pt-6">
                    <div className="text-3xl font-bold mb-6 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                        {formatCurrency(prizePool)}
                    </div>

                    <div className="space-y-3">
                        {league.prizeDistribution.map((prize: any, index: number) => (
                            <motion.div
                                key={prize.position}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.1 * index }}
                                className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-800"
                                whileHover={{
                                    scale: 1.02,
                                    boxShadow: "0 0 10px 0 rgba(79, 70, 229, 0.2)",
                                    borderColor: "rgba(99, 102, 241, 0.4)",
                                    transition: { duration: 0.2 }
                                }}
                            >
                                <div className="flex items-center">
                                    <Trophy
                                        className={`h-5 w-5 mr-2 ${prize.position === 1
                                            ? "text-yellow-500"
                                            : prize.position === 2
                                                ? "text-gray-400"
                                                : prize.position === 3
                                                    ? "text-amber-700"
                                                    : "text-gray-500"
                                            }`}
                                    />
                                    <span className="text-gray-300">
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
                                <div className="font-medium bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                                    {formatCurrency(
                                        prizePool * (prize.percentageShare / 100)
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    {league.status === "upcoming" && !league.hasJoined && (
                        <div className="pt-6 mt-4 border-t border-gray-800">
                            <motion.div
                                whileHover={{ scale: isJoinDisabled ? 1 : 1.02 }}
                                whileTap={{ scale: isJoinDisabled ? 1 : 0.98 }}
                            >
                                <Button
                                    className={`w-full text-white bg-gradient-to-r ${isJoinDisabled
                                        ? "from-gray-500 to-gray-600 cursor-not-allowed opacity-70"
                                        : "from-orange-500 to-red-500 hover:from-indigo-600 hover:to-purple-600"
                                        } border-0 shadow-lg py-6`}
                                    onClick={handleJoinLeague}
                                    size="lg"
                                    disabled={isJoinDisabled}
                                >
                                    {isJoinDisabled
                                        ? `Joining Closed (${minutesUntilFirstKickoff} mins to kickoff)`
                                        : `Join League for ${formatCurrency(league.entryFee)}`}
                                    {!isJoinDisabled && <ArrowRight className="ml-2 h-5 w-5" />}
                                </Button>
                            </motion.div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}