// app/api/payment/initiate/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await request.json();
    const { leagueId, fplTeamId, amount, email, name, metadata } = body;
    
    if (!leagueId || !fplTeamId || !amount || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    // Get user wallet or create one if it doesn't exist
    let wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id }
    });
    
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId: session.user.id,
          balance: 0,
          currency: "NGN", // Using Nigerian Naira
        }
      });
    }
    
    // Generate a reference code
    const reference = `fpl_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
    
    // Prepare Paystack request
    const paystackURL = 'https://api.paystack.co/transaction/initialize';
    const paystackResponse = await fetch(paystackURL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        amount,
        reference,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/verify?leagueId=${leagueId}&fplTeamId=${fplTeamId}`,
        metadata: {
          leagueId,
          fplTeamId,
          userId: session.user.id,
          ...metadata
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
    
    // Record the pending transaction
    await prisma.transaction.create({
      data: {
        userId: session.user.id,
        walletId: wallet.id,
        type: 'entry_fee',
        amount: -(amount / 100), // Store in main currency unit, negative for payment
        currency: "NGN",
        status: 'pending',
        externalReference: reference,
        description: `Entry fee for ${metadata.league_name} - Gameweek ${metadata.gameweek}`
      }
    });
    
    return NextResponse.json({
      success: true,
      authorization_url: paystackData.data.authorization_url,
      reference
    });
  } catch (error) {
    console.error("Payment initiation error:", error);
    return NextResponse.json(
      { error: "Failed to initiate payment" },
      { status: 500 }
    );
  }
}