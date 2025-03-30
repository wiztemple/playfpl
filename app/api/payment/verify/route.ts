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
    
    // Find the transaction in our database
    const transaction = await prisma.transaction.findFirst({
      where: {
        externalReference: reference
      }
    });
    
    if (!transaction) {
      console.error(`Transaction not found for reference: ${reference}`);
      
      // Try to find the league entry instead
      const leagueEntry = await prisma.leagueEntry.findFirst({
        where: {
          paymentId: reference
        }
      });
      
      if (leagueEntry) {
        // If we found the league entry but not the transaction, update the entry
        await prisma.leagueEntry.update({
          where: { id: leagueEntry.id },
          data: { paid: true }
        });
        
        // Redirect to my-leagues page with success parameter instead of non-existent success page
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/leagues/my-leagues?success=true`);
      }
      
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
    try {
      // Check if the user already has an entry in this league
      const existingEntry = await prisma.leagueEntry.findUnique({
        where: {
          userId_leagueId: {
            userId: transaction.userId,
            leagueId: leagueId
          }
        }
      });
    
      if (existingEntry) {
        // Update the existing entry instead of creating a new one
        await prisma.leagueEntry.update({
          where: { id: existingEntry.id },
          data: {
            paid: true,
            paymentId: transaction.id
          }
        });
      } else {
        // Create a new league entry
        await prisma.leagueEntry.create({
          data: {
            userId: transaction.userId,
            leagueId,
            fplTeamId: parseInt(fplTeamId as string),
            paid: true,
            paymentId: transaction.id
          }
        });
      }
    } catch (error) {
      console.error("Error creating/updating league entry:", error);
      // Continue with the payment flow even if league entry creation fails
    }
    
    // Redirect to success page
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/leagues/my-leagues?success=true`);
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/payment/failed?error=server-error`);
  }
}