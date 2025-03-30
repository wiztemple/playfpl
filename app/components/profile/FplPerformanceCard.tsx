import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/app/components/ui/card';

interface FplPerformanceCardProps {
    userProfile: any;
    teamInfo: any;
}

export const FplPerformanceCard = ({ userProfile, teamInfo }: FplPerformanceCardProps) => (
    <Card className="backdrop-blur-md bg-gray-900/60 border border-gray-800 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-xl pointer-events-none"></div>
        <CardHeader className="relative z-10">
            <CardTitle className="text-gray-100">FPL Performance</CardTitle>
            <CardDescription className="text-gray-400">
                Statistics from your Fantasy Premier League team
            </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
            {!userProfile?.fplTeamId ? (
                <div className="bg-blue-900/30 border border-blue-800/50 text-blue-300 p-4 rounded-md text-center">
                    <p>Connect your FPL team to see performance statistics</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-500">Overall Rank</p>
                            <p className="text-xl font-bold text-gray-200">{teamInfo?.overallRank?.toLocaleString() || 'N/A'}</p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500">Total Points</p>
                            <p className="text-xl font-bold text-gray-200">{teamInfo?.totalPoints || '0'}</p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500">Team Value</p>
                            <p className="text-xl font-bold text-gray-200">£{teamInfo?.teamValue || '0.0'}m</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-500">Current Gameweek</p>
                            <p className="text-xl font-bold text-gray-200">GW {teamInfo?.currentGameweek || '30'}</p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500">Gameweek Points</p>
                            <p className="text-xl font-bold text-gray-200">{teamInfo?.gameweekPoints || '0'}</p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500">Transfers</p>
                            <p className="text-xl font-bold text-gray-200">{teamInfo?.transfersMade || '0'} / {teamInfo?.transfersAvailable || '0'}</p>
                        </div>
                    </div>
                </div>
            )}
        </CardContent>
    </Card>
);