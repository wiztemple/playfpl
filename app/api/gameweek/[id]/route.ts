import { getGameweekInfo } from "@/lib/fpl-api";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const gameweekInfo = await getGameweekInfo(parseInt(params.id));
    return NextResponse.json(gameweekInfo);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch gameweek info" }, { status: 500 });
  }
}