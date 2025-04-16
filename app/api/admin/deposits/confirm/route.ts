// app/api/admin/deposits/confirm/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path if needed
import { Prisma } from "@prisma/client";
import type { Session } from "next-auth";

// Session type with Admin flag
interface SessionWithAdmin extends Omit<Session, 'user'> {
    user?: { id?: string; isAdmin?: boolean; };
}

// Expected request body
interface ConfirmDepositBody {
    transactionId?: string;
}

export async function POST(request: NextRequest) {
    const functionStartTime = Date.now();
    let transactionId: string | undefined; // Define outside try for logging

    try {
        // 1. --- Authorization: Ensure Admin ---
        const session = await getServerSession(authOptions as any) as SessionWithAdmin;
        const adminUserId = session?.user?.id;
        if (!adminUserId) {
            return NextResponse.json({ error: "Unauthorized: Not signed in" }, { status: 401 });
        }
        const adminUser = await prisma.user.findUnique({ where: { id: adminUserId }, select: { isAdmin: true } });
        if (!adminUser?.isAdmin) {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }
        console.log(`[ADMIN_CONFIRM_DEPOSIT] Authorized Admin: ${adminUserId}`);

        // 2. --- Input Validation ---
        let requestBody: ConfirmDepositBody;
        try {
            requestBody = await request.json();
            transactionId = requestBody.transactionId; // Assign for logging
        } catch (e) {
            return NextResponse.json({ error: "Invalid request body. Expecting { transactionId: string }" }, { status: 400 });
        }

        if (!transactionId || typeof transactionId !== 'string') {
            return NextResponse.json({ error: "Missing or invalid 'transactionId' in request body" }, { status: 400 });
        }
        console.log(`[ADMIN_CONFIRM_DEPOSIT] Attempting to confirm Transaction ID: ${transactionId}`);


        // 3. --- Database Update within Transaction ---
        const updatedTransaction = await prisma.$transaction(async (tx) => {
            // a. Find the specific transaction to confirm
            const transaction = await tx.transaction.findUnique({
                where: { id: transactionId },
                // Select fields needed for validation and update
                select: {
                    id: true,
                    amount: true,
                    status: true,
                    type: true,
                    walletId: true,
                    userId: true // For logging/verification
                }
            });

            // b. Validate the transaction state
            if (!transaction) {
                throw new Error(`Transaction with ID ${transactionId} not found.`); // Caught below, results in 404
            }
            if (transaction.type !== 'DEPOSIT') {
                throw new Error(`Transaction ${transactionId} is not a DEPOSIT type (Type: ${transaction.type}). Cannot confirm.`); // Results in 400
            }
            if (transaction.status !== 'PENDING') {
                // Idempotency check: If already completed, just return success without re-processing
                if(transaction.status === 'COMPLETED') {
                    console.warn(`[ADMIN_CONFIRM_DEPOSIT] Transaction ${transactionId} is already COMPLETED. No action taken.`);
                    // Returning the existing transaction to signal success without double-counting
                    // Or throw specific error if re-confirming isn't allowed
                    return transaction; // Treat as success
                }
                // Otherwise, it's in another invalid state (failed, cancelled etc)
                throw new Error(`Transaction ${transactionId} is not PENDING (Status: ${transaction.status}). Cannot confirm.`); // Results in 409 Conflict
            }

             // c. Find the associated wallet (ensure it exists)
             const wallet = await tx.wallet.findUnique({
                 where: { id: transaction.walletId },
                 select: { id: true, balance: true } // Select balance for logging if needed
             });

             if (!wallet) {
                 throw new Error(`Wallet with ID ${transaction.walletId} associated with transaction ${transactionId} not found.`); // Should not happen if DB is consistent
             }

            // d. Update Transaction status
            const confirmedTx = await tx.transaction.update({
                where: { id: transactionId },
                data: {
                    status: 'COMPLETED',
                    updatedAt: new Date()
                }
            });
            console.log(`[ADMIN_CONFIRM_DEPOSIT] Transaction ${transactionId} status updated to COMPLETED.`);

            // e. Update Wallet balance (using Prisma.Decimal for amount)
            const updatedWallet = await tx.wallet.update({
                where: { id: transaction.walletId },
                data: {
                    // Ensure amount from transaction is treated as Decimal if needed
                    balance: { increment: transaction.amount } // Prisma handles Decimal increment
                }
            });
            console.log(`[ADMIN_CONFIRM_DEPOSIT] Wallet ${wallet.id} balance incremented by ${transaction.amount}. New balance: ${updatedWallet.balance}`);

            return confirmedTx; // Return the completed transaction

        }, {
             // Optional: Set timeout for this transaction if needed
             timeout: 10000 // 10 seconds
        }); // End prisma.$transaction

        // 4. --- Return Success Response ---
        const duration = Date.now() - functionStartTime;
        console.log(`[ADMIN_CONFIRM_DEPOSIT] Deposit ${transactionId} confirmed successfully for user ${updatedTransaction.userId}. Duration: ${duration}ms`);
        return NextResponse.json({
            success: true,
            message: "Deposit confirmed successfully.",
            transactionId: updatedTransaction.id,
            userId: updatedTransaction.userId
        });

    } catch (error) {
        const duration = Date.now() - functionStartTime;
        console.error(`[ADMIN_CONFIRM_DEPOSIT] Error confirming deposit ${transactionId}:`, error);
        let status = 500;
        let message = "Failed to confirm deposit.";
        let details = error instanceof Error ? error.message : "Unknown server error.";

        // Set specific status codes based on caught errors
        if (details.includes("not found")) status = 404;
        if (details.includes("not a DEPOSIT type") || details.includes("Invalid request body")) status = 400;
        if (details.includes("not PENDING")) status = 409; // Conflict - already processed or wrong state

        return NextResponse.json({ error: message, details: details }, { status: status });
    }
}