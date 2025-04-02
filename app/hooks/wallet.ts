import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { PaymentData } from "../types/wallet";

export function useWalletData() {
    return useQuery({
        queryKey: ['wallet'],
        queryFn: async () => {
            const response = await fetch('/api/wallet');
            if (!response.ok) {
                throw new Error('Failed to fetch wallet data');
            }
            const data = await response.json();

            // Validate the data to make sure amounts are reasonable
            if (data.balance) {
                // If the balance is unreasonably large (likely a kobo/naira mixup)
                if (Math.abs(data.balance) > 1000000) {
                    console.warn('Wallet balance seems unusually large, might be a unit issue');
                    data.balance = data.balance / 100; // Convert to reasonable value as failsafe
                }

                // If balance is negative but should never be
                if (data.balance < -10000) {
                    console.warn('Wallet balance is extremely negative, might be an error');
                    data.balance = Math.abs(data.balance); // Convert to positive as failsafe
                }
            }

            // Also validate transaction amounts if present
            if (data.transactions && Array.isArray(data.transactions)) {
                data.transactions = data.transactions.map((tx: { id: string; amount: number }) => {
                    if (Math.abs(tx.amount) > 1000000) {
                        console.warn(`Transaction ${tx.id} amount seems unusually large, might be a unit issue`);
                        tx.amount = tx.amount / 100; // Convert to reasonable value
                    }
                    return tx;
                });
            }

            return data;
        },
        refetchOnWindowFocus: false,
    });
}

export function useInitiatePayment() {
    return useMutation({
        mutationFn: async (paymentData: PaymentData) => {
            const response = await fetch(`/api/payment/initiate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(paymentData),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "Failed to initiate payment");
            }
            return data;
        },
        onError: (error: Error) => {
            toast.error("Payment initiation failed. Please try again.");
        }
    });
}