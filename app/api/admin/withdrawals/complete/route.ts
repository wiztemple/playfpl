// app/api/admin/withdrawals/complete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path
import type { Session } from "next-auth";
import { Prisma } from "@prisma/client";

interface SessionWithAdmin extends Omit<Session, 'user'> { user?: { id?: string; isAdmin?: boolean; }; }
interface CompleteBody { transactionId?: string; bankReference?: string; } // Optional bank ref

export async function POST(request: NextRequest) {
    const functionStartTime = Date.now();
    let transactionId: string | undefined;
    console.log("[API ADMIN/WITHDRAWALS/COMPLETE] POST request received.");
    try {
        // Auth & Admin Check
        const session = await getServerSession(authOptions as any) as SessionWithAdmin;
        const adminUserId = session?.user?.id;
        if (!adminUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const adminUser = await prisma.user.findUnique({ where: { id: adminUserId }, select: { isAdmin: true } });
        if (!adminUser?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        // Validate Input
        let requestBody: CompleteBody;
        try { requestBody = await request.json(); transactionId = requestBody.transactionId; }
        catch (e) { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
        if (!transactionId) return NextResponse.json({ error: "Missing transactionId" }, { status: 400 });
        const bankReference = requestBody.bankReference; // Optional ref from actual bank transfer
        console.log(`[API ADMIN/WITHDRAWALS/COMPLETE] Request for Tx: ${transactionId} by Admin: ${adminUserId}. Bank Ref: ${bankReference}`);


        // Find transaction and validate status
        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId },
            select: { id: true, status: true, type: true, externalReference: true }
        });

        if (!transaction) throw new Error("Transaction not found."); // -> 404
        if (transaction.type !== 'WITHDRAWAL') throw new Error("Transaction is not a withdrawal."); // -> 400
        // Can only complete PROCESSING transactions
        if (transaction.status !== 'PROCESSING') {
            // Allow re-completing already COMPLETED maybe? Or just fail? Let's fail for now.
            throw new Error(`Cannot complete transaction with status '${transaction.status}'.`); // -> 409 Conflict
        }

        // Update status to COMPLETED
        // DO NOT change wallet balance here (already debited on approval)
        const updatedTransaction = await prisma.transaction.update({
            where: { id: transactionId },
            data: {
                status: 'COMPLETED',
                externalReference: bankReference || transaction.externalReference, // Update reference if provided
                updatedAt: new Date()
            }
        });

        const duration = Date.now() - functionStartTime;
        console.log(`[API ADMIN/WITHDRAWALS/COMPLETE] Tx ${transactionId} marked as completed. Duration: ${duration}ms`);
        return NextResponse.json({ success: true, message: "Withdrawal marked as completed.", transactionId: updatedTransaction.id, status: updatedTransaction.status });

    } catch (error) {
        const duration = Date.now() - functionStartTime;
        console.error(`[API ADMIN/WITHDRAWALS/COMPLETE] Error for Tx ${transactionId}:`, error);
        let status = 500; let message = "Failed to mark withdrawal as completed."; let details = error instanceof Error ? error.message : "Unknown error.";
        if (details.includes("not found")) status = 404;
        if (details.includes("not a withdrawal")) status = 400;
        if (details.includes("Cannot complete transaction")) status = 409;
        return NextResponse.json({ error: message, details }, { status: status });
    }
}