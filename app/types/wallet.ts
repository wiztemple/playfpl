export interface PaymentData {
    leagueId: string;
    fplTeamId: string;
    amount: number;
    email?: string;
    name?: string;
    metadata?: {
        league_name?: string;
        gameweek?: number;
        team_name?: string;
        [key: string]: any;
    };
}

export interface PendingDepositInfo {
    id: string;
    amount: number | string; // Prisma Decimal might serialize as string depending on setup
    currency: string;
    createdAt: Date;
    externalReference: string | null;
    userId: string;
    user: { // Include basic user info
        name: string | null;
        email: string | null;
    } | null;
}

export interface WalletBalanceResponse {
    balance: number;  // API route converts Decimal to number
    currency: string; // e.g., "NGN"
}

/**
 * Structure for a Transaction object suitable for client-side display.
 * Matches the formatted response from GET /api/wallet/transactions
 */
export interface ClientTransaction {
    id: string;
    userId: string;
    walletId: string;
    type: string; // Use string, matching the reverted schema type
    amount: string; // API route returns string after Decimal conversion
    currency: string;
    status: string; // Use string, matching the reverted schema type
    externalReference: string | null;
    description: string | null;
    createdAt: string; // API route returns ISO string
    updatedAt: string; // API route returns ISO string
    metadata?: any | null; // Keep as 'any' or define specific metadata structure if known
}

/**
 * Structure of the paginated response from GET /api/wallet/transactions
 */
export interface TransactionApiResponse {
    transactions: ClientTransaction[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
    limit: number;
}

/**
 * Structure for variables passed TO the initiate deposit mutation/API
 */
export interface InitiateDepositVars {
    amount: number;
}

/**
 * Structure of the successful response FROM POST /api/wallet/deposit/initiate
 */
export interface DepositInitiatedData {
    message: string;
    referenceCode: string;
    transactionId: string;
    depositAccountDetails: {
        bankName: string;
        accountNumber: string;
        accountName: string;
    };
    amountDeposited: number; // The actual amount requested for deposit
}

// --- Ensure other necessary types like League, LeagueWithUserStatus etc. are also here ---
import type { WeeklyLeague as WeeklyLeaguePrisma, User as UserPrisma } from '@prisma/client';

export type League = WeeklyLeaguePrisma;

export interface LeagueWithUserStatus extends League {
    hasJoined?: boolean;
    hasPaid?: boolean;
}

export interface UserProfile extends Pick<UserPrisma, 'id' | 'name' | 'email' | 'image' | 'username' | 'fplTeamId' | 'fplTeamName' | 'createdAt'> {
    // Add other profile-specific fields if needed
}

export interface UserStats {
    leaguesJoined: number;
    leaguesWon: number;
    totalWinnings: number;
    top3Finishes: number;
    averagePosition: number | null;
    roi: number;
}
