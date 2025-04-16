import type { DefaultSession, DefaultUser } from "next-auth";
import type { JWT as DefaultJWT } from "next-auth/jwt";
import type { WeeklyLeague as WeeklyLeaguePrisma } from '@prisma/client';
export interface PrizeDistribution {
  id: string;
  leagueId: string;
  position: number;
  percentageShare: number;
}

export interface MyResults {
  rank?: number | null;
  points?: number | null;
  weeklyPoints?: number | null;
  winnings: number;
  payoutStatus?: string | null;
}

export interface WeeklyLeague {
  id: string;
  name: string;
  gameweek: number;
  entryFee: number;
  maxParticipants: number;
  currentParticipants: number;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  platformFeePercentage: number;
  minParticipantsRequired: number;
  tiebreaker: string;
  createdAt: string;
  updatedAt: string;
  leagueType: 'tri' | 'duo' | 'jackpot';
  prizeDistribution: PrizeDistribution[];
  myResults?: MyResults;
  hasJoined?: boolean;
  hasPaid?: boolean;
  gameweekInfo?: {
    deadline_time: string;
    is_current?: boolean;
    is_next?: boolean;
    finished?: boolean;
  };
}

// League Entry Types
export interface LeagueEntry {
  id: string;
  userId: string;
  leagueId: string;
  fplTeamId: number;
  joinedAt: string;
  paid: boolean;
  paymentId?: string | null;
  pointsAtStart?: number | null;
  finalPoints?: number | null;
  weeklyPoints?: number | null;
  rank?: number | null;
  winnings: number;
  payoutStatus?: string | null;
}

export interface LeagueEntryPrisma {
  id: string;
  userId: string;
  leagueId: string;
  fplTeamId: number;
  joinedAt: Date; // Prisma returns Date object
  paid: boolean;
  paymentId?: string | null;
  pointsAtStart?: number | null;
  finalPoints?: number | null;
  weeklyPoints?: number | null;
  rank?: number | null;
  winnings: number;
  payoutStatus?: string | null;
  updatedAt: Date; // Prisma includes this
}

// The richer type for the API response / Frontend component
export interface DisplayedLeaderboardEntry {
  // Core Fields (matching LeagueEntryPrisma but adapting types like Date->string)
  id: string;
  userId: string;
  leagueId: string;
  fplTeamId: number;
  joinedAt: string; // ISO String format for JSON
  paid: boolean;
  paymentId?: string | null;
  pointsAtStart?: number | null;
  finalPoints?: number | null;
  weeklyPoints?: number | null;
  rank?: number | null;
  winnings: number;
  payoutStatus?: string | null;

  // Additional fields needed for display
  userName?: string | null;
  teamName?: string | null;
  position?: number | null; // Often same as rank
  isGwWinner?: boolean;
  isCurrentUser?: boolean; // Flag set client-side, but API can default it

  // Optional Aliases (match frontend usage)
  points?: number | null; // alias for finalPoints
  gwPoints?: number | null; // alias for weeklyPoints
  startPoints?: number | null; // alias for pointsAtStart

  // Add any other fields your LeaderboardCard component requires
  // If component needs nested user/entry object, define them here too
  // Example:
  // user?: { id: string; name?: string | null };
}

// User and FPL Team Types
export interface FplTeam {
  id: number;
  name: string;
  player_name: string;
  total_points: number;
}

// Transaction Types
export interface Transaction {
  id: string;
  userId: string;
  walletId: string;
  type: 'deposit' | 'withdrawal' | 'entry_fee' | 'winnings' | 'refund';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  externalReference?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: any;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  transactions: Transaction[];
}

// --- CONSOLIDATED NextAuth Type Augmentation ---
declare module "next-auth" {
  /**
   * Add custom properties to the Session interface
   */
  interface Session {
    user: {
      id: string;       // Add user ID
      isAdmin: boolean; // <<< ADDED isAdmin HERE
    } & DefaultSession["user"]; // Keep default fields (name, email, image)
  }

  /**
   * Augment User type if needed
   * (Based on what authorize/profile callbacks return)
   */
  interface User extends DefaultUser {
    isAdmin?: boolean; // Add isAdmin if applicable
  }
}

// declare module "next-auth/jwt" {
//   /**
//    * Add custom properties to the JWT token
//    */
//   interface JWT extends DefaultJWT { // Use extends DefaultJWT here
//     id: string;       // Add user ID
//     isAdmin: boolean; // Add isAdmin flag
//   }
// }

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status?: number;
}

