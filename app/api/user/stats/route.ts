// /app/api/user/stats/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path if needed
import { Session } from "next-auth";

// Define a type for the session with user ID
interface SessionWithUser extends Omit<Session, 'user'> {
  user?: { id?: string }; // Only need ID here
}

// Define the structure of the stats object to be returned
interface UserStats {
  leaguesJoined: number;
  leaguesWon: number;
  totalWinnings: number;
  top3Finishes: number;
  averagePosition: number | null; // Can be null if no completed leagues
  roi: number; // Return on Investment as a percentage
}


export async function GET() {
  console.log("[API /user/stats] Fetching user stats...");
  try {
    // Cast the session to our custom type
    const session = await getServerSession(authOptions as any) as SessionWithUser;

    // Ensure user is authenticated and has an ID
    if (!session?.user?.id) {
      console.warn("[API /user/stats] Unauthorized access attempt.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    console.log(`[API /user/stats] User ID: ${userId}`);

    // Fetch all necessary league entry data for the user in one go
    const leagueEntries = await prisma.leagueEntry.findMany({
      where: { userId: userId },
      select: {
        rank: true,
        winnings: true,
        league: { // Include related league data needed for calculations
          select: {
            status: true,
            entryFee: true,
          },
        },
      },
    });
    console.log(`[API /user/stats] Found ${leagueEntries.length} league entries for user ${userId}.`);


    // --- Calculate Statistics ---

    const leaguesJoined = leagueEntries.length;

    // Filter for completed leagues to calculate performance stats
    const completedEntries = leagueEntries.filter(
      (entry) => entry.league.status === "completed"
    );
    console.log(`[API /user/stats] Found ${completedEntries.length} completed entries.`);


    // Calculate leagues won (rank 1 in completed leagues)
    const leaguesWon = completedEntries.filter(entry => entry.rank === 1).length;

    // Calculate top 3 finishes (rank 1, 2, or 3 in completed leagues)
    const top3Finishes = completedEntries.filter(
      entry => entry.rank !== null && entry.rank <= 3
    ).length;

    // Calculate total winnings (sum from completed leagues only, assumes winnings are final)
    const totalWinnings = completedEntries.reduce(
      (sum, entry) => sum + (entry.winnings || 0),
      0
    );

    // Calculate total entry fees paid for completed leagues
    const totalFeesPaid = completedEntries.reduce(
      (sum, entry) => sum + (entry.league.entryFee || 0),
      0
    );
    console.log(`[API /user/stats] Total Winnings: ${totalWinnings}, Total Fees Paid (Completed): ${totalFeesPaid}`);


    // Calculate Return on Investment (ROI) percentage
    const roi = totalFeesPaid > 0
      ? Math.round(((totalWinnings - totalFeesPaid) / totalFeesPaid) * 100)
      : 0; // Avoid division by zero, ROI is 0 if no fees paid

    // Calculate average position from completed leagues with a valid rank
    const validRanks = completedEntries
      .map(entry => entry.rank)
      .filter((rank): rank is number => rank !== null && rank > 0); // Filter out nulls and potentially rank 0 if invalid

    const averagePosition = validRanks.length > 0
      ? validRanks.reduce((sum, rank) => sum + rank, 0) / validRanks.length
      : null; // Set to null if no valid ranks found


    // Prepare the response object with names matching the frontend component props
    const statsResult: UserStats = {
      leaguesJoined,
      leaguesWon,
      totalWinnings,
      top3Finishes,
      averagePosition,
      roi,
    };

    console.log("[API /user/stats] Calculated Stats:", statsResult);
    return NextResponse.json(statsResult);

  } catch (error) {
    console.error("[API /user/stats] Error fetching user stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch user stats", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}