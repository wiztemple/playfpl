import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, code } = body;

    if (!userId || !code) {
      return NextResponse.json(
        { error: "User ID and verification code are required" },
        { status: 400 }
      );
    }

    // Find the verification token
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: userId,
        token: code,
      },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (new Date() > verificationToken.expires) {
      return NextResponse.json(
        { error: "Verification code has expired" },
        { status: 400 }
      );
    }

    // Update user's email verification status
    await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: new Date() }
    });

    // Delete the used token
    await prisma.verificationToken.delete({
      where: { token: code }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error verifying code:", error);
    return NextResponse.json(
      { error: "Failed to verify email" },
      { status: 500 }
    );
  }
}