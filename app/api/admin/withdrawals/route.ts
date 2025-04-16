// app/api/admin/withdrawals/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path
import type { Session } from "next-auth";
import { Prisma, TransactionStatus } from "@prisma/client";

interface SessionWithAdmin extends Omit<Session, 'user'> { user?: { id?: string; isAdmin?: boolean; }; }

// Type for data returned (includes user info and metadata)
export type AdminWithdrawalRequest = Prisma.TransactionGetPayload<{
    select: {
        id: true; amount: true; currency: true; createdAt: true; status: true;
        externalReference: true; description: true; metadata: true; userId: true;
        user: { select: { name: true; email: true; } }
    }
}>;

export async function GET(request: NextRequest) {
    console.log("[API ADMIN/WITHDRAWALS] GET request received.");
    try {
        // Auth & Admin Check
        const session = await getServerSession(authOptions as any) as SessionWithAdmin;
        const adminUserId = session?.user?.id;
        if (!adminUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const adminUser = await prisma.user.findUnique({ where: { id: adminUserId }, select: { isAdmin: true } });
        if (!adminUser?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const { searchParams } = request.nextUrl;
        // Filter by status (e.g., REQUIRES_APPROVAL, PROCESSING) - Default to REQUIRES_APPROVAL
        const statusFilter = searchParams.get('status')?.toUpperCase() || 'REQUIRES_APPROVAL';

        // Validate status filter if needed based on Enum
        const validStatuses = Object.keys(TransactionStatus);
        if (!validStatuses.includes(statusFilter)) {
            return NextResponse.json({ error: `Invalid status filter: ${statusFilter}` }, { status: 400 });
        }

        console.log(`[API ADMIN/WITHDRAWALS] Fetching withdrawals with status: ${statusFilter}`);
        const whereClause: Prisma.TransactionWhereInput = {
            type: 'WITHDRAWAL', // Only withdrawals
            status: statusFilter as TransactionStatus // Cast to enum type if using enums, otherwise keep string
            // status: statusFilter // Use this if status is String in schema
        };

        const withdrawalRequests = await prisma.transaction.findMany({
            where: whereClause,
            select: { // Select all necessary data for admin display
                id: true, amount: true, currency: true, createdAt: true, status: true,
                externalReference: true, description: true, metadata: true, userId: true,
                user: { select: { name: true, email: true } }
            },
            orderBy: { createdAt: 'asc' } // Oldest requests first
        });

        // Format for JSON (convert Decimal to string/number)
        const formattedData = withdrawalRequests.map(req => ({
            ...req,
            amount: req.amount.toString(), // Example: Convert Decimal to string
            createdAt: req.createdAt.toISOString(), // Convert Date to string
            // Ensure metadata is parsed/serializable if needed, Prisma handles JSON type well
        }));

        return NextResponse.json(formattedData);

    } catch (error) {
        console.error("[API ADMIN/WITHDRAWALS] GET Error:", error);
        return NextResponse.json({ error: "Failed to fetch withdrawal requests" }, { status: 500 });
    }
}