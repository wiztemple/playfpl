"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Users,
  RefreshCw,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Trophy,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils"; // Adjust path
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
// Import the specific leaderboard entry type returned by the API
import type { DisplayedLeaderboardEntry, League } from "@/app/types"; // Adjust path
import { toast } from "sonner";
import Loading from "@/app/components/shared/Loading"; // Adjust path

// Define the expected shape of the league prop for this component
interface LeaderboardLeagueInfo
  extends Pick<
    League,
    "id" | "status" | "gameweek" | "currentHighestGwPoints"
  > {}

interface LeaderboardCardProps {
  league: LeaderboardLeagueInfo; // Expect only necessary league info
  initialData?: { leaderboard: DisplayedLeaderboardEntry[]; meta: any }; // For SSR/ISR
  refreshInterval?: number;
  currentUserId?: string | null; // Can be null if user not logged in
  pageSize?: number;
}

export default function LeaderboardCard({
  league,
  initialData,
  refreshInterval = 60000, // Default to 1 minute refresh for active leagues
  currentUserId,
  pageSize = 30, // Default items per page
}: LeaderboardCardProps) {
  // --- State ---
  const [currentPageData, setCurrentPageData] = useState<
    DisplayedLeaderboardEntry[]
  >(initialData?.leaderboard || []);
  const [currentPage, setCurrentPage] = useState<number>(
    initialData?.meta?.page || 1
  );
  const [rowsPerPage, setRowsPerPage] = useState<number>(pageSize); // Keep if allowing user to change limit
  const [totalEntries, setTotalEntries] = useState<number>(
    initialData?.meta?.count || 0
  );
  const [totalPages, setTotalPages] = useState<number>(
    initialData?.meta?.totalPages || 1
  );
  const [isLoading, setIsLoading] = useState<boolean>(!initialData);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(
    initialData?.meta?.timestamp
      ? new Date(initialData.meta.timestamp)
      : new Date()
  );
  // Use league status passed in props initially, fetchLeaderboardPage will update it
  const [currentLeagueStatus, setCurrentLeagueStatus] = useState<string>(
    initialData?.meta?.leagueStatus || league.status
  );
  const [autoRefresh, setAutoRefresh] = useState<boolean>(
    currentLeagueStatus === "active"
  );
  const [findUserError, setFindUserError] = useState<string | null>(null);

  // --- Data Fetching ---
  const fetchLeaderboardPage = useCallback(
    async (page: number, limit: number, isManualRefresh = false) => {
      if (!league?.id) return; // Don't fetch without league ID

      if (!isManualRefresh) setIsLoading(true);
      else setIsRefreshing(true);
      setFindUserError(null); // Clear previous find user errors on fetch

      try {
        const apiUrl = `/api/leagues/weekly/${
          league.id
        }/leaderboard?page=${page}&limit=${limit}&_=${Date.now()}`;
        const response = await fetch(apiUrl);
        const data = await response.json(); // Always try to parse

        if (!response.ok) {
          throw new Error(
            data.error || data.details || `API Error: ${response.statusText}`
          );
        }

        if (data.leaderboard && data.meta) {
          // Ensure data types match DisplayedLeaderboardEntry (API should handle conversion)
          setCurrentPageData(data.leaderboard as DisplayedLeaderboardEntry[]);
          setTotalEntries(data.meta.count);
          setTotalPages(Math.max(1, data.meta.totalPages));
          setLastRefreshed(new Date(data.meta.timestamp));
          setCurrentLeagueStatus(data.meta.leagueStatus);
          // Only update currentPage state if the fetch was for a *different* page
          // to avoid loops if rowsPerPage changes pagination logic
          if (page !== currentPage && !isManualRefresh) {
            setCurrentPage(page);
          } else if (page === 1 && currentPage !== 1 && !isManualRefresh) {
            // Handle case where changing rowsPerPage resets page to 1
            setCurrentPage(1);
          }
        } else {
          throw new Error("Received empty or invalid data from API");
        }
      } catch (error) {
        console.error("Error fetching leaderboard page:", error);
        toast.error("Failed to load leaderboard", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
        setCurrentPageData([]); // Clear data on error
        setTotalEntries(0);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [league?.id, currentPage, rowsPerPage]
  ); // Add rowsPerPage dependency

  // --- Effects ---
  // Initial fetch & fetch on page change
  useEffect(() => {
    // Skip initial fetch if initialData for page 1 is provided
    if (initialData && currentPage === 1 && rowsPerPage === pageSize) {
      setIsLoading(false);
      return;
    }
    console.log(`Workspaceing page ${currentPage}`);
    fetchLeaderboardPage(currentPage, rowsPerPage);
  }, [
    currentPage,
    rowsPerPage,
    league?.id,
    fetchLeaderboardPage,
    initialData,
    pageSize,
  ]); // Rerun if page or limit changes

  // Auto-refresh interval
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (autoRefresh && currentLeagueStatus === "active") {
      console.log(
        `Starting auto-refresh for page ${currentPage} every ${refreshInterval}ms`
      );
      intervalId = setInterval(() => {
        console.log(`Auto-refreshing page ${currentPage}...`);
        fetchLeaderboardPage(currentPage, rowsPerPage); // Fetch current page data
      }, refreshInterval);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    }; // Cleanup interval
  }, [
    autoRefresh,
    currentLeagueStatus,
    refreshInterval,
    currentPage,
    rowsPerPage,
    fetchLeaderboardPage,
  ]);

  // Update autoRefresh toggle based on latest league status
  useEffect(() => {
    setAutoRefresh(currentLeagueStatus === "active");
  }, [currentLeagueStatus]);

  // --- Event Handlers ---
  const handlePageChange = (newPage: number) => {
    const pageToGo = Math.max(1, Math.min(newPage, totalPages)); // Clamp page number
    if (pageToGo !== currentPage) {
      setCurrentPage(pageToGo); // Set state, useEffect will trigger fetch
    }
  };

  const refreshNow = () => {
    if (!isRefreshing && !isLoading)
      fetchLeaderboardPage(currentPage, rowsPerPage, true);
  };

  const jumpToUserPosition = async () => {
    if (!currentUserId || isLoading || isRefreshing) return;
    setIsLoading(true);
    setFindUserError(null); // Show loading, clear error
    try {
      const findUrl = `/api/leagues/weekly/${league.id}/find-user-page?userId=${currentUserId}&limit=${rowsPerPage}`;
      const response = await fetch(findUrl);
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.error || data.details || "Could not find user page"
        );

      if (data.page && data.page > 0) {
        if (data.page !== currentPage) {
          handlePageChange(data.page); // Navigate (sets state, triggers fetch)
        } else {
          toast.info("You are already on your page.");
          setIsLoading(false); // Already on page, stop loading indicator
        }
      } else {
        toast.error("User position not found", {
          description: data.message || "You might not be in this league.",
        });
        setIsLoading(false); // User not found, stop loading
      }
    } catch (error) {
      console.error("Error in jumpToUserPosition:", error);
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Could not determine user page.";
      setFindUserError(errorMsg); // Set specific error state
      toast.error("Error Finding Position", { description: errorMsg });
      setIsLoading(false); // Stop loading on error
    }
    // NOTE: Removed finally block setting isLoading false, handled within try/catch now
  };

  // --- Rendering Helpers ---
  const getRankBadge = (rank: number | null | undefined): React.ReactNode => {
    if (rank == null || rank <= 0)
      return <span className="text-gray-500">-</span>;
    switch (rank) {
      case 1:
        return (
          <Badge
            variant="outline"
            className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 px-1.5 py-0.5 text-xs"
          >
            1st
          </Badge>
        );
      case 2:
        return (
          <Badge
            variant="outline"
            className="bg-gray-400/20 text-gray-300 border-gray-400/30 px-1.5 py-0.5 text-xs"
          >
            2nd
          </Badge>
        );
      case 3:
        return (
          <Badge
            variant="outline"
            className="bg-amber-700/20 text-amber-500 border-amber-700/30 px-1.5 py-0.5 text-xs"
          >
            3rd
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="bg-gray-700/20 text-gray-400 border-gray-700/30 px-1.5 py-0.5 text-xs"
          >
            {rank}
          </Badge>
        );
    }
  };

  // Determine column count for empty/loading states based on status
  const columnCount =
    currentLeagueStatus === "upcoming"
      ? 3
      : currentLeagueStatus === "completed"
      ? 4
      : 3;

  return (
    <div className="md:col-span-3 mt-6">
      <Card className="bg-gray-900/80 border border-gray-800 overflow-hidden backdrop-blur-sm shadow-lg">
        <CardHeader className="border-b border-gray-800 pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center text-lg text-gray-100">
              {" "}
              <Users className="h-5 w-5 mr-2 text-indigo-400" /> Leaderboard{" "}
            </CardTitle>
            <div className="flex items-center space-x-2">
              {currentLeagueStatus !== "completed" && (
                <>
                  <span className="text-xs text-gray-400 hidden sm:inline">
                    {" "}
                    Updated:{" "}
                    {lastRefreshed.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                  </span>
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={refreshNow}
                          disabled={isRefreshing || isLoading}
                          className="h-7 w-7 text-gray-400 hover:text-white hover:bg-gray-700"
                        >
                          <RefreshCw
                            className={`h-4 w-4 ${
                              isRefreshing ? "animate-spin" : ""
                            }`}
                          />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>Refresh</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-gray-400 hover:text-white hover:bg-gray-700"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-800 border-gray-700 text-gray-200">
                  {currentLeagueStatus === "active" && (
                    <DropdownMenuItem
                      onSelect={() => setAutoRefresh(!autoRefresh)}
                    >
                      {" "}
                      {autoRefresh
                        ? "Disable Auto-Refresh"
                        : "Enable Auto-Refresh"}{" "}
                    </DropdownMenuItem>
                  )}
                  {currentUserId && (
                    <DropdownMenuItem
                      onSelect={jumpToUserPosition}
                      disabled={isLoading || isRefreshing}
                    >
                      {" "}
                      <Search className="h-4 w-4 mr-2" /> Find My Position{" "}
                    </DropdownMenuItem>
                  )}
                  {/* Add other options if needed */}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <CardDescription className="text-gray-400 mt-1 text-sm">
            {currentLeagueStatus === "upcoming"
              ? "Sorted by join time."
              : currentLeagueStatus === "active"
              ? "Sorted by Gameweek points. Updates live."
              : "Final standings sorted by rank."}
          </CardDescription>
          {findUserError && (
            <p className="text-xs text-red-400 mt-1">{findUserError}</p>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
            <Table>
              <TableHeader className="bg-gray-900 sticky top-0 z-10">
                <TableRow className="hover:bg-transparent border-b border-gray-700">
                  <TableHead className="w-16 py-2 px-4 text-xs font-semibold text-indigo-300">
                    Rank
                  </TableHead>
                  <TableHead className="py-2 px-4 text-xs font-semibold text-purple-300">
                    Player
                  </TableHead>
                  {/* Conditional Headers */}
                  {currentLeagueStatus !== "upcoming" ? (
                    <>
                      <TableHead className="text-right py-2 px-4 text-xs font-semibold text-emerald-300">
                        GW Points
                      </TableHead>
                      {currentLeagueStatus === "completed" && (
                        <TableHead className="text-right py-2 px-4 text-xs font-semibold text-green-300">
                          Prize
                        </TableHead>
                      )}
                    </>
                  ) : (
                    <TableHead className="text-right py-2 px-4 text-xs font-semibold text-cyan-300">
                      Joined
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody className="bg-gray-900/50">
                {/* Loading Skeleton */}
                {isLoading ? (
                  Array.from({ length: rowsPerPage }).map((_, index) => (
                    <TableRow
                      key={`skeleton-${index}`}
                      className="border-gray-800 animate-pulse"
                    >
                      <TableCell className="py-2 px-4">
                        {" "}
                        <div className="h-6 w-10 bg-gray-700/50 rounded"></div>{" "}
                      </TableCell>
                      <TableCell className="py-2 px-4">
                        {" "}
                        <div className="flex flex-col gap-2">
                          {" "}
                          <div className="h-4 w-32 bg-gray-700/50 rounded"></div>{" "}
                          <div className="h-3 w-24 bg-gray-700/50 rounded"></div>{" "}
                        </div>{" "}
                      </TableCell>
                      {currentLeagueStatus !== "upcoming" ? (
                        <>
                          <TableCell className="py-2 px-4 text-right">
                            {" "}
                            <div className="h-5 w-12 bg-gray-700/50 rounded-full ml-auto"></div>{" "}
                          </TableCell>
                          {currentLeagueStatus === "completed" && (
                            <TableCell className="py-2 px-4 text-right">
                              {" "}
                              <div className="h-5 w-16 bg-gray-700/50 rounded ml-auto"></div>{" "}
                            </TableCell>
                          )}
                        </>
                      ) : (
                        <TableCell className="py-2 px-4 text-right">
                          {" "}
                          <div className="h-5 w-16 bg-gray-700/50 rounded ml-auto"></div>{" "}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : // Data Rows
                currentPageData.length > 0 ? (
                  currentPageData.map((entry) => {
                    // Use DisplayedLeaderboardEntry type
                    const isCurrentUser =
                      currentUserId && entry.userId === currentUserId;
                    return (
                      <motion.tr
                        key={entry.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className={`border-gray-800 hover:bg-gray-800/50 transition-colors text-sm ${
                          entry.isGwWinner ? "bg-green-900/20" : ""
                        } ${
                          isCurrentUser
                            ? "bg-indigo-900/30 border-l-2 border-r-2 border-indigo-500"
                            : ""
                        }`}
                      >
                        <TableCell className="py-2 px-4 font-medium text-center w-16">
                          {getRankBadge(entry.rank)}
                        </TableCell>
                        <TableCell className="py-2 px-4">
                          <div className="flex flex-col">
                            <div className="flex items-center">
                              <span className="font-medium text-gray-200 truncate max-w-[150px] sm:max-w-[200px]">
                                {entry.userName ?? "Unknown User"}
                              </span>
                              {isCurrentUser && (
                                <Badge
                                  variant="secondary"
                                  className="ml-2 px-1 py-0 text-xs bg-indigo-500/30 text-indigo-300"
                                >
                                  You
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-gray-400 truncate max-w-[150px] sm:max-w-[200px]">
                              {entry.teamName ?? "N/A"}
                            </span>
                          </div>
                        </TableCell>
                        {/* Conditional Data Cells */}
                        {currentLeagueStatus !== "upcoming" ? (
                          <>
                            {/* GW Points Cell */}
                            <TableCell className="text-right py-2 px-4">
                              {" "}
                              <Badge
                                variant={
                                  entry.isGwWinner ? "success" : "outline"
                                }
                                className={cn(
                                  entry.isGwWinner &&
                                    "border-green-500/50 text-green-300 bg-green-900/30"
                                )}
                              >
                                {" "}
                                {entry.gwPoints ?? 0}{" "}
                              </Badge>{" "}
                            </TableCell>
                            {/* Prize Cell */}
                            {currentLeagueStatus === "completed" && (
                              <TableCell className="text-right py-2 px-4 text-xs">
                                {" "}
                                {entry.winnings != null &&
                                entry.winnings > 0 ? (
                                  <span className="font-semibold text-green-400">
                                    {formatCurrency(entry.winnings)}
                                  </span>
                                ) : (
                                  <span className="text-gray-600">-</span>
                                )}{" "}
                              </TableCell>
                            )}
                          </>
                        ) : (
                          // Joined Date Cell
                          <TableCell className="text-right text-xs text-gray-400 py-2 px-4">
                            {" "}
                            {entry.joinedAt
                              ? formatDate(entry.joinedAt)
                              : "-"}{" "}
                          </TableCell>
                        )}
                      </motion.tr>
                    );
                  })
                ) : (
                  // Empty Row
                  <TableRow>
                    {" "}
                    <TableCell
                      colSpan={columnCount}
                      className="h-36 text-center text-gray-500"
                    >
                      {" "}
                      No participants found
                      {currentLeagueStatus === "upcoming" ? " yet" : ""}.{" "}
                    </TableCell>{" "}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        {/* Footer with Pagination */}
        {(totalEntries > rowsPerPage || totalPages > 1) && ( // Show footer only if needed
          <CardFooter className="border-t border-gray-800 p-2 flex justify-between items-center flex-wrap gap-2">
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <span>
                {" "}
                Showing{" "}
                {currentPageData.length
                  ? (currentPage - 1) * rowsPerPage + 1
                  : 0}
                - {Math.min(currentPage * rowsPerPage, totalEntries)} of{" "}
                {totalEntries}{" "}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 p-0"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1 || isLoading || isRefreshing}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 p-0"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoading || isRefreshing}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-3 text-sm font-medium text-gray-300">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 p-0"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={
                  currentPage === totalPages || isLoading || isRefreshing
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 p-0"
                onClick={() => handlePageChange(totalPages)}
                disabled={
                  currentPage === totalPages || isLoading || isRefreshing
                }
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
