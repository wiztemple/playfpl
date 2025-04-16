// app/api/gameweek/current/route.ts
import { NextResponse } from "next/server";
// --- Import the shared function with the heuristic logic ---
import { getCurrentGameweek } from "@/lib/fpl-api"; // Adjust path if needed

export async function GET() {
  console.log("[API /gameweek/current] GET request received.");
  try {
    // --- Call the shared helper function ---
    // This function now contains the logic to check 'is_current' AND 'finished'
    const effectiveCurrentGameweek = await getCurrentGameweek();
    // --- End Call ---

    if (!effectiveCurrentGameweek) {
        console.error("[API /gameweek/current] getCurrentGameweek helper returned null or threw error.");
        throw new Error("Could not determine effective current gameweek from helper.");
    }

    // Return the relevant gameweek object determined by the helper
    // This should now be the object for GW32 if GW31 was finished
    console.log(`[API /gameweek/current] Returning effective gameweek data for GW ID: ${effectiveCurrentGameweek.id}`);
    // Frontend expects the full object based on previous logs
    return NextResponse.json(effectiveCurrentGameweek);

  } catch (error) {
    console.error("[API /gameweek/current] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch current gameweek data";
    return NextResponse.json(
      { error: "Failed to fetch current gameweek information", details: errorMessage },
      { status: 500 }
    );
  }
}