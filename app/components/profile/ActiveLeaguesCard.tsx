// // app/components/profile/ActiveLeaguesCard.tsx

// import Link from 'next/link';
// import {
//     Card,
//     CardContent,
//     CardDescription,
//     CardFooter,
//     CardHeader,
//     CardTitle
// } from '@/app/components/ui/card';
// import { Button } from '@/app/components/ui/button';
// import { Trophy, Clock, ChevronRight, Banknote } from 'lucide-react';
// // Import the correct type
// import type { League } from '@/app/types'; // Use League (aliased to WeeklyLeaguePrisma)

// interface ActiveLeaguesCardProps {
//     activeLeagues: League[]; // Expect array of the main League type
//     formatCurrency: (amount: number) => string;
//     // Ensure formatDate prop can handle Date objects
//     formatDate: (date: Date | string | null | undefined) => string;
// }

// export const ActiveLeaguesCard = ({ activeLeagues, formatCurrency, formatDate }: ActiveLeaguesCardProps) => (
//     <Card className="backdrop-blur-md bg-gray-900/60 border border-gray-800 shadow-xl relative overflow-hidden">
//         <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-xl pointer-events-none"></div>
//         <CardHeader className="relative z-10">
//             <CardTitle className="text-gray-100">Active Leagues</CardTitle>
//             <CardDescription className="text-gray-400">
//                 Leagues you are currently participating in
//             </CardDescription>
//         </CardHeader>
//         <CardContent className="relative z-10">
//             {activeLeagues.length === 0 ? (
//                 <div className="bg-blue-900/30 border border-blue-800/50 text-blue-300 p-4 rounded-md text-center">
//                     <p>You are not currently participating in any active leagues</p>
//                     <Link href="/leagues/weekly" className="mt-2 inline-block">
//                         <Button variant="outline" className="mt-2 border-blue-600/40 bg-blue-950/30 text-blue-300 hover:bg-blue-900/40 hover:text-blue-200">
//                             Browse Leagues
//                         </Button>
//                     </Link>
//                 </div>
//             ) : (
//                 <div className="space-y-3">
//                     {activeLeagues.map((league) => {
//                         // --- FIX: Convert entryFee to number for formatting ---
//                         let entryFeeNumber: number = 0;
//                         const rawEntryFee = league?.entryFee; // This has Decimal type according to League/WeeklyLeaguePrisma
//                         if (rawEntryFee != null) {
//                             if (typeof rawEntryFee === 'number') {
//                                 entryFeeNumber = rawEntryFee; // Already a number (API might have converted)
//                             } else if (typeof (rawEntryFee as any)?.toNumber === 'function') {
//                                 entryFeeNumber = (rawEntryFee as any).toNumber(); // It's a Decimal object
//                             } else {
//                                 // Fallback if it's string or other
//                                 entryFeeNumber = parseFloat(String(rawEntryFee));
//                             }
//                         }
//                         if (isNaN(entryFeeNumber)) { entryFeeNumber = 0; }
//                         // --- END FIX ---

//                         return (
//                             <Link href={`/leagues/weekly/${league.id}`} key={league.id}>
//                                 <div
//                                     className="p-4 rounded-lg border border-gray-800 bg-gray-800/50 hover:bg-gray-800/80 hover:border-indigo-500/50 transition-all duration-200 flex justify-between items-center"
//                                 >
//                                     <div className="flex-1">
//                                         <h3 className="font-medium text-gray-200">{league.name}</h3>
//                                         <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
//                                             <div className="flex items-center text-sm text-gray-400">
//                                                 <Trophy className="h-3.5 w-3.5 mr-1 text-indigo-400" />
//                                                 GW {league.gameweek}
//                                             </div>
//                                             <div className="flex items-center text-sm text-gray-400">
//                                                 <Banknote className="h-3.5 w-3.5 mr-1 text-emerald-400" />
//                                                 {/* Use the converted number */}
//                                                 {formatCurrency(entryFeeNumber)}
//                                             </div>
//                                             <div className="flex items-center text-sm text-gray-400">
//                                                 <Clock className="h-3.5 w-3.5 mr-1 text-amber-400" />
//                                                 {/* Pass the Date object from league.endDate */}
//                                                 Ends {formatDate(league.endDate)}
//                                             </div>
//                                         </div>
//                                     </div>
//                                     <div className="flex items-center pl-2">
//                                         <div className="mr-4 text-right">
//                                             <div className="text-sm text-gray-400">Rank</div>
//                                             <div className="font-medium text-gray-200">
//                                                 {/* TODO: userRank needs separate data source */}
//                                                 {'-'}/{league.currentParticipants ?? '?'}
//                                             </div>
//                                         </div>
//                                         <ChevronRight className="h-5 w-5 text-gray-500 flex-shrink-0" />
//                                     </div>
//                                 </div>
//                             </Link>
//                         );
//                     })}
//                 </div>
//             )}
//         </CardContent>
//         {activeLeagues.length > 0 && (
//             <CardFooter className="relative z-10 mt-4">
//                 <Link href="/leagues/weekly" className="w-full">
//                     <Button variant="outline" className="w-full border-indigo-600/40 bg-indigo-950/30 text-indigo-300 hover:bg-indigo-900/40 hover:text-indigo-200">
//                         View All Leagues
//                     </Button>
//                 </Link>
//             </CardFooter>
//         )}
//     </Card>
// );
// app/components/profile/ActiveLeaguesCard.tsx
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Trophy, Clock, Banknote } from 'lucide-react'; // Removed unused ChevronRight
import type { MyLeagueInfo } from '@/app/types'; // <<< Use the specific type
import React from 'react';
import { formatCurrency, formatDate } from '@/lib/utils'; // Assuming formatDate handles string input

