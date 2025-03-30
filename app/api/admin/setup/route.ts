import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// This should be set as an environment variable in production
const ADMIN_SETUP_TOKEN = process.env.ADMIN_SETUP_TOKEN || "your-secret-token-here";

export async function POST(request: Request) {
  try {
    const { email, secretToken } = await request.json();
    
    // Validate the secret token
    if (secretToken !== ADMIN_SETUP_TOKEN) {
      return NextResponse.json(
        { error: "Invalid secret token" },
        { status: 403 }
      );
    }
    
    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Update the user to be an admin using raw query
    await prisma.$executeRaw`
      UPDATE "User" SET "isAdmin" = true WHERE id = ${user.id}
    `;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error setting up admin:", error);
    return NextResponse.json(
      { error: "Failed to set up admin" },
      { status: 500 }
    );
  }
}