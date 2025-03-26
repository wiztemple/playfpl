// /app/api/wallet/deposit/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { z } from "zod";

const depositSchema = z.object({
  amount: z.number().positive().min(5).max(1000),
});

export async function POST(request: Request) {
  try {
    const session = await auth();

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

    const { amount } = validationResult.data;

    // Get or create user wallet
    let wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId: session.user.id,
          balance: 0,
          currency: "USD",
        },
      });
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "usd",
      metadata: {
        userId: session.user.id,
        walletId: wallet.id,
        type: "wallet_deposit",
      },
    });

    // Create a pending transaction record
    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        walletId: wallet.id,
        type: "deposit",
        amount,
        currency: "USD",
        status: "pending",
        externalReference: paymentIntent.id,
      },
    });

    return NextResponse.json({
      transaction,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Error processing deposit:", error);
    return NextResponse.json(
      { error: "Failed to process deposit" },
      { status: 500 }
    );
  }
}
