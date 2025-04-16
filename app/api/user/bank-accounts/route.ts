// app/api/user/bank-accounts/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path
import { z } from "zod";
import type { Session } from "next-auth";
import { Prisma } from "@prisma/client";

// Session type
interface SessionWithUser extends Omit<Session, 'user'> { user?: { id?: string }; }

// Zod schema for validating new bank account input
const addBankAccountSchema = z.object({
    accountNumber: z.string().length(10, "Account number must be 10 digits").regex(/^\d+$/, "Account number must contain only digits"),
    accountName: z.string().min(3, "Account name seems too short"),
    bankName: z.string().min(2, "Bank name is required"),
    bankCode: z.string().optional(), // Optional but recommended
    isDefault: z.boolean().optional(),
});

// --- POST Handler: Add a new bank account ---
export async function POST(request: NextRequest) {
    console.log("[API /user/bank-accounts] POST request received.");
    try {
        // 1. Authentication
        const session = await getServerSession(authOptions as any) as SessionWithUser;
        const userId = session?.user?.id;
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        console.log(`[API /user/bank-accounts] User ID: ${userId}`);

        // 2. Input Validation
        let requestBody;
        try { requestBody = await request.json(); }
        catch (e) { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

        const validationResult = addBankAccountSchema.safeParse(requestBody);
        if (!validationResult.success) {
            console.warn("[API /user/bank-accounts] Validation failed:", validationResult.error.format());
            return NextResponse.json({ error: "Invalid input data.", details: validationResult.error.format() }, { status: 400 });
        }
        const { accountNumber, accountName, bankName, bankCode, isDefault } = validationResult.data;

        // 3. TODO: Optional - Server-side Account Name Verification
        // If you have access to Paystack/Flutterwave/Mono APIs for verification, call them here
        // To check if accountNumber + bankCode resolves to the provided accountName.
        // If verification fails, return a 400 error.
        console.log(`[API /user/bank-accounts] Verification skipped (TODO). Data: ${accountNumber}, ${bankName}, ${accountName}`);

        // 4. Database Operation (within transaction for setting default)
        const newAccount = await prisma.$transaction(async (tx) => {
            // If setting this as default, unset default on any other accounts first
            if (isDefault) {
                await tx.userBankAccount.updateMany({
                    where: { userId: userId, isDefault: true },
                    data: { isDefault: false }
                });
                console.log(`[API /user/bank-accounts] Unset existing default bank for user ${userId}`);
            }

            // Check how many accounts user already has (optional limit)
            const existingCount = await tx.userBankAccount.count({ where: { userId: userId }});
            if (existingCount >= 5) { // Example limit of 5 accounts
                 throw new Error("Maximum number of bank accounts reached.");
            }


            // Create the new bank account
            console.log(`[API /user/bank-accounts] Creating bank account record...`);
            const createdAccount = await tx.userBankAccount.create({
                data: {
                    userId,
                    accountNumber,
                    accountName, // Store the user-provided name (or verified name if available)
                    bankName,
                    bankCode,
                    isDefault: isDefault ?? (existingCount === 0), // Make default if it's the first one or if requested
                }
            });
             console.log(`[API /user/bank-accounts] Bank account created: ${createdAccount.id}`);
             return createdAccount;
        }); // End transaction

        // 5. Return Success
        return NextResponse.json(newAccount, { status: 201 });

    } catch (error) {
        console.error("[API /user/bank-accounts] POST Error:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            // Handle unique constraint violation (userId + accountNumber)
            return NextResponse.json({ error: "This bank account has already been added." }, { status: 409 });
        }
         if (error instanceof Error && error.message === "Maximum number of bank accounts reached.") {
             return NextResponse.json({ error: error.message }, { status: 400 });
         }
        return NextResponse.json({ error: "Failed to add bank account", details: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
    }
}


// --- GET Handler: List user's saved bank accounts ---
export async function GET(request: NextRequest) {
     console.log("[API /user/bank-accounts] GET request received.");
    try {
        // 1. Authentication
        const session = await getServerSession(authOptions as any) as SessionWithUser;
        const userId = session?.user?.id;
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
         console.log(`[API /user/bank-accounts] User ID: ${userId}`);

        // 2. Fetch Accounts
        const bankAccounts = await prisma.userBankAccount.findMany({
            where: { userId: userId },
            orderBy: { createdAt: 'desc' } // Show newest first
        });
         console.log(`[API /user/bank-accounts] Found ${bankAccounts.length} accounts for user ${userId}.`);

        // 3. Return Accounts
        return NextResponse.json(bankAccounts);

    } catch (error) {
         console.error("[API /user/bank-accounts] GET Error:", error);
         return NextResponse.json({ error: "Failed to fetch bank accounts", details: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
    }
}