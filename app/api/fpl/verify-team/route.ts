import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const teamId = searchParams.get('teamId') || searchParams.get('id');

    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 }
      );
    }

    // Call the FPL API to verify the team exists
    const response = await fetch(`${process.env.FPL_API_ENTRY_BASE_URL}${teamId}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: "FPL Team not found. Please check your Team ID." },
          { status: 404 }
        );
      }

      // Try to get more details about the error
      let errorText = '';
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = 'Could not read error response';
      }

      return NextResponse.json(
        { error: "Invalid FPL Team ID. Please check and try again." },
        { status: 400 }
      );
    }

    const data = await response.json();

    // Check if the response contains the expected fields
    if (!data.name || !data.player_first_name || !data.player_last_name) {
      return NextResponse.json(
        { error: "Invalid FPL Team data format. Please try again." },
        { status: 400 }
      );
    }

    // Extract team name from the response
    const teamName = data.name;
    const playerName = data.player_first_name + " " + data.player_last_name;

    return NextResponse.json({
      verified: true,
      teamName: teamName,
      playerName: playerName
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to verify FPL Team ID. Please try again later." },
      { status: 500 }
    );
  }
}
