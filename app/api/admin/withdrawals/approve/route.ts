// app/api/admin/withdrawals/approve/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path
import type { Session } from "next-auth";
import { Prisma } from "@prisma/client";

interface SessionWithAdmin extends Omit<Session, 'user'> { user?: { id?: string; isAdmin?: boolean; }; }
interface ApproveBody { transactionId?: string; }

export async function POST(request: NextRequest) {
    const functionStartTime = Date.now();
    let transactionId: string | undefined;
    console.log("[API ADMIN/WITHDRAWALS/APPROVE] POST request received.");
    try {
        // Auth & Admin Check
        const session = await getServerSession(authOptions as any) as SessionWithAdmin;
        const adminUserId = session?.user?.id;
        if (!adminUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const adminUser = await prisma.user.findUnique({ where: { id: adminUserId }, select: { isAdmin: true } });
        if (!adminUser?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        // Validate Input
        let requestBody: ApproveBody;
        try { requestBody = await request.json(); transactionId = requestBody.transactionId; }
        catch (e) { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
        if (!transactionId) return NextResponse.json({ error: "Missing transactionId" }, { status: 400 });
        console.log(`[API ADMIN/WITHDRAWALS/APPROVE] Request for Tx: ${transactionId} by Admin: ${adminUserId}`);

        // Process within Transaction
        const result = await prisma.$transaction(async (tx) => {
            const transaction = await tx.transaction.findUnique({
                where: { id: transactionId },
                select: { id: true, amount: true, status: true, type: true, walletId: true, userId: true }
            });

            if (!transaction) throw new Error("Transaction not found."); // -> 404
            if (transaction.type !== 'WITHDRAWAL') throw new Error("Transaction is not a withdrawal."); // -> 400
            // Only allow approving requests that require approval
            if (transaction.status !== 'REQUIRES_APPROVAL') {
                // Allow re-approving PROCESSING maybe? Or just fail? Let's fail for now.
                throw new Error(`Cannot approve transaction with status '${transaction.status}'.`); // -> 409 Conflict
            }

            // Find wallet and check balance AGAIN before debiting
            const wallet = await tx.wallet.findUnique({ where: { id: transaction.walletId } });
            if (!wallet) throw new Error("Associated wallet not found."); // -> 500 or 404?
            if (wallet.balance.comparedTo(transaction.amount) < 0) { // balance < amount
                // If insufficient funds, mark transaction as FAILED instead?
                await tx.transaction.update({ where: { id: transactionId }, data: { status: 'FAILED', description: `Approval failed: Insufficient balance (${wallet.balance})` } });
                console.warn(`[API ADMIN/WITHDRAWALS/APPROVE] Insufficient balance for Tx ${transactionId}. Marked as FAILED.`);
                throw new Error("Insufficient wallet balance to approve withdrawal."); // -> 400
            }

            // Debit wallet
            const updatedWallet = await tx.wallet.update({
                where: { id: transaction.walletId },
                data: { balance: { decrement: transaction.amount } }
            });

            // Update transaction status to PROCESSING
            const updatedTransaction = await tx.transaction.update({
                where: { id: transactionId },
                data: { status: 'PROCESSING', updatedAt: new Date() }
            });

            console.log(`[API ADMIN/WITHDRAWALS/APPROVE] Tx ${transactionId} approved. Balance debited. New Balance: ${updatedWallet.balance}`);
            return updatedTransaction;
        }, { timeout: 15000 }); // 15s timeout

        return NextResponse.json({ success: true, message: "Withdrawal approved and balance debited. Ready for payout.", transactionId: result.id, status: result.status });

    } catch (error) {
        const duration = Date.now() - functionStartTime;
        console.error(`[API ADMIN/WITHDRAWALS/APPROVE] Error for Tx ${transactionId}:`, error);
        let status = 500;
        let message = "Failed to approve withdrawal.";
        let details = error instanceof Error ? error.message : "Unknown error.";
        if (details.includes("not found")) status = 404;
        if (details.includes("not a withdrawal") || details.includes("Insufficient wallet balance")) status = 400;
        if (details.includes("Cannot approve transaction")) status = 409;
        return NextResponse.json({ error: message, details }, { status });
    }
}