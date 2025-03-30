import Link from 'next/link';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/app/components/ui/card';
import { Trophy, DollarSign, Clock, ChevronRight } from 'lucide-react';
import { UserLeague } from '@/app/types';


interface CompletedLeaguesCardProps {
    completedLeagues: UserLeague[];
    formatCurrency: (amount: number) => string;
    formatDate: (date: string) => string;
}

export const CompletedLeaguesCard = ({ completedLeagues, formatCurrency, formatDate }: CompletedLeaguesCardProps) => (
    <Card className="backdrop-blur-md bg-gray-900/60 border border-gray-800 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-xl pointer-events-none"></div>
        <CardHeader className="relative z-10">
            <CardTitle className="text-gray-100">Completed Leagues</CardTitle>
            <CardDescription className="text-gray-400">
                Your recent league history
            </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
            {completedLeagues.length === 0 ? (
                <div className="bg-blue-900/30 border border-blue-800/50 text-blue-300 p-4 rounded-md text-center">
                    <p>You haven't participated in any completed leagues yet</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {completedLeagues.map((league) => (
                        <Link href={`/leagues/weekly/${league.id}`} key={league.id}>
                            <div
                                className="p-4 rounded-lg border border-gray-800 bg-gray-800/50 hover:bg-gray-800/80 hover:border-indigo-500/50 transition-all duration-200 flex justify-between items-center"
                            >
                                <div className="flex-1">
                                    <h3 className="font-medium text-gray-200">{league.name}</h3>
                                    <div className="flex items-center gap-4 mt-1">
                                        <div className="flex items-center text-sm text-gray-400">
                                            <Trophy className="h-3.5 w-3.5 mr-1 text-indigo-400" />
                                            GW {league.gameweek}
                                        </div>
                                        <div className="flex items-center text-sm text-gray-400">
                                            <DollarSign className="h-3.5 w-3.5 mr-1 text-emerald-400" />
                                            {formatCurrency(league.entryFee)}
                                        </div>
                                        <div className="flex items-center text-sm text-gray-400">
                                            <Clock className="h-3.5 w-3.5 mr-1 text-amber-400" />
                                            Ended {formatDate(league.endDate)}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <div className="mr-4 text-right">
                                        <div className="text-sm text-gray-400">Final Rank</div>
                                        <div className={`font-medium ${league.userRank && league.userRank <= 3
                                            ? 'text-yellow-400'
                                            : 'text-gray-200'
                                            }`}>
                                            {league.userRank || '-'}/{league.currentParticipants}
                                        </div>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-gray-500" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </CardContent>
    </Card>
);