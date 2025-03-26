// app/api/payment/verify/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');
    const leagueId = searchParams.get('leagueId');
    const fplTeamId = searchParams.get('fplTeamId');
    
    if (!reference || !leagueId || !fplTeamId) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/payment/failed?error=missing-params`);
    }
    
    // Find the transaction
    const transaction = await prisma.transaction.findFirst({
      where: { externalReference: reference }
    });
    
    if (!transaction) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/payment/failed?error=transaction-not-found`);
    }
    
    // Verify with Paystack
    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const verifyData = await verifyResponse.json();
    
    if (!verifyData.status || verifyData.data.status !== 'success') {
      // Update transaction to failed
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'failed' }
      });
      
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/payment/failed?reference=${reference}`);
    }
    
    // Payment successful, update transaction and wallet
    await prisma.$transaction(async (tx) => {
      // Update transaction status
      await tx.transaction.update({
        where: { id: transaction.id },
        data: { status: 'completed' }
      });

      // Update wallet balance
      await tx.wallet.update({
        where: { userId: transaction.userId },
        data: {
          balance: {
            increment: transaction.amount
          }
        }
      });
    });

    // Join the league
    await prisma.leagueEntry.create({
      data: {
        userId: transaction.userId,
        leagueId,
        fplTeamId: parseInt(fplTeamId as string),
        paid: true,
        paymentId: transaction.id
      }
    });
    
    // Redirect to success page
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/leagues/my-leagues?success=true`);
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/payment/failed?error=server-error`);
  }
}