// /app/api/wallet/withdraw/route.ts
// This route now handles INITIATING a withdrawal request

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth-options"; // Adjust path if needed
import { z } from "zod";
import type { Session } from "next-auth";
import { Prisma } from "@prisma/client"; // Import Prisma namespace for Decimal/types

// Session type
interface SessionWithUser extends Omit<Session, 'user'> { user?: { id?: string }; }

// Zod schema for request body validation
const withdrawalRequestSchema = z.object({
    amount: z.number().positive("Amount must be positive").min(500, "Minimum withdrawal is NGN 500"), // Example minimum
    bankAccountId: z.string().cuid("Valid bank account selection is required"), // Expect CUID of the UserBankAccount record
});

// Define return type for success
interface WithdrawalRequestResponse {
    success: boolean;
    message: string;
    transactionId: string;
    status: string; // Return the status ('REQUIRES_APPROVAL')
}

export async function POST(request: NextRequest) {
    console.log("[API /wallet/withdraw] POST request received (Initiate Withdrawal).");
    try {
        // 1. Authentication
        const session = await getServerSession(authOptions as any) as SessionWithUser;
        const userId = session?.user?.id;
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        console.log(`[API /wallet/withdraw] User ID: ${userId}`);

        // 2. Input Validation
        let requestBody;
        try { requestBody = await request.json(); }
        catch (e) { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

        const validationResult = withdrawalRequestSchema.safeParse(requestBody);
        if (!validationResult.success) {
            console.warn("[API /wallet/withdraw] Validation failed:", validationResult.error.format());
            return NextResponse.json({ error: "Invalid input data.", details: validationResult.error.format() }, { status: 400 });
        }
        const { amount, bankAccountId } = validationResult.data;
        const withdrawalAmountDecimal = new Prisma.Decimal(amount.toFixed(2));
        console.log(`[API /wallet/withdraw] Validated amount: ${withdrawalAmountDecimal}, Bank Account ID: ${bankAccountId}`);

        // 3. Fetch Wallet and Selected Bank Account concurrently
        const [wallet, selectedBankAccount] = await Promise.all([
            prisma.wallet.findUnique({ where: { userId } }),
            prisma.userBankAccount.findUnique({ where: { id: bankAccountId } }) // Find account by its unique ID
        ]);

        // 4. Validation
        if (!wallet) return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
        if (!selectedBankAccount) return NextResponse.json({ error: "Selected bank account not found" }, { status: 404 });
        // **Crucially, verify ownership:** Ensure the selected bank account belongs to the logged-in user
        if (selectedBankAccount.userId !== userId) {
            console.warn(`[API /wallet/withdraw] User ${userId} attempted withdraw to account ${bankAccountId} owned by ${selectedBankAccount.userId}.`);
            return NextResponse.json({ error: "Invalid bank account selection" }, { status: 403 }); // Forbidden
        }
        // Check balance (using Decimal comparison)
        if (wallet.balance.comparedTo(withdrawalAmountDecimal) < 0) { // balance < amount
            console.warn(`[API /wallet/withdraw] Insufficient balance for user ${userId}. Balance: ${wallet.balance}, Requested: ${withdrawalAmountDecimal}`);
            return NextResponse.json({ error: "Insufficient wallet balance." }, { status: 400 });
        }
        console.log(`[API /wallet/withdraw] Validation passed.`);

        // 5. Create PENDING/APPROVAL Withdrawal Transaction
        // **DO NOT DECREMENT BALANCE HERE** - Admin does that upon approval
        const newTransaction = await prisma.transaction.create({
            data: {
                userId: userId,
                walletId: wallet.id,
                type: 'WITHDRAWAL',          // Use string value (or Enum if you switched back)
                status: 'REQUIRES_APPROVAL', // Initial status needing admin action
                amount: withdrawalAmountDecimal, // Store positive amount requested
                currency: wallet.currency,
                description: `Withdrawal Request: ${selectedBankAccount.bankName} - ****${selectedBankAccount.accountNumber.slice(-4)}`,
                // Store necessary details for admin payout in metadata
                metadata: {
                    bankAccountId: selectedBankAccount.id,
                    accountName: selectedBankAccount.accountName,
                    accountNumber: selectedBankAccount.accountNumber, // Store full number for admin
                    bankName: selectedBankAccount.bankName,
                    bankCode: selectedBankAccount.bankCode,
                }
            }
        });
        console.log(`[API /wallet/withdraw] Withdrawal request transaction created (Requires Approval): ${newTransaction.id}`);

        // 6. Return Success (Request Submitted)
        const responsePayload: WithdrawalRequestResponse = {
            success: true,
            message: "Withdrawal requested successfully. Awaiting approval.",
            transactionId: newTransaction.id,
            status: newTransaction.status // Return current status
        };
        return NextResponse.json(responsePayload, { status: 201 }); // Use 201 for resource creation

    } catch (error) {
        console.error("[API /wallet/withdraw] Error processing withdrawal request:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            console.error(`[API /wallet/withdraw] Prisma Error Code: ${error.code}`, error.meta);
            return NextResponse.json({ error: "Database error processing request." }, { status: 500 });
        }
        return NextResponse.json({ error: "Failed to request withdrawal.", details: error instanceof Error ? error.message : "Unknown server error." }, { status: 500 });
    }
}