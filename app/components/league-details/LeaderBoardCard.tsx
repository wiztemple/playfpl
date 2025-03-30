"use client";

import { motion } from "framer-motion";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/app/components/ui/card";
import { Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface LeaderboardCardProps {
    league: any;
    leaderboard: any[];
}

export default function LeaderboardCard({ league, leaderboard }: LeaderboardCardProps) {
    return (
        <div className="md:col-span-3 mt-8">
            <Card className="bg-gray-900/80 border border-gray-800 overflow-hidden backdrop-blur-sm shadow-lg">
                <CardHeader className="border-b border-gray-800">
                    <CardTitle className="flex items-center">
                        <Users className="h-5 w-5 mr-2 text-indigo-400" />
                        Leaderboard
                    </CardTitle>
                    <CardDescription>
                        {league.status === "upcoming"
                            ? "Participants who have joined this league"
                            : league.status === "active"
                                ? "Current standings in this league"
                                : "Final standings and prize distribution"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
                        <table className="w-full min-w-full divide-y divide-gray-800">
                            <thead>
                                <tr className="bg-gradient-to-r from-gray-900 to-gray-800">
                                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-indigo-300 uppercase tracking-wider">Rank</th>
                                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">Manager</th>
                                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-pink-300 uppercase tracking-wider">Team</th>
                                    {league.status === "upcoming" ? (
                                        <th className="px-4 py-3.5 text-right text-xs font-semibold text-cyan-300 uppercase tracking-wider">Joined</th>
                                    ) : (
                                        <>
                                            <th className="px-4 py-3.5 text-right text-xs font-semibold text-blue-300 uppercase tracking-wider">
                                                Starting Points
                                            </th>
                                            <th className="px-4 py-3.5 text-right text-xs font-semibold text-emerald-300 uppercase tracking-wider">GW Points</th>
                                            <th className="px-4 py-3.5 text-right text-xs font-semibold text-amber-300 uppercase tracking-wider">Final Points</th>
                                            <th className="px-4 py-3.5 text-right text-xs font-semibold text-green-300 uppercase tracking-wider">Winnings</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800 bg-gray-900/50">
                                {leaderboard.length > 0 ? (
                                    leaderboard.map((entry, index) => (
                                        <motion.tr
                                            key={entry.userId}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3, delay: 0.05 * index }}
                                            className="hover:bg-gray-800/50 transition-colors duration-150 ease-in-out"
                                            whileHover={{
                                                backgroundColor: "rgba(31, 41, 55, 0.5)",
                                                transition: { duration: 0.2 }
                                            }}
                                        >
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium ${entry.rank === 1 ? "bg-yellow-500/20 text-yellow-300" :
                                                        entry.rank === 2 ? "bg-gray-400/20 text-gray-300" :
                                                            entry.rank === 3 ? "bg-amber-700/20 text-amber-500" :
                                                                "bg-gray-700/20 text-gray-400"
                                                        }`}>
                                                        {entry.rank || index + 1}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-200">{entry.userName}</div>
                                            </td>
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                <div className="text-sm text-gray-300">{entry.teamName}</div>
                                            </td>
                                            {league.status === "upcoming" ? (
                                                <td className="px-4 py-3.5 text-right whitespace-nowrap text-sm text-gray-300">
                                                    {entry.joinedAt
                                                        ? new Date(entry.joinedAt).toLocaleDateString()
                                                        : "-"}
                                                </td>
                                            ) : (
                                                <>
                                                    <td className="px-4 py-3.5 text-right whitespace-nowrap text-sm text-blue-300 font-medium">
                                                        {entry.startPoints || "-"}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-900/30 text-emerald-300">
                                                            {entry.weeklyPoints || "-"}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right whitespace-nowrap text-sm text-amber-300 font-medium">
                                                        {entry.finalPoints || "-"}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                                        <div className="text-sm font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                                                            {formatCurrency(entry.winnings || 0)}
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                        </motion.tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={league.status === "upcoming" ? 4 : 7}
                                            className="px-4 py-12 text-center text-gray-500"
                                        >
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <Users className="h-8 w-8 text-gray-600" />
                                                <p>
                                                    {league.status === "upcoming"
                                                        ? "No one has joined this league yet"
                                                        : "No participants yet"}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}