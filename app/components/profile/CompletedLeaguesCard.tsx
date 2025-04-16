// import Link from 'next/link';
// import {
//     Card,
//     CardContent,
//     CardDescription,
//     CardHeader,
//     CardTitle
// } from '@/app/components/ui/card';
// import { Trophy, Clock, ChevronRight, Banknote } from 'lucide-react';
// // --- Import the correct type ---
// import type { League } from '@/app/types'; // Use League (aliased to WeeklyLeaguePrisma)

// interface CompletedLeaguesCardProps {
//     // --- Change expected type ---
//     completedLeagues: League[];
//     formatCurrency: (amount: number) => string;
//     // Ensure formatDate prop can handle Date objects
//     formatDate: (date: Date | string | null | undefined) => string;
// }

// export const CompletedLeaguesCard = ({ completedLeagues, formatCurrency, formatDate }: CompletedLeaguesCardProps) => (
//     <Card className="backdrop-blur-md bg-gray-900/60 border border-gray-800 shadow-xl relative overflow-hidden">
//         {/* Background and Header remain the same */}
//         <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-xl pointer-events-none"></div>
//         <CardHeader className="relative z-10">
//             <CardTitle className="text-gray-100">Completed Leagues</CardTitle>
//             <CardDescription className="text-gray-400">
//                 Your recent league history
//             </CardDescription>
//         </CardHeader>
//         <CardContent className="relative z-10">
//             {completedLeagues.length === 0 ? (
//                 <div className="bg-blue-900/30 border border-blue-800/50 text-blue-300 p-4 rounded-md text-center">
//                     <p>You haven't participated in any completed leagues yet</p>
//                 </div>
//             ) : (
//                 <div className="space-y-3">
//                      {/* league is now type League */}
//                     {completedLeagues.map((league) => (
//                         <Link href={`/leagues/weekly/${league.id}`} key={league.id}>
//                             <div
//                                 className="p-4 rounded-lg border border-gray-800 bg-gray-800/50 hover:bg-gray-800/80 hover:border-indigo-500/50 transition-all duration-200 flex justify-between items-center"
//                             >
//                                 <div className="flex-1">
//                                     <h3 className="font-medium text-gray-200">{league.name}</h3>
//                                      {/* Use flex-wrap and gap for better responsiveness */}
//                                     <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
//                                         <div className="flex items-center text-sm text-gray-400">
//                                             <Trophy className="h-3.5 w-3.5 mr-1 text-indigo-400" />
//                                             GW {league.gameweek}
//                                         </div>
//                                         <div className="flex items-center text-sm text-gray-400">
//                                             <Banknote className="h-3.5 w-3.5 mr-1 text-emerald-400" />
//                                             {formatCurrency(league.entryFee)}
//                                         </div>
//                                         <div className="flex items-center text-sm text-gray-400">
//                                             <Clock className="h-3.5 w-3.5 mr-1 text-amber-400" />
//                                              {/* Pass the Date object from league.endDate */}
//                                             Ended {formatDate(league.endDate)}
//                                         </div>
//                                     </div>
//                                 </div>
//                                 <div className="flex items-center pl-2"> {/* Added padding left */}
//                                     <div className="mr-4 text-right">
//                                         <div className="text-sm text-gray-400">Final Rank</div>
//                                         {/* TODO: userRank needs separate data source */}
//                                         {/* Add safe check for currentParticipants */}
//                                         <div className={`font-medium text-gray-200`}>
//                                             {'-'}/{league.currentParticipants ?? '?'}
//                                         </div>
//                                     </div>
//                                     <ChevronRight className="h-5 w-5 text-gray-500 flex-shrink-0" /> {/* Added flex-shrink-0 */}
//                                 </div>
//                             </div>
//                         </Link>
//                     ))}
//                 </div>
//             )}
//         </CardContent>
//         {/* No Footer needed usually for completed list? Add if desired. */}
//     </Card>
// );

// app/components/profile/CompletedLeaguesCard.tsx
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Trophy, Clock, Banknote } from 'lucide-react'; // Removed unused ChevronRight
// --- Import the correct type ---
import type { MyLeagueInfo } from '@/app/types'; // Expect MyLeagueInfo
import React from 'react';
import { formatCurrency, formatDate } from '@/lib/utils'; // Assuming formatDate handles string input

interface CompletedLeaguesCardProps {
    // --- Change expected type ---
    completedLeagues: MyLeagueInfo[];
    formatCurrency: (amount: number) => string;
    formatDate: (date: string | null | undefined) => string; // Accept string from MyLeagueInfo
}

export const CompletedLeaguesCard = ({ completedLeagues, formatCurrency, formatDate }: CompletedLeaguesCardProps) => {
    return (
    <Card className="backdrop-blur-md bg-gray-900/60 border border-gray-800 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-xl pointer-events-none"></div>
        <CardHeader className="relative z-10">
            <CardTitle className="text-gray-100">Completed Leagues</CardTitle>
            <CardDescription className="text-gray-400"> Your recent league history </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
            {completedLeagues.length === 0 ? ( <div className="bg-blue-900/30 border border-blue-800/50 text-blue-300 p-4 rounded-md text-center"> <p>You haven't participated in any completed leagues yet</p> </div>
            ) : (
                <div className="space-y-3">
                    {/* Use MyLeagueInfo type here */}
                    {completedLeagues.map((league: MyLeagueInfo) => (
                        <Link href={`/leagues/weekly/${league.id}`} key={league.id}>
                            <div className="p-4 rounded-lg border border-gray-800 bg-gray-800/50 hover:bg-gray-800/80 hover:border-indigo-500/50 transition-all duration-200 flex justify-between items-center" >
                                <div className="flex-1">
                                    <h3 className="font-medium text-gray-200">{league.name}</h3>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                                        <div className="flex items-center text-sm text-gray-400"> <Trophy className="h-3.5 w-3.5 mr-1 text-indigo-400" /> GW {league.gameweek} </div>
                                        <div className="flex items-center text-sm text-gray-400"> <Banknote className="h-3.5 w-3.5 mr-1 text-emerald-400" /> {formatCurrency(league.entryFee)} {/* entryFee is number */} </div>
                                        <div className="flex items-center text-sm text-gray-400"> <Clock className="h-3.5 w-3.5 mr-1 text-amber-400" /> Ended {formatDate(league.endDate)} {/* endDate is string */} </div>
                                    </div>
                                </div>
                                <div className="flex items-center pl-2">
                                    <div className="mr-4 text-right">
                                        <div className="text-sm text-gray-400">Final Rank</div>
                                        <div className={`font-medium ${league.myResults?.rank && league.myResults.rank <= 3 ? 'text-yellow-400' : 'text-gray-200' }`}>
                                            {/* Use userRank from myResults */}
                                            {league.myResults?.rank ?? '-'}/{league.currentParticipants ?? '?'}
                                        </div>
                                        {/* Display winnings from myResults */}
                                        {(league.myResults?.winnings ?? 0) > 0 && (
                                             <div className="text-xs text-green-400 mt-0.5 font-semibold">+{formatCurrency(league.myResults!.winnings)}</div>
                                        )}
                                    </div>
                                    {/* <ChevronRight className="h-5 w-5 text-gray-500 flex-shrink-0" /> */}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </CardContent>
    </Card>
   );
}