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

    // All database amounts are stored in the primary currency unit (naira, not kobo)
    // No need to convert - just return as is
    const formattedTransactions = wallet.transactions.map(transaction => ({
      ...transaction,
      amount: transaction.amount, // Already in naira, no conversion needed
    }));

    return NextResponse.json({
      balance: wallet.balance, // Already in naira, no conversion needed
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