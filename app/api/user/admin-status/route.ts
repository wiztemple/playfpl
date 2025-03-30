import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { isAdmin: false },
        { status: 200 }
      );
    }
    
    // Use raw query to avoid TypeScript issues with isAdmin field
    const adminCheck = await prisma.$queryRaw`
      SELECT "isAdmin" FROM "User" WHERE id = ${session.user.id}
    `;
    
    const isAdmin = (adminCheck as any[])[0]?.isAdmin === true;
    
    return NextResponse.json({ isAdmin: isAdmin });
  } catch (error) {
    console.error("Error checking admin status:", error);
    return NextResponse.json(
      { isAdmin: false },
      { status: 500 }
    );
  }
}