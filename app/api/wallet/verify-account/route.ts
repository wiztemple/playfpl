import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function POST(request: Request) {
    try {
        // Replace auth() with getServerSession(authOptions)
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get request body
        const body = await request.json();
        const { account_number, bank_code } = body;

        if (!account_number || !bank_code) {
            return NextResponse.json(
                { error: "Account number and bank code are required" },
                { status: 400 }
            );
        }

        // Call Paystack API to verify account
        const response = await fetch(
            `https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const data = await response.json();

        if (!data.status) {
            return NextResponse.json(
                { error: data.message || "Could not verify account" },
                { status: 400 }
            );
        }

        return NextResponse.json({
            account_name: data.data.account_name,
            account_number: data.data.account_number,
            bank_code,
        });
    } catch (error) {
        console.error("Error verifying account:", error);
        return NextResponse.json(
            { error: "Failed to verify account" },
            { status: 500 }
        );
    }
}