// app/api/admin/deposits/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path
import type { Session } from "next-auth";
import { Prisma } from "@prisma/client";

// Session type with Admin flag
interface SessionWithAdmin extends Omit<Session, 'user'> {
    user?: { id?: string; isAdmin?: boolean; };
}


export async function GET(request: NextRequest) {
    console.log("[API ADMIN/DEPOSITS] GET request received.");
    // --- Authorization ---
    const session = await getServerSession(authOptions as any) as SessionWithAdmin;
    const adminUserId = session?.user?.id;
    if (!adminUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const adminUser = await prisma.user.findUnique({ where: { id: adminUserId }, select: { isAdmin: true } });
    if (!adminUser?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    console.log(`[API ADMIN/DEPOSITS] Authorized Admin: ${adminUserId}`);

    try {
        const { searchParams } = request.nextUrl;
        const statusFilter = searchParams.get('status');

        // Default to fetching PENDING deposits if no status specified or if specified
        const whereClause: Prisma.TransactionWhereInput = {
             type: 'DEPOSIT', // Only show deposits
             status: statusFilter === 'PENDING' ? 'PENDING' : 'PENDING' // Only pending for now
             // status: statusFilter ? (statusFilter.toUpperCase() as TransactionStatus) : 'PENDING' // More flexible if needed later
        };

        const pendingDeposits = await prisma.transaction.findMany({
            where: whereClause,
            select: {
                id: true,
                amount: true,
                currency: true,
                createdAt: true,
                externalReference: true,
                userId: true,
                user: { // Include user name/email
                    select: {
                        name: true,
                        email: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'asc' // Show oldest first
            }
        });

        // Convert Decimal amount to number string for JSON compatibility if necessary
        // Prisma typically handles this, but good practice if issues arise
        const formattedDeposits = pendingDeposits.map(d => ({
            ...d,
            amount: d.amount.toString() // Example: ensure string format
        }));

        console.log(`[API ADMIN/DEPOSITS] Found ${formattedDeposits.length} pending deposits.`);
        return NextResponse.json(formattedDeposits);

    } catch (error) {
        console.error("[API ADMIN/DEPOSITS] Error fetching pending deposits:", error);
        return NextResponse.json(
            { error: "Failed to fetch pending deposits", details: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}