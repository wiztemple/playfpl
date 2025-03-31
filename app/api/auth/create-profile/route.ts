import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { userId, email, name, fplTeamId, fplTeamName } = await request.json();

    if (!userId || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("Creating profile for user:", userId);

    // Create profile data object based on the actual table structure
    const profileData = {
      id: userId,
      email: email,
      name: name,
      fpl_team_id: fplTeamId,
      fpl_team_name: fplTeamName,
      is_admin: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      email_verified: null // Initially null until verified
    };
    
    console.log("Creating profile with data:", profileData);

    // Get the supabaseAdmin client using the new function
    const supabaseAdmin = getSupabaseAdmin();

    // Create new profile
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    if (error) {
      console.error("Error creating profile:", error);
      return NextResponse.json(
        { error: `Failed to create profile: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, profile: data, created: true });
  } catch (error: any) {
    console.error("Unexpected error creating profile:", error);
    return NextResponse.json(
      { error: `An unexpected error occurred: ${error.message}` },
      { status: 500 }
    );
  }
}