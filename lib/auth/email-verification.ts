import { supabase, getSupabaseAdmin } from "@/lib/supabase";

/**
 * Send a verification email to the user
 * @param email The user's email address
 * @returns Object with success status and any error
 */
export async function sendVerificationEmail(email: string) {
  try {
    console.log(`Sending verification email to: ${email}`);
    
    // Send verification email directly using Supabase's resend method
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });
    
    if (error) {
      console.error('Error sending verification email:', error);
      return { success: false, error: error.message };
    }
    
    console.log('Verification email sent successfully');
    return { success: true };
  } catch (error: any) {
    console.error('Unexpected error sending verification email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update a user's email verification status
 * @param userId The user's ID
 * @returns Object with success status and any error
 */
export async function updateEmailVerificationStatus(userId: string) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ 
        email_verified: new Date().toISOString() 
      })
      .eq('id', userId);
    
    if (error) {
      console.error('Error updating email verification status:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Unexpected error updating email verification status:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a custom verification link
 * @param email The user's email address
 * @param redirectTo The URL to redirect to after verification
 * @returns Object with success status, link (if successful), and any error
 */
export async function createCustomVerificationLink(email: string, redirectTo: string) {
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });
    
    if (error) {
      console.error('Error creating verification link:', error);
      return { success: false, error: error.message };
    }
    
    return { 
      success: true, 
      message: 'Magic link sent successfully. Please check your email.' 
    };
  } catch (error: any) {
    console.error('Unexpected error creating verification link:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Manually verify a user's email in the profiles table
 * This can be used when you know the user is verified but the status isn't updated
 */
export async function manuallyVerifyEmail(userId: string) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ 
        email_verified: new Date().toISOString() 
      })
      .eq('id', userId);
    
    if (error) {
      console.error('Error manually verifying email:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, message: 'Email manually verified' };
  } catch (error: any) {
    console.error('Unexpected error manually verifying email:', error);
    return { success: false, error: error.message };
  }
}