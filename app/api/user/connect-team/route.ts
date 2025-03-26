import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";


export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await request.json();
    const fplTeamId = Number(body.fplTeamId);
    
    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    
    if (!user) {
      return NextResponse.json({ 
        error: "User not found in database",
        sessionEmail: session.user.email
      }, { status: 404 });
    }
    
    // Check if team ID is already connected to another user
    const existingUser = await prisma.user.findFirst({
      where: { 
        fplTeamId,
        id: { not: user.id }
      }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: "This FPL team ID is already connected to another account" },
        { status: 400 }
      );
    }
    
    // Update the user's profile
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        fplTeamId,
        fplTeamName: body.fplTeamName || `FPL Team ${fplTeamId}`
      }
    });
    
    return NextResponse.json({
      success: true,
      message: "Team connected successfully",
      userId: updatedUser.id,
      fplTeamId: updatedUser.fplTeamId,
      fplTeamName: updatedUser.fplTeamName
    });
  } catch (error) {
    console.error("Error connecting FPL team:", error);
    return NextResponse.json({ 
      error: "Failed to connect FPL team",
      details: String(error)
    }, { status: 500 });
  }
}