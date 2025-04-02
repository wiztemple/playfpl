// /app/api/wallet/deposit/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { z } from "zod";
import { prisma } from "@/lib/db";

// Validation schema
const depositSchema = z.object({
  amount: z.number().positive().min(5).max(10000), // Updated max amount to 10000
  email: z.string().email(),
  name: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate request body
    const body = await request.json();
    const validationResult = depositSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { amount, email, name } = validationResult.data;

    // Get or create user wallet
    let wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId: session.user.id,
          balance: 0,
          currency: "NGN",
        },
      });
    }

    // Generate a reference code
    const reference = `fpl_deposit_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;

    // Initialize Paystack transaction
    const paystackURL = 'https://api.paystack.co/transaction/initialize';
    const paystackResponse = await fetch(paystackURL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amount * 100), // Convert to kobo FOR PAYSTACK ONLY
        reference,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/wallet/verify-deposit`,
        metadata: {
          userId: session.user.id,
          walletId: wallet.id,
          type: 'wallet_deposit',
          name: name || 'FPL Player'
        },
        currency: "NGN",
        channels: ["card", "bank_transfer", "ussd", "qr", "mobile_money"]
      })
    });

    const paystackData = await paystackResponse.json();

    if (!paystackData.status) {
      console.error("Paystack error:", paystackData.message);
      return NextResponse.json(
        { error: paystackData.message || "Payment initialization failed" },
        { status: 400 }
      );
    }

    // Create a pending transaction record - STORE AS NAIRA in DB
    try {
      await prisma.transaction.create({
        data: {
          userId: session.user.id,
          walletId: wallet.id,
          type: "deposit",
          amount: amount, // Store in naira (NOT kobo)
          currency: "NGN",
          status: "pending",
          externalReference: reference,
          description: `Wallet deposit of ₦${amount}`
        }
      });

      console.log(`Successfully created transaction record for reference: ${reference}`);
    } catch (transactionError) {
      console.error("Transaction creation error:", transactionError);
      // Continue with the payment flow even if transaction recording fails
    }

    // For DEMO ONLY: Automatically update balance (remove this in production)
    // This would normally be handled by the webhook from Paystack
    if (process.env.NODE_ENV === 'development') {
      try {
        // Demo auto-complete transaction by UPDATING the existing pending transaction
        setTimeout(async () => {
          // First, find the pending transaction
          const pendingTransaction = await prisma.transaction.findFirst({
            where: {
              externalReference: reference,
              status: "pending"
            }
          });

          if (pendingTransaction) {
            // Update the transaction status to completed
            await prisma.transaction.update({
              where: {
                id: pendingTransaction.id
              },
              data: {
                status: "completed"
              }
            });

            // Update the wallet balance
            await prisma.wallet.update({
              where: { id: wallet.id },
              data: {
                balance: {
                  increment: amount // Increment by naira amount (NOT kobo)
                }
              }
            });

            console.log(`Demo: Updated transaction ${pendingTransaction.id} to completed`);
          } else {
            console.log(`Warning: Could not find pending transaction with reference ${reference}`);
          }
        }, 3000);
      } catch (demoError) {
        console.error("Demo auto-complete error:", demoError);
      }
    }

    return NextResponse.json({
      success: true,
      paymentUrl: paystackData.data.authorization_url,
      reference
    });
  } catch (error) {
    console.error("Error processing deposit:", error);
    return NextResponse.json(
      { error: "Failed to process deposit" },
      { status: 500 }
    );
  }
}