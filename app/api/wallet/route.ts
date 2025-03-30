import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get the user's wallet with transactions
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!wallet) {
      return NextResponse.json(
        { error: "Wallet not found" },
        { status: 404 }
      );
    }

    // Format amounts to be in the correct units (NGN is stored in kobo)
    const formattedTransactions = wallet.transactions.map(transaction => ({
      ...transaction,
      amount: transaction.amount / 100, // Convert from kobo to naira
    }));

    return NextResponse.json({
      balance: wallet.balance / 100, // Convert from kobo to naira
      currency: wallet.currency,
      transactions: formattedTransactions
    });
  } catch (error) {
    console.error("Error fetching wallet:", error);
    return NextResponse.json(
      { error: "Failed to fetch wallet" },
      { status: 500 }
    );
  }
}
