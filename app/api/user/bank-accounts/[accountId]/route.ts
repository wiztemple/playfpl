// app/api/user/bank-accounts/[accountId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path
import type { Session } from "next-auth";

// Session type
interface SessionWithUser extends Omit<Session, 'user'> { user?: { id?: string }; }

export async function DELETE(
    request: NextRequest,
    context: { params: { accountId: string } } // Get accountId from context.params
) {
    const accountId = context.params.accountId;
    console.log(`[API DELETE /user/bank-accounts] Request for ID: ${accountId}`);

    try {
        // 1. Authentication
        const session = await getServerSession(authOptions as any) as SessionWithUser;
        const userId = session?.user?.id;
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        console.log(`[API DELETE /user/bank-accounts] User ID: ${userId}`);

        if (!accountId || typeof accountId !== 'string') {
            return NextResponse.json({ error: "Invalid Bank Account ID provided" }, { status: 400 });
        }

        // 2. Find the account to verify ownership
        const accountToDelete = await prisma.userBankAccount.findUnique({
            where: { id: accountId },
            select: { userId: true } // Only need userId for ownership check
        });

        if (!accountToDelete) {
            console.warn(`[API DELETE /user/bank-accounts] Account ${accountId} not found.`);
            return NextResponse.json({ error: "Bank account not found" }, { status: 404 });
        }

        // 3. Verify Ownership
        if (accountToDelete.userId !== userId) {
            console.warn(`[API DELETE /user/bank-accounts] User ${userId} attempted to delete account ${accountId} belonging to user ${accountToDelete.userId}.`);
            return NextResponse.json({ error: "Forbidden: Cannot delete this bank account" }, { status: 403 });
        }

        // 4. Delete the account
        console.log(`[API DELETE /user/bank-accounts] Deleting account ${accountId} for user ${userId}...`);
        await prisma.userBankAccount.delete({
            where: { id: accountId } // Use the unique ID for deletion
        });
        console.log(`[API DELETE /user/bank-accounts] Account ${accountId} deleted successfully.`);

        // 5. Return Success
        return NextResponse.json({ success: true, message: "Bank account deleted successfully." }, { status: 200 }); // OK status for delete

    } catch (error) {
        console.error(`[API DELETE /user/bank-accounts] DELETE Error for ID ${accountId}:`, error);
        return NextResponse.json({ error: "Failed to delete bank account", details: error instanceof Error ? error.message : "Unknown server error." }, { status: 500 });
    }
}