interface ActiveLeaguesCardProps {
    activeLeagues: MyLeagueInfo[]; // <<< Use the specific type
    formatCurrency: (amount: number) => string;
    formatDate: (date: string | null | undefined) => string; // Accept string from MyLeagueInfo
}

export const ActiveLeaguesCard = ({ activeLeagues, formatCurrency, formatDate }: ActiveLeaguesCardProps) => {
   return (
    <Card className="backdrop-blur-md bg-gray-900/60 border border-gray-800 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-xl pointer-events-none"></div>
        <CardHeader className="relative z-10">
            <CardTitle className="text-gray-100">Active Leagues</CardTitle>
            <CardDescription className="text-gray-400"> Leagues you are currently participating in </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
            {activeLeagues.length === 0 ? (
                 <div className="bg-blue-900/30 border border-blue-800/50 text-blue-300 p-4 rounded-md text-center"> <p>You are not currently participating in any active leagues</p> <Link href="/leagues/weekly" className="mt-2 inline-block"> <Button variant="outline" className="mt-2 border-blue-600/40 bg-blue-950/30 text-blue-300 hover:bg-blue-900/40 hover:text-blue-200"> Browse Leagues </Button> </Link> </div>
            ) : (
                <div className="space-y-3">
                    {/* Use MyLeagueInfo type here */}
                    {activeLeagues.map((league: MyLeagueInfo) => (
                        <Link href={`/leagues/weekly/${league.id}`} key={league.id}>
                            <div className="p-4 rounded-lg border border-gray-800 bg-gray-800/50 hover:bg-gray-800/80 hover:border-indigo-500/50 transition-all duration-200 flex justify-between items-center" >
                                <div className="flex-1">
                                    <h3 className="font-medium text-gray-200">{league.name}</h3>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                                        <div className="flex items-center text-sm text-gray-400"> <Trophy className="h-3.5 w-3.5 mr-1 text-indigo-400" /> GW {league.gameweek} </div>
                                        <div className="flex items-center text-sm text-gray-400"> <Banknote className="h-3.5 w-3.5 mr-1 text-emerald-400" /> {formatCurrency(league.entryFee)} {/* entryFee is number */} </div>
                                        <div className="flex items-center text-sm text-gray-400"> <Clock className="h-3.5 w-3.5 mr-1 text-amber-400" /> Ends {formatDate(league.endDate)} {/* endDate is string */} </div>
                                    </div>
                                </div>
                                <div className="flex items-center pl-2">
                                    <div className="mr-4 text-right">
                                        <div className="text-sm text-gray-400">Rank</div>
                                        <div className="font-medium text-gray-200">
                                            {/* Use userRank from MyLeagueInfo */}
                                            {league.userRank ?? '-'}/{league.currentParticipants ?? '?'}
                                        </div>
                                    </div>
                                    {/* <ChevronRight className="h-5 w-5 text-gray-500 flex-shrink-0" /> */}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </CardContent>
        {activeLeagues.length > 0 && ( <CardFooter className="relative z-10 mt-4"> <Link href="/leagues/weekly" className="w-full"> <Button variant="outline" className="w-full border-indigo-600/40 bg-indigo-950/30 text-indigo-300 hover:bg-indigo-900/40 hover:text-indigo-200"> View All Leagues </Button> </Link> </CardFooter> )}
    </Card>
   );
}