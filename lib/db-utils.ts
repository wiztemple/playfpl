import { prisma } from './db';
import { cache } from 'react';

/**
 * Get league by ID with prize distribution
 */
export const getLeagueById = cache(async (id: string) => {
  return prisma.weeklyLeague.findUnique({
    where: { id },
    include: {
      prizeDistribution: {
        orderBy: {
          position: 'asc',
        },
      },
      _count: {
        select: { entries: true },
      },
    },
  });
});

/**
 * Get all available leagues
 */
export const getAvailableLeagues = cache(async (gameweekFilter?: number) => {
  const filter: any = {
    status: 'upcoming',
  };

  if (gameweekFilter) {
    filter.gameweek = gameweekFilter;
  }

  return prisma.weeklyLeague.findMany({
    where: filter,
    include: {
      prizeDistribution: {
        orderBy: {
          position: 'asc',
        },
      },
      _count: {
        select: { entries: true },
      },
    },
    orderBy: {
      startDate: 'asc',
    },
  });
});

/**
 * Get leagues joined by a user
 */
export const getUserLeagues = cache(async (userId: string) => {
  const entries = await prisma.leagueEntry.findMany({
    where: {
      userId,
    },
    include: {
      league: {
        include: {
          prizeDistribution: {
            orderBy: {
              position: 'asc',
            },
          },
          _count: {
            select: { entries: true },
          },
        },
      },
    },
    orderBy: {
      joinedAt: 'desc',
    },
  });

  // Transform the data to include user results
  return entries.map((entry) => ({
    ...entry.league,
    currentParticipants: entry.league._count.entries,
    _count: undefined,
    myResults: {
      rank: entry.rank,
      points: entry.finalPoints,
      weeklyPoints: entry.weeklyPoints,
      winnings: entry.winnings,
      payoutStatus: entry.payoutStatus,
    },
  }));
});

/**
 * Get user wallet with transactions
 */
export const getUserWallet = cache(async (userId: string) => {
  // Try to find existing wallet
  let wallet = await prisma.wallet.findUnique({
    where: { userId },
    include: {
      transactions: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      },
    },
  });

  // Create wallet if it doesn't exist
  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: {
        userId,
        balance: 0,
        currency: 'USD',
      },
      include: {
        transactions: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });
  }

  return wallet;
});

/**
 * Get league leaderboard
 */
export const getLeagueLeaderboard = cache(async (leagueId: string) => {
  const entries = await prisma.leagueEntry.findMany({
    where: {
      leagueId,
      paid: true,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          fplTeamName: true,
        },
      },
    },
    orderBy: [
      {
        weeklyPoints: 'desc',
      },
      {
        joinedAt: 'asc', // tiebreaker
      },
    ],
  });

  // Transform the data
  return entries.map((entry, index) => ({
    rank: index + 1,
    userId: entry.user.id,
    userName: entry.user.name,
    userImage: entry.user.image,
    teamName: entry.user.fplTeamName,
    fplTeamId: entry.fplTeamId,
    startPoints: entry.pointsAtStart || 0,
    finalPoints: entry.finalPoints || 0,
    weeklyPoints: entry.weeklyPoints || 0,
    winnings: entry.winnings,
  }));
});

/**
 * Create a new weekly league
 */
export async function createWeeklyLeague(data: any, userId: string) {
  const {
    name,
    gameweek,
    entryFee,
    maxParticipants,
    startDate,
    endDate,
    prizeDistribution,
    platformFeePercentage = 10,
    minParticipantsRequired = 3,
  } = data;

  return prisma.weeklyLeague.create({
    data: {
      name,
      gameweek: parseInt(gameweek),
      entryFee: parseFloat(entryFee),
      maxParticipants: parseInt(maxParticipants),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      platformFeePercentage,
      minParticipantsRequired,
      prizeDistribution: {
        create: prizeDistribution.map((prize: any) => ({
          position: prize.position,
          percentageShare: prize.percentageShare,
        })),
      },
    },
    include: {
      prizeDistribution: true,
    },
  });
}

/**
 * Process gameweek results
 */
export async function processGameweekResults(gameweekId: number) {
  // Find all leagues for this gameweek that are active
  const leagues = await prisma.weeklyLeague.findMany({
    where: {
      gameweek: gameweekId,
      status: 'active',
    },
    include: {
      entries: {
        where: {
          paid: true,
        },
        include: {
          user: true,
        },
      },
      prizeDistribution: true,
    },
  });

  for (const league of leagues) {
    // Calculate results for each league
    await calculateLeagueResults(league);
  }

  return { processed: leagues.length };
}

/**
 * Calculate results for a single league
 */
async function calculateLeagueResults(league: any) {
  try {
    // Update league status
    await prisma.weeklyLeague.update({
      where: {
        id: league.id,
      },
      data: {
        status: 'completed',
      },
    });

    // Sort entries by weekly points
    const sortedEntries = [...league.entries].sort((a, b) => {
      if (b.weeklyPoints !== a.weeklyPoints) {
        return b.weeklyPoints - a.weeklyPoints;
      }
      // Use join time as tiebreaker
      return a.joinedAt.getTime() - b.joinedAt.getTime();
    });

    // Calculate prize pool
    const totalEntryFees = league.entries.length * league.entryFee;
    const platformFee = totalEntryFees * (league.platformFeePercentage / 100);
    const prizePool = totalEntryFees - platformFee;

    // Assign ranks and distribute prizes
    for (let i = 0; i < sortedEntries.length; i++) {
      const entry = sortedEntries[i];
      const rank = i + 1;

      // Find if this rank gets a prize
      const prize = league.prizeDistribution.find((p: any) => p.position === rank);
      const winnings = prize ? (prizePool * prize.percentageShare) / 100 : 0;

      // Update entry with rank and winnings
      await prisma.leagueEntry.update({
        where: {
          id: entry.id,
        },
        data: {
          rank,
          winnings,
          payoutStatus: winnings > 0 ? 'pending' : null,
        },
      });

      // Process payout if there are winnings
      if (winnings > 0) {
        await processWinningPayout(entry.userId, winnings, entry.id);
      }
    }

    return { success: true, leagueId: league.id };
  } catch (error) {
    console.error(`Error calculating results for league ${league.id}:`, error);
    throw error;
  }
}

/**
 * Process winning payout to user wallet
 */
async function processWinningPayout(userId: string, amount: number, entryId: string) {
  // Get or create user wallet
  let wallet = await prisma.wallet.findUnique({
    where: { userId },
  });

  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: {
        userId,
        balance: 0,
        currency: 'USD',
      },
    });
  }

  // Update wallet balance
  await prisma.wallet.update({
    where: {
      id: wallet.id,
    },
    data: {
      balance: {
        increment: amount,
      },
    },
  });

  // Create transaction record
  await prisma.transaction.create({
    data: {
      userId,
      walletId: wallet.id,
      type: 'winnings',
      amount,
      status: 'completed',
      leagueEntryId: entryId,
    },
  });

  // Update entry payout status
  await prisma.leagueEntry.update({
    where: {
      id: entryId,
    },
    data: {
      payoutStatus: 'completed',
    },
  });

  return { success: true, userId, amount };
}