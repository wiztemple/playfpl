// app/hooks/wallet.ts (or app/hooks/admin.ts)

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { AdminActionSuccessResponse, ApproveWithdrawalVars, ClientAdminWithdrawalRequest, CompleteWithdrawalVars, RejectWithdrawalVars } from '../types/bank';


// --- Define Query Key Constant ---
const ADMIN_WITHDRAWAL_QUERY_KEY = 'adminWithdrawalRequests';

// --- NEW Hook to Fetch Admin Withdrawal Requests ---
export function useWithdrawalRequests(statusFilter: string = 'REQUIRES_APPROVAL') {
    const { data: session, status: authStatus } = useSession();
    // Query key includes the status filter to refetch when it changes
    const queryKey = [ADMIN_WITHDRAWAL_QUERY_KEY, statusFilter, session?.user?.id];

    return useQuery<ClientAdminWithdrawalRequest[]>({
        queryKey: queryKey,
        queryFn: async (): Promise<ClientAdminWithdrawalRequest[]> => {
            if (authStatus !== 'authenticated' || !session?.user?.id) return [];
            const response = await fetch(`/api/admin/withdrawals?status=${statusFilter}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to fetch withdrawal requests');
            }
            const data = await response.json();
            // Ensure amount and dates are strings/numbers as expected by ClientAdminWithdrawalRequest
            return data.map((d: any) => ({
                ...d,
                amount: String(d.amount || '0'), // API returns stringified Decimal
                createdAt: String(d.createdAt), // API returns stringified Date
                updatedAt: String(d.updatedAt) // API returns stringified Date
            }));
        },
        enabled: authStatus === 'authenticated' && !!session?.user?.id,
        refetchInterval: 30000, // Refetch often
        refetchOnWindowFocus: true,
    });
}

// --- NEW Hook to Approve a Withdrawal ---
export function useApproveWithdrawal() {
    const queryClient = useQueryClient();
    return useMutation<AdminActionSuccessResponse, Error, ApproveWithdrawalVars>({
        mutationFn: async ({ transactionId }: ApproveWithdrawalVars): Promise<AdminActionSuccessResponse> => {
            const response = await fetch('/api/admin/withdrawals/approve', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ transactionId })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || `Approval failed (${response.status})`);
            return data;
        },
        onSuccess: (data, variables) => {
            toast.success("Withdrawal Approved", { description: `Tx ${variables.transactionId} Processing. Balance debited.` });
            // Invalidate ALL withdrawal statuses as the item moves from REQUIRES_APPROVAL to PROCESSING
            queryClient.invalidateQueries({ queryKey: [ADMIN_WITHDRAWAL_QUERY_KEY] });
        },
        onError: (error: Error, variables) => {
            toast.error(`Approval Failed (Tx ${variables.transactionId})`, { description: error.message });
        }
    });
}

// --- NEW Hook to Reject a Withdrawal ---
export function useRejectWithdrawal() {
    const queryClient = useQueryClient();
    return useMutation<AdminActionSuccessResponse, Error, RejectWithdrawalVars>({
        mutationFn: async ({ transactionId, reason }: RejectWithdrawalVars): Promise<AdminActionSuccessResponse> => {
            const response = await fetch('/api/admin/withdrawals/reject', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ transactionId, reason })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || `Rejection failed (${response.status})`);
            return data;
        },
        onSuccess: (data, variables) => {
            toast.info("Withdrawal Rejected", { description: `Tx ${variables.transactionId} marked as ${data.status || 'Rejected'}.` });
            // Invalidate the relevant status lists
            queryClient.invalidateQueries({ queryKey: [ADMIN_WITHDRAWAL_QUERY_KEY] });
        },
        onError: (error: Error, variables) => {
            toast.error(`Rejection Failed (Tx ${variables.transactionId})`, { description: error.message });
        }
    });
}

// --- NEW Hook to Complete a Withdrawal ---
export function useCompleteWithdrawal() {
    const queryClient = useQueryClient();
    return useMutation<AdminActionSuccessResponse, Error, CompleteWithdrawalVars>({
        mutationFn: async ({ transactionId, bankReference }: CompleteWithdrawalVars): Promise<AdminActionSuccessResponse> => {
            const response = await fetch('/api/admin/withdrawals/complete', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ transactionId, bankReference })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || `Completion failed (${response.status})`);
            return data;
        },
        onSuccess: (data, variables) => {
            toast.success("Withdrawal Completed", { description: `Tx ${variables.transactionId} marked as Completed.` });
            // Invalidate the relevant status lists
            queryClient.invalidateQueries({ queryKey: [ADMIN_WITHDRAWAL_QUERY_KEY] });
        },
        onError: (error: Error, variables) => {
            toast.error(`Completion Failed (Tx ${variables.transactionId})`, { description: error.message });
        }
    });
}