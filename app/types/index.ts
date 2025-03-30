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

export interface LeaderboardEntry {
  id: string;
  userId: string;
  userName?: string;
  teamName: string;
  rank?: number;
  position?: number;
  startPoints?: number;
  startingPoints?: number;
  starting_points?: number;
  weeklyPoints?: number;
  gwPoints?: number;
  event_total?: number;
  finalPoints?: number;
  points?: number;
  total?: number;
  winnings?: number;
  joinedAt?: string;
  
  // Team and manager names
  team_name?: string;
  entry_name?: string;
  managerName?: string;
  manager_name?: string;
  player_name?: string;
  displayName?: string;
  display_name?: string;
  name?: string;
  
  // User and entry info
  user?: {
    id: string;
    name?: string;
  };
  entry?: {
    name?: string;
    player_name?: string;
  };
  
  // Status flags
  has_played?: boolean;
  isCurrentUser?: boolean;
  is_current_user?: boolean;
  current_user?: boolean;
  isHighlighted?: boolean;
  highlighted?: boolean;
  is_highlighted?: boolean;
  
  // GW winner flags
  isGwWinner?: boolean;
  is_gw_winner?: boolean;
  gw_winner?: boolean;
}

export interface League {
  id: string;
  name: string;
  gameweek: number;
  entryFee: number;
  maxParticipants: number;
  currentParticipants: number;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  leagueType: 'tri' | 'duo' | 'jackpot';
  userRank?: number;
  hasJoined?: boolean;
  myResults?: MyResults;
}

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