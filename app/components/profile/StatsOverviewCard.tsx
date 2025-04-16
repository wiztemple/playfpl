import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/app/components/ui/card';
import { UserStats } from '@/app/types/user';
import { Trophy, Users, Percent, Banknote } from 'lucide-react';

interface StatsOverviewCardProps {
    stats: UserStats | null | undefined;
    formatCurrency: (amount: number) => string;
}

export const StatsOverviewCard = ({ stats, formatCurrency }: StatsOverviewCardProps) => (
    <Card className="md:col-span-2 backdrop-blur-md bg-gray-900/60 border border-gray-800 shadow-xl relative overflow-hidden">
        {/* Background divs remain the same */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-xl pointer-events-none"></div>
        <CardHeader className="relative z-10">
            <CardTitle className="text-gray-100">Stats Overview</CardTitle>
            <CardDescription className="text-gray-400">
                Your performance across all leagues
            </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Leagues Joined */}
                <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700/50">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-gray-400 text-sm">Leagues Joined</h3>
                        <Users className="h-4 w-4 text-indigo-400" />
                    </div>
                    {/* Use nullish coalescing for default */}
                    <p className="text-2xl font-bold text-gray-100">{stats?.leaguesJoined ?? 0}</p>
                </div>

                {/* Leagues Won */}
                <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700/50">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-gray-400 text-sm">Leagues Won</h3>
                        <Trophy className="h-4 w-4 text-amber-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-100">{stats?.leaguesWon ?? 0}</p>
                </div>

                {/* Win Rate */}
                <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700/50">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-gray-400 text-sm">Win Rate</h3>
                        <Percent className="h-4 w-4 text-emerald-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-100">
                        {/* Ensure both values exist for calculation */}
                        {(stats?.leaguesJoined != null && stats?.leaguesWon != null && stats.leaguesJoined > 0)
                            ? Math.round((stats.leaguesWon / stats.leaguesJoined) * 100)
                            : 0}%
                    </p>
                </div>

                {/* Total Winnings */}
                <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700/50">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-gray-400 text-sm">Total Winnings</h3>
                        <Banknote className="h-4 w-4 text-purple-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-100">
                        {formatCurrency(stats?.totalWinnings ?? 0)}
                    </p>
                </div>
            </div>

            {/* Recent Performance Section */}
            <div className="mt-6 bg-gray-800/40 rounded-lg p-4 border border-gray-700/50">
                <h3 className="text-gray-300 text-sm font-medium mb-3">Performance Metrics</h3>
                {/* Added flex-wrap and gap for better responsiveness */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Top 3 Finishes */}
                    <div className="text-center flex-1 min-w-[80px]"> {/* Added text-center, flex-1, min-w */}
                        <p className="text-gray-400 text-sm">Top 3 Finishes</p>
                        <p className="text-xl font-bold text-gray-100">{stats?.top3Finishes ?? 0}</p>
                    </div>
                    {/* Avg. Position */}
                    <div className="text-center flex-1 min-w-[80px]">
                        <p className="text-gray-400 text-sm">Avg. Position</p>
                        {/* Check specifically for null/undefined before toFixed */}
                        <p className="text-xl font-bold text-gray-100">{stats?.averagePosition != null ? stats.averagePosition.toFixed(1) : '-'}</p>
                    </div>
                    {/* ROI */}
                    <div className="text-center flex-1 min-w-[80px]">
                        <p className="text-gray-400 text-sm">ROI</p>
                        <p className="text-xl font-bold text-gray-100">
                            {/* Check specifically for null/undefined before toFixed */}
                            {stats?.roi != null ? `${stats.roi.toFixed(0)}%` : '0%'}
                        </p>
                    </div>
                </div>
            </div>
        </CardContent>
    </Card>
);