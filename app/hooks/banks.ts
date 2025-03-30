import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

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