import { NextResponse } from "next/server";
import { setupFirstAdmin } from "@/lib/admin-setup";

export async function GET() {
  try {
    await setupFirstAdmin();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error initializing app:", error);
    return NextResponse.json(
      { error: "Failed to initialize app" },
      { status: 500 }
    );
  }
}