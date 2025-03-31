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

    // Get the supabaseAdmin client
    const supabaseAdmin = getSupabaseAdmin();
    
    // Check if this is a new user signup by looking for pending user data
    const { data: pendingUserData, error: pendingError } = await supabaseAdmin
      .from('pending_users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (!pendingError && pendingUserData) {
      console.log("Found pending user data, creating profile");
      
      // Create the user profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          email: email,
          name: pendingUserData.name,
          username: pendingUserData.username,
          email_verified: new Date().toISOString(),
          fpl_team_id: pendingUserData.fpl_team_id,
          fpl_team_name: pendingUserData.fpl_team_name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (profileError) {
        console.error("Error creating profile:", profileError);
        return NextResponse.json(
          { error: `Failed to create profile: ${profileError.message}` },
          { status: 500 }
        );
      }
      
      // Set the user's password if provided
      if (pendingUserData.password) {
        try {
          // Make sure the password is a string
          const passwordString = String(pendingUserData.password);
          
          // Log for debugging
          console.log("Setting password for user:", userId);
          
          const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { password: passwordString }
          );
          
          if (passwordError) {
            console.error("Error setting password:", passwordError);
          }
        } catch (pwErr: any) {
          console.error("Error setting password:", pwErr);
        }
      }
      
      // Clean up the pending user data
      await supabaseAdmin
        .from('pending_users')
        .delete()
        .eq('email', email);
        
      return NextResponse.json({ 
        success: true, 
        message: "New user profile created successfully" 
      });
    } else {
      // This is an existing user, just update the email_verified status
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ 
          email_verified: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (updateError) {
        console.error("Error updating profile:", updateError);
        return NextResponse.json(
          { error: `Failed to update profile: ${updateError.message}` },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ 
        success: true, 
        message: "Existing user profile updated successfully" 
      });
    }
  } catch (error: any) {
    console.error("Error processing auth callback:", error);
    return NextResponse.json(
      { error: `An unexpected error occurred: ${error.message}` },
      { status: 500 }
    );
  }
}