// app/api/wallet/transactions/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path if needed
import type { Session } from "next-auth";
import { Prisma } from "@prisma/client"; // Import Prisma namespace for types

// Define Session Type
interface SessionWithUser extends Omit<Session, 'user'> { user?: { id?: string }; }

// Define structure returned by THIS endpoint
// Ensure this matches ClientTransaction type used in frontend hook/component
// Dates are ISO strings, Amount is string (from Decimal)
export interface ClientTransactionAPI {
     id: string; userId: string; walletId: string; type: string;
     amount: string; currency: string; status: string;
     externalReference: string | null; description: string | null;
     createdAt: string; updatedAt: string; metadata: any | null;
}
export interface TransactionApiResponseAPI {
    transactions: ClientTransactionAPI[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
    limit: number;
}

export async function GET(request: NextRequest) {
    console.log("[API /wallet/transactions] GET request received.");
    try {
        // 1. Authentication
        const session = await getServerSession(authOptions as any) as SessionWithUser;
        const userId = session?.user?.id;
        if (!userId) {
            console.warn("[API /wallet/transactions] Unauthorized.");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.log(`[API /wallet/transactions] User ID: ${userId}`);

        // 2. Parse Query Parameters for Pagination, Filtering, Searching
        const { searchParams } = request.nextUrl;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10'); // Default limit per page
        // Get filter values (convert to uppercase if your DB/Enums use that)
        const filterType = searchParams.get('type')?.toUpperCase();
        const filterStatus = searchParams.get('status')?.toUpperCase();
        const searchTerm = searchParams.get('search');

        // Basic validation for pagination params
        if (isNaN(page) || page < 1) { return NextResponse.json({ error: "Invalid page parameter"}, { status: 400 }); }
        if (isNaN(limit) || limit < 1 || limit > 100) { // Add upper bound for limit
            return NextResponse.json({ error: "Invalid limit parameter (must be 1-100)"}, { status: 400 });
        }

        const skip = (page - 1) * limit;

        // 3. Build Database Query WHERE Clause Dynamically
        const whereClause: Prisma.TransactionWhereInput = {
            userId: userId, // Always filter by logged-in user
        };
        if (filterType) {
             // Assuming 'type' is String in schema now. Add validation if needed.
             whereClause.type = filterType;
        }
        if (filterStatus) {
             // Assuming 'status' is String in schema now. Add validation if needed.
             whereClause.status = filterStatus;
        }
        if (searchTerm) {
            // Search across multiple relevant fields
            whereClause.OR = [
                { description: { contains: searchTerm, mode: 'insensitive' } },
                { externalReference: { contains: searchTerm, mode: 'insensitive' } },
                { id: { contains: searchTerm, mode: 'insensitive' } }, // Allow searching by Transaction ID
                // Consider searching by amount if useful, requires parsing searchTerm as number potentially
            ];
        }
        console.log("[API /wallet/transactions] Query Params:", { page, limit, filterType, filterStatus, searchTerm });
        console.log("[API /wallet/transactions] Where Clause:", JSON.stringify(whereClause));

        // 4. Fetch Data (Total Count and Paginated Results)
        // Use a transaction to get both count and data consistently
        const [totalCount, transactions] = await prisma.$transaction([
             prisma.transaction.count({ where: whereClause }),
             prisma.transaction.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' }, // Show newest transactions first
                skip: skip,
                take: limit,
                // Select all fields needed for the response
                 select: {
                    id: true, userId: true, walletId: true, type: true, amount: true,
                    currency: true, status: true, externalReference: true, description: true,
                    createdAt: true, updatedAt: true, metadata: true
                 }
            })
        ]);

        const totalPages = Math.ceil(totalCount / limit);

         // 5. Format Data for JSON Response
        const formattedTransactions: ClientTransactionAPI[] = transactions.map(t => ({
            ...t,
            // Convert Decimal to string to avoid precision loss in JSON/JavaScript number
            amount: t.amount.toString(),
            // Convert Dates to ISO strings
            createdAt: t.createdAt.toISOString(),
            updatedAt: t.updatedAt.toISOString(),
        }));

        const responsePayload: TransactionApiResponseAPI = {
            transactions: formattedTransactions,
            totalCount,
            totalPages,
            currentPage: page,
            limit
        };

        console.log(`[API /wallet/transactions] Found ${totalCount} total tx, returning page ${page}/${totalPages} (${formattedTransactions.length} tx).`);
        return NextResponse.json(responsePayload);

    } catch (error) {
        console.error("[API /wallet/transactions] Error fetching transactions:", error);
        let errorMsg = "Failed to fetch transactions";
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            errorMsg = "Database error while fetching transactions.";
            console.error(`Prisma Error Code: ${error.code}`);
        } else if (error instanceof Error) {
            errorMsg = error.message;
        }
        return NextResponse.json(
            { error: "Failed to fetch transactions", details: errorMsg },
            { status: 500 }
        );
    }
}