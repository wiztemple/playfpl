import Link from 'next/link';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Trophy, DollarSign, Clock, ChevronRight } from 'lucide-react';
import { UserLeague } from '@/app/types';

interface ActiveLeaguesCardProps {
    activeLeagues: UserLeague[];
    formatCurrency: (amount: number) => string;
    formatDate: (date: string) => string;
}

export const ActiveLeaguesCard = ({ activeLeagues, formatCurrency, formatDate }: ActiveLeaguesCardProps) => (
    <Card className="backdrop-blur-md bg-gray-900/60 border border-gray-800 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-xl pointer-events-none"></div>
        <CardHeader className="relative z-10">
            <CardTitle className="text-gray-100">Active Leagues</CardTitle>
            <CardDescription className="text-gray-400">
                Leagues you are currently participating in
            </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
            {activeLeagues.length === 0 ? (
                <div className="bg-blue-900/30 border border-blue-800/50 text-blue-300 p-4 rounded-md text-center">
                    <p>You are not currently participating in any active leagues</p>
                    <Link href="/leagues/weekly" className="mt-2 inline-block">
                        <Button variant="outline" className="mt-2 border-blue-600/40 bg-blue-950/30 text-blue-300 hover:bg-blue-900/40 hover:text-blue-200">
                            Browse Leagues
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {activeLeagues.map((league) => (
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
                                            Ends {formatDate(league.endDate)}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <div className="mr-4 text-right">
                                        <div className="text-sm text-gray-400">Current Rank</div>
                                        <div className="font-medium text-gray-200">
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
        {activeLeagues.length > 0 && (
            <CardFooter className="relative z-10">
                <Link href="/leagues/weekly" className="w-full">
                    <Button variant="outline" className="w-full border-indigo-600/40 bg-indigo-950/30 text-indigo-300 hover:bg-indigo-900/40 hover:text-indigo-200">
                        View All Leagues
                    </Button>
                </Link>
            </CardFooter>
        )}
    </Card>
);