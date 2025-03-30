import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { PaymentData } from "../types/wallet";

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