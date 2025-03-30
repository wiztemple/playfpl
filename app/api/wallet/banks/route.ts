import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET() {
    try {
        // Replace auth() with getServerSession(authOptions)
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch banks from Paystack
        const response = await fetch('https://api.paystack.co/bank', {
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (!data.status) {
            return NextResponse.json({ error: data.message || "Failed to fetch banks" }, { status: 400 });
        }

        return NextResponse.json(data.data);
    } catch (error) {
        console.error("Error fetching banks:", error);
        return NextResponse.json(
            { error: "Failed to fetch banks" },
            { status: 500 }
        );
    }
}