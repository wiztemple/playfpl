import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { z } from 'zod';
import { prisma } from "@/lib/db";

// Validation schema
const withdrawSchema = z.object({
    amount: z.number().positive().min(5),
    account_number: z.string().length(10),
    bank_code: z.string(),
    account_name: z.string(),
    bank_name: z.string(),
});

export async function POST(request: Request) {
    try {
        // Replace auth() with getServerSession(authOptions)
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Validate request body
        const body = await request.json();
        const validationResult = withdrawSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                {
                    error: "Invalid request data",
                    details: validationResult.error.format(),
                },
                { status: 400 }
            );
        }

        const { amount, account_number, bank_code, account_name, bank_name } = validationResult.data;

        // Get user wallet
        const wallet = await prisma.wallet.findUnique({
            where: { userId: session.user.id },
        });

        if (!wallet) {
            return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
        }

        // Check if user has enough balance
        if (wallet.balance < amount) {
            return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
        }

        // Generate a reference code
        const reference = `fpl_withdraw_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;

        // Create a recipient on Paystack
        const createRecipientResponse = await fetch('https://api.paystack.co/transferrecipient', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'nuban',
                name: account_name,
                account_number,
                bank_code,
                currency: 'NGN'
            })
        });

        const recipientData = await createRecipientResponse.json();

        if (!recipientData.status) {
            return NextResponse.json({ error: recipientData.message || "Failed to create recipient" }, { status: 400 });
        }

        const recipient_code = recipientData.data.recipient_code;

        // Initiate transfer
        const transferResponse = await fetch('https://api.paystack.co/transfer', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                source: 'balance',
                amount: Math.round(amount * 100), // Convert to kobo
                recipient: recipient_code,
                reason: `Withdrawal to ${account_name} (${bank_name})`,
                reference
            })
        });

        const transferData = await transferResponse.json();

        // Create transaction and update wallet in a transaction
        await prisma.$transaction(async (tx) => {
            // Create transaction record
            await tx.transaction.create({
                data: {
                    userId: session.user.id,
                    walletId: wallet.id,
                    type: "withdrawal",
                    amount,
                    currency: "NGN",
                    status: transferData.status ? "pending" : "failed",
                    externalReference: reference,
                    // Store metadata as a JSON string if your schema doesn't have a JSON field
                    metadata: JSON.stringify({
                        account_number,
                        bank_code,
                        account_name,
                        bank_name,
                        recipient_code
                    })
                },
            });

            // Update wallet balance
            if (transferData.status) {
                await tx.wallet.update({
                    where: { id: wallet.id },
                    data: {
                        balance: {
                            decrement: amount
                        }
                    }
                });
            }
        });

        if (!transferData.status) {
            return NextResponse.json(
                { error: transferData.message || "Transfer failed" },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Withdrawal initiated successfully",
            reference
        });
    } catch (error) {
        console.error("Error processing withdrawal:", error);
        return NextResponse.json(
            { error: "Failed to process withdrawal" },
            { status: 500 }
        );
    }
}