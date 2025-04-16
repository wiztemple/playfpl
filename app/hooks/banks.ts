import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AddBankAccountVars, UserBankAccount } from '../types/bank';
import { useSession } from 'next-auth/react';

// Type for bank data
export interface Bank {
  id: number;
  code: string;
  name: string;
}

// Hook to fetch banks
export function useBanks() {
  return useQuery({
    queryKey: ['banks'],
    queryFn: async (): Promise<Bank[]> => {
      const response = await fetch('/api/wallet/banks');
      if (!response.ok) {
        throw new Error('Failed to fetch banks');
      }
      const data = await response.json();
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook for verifying bank account
export function useVerifyAccount() {
  return useMutation({
    mutationFn: async (data: { account_number: string; bank_code: string }) => {
      const response = await fetch('/api/wallet/verify-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to verify account');
      }
      return responseData;
    },
    onSuccess: () => {
      toast.success('Account verified successfully');
    },
    onError: (error: Error) => {
      console.error('Error verifying account:', error);
      toast.error(error.message || 'Failed to verify account. Please check your details.');
    }
  });
}

// Hook for withdrawal
export function useWithdraw() {
  return useMutation({
    mutationFn: async (data: {
      amount: number;
      account_number: string;
      bank_code: string;
      account_name: string;
      bank_name: string;
    }) => {
      const response = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to process withdrawal');
      }
      return responseData;
    },
    onError: (error: Error) => {
      console.error('Error processing withdrawal:', error);
      toast.error(error.message || 'Failed to process your withdrawal. Please try again.');
    }
  });
}

export function useUserBankAccounts() {
  const { data: session, status } = useSession();
  return useQuery<UserBankAccount[]>({
    queryKey: ['userBankAccounts', session?.user?.id], // Query key based on user
    queryFn: async (): Promise<UserBankAccount[]> => {
      if (status !== 'authenticated' || !session?.user?.id) return []; // Return empty if not logged in
      console.log("[useUserBankAccounts] Fetching...");
      const response = await fetch('/api/user/bank-accounts'); // Call GET endpoint
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`[useUserBankAccounts] API Error ${response.status}:`, errorData);
        throw new Error(errorData.error || 'Failed to fetch bank accounts');
      }
      const data = await response.json();
      // Optional: Convert date strings back to Date objects if needed client-side
      // return data.map((acc: any) => ({ ...acc, createdAt: new Date(acc.createdAt), updatedAt: new Date(acc.updatedAt) }));
      return data as UserBankAccount[]; // Assume API returns dates as strings matching type
    },
    enabled: status === 'authenticated' && !!session?.user?.id, // Only fetch when logged in
    staleTime: 1000 * 60 * 15, // Cache accounts for 15 minutes
    refetchOnWindowFocus: true,
  });
}

// --- NEW Hook to Add a Bank Account ---
export function useAddBankAccount() {
  const queryClient = useQueryClient();
  return useMutation<UserBankAccount, Error, AddBankAccountVars>({ // Expects UserBankAccount on success
    mutationFn: async (accountData: AddBankAccountVars): Promise<UserBankAccount> => {
      console.log("[useAddBankAccount] Calling POST /api/user/bank-accounts", accountData);
      const response = await fetch('/api/user/bank-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountData)
      });
      const data = await response.json();
      if (!response.ok) {
        console.error(`[useAddBankAccount] API Error ${response.status}:`, data);
        throw new Error(data.error || data.details || `Failed to add account (${response.status})`);
      }
      console.log("[useAddBankAccount] API Success:", data);
      return data as UserBankAccount; // Return the newly created account data
    },
    onSuccess: (data) => {
      toast.success("Bank Account Added!", { description: `${data.bankName} - ****${data.accountNumber.slice(-4)}` });
      queryClient.invalidateQueries({ queryKey: ['userBankAccounts'] }); // Refresh the list <<< IMPORTANT
    },
    onError: (error: Error) => {
      console.error("[useAddBankAccount] Mutation Error:", error);
      toast.error("Failed to Add Account", { description: error.message });
    }
  });
}

// --- NEW Hook to Delete a Bank Account ---
export function useDeleteBankAccount() {
  const queryClient = useQueryClient();
  // Define success response type for DELETE API
  type DeleteResponse = { success: boolean; message: string };

  return useMutation<DeleteResponse, Error, string>({ // Takes accountId (string)
    mutationFn: async (accountId: string): Promise<DeleteResponse> => {
      console.log(`[useDeleteBankAccount] Calling DELETE /api/user/bank-accounts/${accountId}`);
      const response = await fetch(`/api/user/bank-accounts/${accountId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (!response.ok) {
        console.error(`[useDeleteBankAccount] API Error ${response.status}:`, data);
        throw new Error(data.error || `Failed to delete account (${response.status})`);
      }
      console.log("[useDeleteBankAccount] API Success:", data);
      return data as DeleteResponse;
    },
    onSuccess: (data, accountId) => { // Receive accountId as second arg
      toast.success("Bank Account Deleted", { description: data.message });
      queryClient.invalidateQueries({ queryKey: ['userBankAccounts'] }); // Refresh the list <<< IMPORTANT
      console.log(`[useDeleteBankAccount] Successfully deleted account ${accountId}`);
    },
    onError: (error: Error, accountId) => {
      console.error(`[useDeleteBankAccount] Mutation Error for ${accountId}:`, error);
      toast.error("Failed to Delete Account", { description: error.message });
    }
  });
}