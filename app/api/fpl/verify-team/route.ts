// /app/api/fpl/verify-team/route.ts
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id || isNaN(Number(id))) {
    return NextResponse.json(
      { valid: false, error: "Invalid team ID" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://fantasy.premierleague.com/api/entry/${id}/`
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { valid: false, error: "FPL team not found" },
          { status: 404 }
        );
      }
      throw new Error(`FPL API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      valid: true,
      teamName: data.name,
      managerName: `${data.player_first_name} ${data.player_last_name}`,
      overallRank: data.summary_overall_rank,
    });
  } catch (error) {
    console.error("Error verifying team ID:", error);
    return NextResponse.json(
      { valid: false, error: "Failed to verify team ID" },
      { status: 500 }
    );
  }
}
