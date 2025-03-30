import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateVerificationCode, sendVerificationEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user is already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 400 }
      );
    }

    // Generate a new verification code
    const verificationCode = generateVerificationCode();
    const codeExpiry = new Date();
    codeExpiry.setMinutes(codeExpiry.getMinutes() + 30); // Code valid for 30 minutes

    // Delete any existing verification tokens for this user
    await prisma.verificationToken.deleteMany({
      where: { identifier: userId }
    });

    // Create a new verification token
    await prisma.verificationToken.create({
      data: {
        identifier: userId,
        token: verificationCode,
        expires: codeExpiry,
      }
    });

    // Send verification email with code
    await sendVerificationEmail(user.email, user.name || "User", verificationCode);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error resending verification code:", error);
    return NextResponse.json(
      { error: "Failed to resend verification code" },
      { status: 500 }
    );
  }
}