import { NextResponse } from 'next/server';
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');
    
    if (!reference) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/wallet?error=missing-reference`);
    }
    
    // Find the transaction
    const transaction = await prisma.transaction.findFirst({
      where: { externalReference: reference }
    });
    
    if (!transaction) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/wallet?error=transaction-not-found`);
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
      
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/wallet?error=payment-failed&reference=${reference}`);
    }
    
    // Payment successful, update transaction and wallet
    await prisma.$transaction(async (tx) => {
      // Update the transaction status using the id
      await tx.transaction.update({
        where: { id: transaction.id },
        data: { status: 'completed' }
      });
      
      // Update wallet balance
      await tx.wallet.update({
        where: { userId: transaction.userId },
        data: {
          balance: {
            increment: transaction.amount / 100 // Convert from kobo back to naira
          }
        }
      });
    });
    
    // Redirect to success page
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/wallet?success=deposit`);
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/wallet?error=server-error`);
  }
}