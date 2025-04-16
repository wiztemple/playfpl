// app/api/admin/withdrawals/reject/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path
import type { Session } from "next-auth";
import { Prisma } from "@prisma/client";

interface SessionWithAdmin extends Omit<Session, 'user'> { user?: { id?: string; isAdmin?: boolean; }; }
interface RejectBody { transactionId?: string; reason?: string; } // Add optional reason

export async function POST(request: NextRequest) {
    const functionStartTime = Date.now();
    let transactionId: string | undefined;
    console.log("[API ADMIN/WITHDRAWALS/REJECT] POST request received.");
    try {
        // Auth & Admin Check
        const session = await getServerSession(authOptions as any) as SessionWithAdmin;
        const adminUserId = session?.user?.id;
        if (!adminUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const adminUser = await prisma.user.findUnique({ where: { id: adminUserId }, select: { isAdmin: true } });
        if (!adminUser?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        // Validate Input
        let requestBody: RejectBody;
        try { requestBody = await request.json(); transactionId = requestBody.transactionId; }
        catch (e) { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
        if (!transactionId) return NextResponse.json({ error: "Missing transactionId" }, { status: 400 });
        const reason = requestBody.reason || "Rejected by admin"; // Get optional reason
        console.log(`[API ADMIN/WITHDRAWALS/REJECT] Request for Tx: ${transactionId} by Admin: ${adminUserId}. Reason: ${reason}`);

        // Find transaction and validate status
        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId },
            select: { id: true, status: true, type: true, description: true }
        });

        if (!transaction) throw new Error("Transaction not found."); // -> 404
        if (transaction.type !== 'WITHDRAWAL') throw new Error("Transaction is not a withdrawal."); // -> 400
        // Allow rejecting PENDING or REQUIRES_APPROVAL requests
        if (transaction.status !== 'PENDING' && transaction.status !== 'REQUIRES_APPROVAL') {
            throw new Error(`Cannot reject transaction with status '${transaction.status}'.`); // -> 409 Conflict
        }

        // Update status to FAILED (or CANCELLED depending on semantics)
        // DO NOT change wallet balance
        const updatedTransaction = await prisma.transaction.update({
            where: { id: transactionId },
            data: {
                status: 'FAILED', // Or 'CANCELLED'
                description: transaction.description ? `${transaction.description} (Rejected: ${reason})` : `Withdrawal Rejected: ${reason}`,
                updatedAt: new Date()
            }
        });

        const duration = Date.now() - functionStartTime;
        console.log(`[API ADMIN/WITHDRAWALS/REJECT] Tx ${transactionId} rejected. Duration: ${duration}ms`);
        return NextResponse.json({ success: true, message: "Withdrawal request rejected.", transactionId: updatedTransaction.id, status: updatedTransaction.status });

    } catch (error) {
        const duration = Date.now() - functionStartTime;
        console.error(`[API ADMIN/WITHDRAWALS/REJECT] Error for Tx ${transactionId}:`, error);
        let status = 500; let message = "Failed to reject withdrawal."; let details = error instanceof Error ? error.message : "Unknown error.";
        if (details.includes("not found")) status = 404;
        if (details.includes("not a withdrawal")) status = 400;
        if (details.includes("Cannot reject transaction")) status = 409;
        return NextResponse.json({ error: message, details }, { status: status });
    }
}