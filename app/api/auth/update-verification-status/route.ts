import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { userId, email } = await request.json();

    if (!userId || !email) {
      return NextResponse.json(
        { error: "User ID and email are required" },
        { status: 400 }
      );
    }

    console.log("Updating email verification status for user:", userId, "with email:", email);
    
    // Get the supabaseAdmin client
    const supabaseAdmin = getSupabaseAdmin();
    
    // First check if the profile exists
    const { data: existingProfile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (fetchError) {
      console.error("Error fetching profile:", fetchError);
      
      // If the profile doesn't exist, create it
      if (fetchError.code === 'PGRST116') { // "Not found" error code
        console.log("Profile not found, creating new profile");
        
        const { error: insertError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: userId,
            email: email,
            name: email.split('@')[0], // Default name from email
            email_verified: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.error("Error creating profile:", insertError);
          return NextResponse.json(
            { error: `Failed to create profile: ${insertError.message}` },
            { status: 500 }
          );
        }
        
        console.log("Profile created successfully with email_verified=true");
        return NextResponse.json({ 
          success: true, 
          message: "Profile created with verified email" 
        });
      }
      
      return NextResponse.json(
        { error: `Failed to fetch profile: ${fetchError.message}` },
        { status: 500 }
      );
    }
    
    // Profile exists, update it
    console.log("Profile exists, updating email_verified field");
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        email_verified: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (updateError) {
      console.error("Error updating email verification status:", updateError);
      return NextResponse.json(
        { error: `Failed to update verification status: ${updateError.message}` },
        { status: 500 }
      );
    }

    console.log("Email verification status updated successfully");
    return NextResponse.json({ 
      success: true, 
      message: "Email verification status updated successfully" 
    });
  } catch (error: any) {
    console.error("Unexpected error updating verification status:", error);
    return NextResponse.json(
      { error: `An unexpected error occurred: ${error.message}` },
      { status: 500 }
    );
  }
}