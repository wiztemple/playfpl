"use client";

import { motion } from "framer-motion";
import {
    Card,
    CardContent,
} from "@/app/components/ui/card";
import {
    Trophy,
    DollarSign,
    CheckCircle,
    ArrowRight
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface PrizesTabProps {
    league: any;
    prizePool: number;
    isJoinDisabled: boolean;
    minutesUntilFirstKickoff: number | null;
    handleJoinLeague: () => void;
}

export default function PrizesTab({
    league,
    prizePool,
    isJoinDisabled,
    minutesUntilFirstKickoff,
    handleJoinLeague,
}: PrizesTabProps) {
    return (
        <Card className="bg-gray-900/80 border border-gray-800 overflow-hidden backdrop-blur-sm shadow-lg">
            <CardContent className="p-6">
                <div className="space-y-6">
                    <div>
                        <h3 className="text-xl font-semibold mb-4 flex items-center text-yellow-400">
                            <Trophy className="h-6 w-6 mr-2" />
                            Prize Distribution
                        </h3>
                        <div className="space-y-4">
                            <div className="p-4 rounded-lg bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-800">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-gray-300">Total Prize Pool</p>
                                    <p className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                                        {formatCurrency(prizePool)}
                                    </p>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <p className="text-gray-400">Entry Fee × Participants</p>
                                    <p className="text-gray-400">
                                        {formatCurrency(league.entryFee)} × {league.currentParticipants}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {league.prizeDistribution.map((prize: any, index: number) => (
                                    <motion.div
                                        key={prize.position}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: 0.1 * index }}
                                        className="flex justify-between items-center p-4 rounded-lg bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-800"
                                        whileHover={{
                                            scale: 1.02,
                                            boxShadow: "0 0 10px 0 rgba(79, 70, 229, 0.2)",
                                            borderColor: "rgba(99, 102, 241, 0.4)",
                                            transition: { duration: 0.2 }
                                        }}
                                    >
                                        <div className="flex items-center">
                                            <div className={`p-3 rounded-full mr-4 ${prize.position === 1 ? "bg-yellow-900/30 text-yellow-500" :
                                                    prize.position === 2 ? "bg-gray-700/30 text-gray-400" :
                                                        prize.position === 3 ? "bg-amber-900/30 text-amber-700" :
                                                            "bg-gray-800/30 text-gray-500"
                                                }`}>
                                                <Trophy className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="text-lg font-medium text-gray-200">
                                                    {prize.position}
                                                    {prize.position === 1
                                                        ? "st"
                                                        : prize.position === 2
                                                            ? "nd"
                                                            : prize.position === 3
                                                                ? "rd"
                                                                : "th"}{" "}
                                                    Place
                                                </p>
                                                <p className="text-sm text-gray-400">
                                                    {prize.percentageShare}% of prize pool
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                                                {formatCurrency(prizePool * (prize.percentageShare / 100))}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-800">
                        <h3 className="text-lg font-semibold mb-3 flex items-center text-pink-400">
                            <CheckCircle className="h-5 w-5 mr-2" />
                            Prize Payout
                        </h3>
                        <div className="space-y-2 text-gray-300">
                            <p>All prizes will be distributed automatically to winners' wallets after the gameweek is completed and results are finalized.</p>
                            <p>In case of a tie, the prize money for the tied positions will be combined and split equally among the tied participants.</p>
                            <p>Winners can withdraw their prizes to their bank accounts at any time after they've been awarded.</p>
                        </div>
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
                </div>
            </CardContent>
        </Card>
    );
}