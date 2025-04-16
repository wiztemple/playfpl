// app/api/wallet/withdrawal/request/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path
import { z } from "zod";
import type { Session } from "next-auth";
import { Prisma } from "@prisma/client";

// Session type
interface SessionWithUser extends Omit<Session, 'user'> { user?: { id?: string }; }

// Zod schema for request body
const withdrawalRequestSchema = z.object({
    amount: z.number().positive("Amount must be positive").min(500, "Minimum withdrawal is NGN 500"), // Example min withdrawal
    bankAccountId: z.string().cuid("Invalid bank account selection"), // Expect CUID of the UserBankAccount record
});

export async function POST(request: NextRequest) {
    console.log("[API /wallet/withdrawal/request] POST request received.");
    try {
        // 1. Authentication
        const session = await getServerSession(authOptions as any) as SessionWithUser;
        const userId = session?.user?.id;
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        console.log(`[API /wallet/withdrawal/request] User ID: ${userId}`);

        // 2. Input Validation
        let requestBody;
        try { requestBody = await request.json(); }
        catch (e) { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

        const validationResult = withdrawalRequestSchema.safeParse(requestBody);
        if (!validationResult.success) {
            console.warn("[API /wallet/withdrawal/request] Validation failed:", validationResult.error.format());
            return NextResponse.json({ error: "Invalid input data.", details: validationResult.error.format() }, { status: 400 });
        }
        const { amount, bankAccountId } = validationResult.data;
        const withdrawalAmountDecimal = new Prisma.Decimal(amount.toFixed(2)); // Ensure Decimal
         console.log(`[API /wallet/withdrawal/request] Validated amount: ${withdrawalAmountDecimal}, Bank Account ID: ${bankAccountId}`);

        // 3. Fetch Wallet and Selected Bank Account (check ownership)
        const [wallet, selectedBankAccount] = await Promise.all([
             prisma.wallet.findUnique({ where: { userId } }),
             prisma.userBankAccount.findUnique({ where: { id: bankAccountId }})
        ]);

        // 4. Validation
        if (!wallet) return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
        if (!selectedBankAccount) return NextResponse.json({ error: "Selected bank account not found" }, { status: 404 });
        // Crucially, ensure the selected bank account BELONGS to the logged-in user
        if (selectedBankAccount.userId !== userId) {
            console.warn(`[API /wallet/withdrawal/request] User ${userId} attempted to withdraw to bank account ${bankAccountId} not belonging to them.`);
            return NextResponse.json({ error: "Invalid bank account selection" }, { status: 403 }); // Forbidden
        }
        // Check balance
        if (wallet.balance.comparedTo(withdrawalAmountDecimal) < 0) { // balance < amount
            console.warn(`[API /wallet/withdrawal/request] Insufficient balance for user ${userId}. Balance: ${wallet.balance}, Requested: ${withdrawalAmountDecimal}`);
            return NextResponse.json({ error: "Insufficient wallet balance." }, { status: 400 });
        }
         console.log(`[API /wallet/withdrawal/request] Validation passed.`);

        // 5. Create PENDING Withdrawal Transaction
        const newTransaction = await prisma.transaction.create({
            data: {
                userId: userId,
                walletId: wallet.id,
                type: 'WITHDRAWAL', // Use String value
                status: 'REQUIRES_APPROVAL', // Needs admin approval before processing/debiting
                amount: withdrawalAmountDecimal, // Store positive amount requested
                currency: wallet.currency, // Use wallet currency
                description: `Withdrawal request to: ${selectedBankAccount.bankName} - ${selectedBankAccount.accountNumber.slice(-4)}`,
                // Store essential bank details for admin processing right in the transaction metadata
                metadata: {
                    bankAccountId: selectedBankAccount.id,
                    accountName: selectedBankAccount.accountName,
                    accountNumber: selectedBankAccount.accountNumber, // Store full number here? Or rely on fetching via ID? Store for convenience.
                    bankName: selectedBankAccount.bankName,
                    bankCode: selectedBankAccount.bankCode,
                }
            }
        });
        console.log(`[API /wallet/withdrawal/request] Pending withdrawal transaction created: ${newTransaction.id}`);

        // 6. Return Success (Request Submitted)
        return NextResponse.json({
            success: true,
            message: "Withdrawal requested successfully. Awaiting approval.",
            transactionId: newTransaction.id,
            status: newTransaction.status
        }, { status: 201 }); // 201 Created status might be appropriate


    } catch (error) {
        console.error("[API /wallet/withdrawal/request] Error:", error);
         if (error instanceof Prisma.PrismaClientKnownRequestError) {
             console.error(`[API /wallet/withdrawal/request] Prisma Error Code: ${error.code}`, error.meta);
             return NextResponse.json({ error: "Database error processing withdrawal request." }, { status: 500 });
         }
        return NextResponse.json({ error: "Failed to request withdrawal.", details: error instanceof Error ? error.message : "Unknown server error." }, { status: 500 });
    }
}