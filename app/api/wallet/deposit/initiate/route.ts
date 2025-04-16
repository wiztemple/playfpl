import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path if needed
import { Prisma } from "@prisma/client"; // Import Prisma namespace for Decimal
import type { Session } from "next-auth";

// Define session type with user ID
interface SessionWithUser extends Omit<Session, 'user'> {
    user?: { id?: string; email?: string; name?: string; };
}

// Define expected request body structure
interface DepositRequestBody {
    amount?: number;
}

export async function POST(request: NextRequest) {
    console.log("[API /wallet/deposit/initiate] Received POST request.");

    try {
        // 1. --- Authentication ---
        const session = await getServerSession(authOptions as any) as SessionWithUser;
        const userId = session?.user?.id;

        if (!userId) {
            console.warn("[API /wallet/deposit/initiate] Unauthorized: No session user ID.");
            return NextResponse.json({ error: "Unauthorized: Please log in." }, { status: 401 });
        }
        console.log(`[API /wallet/deposit/initiate] User ID: ${userId}`);

        // 2. --- Input Validation ---
        let requestBody: DepositRequestBody;
        try {
            requestBody = await request.json();
        } catch (e) {
            console.warn("[API /wallet/deposit/initiate] Invalid JSON body.");
            return NextResponse.json({ error: "Invalid request body. Amount is required." }, { status: 400 });
        }

        const { amount } = requestBody;

        if (typeof amount !== 'number' || amount <= 0 || isNaN(amount)) {
            console.warn(`[API /wallet/deposit/initiate] Invalid amount received: ${amount}`);
            return NextResponse.json({ error: "Invalid deposit amount. Amount must be a positive number." }, { status: 400 });
        }
        // Ensure amount has max 2 decimal places if needed, though DB handles storage
        const depositAmount = parseFloat(amount.toFixed(2));
        if (depositAmount <= 0) {
             return NextResponse.json({ error: "Deposit amount must be positive." }, { status: 400 });
        }

        console.log(`[API /wallet/deposit/initiate] Validated deposit amount: ${depositAmount}`);

        // 3. --- Generate Unique Reference Code ---
        // Simple example: prefix + last 4 of userId + timestamp fragment
        // Consider a more robust method for production to ensure uniqueness under high load
        const userSuffix = userId.slice(-4).toUpperCase();
        const timeSuffix = Date.now().toString().slice(-6);
        const referenceCode = `DEP-${userSuffix}-${timeSuffix}`;
        console.log(`[API /wallet/deposit/initiate] Generated Reference Code: ${referenceCode}`);


        // 4. --- Create Pending Transaction & Ensure Wallet Exists (within DB Transaction) ---
        let walletId: string;

        const createdTransaction = await prisma.$transaction(async (tx) => {
            // Find user's wallet
            let wallet = await tx.wallet.findUnique({
                where: { userId: userId },
                select: { id: true } // Only select ID
            });

            // Create wallet if it doesn't exist
            if (!wallet) {
                console.log(`[API /wallet/deposit/initiate] No wallet found for user ${userId}. Creating one...`);
                wallet = await tx.wallet.create({
                    data: {
                        userId: userId,
                        currency: 'NGN', // Default currency from schema
                        balance: 0, // Initial balance
                    },
                    select: { id: true }
                });
                console.log(`[API /wallet/deposit/initiate] Wallet created with ID: ${wallet.id}`);
            }
            walletId = wallet.id; // Assign wallet ID

            // Create the PENDING deposit transaction
            console.log(`[API /wallet/deposit/initiate] Creating PENDING transaction for amount ${depositAmount}...`);
            const newTransaction = await tx.transaction.create({
                data: {
                    userId: userId,
                    walletId: walletId,
                    type: 'DEPOSIT',        // Use Enum value
                    status: 'PENDING',      // Use Enum value
                    amount: depositAmount, // Prisma handles number -> Decimal conversion
                    currency: 'NGN',        // Match wallet currency
                    externalReference: referenceCode,
                    description: `Deposit request ref: ${referenceCode}`,
                }
            });
            console.log(`[API /wallet/deposit/initiate] Pending transaction created: ${newTransaction.id}`);
            return newTransaction; // Return created transaction from the DB transaction block
        });

        // 5. --- Get Central Deposit Account Details ---
        const depositAccountDetails = {
            bankName: process.env.DEPOSIT_BANK_NAME || "Bank Name Not Configured",
            accountNumber: process.env.DEPOSIT_ACCOUNT_NUMBER || "Account Number Not Configured",
            accountName: process.env.DEPOSIT_ACCOUNT_NAME || "Account Name Not Configured",
        };

        // Check if details are configured
        if (depositAccountDetails.bankName.includes("Not Configured")) {
             console.error("[API /wallet/deposit/initiate] CRITICAL: Deposit bank details not configured in environment variables!");
             // Don't expose details, but maybe return a specific error?
             // Or allow creation but warn admin? For now, let's proceed but log heavily.
        }

        // 6. --- Return Success Response ---
        console.log(`[API /wallet/deposit/initiate] Deposit initiated successfully for user ${userId}. Ref: ${referenceCode}`);
        return NextResponse.json({
            message: "Deposit initiated successfully. Please use the reference code for your transfer.",
            referenceCode: referenceCode,
            transactionId: createdTransaction.id, // Return the new transaction ID
            depositAccountDetails: depositAccountDetails
        }, { status: 201 }); // 201 Created status

    } catch (error) {
        console.error("[API /wallet/deposit/initiate] Error:", error);
        // Handle potential Prisma errors specifically if needed
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
             // Log specific Prisma error code
             console.error(`[API /wallet/deposit/initiate] Prisma Error Code: ${error.code}`);
        }
        return NextResponse.json(
            { error: "Failed to initiate deposit.", details: error instanceof Error ? error.message : "Unknown server error." },
            { status: 500 }
        );
    }
}