// Other Utility Types
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface LeaderboardEntry {
  id: string;
  userId: string;
  rank: number;
  position: number;

  // Points
  points: number;
  finalPoints: number;
  startPoints?: number;
  startingPoints?: number;
  starting_points?: number;
  pointsAtStart?: number;
  weeklyPoints: number;
  gwPoints: number;
  event_total: number;
  total: number;

  // Team and user info
  teamName: string;
  team_name: string;
  entry_name: string;
  userName: string;
  managerName: string;
  manager_name: string;
  player_name: string;
  displayName: string;
  display_name: string;
  name: string;

  // Entry info
  user: {
    id: string;
    name: string;
  };
  entry: {
    name: string;
    player_name: string;
  };

  // Flags
  has_played: boolean;
  isCurrentUser: boolean;
  is_current_user: boolean;

  // GW winner flags
  isGwWinner?: boolean;
  is_gw_winner?: boolean;
  gw_winner?: boolean;

  // Extra fields
  joinedAt: string; // Make sure joinedAt is a string
  winnings?: number;
}

// export interface League {
//   id: string;
//   name: string;
//   gameweek: number;
//   entryFee: number;
//   maxParticipants: number;
//   currentParticipants: number;
//   startDate: string;
//   endDate: string;
//   status: 'upcoming' | 'active' | 'completed' | 'cancelled';
//   leagueType: 'tri' | 'duo' | 'jackpot';
//   userRank?: number;
//   hasJoined?: boolean;
//   myResults?: MyResults;
// }
export type League = WeeklyLeaguePrisma;

export interface UserLeague {
  id: string;
  name: string;
  gameweek: number;
  entryFee: number;
  endDate: string;
  userRank?: number;
  currentParticipants: number;
  status: string;
}

export interface LeagueWithUserStatus extends League {
  hasJoined?: boolean;
  hasPaid?: boolean;
}

export interface TeamInfo {
  teamName: string;
  managerName: string;
  overallRank: number | null;
  totalPoints?: number | null;
  teamValue?: string | null; // e.g., "102.5"
  currentGameweek?: number | null;
  gameweekPoints?: number | null;
  transfersMade?: number | null;
  transfersAvailable?: number | null; // Might remain null
}

export interface MyLeagueInfo {
  // Include all fields returned by your API (likely most WeeklyLeague fields + user specific)
  id: string;
  name: string;
  gameweek: number;
  entryFee: number; // API sends as number after conversion
  maxParticipants: number;
  currentParticipants: number;
  startDate: string; // API sends as ISO string
  endDate: string;   // API sends as ISO string
  status: string;    // 'upcoming', 'active', 'completed', etc.
  leagueType: string;
  description?: string | null;
  currentHighestGwPoints?: number | null;
  platformFeePercentage: number;
  prizeDistribution: { // Ensure API includes this structure
      id: string;
      position: number;
      percentageShare: number; // API sends as number after conversion
      leagueId: string;
  }[];
  // User-specific fields added by the API
  userRank: number | null;
  myResults: {
      rank: number | null;
      points: number | null;
      weeklyPoints: number | null;
      winnings: number; // API sends as number after conversion
      payoutStatus: string | null;
  } | null; // Make myResults potentially null
  hasJoined: boolean;
  minParticipantsRequired: number; // Added from error message
  tiebreaker: string; // Added from error message
  createdAt: string; // Added from error message - API should return ISO string
  updatedAt: string; //
}
export interface PrizeDistributionInfo {
  id: string;
  position: number;
  percentageShare: number; // API converts Decimal to number
  leagueId: string;
}

export interface LeagueCardData {
  // Core League Fields (scalar)
  id: string;
  name: string;
  gameweek: number;
  entryFee: number; // API returns as number
  maxParticipants: number;
  currentParticipants: number; // Added by API from _count
  status: string; // 'upcoming', 'active', 'completed', etc.
  startDate: string; // API returns as ISO string
  endDate: string;   // API returns as ISO string
  platformFeePercentage: number; // API returns as number (or Float)
  leagueType: string;
  description?: string | null;
  currentHighestGwPoints?: number | null;
  // Relations (included by API)
  prizeDistribution: PrizeDistributionInfo[];
  // User-specific fields (added by API for 'my-leagues' filter, null/false otherwise)
  userRank?: number | null;
  myResults?: {
      rank: number | null;
      points: number | null; // FPL points can be null
      weeklyPoints: number | null;
      winnings: number; // API returns as number
      payoutStatus: string | null;
  } | null;
  hasJoined?: boolean; // Indicates if the current user has joined
}
