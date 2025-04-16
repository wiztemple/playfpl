// app/api/wallet/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path if needed
import type { Session } from "next-auth";
import { Prisma } from '@prisma/client'; // Import Prisma namespace

// Define session type with user ID
interface SessionWithUser extends Omit<Session, 'user'> {
  user?: { id?: string };
}

// Define the expected structure for the response body
interface WalletBalanceResponse {
  balance: number; // Return balance as a number
  currency: string;
}

export async function GET(request: NextRequest) {
  console.log("[API /wallet] GET request received.");

  try {
    // 1. --- Authentication ---
    const session = await getServerSession(authOptions as any) as SessionWithUser;
    const userId = session?.user?.id;

    if (!userId) {
      console.warn("[API /wallet] Unauthorized: No session user ID.");
      return NextResponse.json({ error: "Unauthorized: Please log in." }, { status: 401 });
    }
    console.log(`[API /wallet] User ID: ${userId}`);

    // 2. --- Fetch Wallet Data ---
    const wallet = await prisma.wallet.findUnique({
      where: { userId: userId },
      select: {
        balance: true,
        currency: true,
      }
    });

    let responseData: WalletBalanceResponse;

    if (wallet) {
      console.log(`[API /wallet] Wallet found for user ${userId}. Balance: ${wallet.balance}, Currency: ${wallet.currency}`);
      // Convert Prisma Decimal to standard number for JSON response
      let finalBalance: number;
      if (typeof wallet.balance === 'number') {
        finalBalance = wallet.balance;
      } else if (wallet.balance && typeof (wallet.balance as any).toNumber === 'function') {
        // Fallback if it IS a Decimal object unexpectedly
        finalBalance = (wallet.balance as any).toNumber();
        console.warn("[API /wallet] Prisma returned Decimal object, converting with .toNumber()");
      } else {
        // Fallback if it's something else weird (e.g., string) - try parsing
        console.warn(`[API /wallet] Unexpected balance type (${typeof wallet.balance}). Attempting parseFloat.`);
        finalBalance = parseFloat(String(wallet.balance) || '0');
      }

      // Ensure it's a valid number before returning
      if (isNaN(finalBalance)) {
        console.error(`[API /wallet] Failed to get valid number for balance (${wallet.balance}) for user ${userId}. Returning 0.`);
        finalBalance = 0;
      }

      responseData = {
        balance: finalBalance, // Use the number directly
        currency: wallet.currency
      };
    } else {
      // Wallet doesn't exist yet for this user. Create one lazily or return default?
      // For now, let's return a default zero balance.
      // Consider creating the wallet on user signup instead.
      console.warn(`[API /wallet] No wallet found for user ${userId}. Returning default balance.`);
      responseData = {
        balance: 0,
        currency: 'NGN' // Default currency
      };
      // // Alternatively, create the wallet here (less ideal for a GET request)
      // const newWallet = await prisma.wallet.create({data: {userId: userId, currency: 'NGN', balance: 0}});
      // responseData = { balance: newWallet.balance.toNumber(), currency: newWallet.currency };
    }

    // 3. --- Return Success Response ---
    return NextResponse.json(responseData);

  } catch (error) {
    console.error("[API /wallet] Error fetching wallet balance:", error);
    let errorMessage = "Failed to fetch wallet balance.";
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error(`[API /wallet] Prisma Error Code: ${error.code}`);
      errorMessage = "Database error occurred while fetching wallet.";
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json(
      { error: "Failed to fetch wallet balance", details: errorMessage },
      { status: 500 }
    );
  }
}