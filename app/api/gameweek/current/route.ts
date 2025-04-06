// app/api/gameweek/current/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Fetch data from FPL API
    const response = await fetch("https://fantasy.premierleague.com/api/bootstrap-static/");
    
    if (!response.ok) {
      throw new Error("Failed to fetch FPL data");
    }
    
    const data = await response.json();
    
    // Find the current gameweek
    const currentGameweek = data.events.find((event: any) => event.is_current);
    const nextGameweek = data.events.find((event: any) => event.is_next);
    
    // If no current gameweek is found, return the next one
    const gameweek = currentGameweek || nextGameweek || data.events[0];
    
    return NextResponse.json(gameweek);
  } catch (error) {
    console.error("Error fetching current gameweek:", error);
    return NextResponse.json(
      { error: "Failed to fetch current gameweek" },
      { status: 500 }
    );
  }
}