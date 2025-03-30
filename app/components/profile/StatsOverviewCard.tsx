import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/app/components/ui/card';
import { Trophy, Users, DollarSign, Percent } from 'lucide-react';

interface StatsOverviewCardProps {
    stats: any;
    formatCurrency: (amount: number) => string;
}

export const StatsOverviewCard = ({ stats, formatCurrency }: StatsOverviewCardProps) => (
    <Card className="md:col-span-2 backdrop-blur-md bg-gray-900/60 border border-gray-800 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-xl pointer-events-none"></div>
        <CardHeader className="relative z-10">
            <CardTitle className="text-gray-100">Stats Overview</CardTitle>
            <CardDescription className="text-gray-400">
                Your performance across all leagues
            </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700/50">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-gray-400 text-sm">Leagues Joined</h3>
                        <Users className="h-4 w-4 text-indigo-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-100">{stats?.leaguesJoined || 0}</p>
                </div>

                <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700/50">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-gray-400 text-sm">Leagues Won</h3>
                        <Trophy className="h-4 w-4 text-amber-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-100">{stats?.leaguesWon || 0}</p>
                </div>

                <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700/50">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-gray-400 text-sm">Win Rate</h3>
                        <Percent className="h-4 w-4 text-emerald-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-100">
                        {stats?.leaguesJoined
                            ? Math.round((stats.leaguesWon / stats.leaguesJoined) * 100)
                            : 0}%
                    </p>
                </div>

                <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700/50">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-gray-400 text-sm">Total Winnings</h3>
                        <DollarSign className="h-4 w-4 text-purple-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-100">
                        {formatCurrency(stats?.totalWinnings || 0)}
                    </p>
                </div>
            </div>

            <div className="mt-6 bg-gray-800/40 rounded-lg p-4 border border-gray-700/50">
                <h3 className="text-gray-300 text-sm font-medium mb-3">Recent Performance</h3>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-sm">Top 3 Finishes</p>
                        <p className="text-xl font-bold text-gray-100">{stats?.top3Finishes || 0}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">Avg. Position</p>
                        <p className="text-xl font-bold text-gray-100">{stats?.averagePosition?.toFixed(1) || '-'}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">ROI</p>
                        <p className="text-xl font-bold text-gray-100">
                            {stats?.roi ? `${stats.roi.toFixed(0)}%` : '0%'}
                        </p>
                    </div>
                </div>
            </div>
        </CardContent>
    </Card>
);