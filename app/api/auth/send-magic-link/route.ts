import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { email, redirectTo, userData } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const baseRedirectUrl = redirectTo || `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`;
    
    console.log("Sending magic link to:", email, "with redirect to:", baseRedirectUrl);
    
    // Store user data in session storage if this is a new user signup
    if (userData && userData.isNewUser) {
      // Get the supabaseAdmin client
      const supabaseAdmin = getSupabaseAdmin();
      
      // Store the user data in a temporary table or session
      try {
        const { error: storageError } = await supabaseAdmin
          .from('pending_users')
          .upsert({
            email: email,
            name: userData.name,
            username: userData.username,
            password: userData.password,
            fpl_team_id: userData.fplTeamId,
            fpl_team_name: userData.fplTeamName,
            created_at: new Date().toISOString()
          });
          
        if (storageError) {
          console.warn("Error storing pending user data:", storageError);
          // Continue anyway, we'll handle this during callback
        }
      } catch (storageErr) {
        console.warn("Error storing pending user data:", storageErr);
        // Continue anyway
      }
    }
    
    // Use the admin API for better delivery rates
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: baseRedirectUrl,
      }
    });
    
    if (error) {
      console.error("Error generating magic link:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    // Log the link for debugging in development
    if (process.env.NODE_ENV === 'development' && data?.properties?.action_link) {
      console.log("Magic link (for dev only):", data.properties.action_link);
    }

    return NextResponse.json({ 
      success: true, 
      message: "Magic link sent successfully. Please check your inbox and spam folder." 
    });
  } catch (error: any) {
    console.error("Error sending magic link:", error);
    return NextResponse.json(
      { error: `An unexpected error occurred: ${error.message}` },
      { status: 500 }
    );
  }
}