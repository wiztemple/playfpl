"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Users, RefreshCw, MoreHorizontal, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from "lucide-react"; // Added Search icon
import { formatCurrency } from "@/lib/utils";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
} from "@/app/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/app/components/ui/table";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { Badge } from "@/app/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { Button } from "@/app/components/ui/button";
import { LeaderboardEntry } from "@/app/types"; // Assuming LeaderboardEntry type exists
import { toast } from "sonner";

interface LeaderboardCardProps {
    league: any;
    initialData?: { leaderboard: LeaderboardEntry[], meta: any }; // Optional initial data for SSR/ISR
    refreshInterval?: number;
    currentUserId?: string;
    pageSize?: number;
}

export default function LeaderboardCard({
    league,
    initialData,
    refreshInterval = 600000, // Default to 10 minutes refresh
    currentUserId,
    pageSize = 30
}: LeaderboardCardProps) {
    // --- State for Server-Side Pagination ---
    const [currentPageData, setCurrentPageData] = useState<LeaderboardEntry[]>(initialData?.leaderboard || []);
    const [currentPage, setCurrentPage] = useState<number>(initialData?.meta?.page || 1);
    const [rowsPerPage, setRowsPerPage] = useState<number>(pageSize);
    const [totalEntries, setTotalEntries] = useState<number>(initialData?.meta?.count || 0);
    const [totalPages, setTotalPages] = useState<number>(initialData?.meta?.totalPages || 1);
    const [isLoading, setIsLoading] = useState<boolean>(!initialData);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [lastRefreshed, setLastRefreshed] = useState<Date>(initialData?.meta?.timestamp ? new Date(initialData.meta.timestamp) : new Date());
    const [autoRefresh, setAutoRefresh] = useState<boolean>(league.status === 'active');
    const [currentLeagueStatus, setCurrentLeagueStatus] = useState<string>(initialData?.meta?.leagueStatus || league.status);
    // --- End State ---

    // --- Data Fetching Function ---
    const fetchLeaderboardPage = useCallback(async (page: number, limit: number, isManualRefresh = false) => {
        if (!isManualRefresh) {
            setIsLoading(true); // Show loader for page changes/auto-refresh
        } else {
            setIsRefreshing(true); // Show spinner for manual refresh button
        }

        try {
            // Construct API URL with pagination params
            const apiUrl = `/api/leagues/weekly/${league.id}/leaderboard?page=${page}&limit=${limit}&_=${Date.now()}`;
            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error(`API Error: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.leaderboard && data.meta) {
                setCurrentPageData(data.leaderboard);
                setTotalEntries(data.meta.count);
                setTotalPages(Math.max(1, data.meta.totalPages)); // Ensure at least 1 page
                setLastRefreshed(new Date(data.meta.timestamp));
                setCurrentLeagueStatus(data.meta.leagueStatus); // Update status based on API response
                // If the fetched page is different from current state, update currentPage
                // This handles cases like rowsPerPage change forcing a jump to page 1
                if (page !== currentPage) {
                    setCurrentPage(page);
                }
            } else {
                // Handle cases where data might be missing
                setCurrentPageData([]);
                setTotalEntries(0);
                setTotalPages(1);
                console.warn("Received empty or invalid data from API");
            }

        } catch (error) {
            console.error("Error fetching leaderboard page:", error);
            // Optionally: set an error state to display to the user
            setCurrentPageData([]); // Clear data on error
            setTotalEntries(0);
            setTotalPages(1);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [league.id, currentPage]); // Include currentPage here? Maybe not, fetch fn defines its own page

    // --- Effects ---

    // Initial fetch and fetch on page/limit change
    useEffect(() => {
        // Don't fetch if we had initial data and are on page 1 unless rowsPerPage changed
        if (initialData && currentPage === 1 && rowsPerPage === pageSize) {
            // Use initial data, maybe trigger a background refresh if needed?
            setIsLoading(false); // Ensure loading is false if using initial data
            return;
        }
        fetchLeaderboardPage(currentPage, rowsPerPage);
    }, [currentPage, rowsPerPage, league.id, fetchLeaderboardPage, initialData, pageSize]); // Dependencies for fetching

    // Auto-refresh interval
    useEffect(() => {
        const interval = setInterval(() => {
            // Only auto-refresh if enabled AND league is potentially active
            if (autoRefresh && (currentLeagueStatus === 'active' || currentLeagueStatus === 'upcoming')) {
                console.log(`Auto-refreshing page ${currentPage}...`);
                // Fetch the *current* page again
                fetchLeaderboardPage(currentPage, rowsPerPage);
            }
        }, refreshInterval);

        return () => clearInterval(interval);
    }, [autoRefresh, currentLeagueStatus, refreshInterval, currentPage, rowsPerPage, fetchLeaderboardPage]);

    // Update autoRefresh toggle based on league status from API
    useEffect(() => {
        setAutoRefresh(currentLeagueStatus === 'active');
    }, [currentLeagueStatus]);


    // --- Event Handlers ---

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
            setCurrentPage(newPage); // Trigger useEffect to fetch new page
        }
    };

    const refreshNow = () => {
        if (isRefreshing) return;
        fetchLeaderboardPage(currentPage, rowsPerPage, true); // Pass true for manual refresh
    };

    // --- Find User Position ---
    // const jumpToUserPosition = async () => {
    //     if (!currentUserId || isLoading || isRefreshing) return;
    //     setIsLoading(true); // Show loading indicator while finding user
    //     try {
    //         // New API endpoint needed: `/api/leagues/weekly/${league.id}/find-user-page`
    //         const findUrl = `/api/leagues/weekly/${league.id}/find-user-page?userId=${currentUserId}&limit=${rowsPerPage}`;
    //         const response = await fetch(findUrl);
    //         if (!response.ok) {
    //             throw new Error('Could not find user page');
    //         }
    //         const data = await response.json();
    //         if (data.page && data.page > 0) {
    //             handlePageChange(data.page); // Navigate to the user's page
    //         } else {
    //             console.warn("User not found in leaderboard or page couldn't be determined.");
    //             // Maybe show a toast notification?
    //         }
    //     } catch (error) {
    //         console.error("Error finding user position:", error);
    //         // Maybe show a toast notification?
    //     } finally {
    //         // setIsLoading(false); // Loading will be set false by fetchLeaderboardPage triggered by handlePageChange
    //     }
    // };
    const jumpToUserPosition = async () => {
        if (!currentUserId || isLoading || isRefreshing) return;
        setIsLoading(true); // <<< Loading starts here
        try {
            const findUrl = `/api/leagues/weekly/${league.id}/find-user-page?userId=${currentUserId}&limit=${rowsPerPage}`;
            console.log(`Finding user position: ${findUrl}`); // Add log
            const response = await fetch(findUrl);

            // Check response BEFORE trying to parse JSON
            if (!response.ok) {
                // Try to get error details from response body
                let errorBody = "No details available";
                try {
                    const errorData = await response.json();
                    errorBody = errorData.error || errorData.details || JSON.stringify(errorData);
                } catch (parseError) {
                    errorBody = await response.text(); // Fallback to text
                }
                console.error(`Error response from find-user-page: ${response.status} ${response.statusText}`, errorBody);
                // Throw a more informative error
                throw new Error(`Could not find user page (Status: ${response.status}). ${errorBody}`);
            }

            const data = await response.json();
            console.log("Find user page response:", data); // Log success response

            if (data.page && data.page > 0) {
                // Only change page if different to avoid unnecessary re-renders/fetches
                if (data.page !== currentPage) {
                    handlePageChange(data.page); // Navigate to the user's page
                } else {
                    console.log("User already on the correct page:", currentPage);
                    // If already on the page, we still need to stop loading
                    setIsLoading(false); // <<< ADD THIS CASE
                }
            } else {
                console.warn("User not found in leaderboard or page couldn't be determined.");
                toast.info("User position not found", { description: "You might not be in this league or data is syncing." });
                // Need to stop loading even if page isn't found
                setIsLoading(false); // <<< ADD THIS CASE
            }
        } catch (error) {
            console.error("Error in jumpToUserPosition:", error);
            toast.error("Error Finding Position", { description: error instanceof Error ? error.message : "Could not determine user page." });
            // Ensure loading stops on error
            setIsLoading(false); // <<< ENSURE THIS IS PRESENT ON ERROR
        } finally {
            // --- FIX: Ensure this is UNCOMMENTED and runs ---
            // This resets loading state regardless of success/failure within try block,
            // unless handlePageChange causes an immediate re-render that skips this frame (unlikely).
            // However, handle cases inside try/catch as well for clarity.
            // For safety, let's explicitly set it ONLY if handlePageChange wasn't called or failed.
            // Note: handlePageChange -> fetchLeaderboardPage also sets/unsets isLoading.
            // Let's rely on the catches above and fetchLeaderboardPage to handle it.
            // We can remove the finally block setting if covered above.
            // Let's keep it for now as a safety net if the above fails.
            console.log("Running jumpToUserPosition finally block");
            setIsLoading(false); // <<< ENSURE UNCOMMENTED
            // --- END FIX ---
        }
    };


    // --- Rendering Helpers ---
    const getRankBadge = (rank: number) => {
        // ... (keep existing implementation)
        switch (rank) {
            case 1:
                return <Badge variant="outline" className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">1st</Badge>;
            case 2:
                return <Badge variant="outline" className="bg-gray-400/20 text-gray-300 border-gray-400/30">2nd</Badge>;
            case 3:
                return <Badge variant="outline" className="bg-amber-700/20 text-amber-500 border-amber-700/30">3rd</Badge>;
            default:
                return <Badge variant="outline" className="bg-gray-700/20 text-gray-400 border-gray-700/30">{rank}th</Badge>;
        }
    };


    return (
        <div className="md:col-span-3 mt-6">
            <Card className="bg-gray-900/80 border border-gray-800 overflow-hidden backdrop-blur-sm shadow-lg">
                <CardHeader className="border-b border-gray-800 pb-3">
                    {/* Card Title & Actions - Adjusted for currentLeagueStatus */}
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center text-lg">
                            <Users className="h-5 w-5 mr-2 text-indigo-400" />
                            Leaderboard
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                            {/* Show refresh controls only if league is not completed */}
                            {currentLeagueStatus !== 'completed' && (
                                <>
                                    <span className="text-xs text-gray-400">
                                        Updated: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={refreshNow} // Use refreshNow
                                                    className="p-1.5 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
                                                    disabled={isRefreshing || isLoading} // Disable if loading anything
                                                >
                                                    <RefreshCw
                                                        className={`h-4 w-4 text-gray-300 ${isRefreshing ? 'animate-spin' : ''}`}
                                                    />
                                                </motion.button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Refresh leaderboard</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </>
                            )}
                            <DropdownMenu>
                                <DropdownMenuTrigger className="p-1.5 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors">
                                    <MoreHorizontal className="h-4 w-4 text-gray-300" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-gray-800 border-gray-700">
                                    {/* Toggle auto-refresh only if active */}
                                    {currentLeagueStatus === 'active' && (
                                        <DropdownMenuItem
                                            className="text-gray-200 focus:bg-gray-700 cursor-pointer"
                                            onClick={() => setAutoRefresh(!autoRefresh)}
                                        >
                                            {autoRefresh ? "Disable auto-refresh" : "Enable auto-refresh"}
                                        </DropdownMenuItem>
                                    )}
                                    {/* Show find position if user ID exists */}
                                    {currentUserId && (
                                        <DropdownMenuItem
                                            className="text-gray-200 focus:bg-gray-700 cursor-pointer flex items-center" // Added flex
                                            onClick={jumpToUserPosition}
                                            disabled={isLoading || isRefreshing} // Disable while loading
                                        >
                                            <Search className="h-4 w-4 mr-2" /> {/* Added Icon */}
                                            Find my position
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    {/* Card Description - Adjusted for currentLeagueStatus */}
                    <CardDescription>
                        {currentLeagueStatus === "upcoming"
                            ? "Participants who have joined this league (sorted by join time)"
                            : currentLeagueStatus === "active"
                                ? "Current standings in this league (sorted by points)"
                                : "Final standings and prize distribution (sorted by rank)"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
                        <Table>
                            {/* <TableHeader className="bg-gradient-to-r from-gray-900 to-gray-800">
                                <TableRow className="hover:bg-transparent border-gray-800">
                                    <TableHead className="w-16 text-xs font-semibold text-indigo-300">Rank</TableHead>
                                    <TableHead className="text-xs font-semibold text-purple-300">Player</TableHead>
                                    {currentLeagueStatus === "upcoming" ? (
                                        <TableHead className="text-right text-xs font-semibold text-cyan-300">Joined</TableHead>
                                    ) : (
                                        <>
                                            <TableHead className="text-right text-xs font-semibold text-blue-300">Start</TableHead>
                                            <TableHead className="text-right text-xs font-semibold text-emerald-300">GW</TableHead>
                                            <TableHead className="text-right text-xs font-semibold text-amber-300">Final</TableHead>
                                            {currentLeagueStatus === "completed" && (
                                                <TableHead className="text-right text-xs font-semibold text-green-300">Prize</TableHead>
                                            )}
                                        </>
                                    )}
                                </TableRow>
                            </TableHeader> */}
                            <TableHeader className="bg-gradient-to-r from-gray-900 to-gray-800">
                                <TableRow className="hover:bg-transparent border-gray-800">
                                    <TableHead className="w-16 text-xs font-semibold text-indigo-300">Rank</TableHead>
                                    <TableHead className="text-xs font-semibold text-purple-300">Player</TableHead>
                                    {/* Only show GW Points header when active/completed */}
                                    {currentLeagueStatus !== "upcoming" ? (
                                        <>
                                            <TableHead className="text-right text-xs font-semibold text-emerald-300">GW Points</TableHead>
                                            {/* Show Prize header only when completed */}
                                            {currentLeagueStatus === "completed" && (
                                                <TableHead className="text-right text-xs font-semibold text-green-300">Prize</TableHead>
                                            )}
                                        </>
                                    ) : (
                                        // Show Joined header when upcoming
                                        <TableHead className="text-right text-xs font-semibold text-cyan-300">Joined</TableHead>
                                    )}
                                </TableRow>
                            </TableHeader>
                            <TableBody className="bg-gray-900/50">
                                {/* Loading Skeleton Rows (Updated Structure) */}
                                {isLoading ? (
                                    Array.from({ length: rowsPerPage }).map((_, index) => (
                                        <TableRow key={`skeleton-${index}`} className="border-gray-800 animate-pulse">
                                            {/* Rank Skeleton */}
                                            <TableCell className="py-2 px-4"> <div className="h-6 w-10 bg-gray-800 rounded"></div> </TableCell>
                                            {/* Player Skeleton */}
                                            <TableCell className="py-2 px-4"> <div className="flex flex-col gap-2"> <div className="h-5 w-36 bg-gray-800 rounded"></div> <div className="h-4 w-28 bg-gray-800 rounded"></div> </div> </TableCell>
                                            {/* Conditional Columns Skeleton */}
                                            {currentLeagueStatus !== "upcoming" ? (
                                                <>
                                                    {/* GW Points Skeleton */}
                                                    <TableCell className="py-2 px-4 text-right"> <div className="h-7 w-14 bg-gray-800/70 rounded-full ml-auto"></div> </TableCell>
                                                    {/* Prize Skeleton (if completed) */}
                                                    {currentLeagueStatus === "completed" && (<TableCell className="py-2 px-4 text-right"> <div className="h-5 w-20 bg-gradient-to-r from-gray-800 to-gray-700 rounded ml-auto"></div> </TableCell>)}
                                                </>
                                            ) : (
                                                // Joined Date Skeleton
                                                <TableCell className="py-2 px-4 text-right"> <div className="h-5 w-20 bg-gray-800 rounded ml-auto"></div> </TableCell>
                                            )}
                                        </TableRow>
                                    ))
                                    // Data Rows (Updated Structure)
                                ) : currentPageData.length > 0 ? (
                                    currentPageData.map((entry, index) => {
                                        const isCurrentUser = currentUserId && (entry.userId === currentUserId || entry.id === currentUserId);
                                        return (
                                            <motion.tr key={entry.id || entry.userId || index} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className={`border-gray-800 hover:bg-gray-800/50 transition-colors ${entry.isGwWinner ? 'bg-green-900/20' : ''} ${isCurrentUser ? 'bg-indigo-900/30 border-l-2 border-r-2 border-indigo-500' : ''}`} >
                                                {/* Rank Cell */}
                                                <TableCell className="py-2 px-4"> {getRankBadge(entry.rank)} </TableCell>
                                                {/* Player Cell */}
                                                <TableCell className="py-2"> <div className="flex flex-col"> <div className="flex items-center"> <span className="font-medium text-gray-200">{entry.userName || entry.name || entry?.user?.name || 'N/A'}</span> {isCurrentUser && (<span className="ml-2 px-1.5 py-0.5 text-xs bg-indigo-500/30 text-indigo-300 rounded-sm"> You </span>)} </div> <span className="text-xs text-gray-400">{entry.teamName || entry.entry_name || entry?.entry?.name || 'N/A'}</span> </div> </TableCell>
                                                {/* Conditional Columns */}
                                                {currentLeagueStatus !== "upcoming" ? (
                                                    <>
                                                        {/* Gameweek Points Cell */}
                                                        <TableCell className="text-right whitespace-nowrap py-2 px-4">
                                                            <Badge variant="outline" className={`${(entry.weeklyPoints ?? entry.gwPoints ?? 0) > (league?.currentHighestGwPoints ?? 0) * 0.9 ? 'bg-emerald-900/30 text-emerald-300 border-emerald-500/30 font-semibold' : (entry.weeklyPoints ?? entry.gwPoints ?? 0) > 0 ? 'bg-gray-800/70 text-gray-200 border-gray-700/50' : 'bg-gray-800/50 text-gray-400 border-gray-700'}`}>
                                                                {/* Display weeklyPoints (or gwPoints fallback) */}
                                                                {entry.weeklyPoints ?? entry.gwPoints ?? "0"}
                                                            </Badge>
                                                        </TableCell>
                                                        {/* Prize Cell (Completed only) */}
                                                        {currentLeagueStatus === "completed" && (
                                                            <TableCell className="text-right whitespace-nowrap py-2 px-4">
                                                                {entry.winnings != null && entry.winnings > 0 ? (<span className="font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent"> {formatCurrency(entry.winnings)} </span>) : (<span className="text-gray-500">-</span>)}
                                                            </TableCell>
                                                        )}
                                                    </>
                                                ) : (
                                                    // Joined Date Cell (Upcoming only)
                                                    <TableCell className="text-right text-sm text-gray-300 py-2 px-4"> {entry.joinedAt ? new Date(entry.joinedAt).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }) : "-"} </TableCell>
                                                )}
                                            </motion.tr>
                                        );
                                    })
                                    // Empty State Row (Updated Colspan)
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            // Adjust colspan based on status
                                            colSpan={currentLeagueStatus === "upcoming" ? 3 : (currentLeagueStatus === "completed" ? 4 : 3)}
                                            className="h-48 text-center"
                                        >
                                            <div className="flex flex-col items-center justify-center space-y-3"> <Users className="h-8 w-8 text-gray-600" /> <p className="text-gray-500"> {currentLeagueStatus === "upcoming" ? "No one has joined yet" : "No participants found"} </p> </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                {/* --- Footer with Pagination Controls --- */}
                {/* Conditionally render footer only if there are entries or multiple pages */}
                {(totalEntries > 0 || totalPages > 1) && (
                    <CardFooter className="border-t border-gray-800 p-2 flex justify-between items-center flex-wrap gap-2">
                        {/* Info Text */}
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                            {/* Use totalEntries state */}
                            <span>
                                Showing {currentPageData.length ? (currentPage - 1) * rowsPerPage + 1 : 0}-
                                {Math.min(currentPage * rowsPerPage, totalEntries)} of {totalEntries}
                            </span>
                            {/* Use totalPages state */}
                            <span className="hidden sm:inline text-gray-500">|</span>
                            <span className="hidden sm:inline">Page {currentPage}/{totalPages}</span>
                        </div>

                        {/* Pagination Buttons */}
                        {totalPages > 1 && ( // Only show buttons if more than one page
                            <div className="flex items-center">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 p-0 bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-gray-200 disabled:opacity-50"
                                    onClick={() => handlePageChange(1)}
                                    disabled={currentPage === 1 || isLoading || isRefreshing} // Disable while loading
                                >
                                    <ChevronsLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 p-0 ml-1 bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-gray-200 disabled:opacity-50"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1 || isLoading || isRefreshing} // Disable while loading
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>

                                {/* Page Number Display (Optional - can get complex) */}
                                {/* Simple text display */}
                                <span className="px-3 text-sm font-medium text-gray-300">{currentPage} / {totalPages}</span>
                                {/* Add more complex page number buttons if needed */}

                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 p-0 ml-1 bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-gray-200 disabled:opacity-50"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    // Use totalPages state for disabling
                                    disabled={currentPage === totalPages || isLoading || isRefreshing} // Disable while loading
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 p-0 ml-1 bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-gray-200 disabled:opacity-50"
                                    onClick={() => handlePageChange(totalPages)}
                                    // Use totalPages state for disabling
                                    disabled={currentPage === totalPages || isLoading || isRefreshing} // Disable while loading
                                >
                                    <ChevronsRight className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}