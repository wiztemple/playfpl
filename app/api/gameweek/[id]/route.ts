import { getGameweekInfo } from "@/lib/fpl-api";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    // Extract the id from context.params
    const params = await context.params;
    const { id } = params;

    // Parse the id to an integer and fetch gameweek info
    const gameweekInfo = await getGameweekInfo(parseInt(id));

    // Return the gameweek info as JSON
    return NextResponse.json(gameweekInfo);
  } catch (error) {
    console.error("Error fetching gameweek info:", error);
    return NextResponse.json({ error: "Failed to fetch gameweek info" }, { status: 500 });
  }
}