import { NextResponse } from "next/server";
import { sendVerificationEmail } from "@/lib/auth/email-verification";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    console.log("Resending verification email to:", email);
    
    const result = await sendVerificationEmail(email);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: "Verification email sent successfully" 
    });
  } catch (error: any) {
    console.error("Error resending verification email:", error);
    return NextResponse.json(
      { error: `An unexpected error occurred: ${error.message}` },
      { status: 500 }
    );
  }
}