import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const leagueId = searchParams.get('leagueId');

    if (!userId || !leagueId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const entry = await prisma.leagueEntry.findUnique({
      where: {
        userId_leagueId: {
          userId,
          leagueId
        }
      }
    });

    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Error fetching league entry:", error);
    return NextResponse.json(
      { error: "Failed to fetch league entry" },
      { status: 500 }
    );
  }
}