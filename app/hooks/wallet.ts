// hooks/wallet.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useDebounce } from "./useDebounce";
import { DepositInitiatedData, InitiateDepositVars, TransactionApiResponse, WalletBalanceResponse } from "../types/wallet";
// --- Import necessary types ---
// Adjust the path to your central types file as needed

// --- Hook for Fetching Wallet Balance ---
export function useWalletBalance() {
    const { data: session, status } = useSession();
    return useQuery<WalletBalanceResponse>({
        // Query key includes user ID to ensure data is specific to the user and refetches on user change
        queryKey: ['walletBalance', session?.user?.id],
        queryFn: async (): Promise<WalletBalanceResponse> => {
            // Return a default state if user isn't authenticated yet
            if (status !== 'authenticated' || !session?.user?.id) {
                console.log("[useWalletBalance] Not authenticated or session loading, returning default.");
                return { balance: 0, currency: 'NGN' };
            }
            console.log("[useWalletBalance] Fetching wallet balance...");
            const response = await fetch('/api/wallet'); // API uses session cookie for auth
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`[useWalletBalance] API Error ${response.status}:`, errorData);
                throw new Error(errorData.error || 'Failed to fetch wallet balance');
            }
            const data = await response.json();
            // Ensure balance is returned as a number
            return { ...data, balance: Number(data.balance || 0) };
        },
        // Only run the query if the session is authenticated and user ID exists
        enabled: status === 'authenticated' && !!session?.user?.id,
        staleTime: 1000 * 60, // Data considered fresh for 1 minute
        refetchOnWindowFocus: true, // Refetch when user returns to the tab
        refetchInterval: 1000 * 60 * 5, // Optional: Refetch every 5 minutes
    });
}


// --- Hook for Fetching Paginated/Filtered Transactions ---
export function useTransactions(
    page: number = 1, // Default to page 1
    limit: number = 10, // Default items per page
    filterType: string | null = null, // Optional filter by type (e.g., 'DEPOSIT')
    // filterStatus: string | null = null, // Optional filter by status (e.g., 'PENDING')
    searchTerm: string = '' // Optional search term
) {
    const { data: session, status } = useSession();
    // Debounce the search term to avoid API calls on every keystroke
    const [debouncedSearchTerm] = useDebounce(searchTerm, 400);

    // Query key includes all parameters that affect the query result
    const queryKey = ['transactions', page, limit, filterType, /*filterStatus,*/ debouncedSearchTerm, session?.user?.id];

    // Define the default structure for placeholder data and initial state
    const defaultResponse: TransactionApiResponse = {
        transactions: [], totalCount: 0, totalPages: 0, currentPage: page, limit: limit
    };

    return useQuery<TransactionApiResponse>({
        queryKey: queryKey,
        queryFn: async (): Promise<TransactionApiResponse> => {
            if (status !== 'authenticated' || !session?.user?.id) {
                console.log("[useTransactions] Not authenticated or session loading, returning default.");
                return defaultResponse;
            }
            console.log(`[useTransactions] Fetching page ${page}, limit ${limit}, type ${filterType}, search '${debouncedSearchTerm}'`);

            // Construct query parameters
            const params = new URLSearchParams();
            params.set('page', page.toString());
            params.set('limit', limit.toString());
            if (filterType) params.set('type', filterType);
            // if (filterStatus) params.set('status', filterStatus);
            if (debouncedSearchTerm) params.set('search', debouncedSearchTerm);

            const response = await fetch(`/api/wallet/transactions?${params.toString()}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`[useTransactions] API Error ${response.status}:`, errorData);
                throw new Error(errorData.error || 'Failed to fetch transactions');
            }
            // Assume API returns data matching TransactionApiResponse (with string amounts/dates)
            return response.json();
        },
        // Only run the query if authenticated and user ID exists
        enabled: status === 'authenticated' && !!session?.user?.id,
        // Keep previous data while loading the next page/filter for smoother UX
        placeholderData: (prevData) => prevData ?? defaultResponse,
        staleTime: 1000 * 15, // Data considered fresh for 15 seconds
    });
}


// --- Hook for Initiating Manual Deposit ---
export function useInitiateDeposit() {
    const queryClient = useQueryClient();

    return useMutation<DepositInitiatedData, Error, InitiateDepositVars>({
        mutationFn: async (depositData: InitiateDepositVars): Promise<DepositInitiatedData> => {
            console.log("[INITIATE_DEPOSIT_MUTATION] Calling API with amount:", depositData.amount);
            const response = await fetch(`/api/wallet/deposit/initiate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(depositData), // Sends { amount: number }
            });

            const data = await response.json();
            if (!response.ok) {
                console.error("[INITIATE_DEPOSIT_MUTATION] API Error:", data);
                throw new Error(data.error || "Failed to initiate deposit");
            }
            console.log("[INITIATE_DEPOSIT_MUTATION] API Success:", data);
            // Expecting API to return DepositInitiatedData structure
            return data as DepositInitiatedData;
        },
        onSuccess: (data) => {
            // Toast notification handled in the component where mutation is used usually
            console.log(`Deposit initiated successfully: TxID ${data.transactionId}, Ref ${data.referenceCode}`);
            // Invalidate transaction history so the new PENDING transaction appears
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        },
        onError: (error: Error) => {
            console.error("[INITIATE_DEPOSIT_MUTATION] Error:", error);
            // Toast notification handled in the component
        }
    });
}
