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
    prizeDistribution: PrizeDistribution[];
    myResults?: MyResults;
    hasJoined?: boolean;
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
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    externalReference?: string | null;
    leagueEntryId?: string | null;
    createdAt: string;
    updatedAt: string;
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
  
  // Auth Types
  declare module "next-auth" {
    interface Session {
      user: {
        id: string;
        name?: string | null;
        email?: string | null;
        image?: string | null;
      };
    }
  }
  
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