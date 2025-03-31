"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [resendDisabled, setResendDisabled] = useState(false);
  const isMagicLink = searchParams.get("magic") === "true";

  useEffect(() => {
    if (resendDisabled) {
      const timer = setTimeout(() => {
        if (timeLeft > 0) {
          setTimeLeft(timeLeft - 1);
        } else {
          setResendDisabled(false);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, resendDisabled]);

  // Check for verification token in URL (Supabase redirects here with token)
  useEffect(() => {
    const handleTokenVerification = async () => {
      // Get the hash fragment from the URL
      const hash = window.location.hash;
      
      // Check for error in the URL hash
      if (hash && hash.includes('error=')) {
        const hashParams = new URLSearchParams(hash.substring(1));
        const errorCode = hashParams.get('error_code');
        const errorDescription = hashParams.get('error_description');
        
        if (errorCode === 'otp_expired') {
          setError('Your verification link has expired. Please request a new one.');
        } else {
          setError(errorDescription || 'Verification failed. Please try again.');
        }
        return;
      }
      
      // Check for successful verification (either with type=signup or access_token)
      if (hash && (hash.includes('type=signup') || hash.includes('access_token='))) {
        setIsLoading(true);
        setError(null);
        
        try {
          // Extract the access_token and refresh_token from the URL
          const hashParams = new URLSearchParams(hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          
          if (!accessToken) {
            throw new Error('No access token found');
          }
          
          console.log('Found access token, setting session');
          
          // Set the session with the tokens
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
          
          if (error) {
            console.error('Session error:', error);
            throw error;
          }
          
          // Get the user to confirm verification worked
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError || !user) {
            console.error('User fetch error:', userError);
            throw userError || new Error('Failed to get user data');
          }
          
          console.log('User verified:', user.email);
          
          // Update the email_verified status in the profiles table
          try {
            const response = await fetch('/api/auth/update-verification-status', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                userId: user.id, 
                email: user.email 
              }),
            });
            
            if (!response.ok) {
              console.warn('Failed to update email verification status, but continuing with verification flow');
            } else {
              console.log('Email verification status updated successfully');
            }
          } catch (updateError) {
            console.warn('Error updating verification status:', updateError);
            // Continue with verification flow even if update fails
          }
          
          setSuccess(true);
          
          // Redirect to sign in page after 2 seconds
          setTimeout(() => {
            router.push("/auth/signin?success=email-verified");
          }, 2000);
        } catch (error: any) {
          console.error('Verification error:', error);
          setError(error.message || "Verification failed. Please try again.");
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    handleTokenVerification();
  }, [router]);

  const handleResendVerification = async () => {
    if (!email) {
      setError("Email address is missing");
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      // Use the magic link API for more reliable delivery
      const response = await fetch('/api/auth/send-magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email,
          redirectTo: `${window.location.origin}/auth/callback`
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification email');
      }
      
      setTimeLeft(60); // 60 seconds cooldown
      setResendDisabled(true);
    } catch (error: any) {
      console.error('Resend error:', error);
      setError(error.message || "Failed to resend verification email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-purple-900/20 to-gray-950"></div>
      <div className="absolute top-0 -left-40 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 -right-40 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl"></div>
      
      <div className="w-full max-w-md px-4 z-10">
        <Link href="/" className="flex justify-center mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            FPL Stakes
          </h1>
        </Link>
        
        <Card className="backdrop-blur-md bg-gray-900/60 border border-gray-800 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-xl pointer-events-none"></div>
          
          <CardHeader className="relative z-10">
            <CardTitle className="text-center text-xl bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Verify Your Email
            </CardTitle>
            <CardDescription className="text-center text-gray-400">
              {success ? "Email verified successfully!" : `We've sent a verification link to ${email || "your email"}`}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4 relative z-10">
            {error && (
              <div className="p-4 bg-red-900/30 border border-red-800/50 text-red-300 rounded-md text-sm flex items-start">
                <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-red-400" />
                <p>{error}</p>
              </div>
            )}
            
            {success ? (
              <div className="flex flex-col items-center justify-center py-6">
                <CheckCircle className="h-12 w-12 text-green-400 mb-4" />
                <p className="text-gray-300 text-center">Your email has been verified successfully!</p>
                <p className="text-gray-400 text-center text-sm mt-2">
                  Redirecting you to the login page...
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-gray-800/50 border border-gray-700 rounded-md p-4">
                  <h3 className="text-gray-300 font-medium mb-2">Instructions:</h3>
                  <ol className="text-gray-400 text-sm space-y-2 list-decimal list-inside">
                    <li>Check your email inbox for a message from FPL Stakes</li>
                    <li>{isMagicLink ? "Click the magic link in the email" : "Click the verification link in the email"}</li>
                    <li>You'll be redirected back to complete the {isMagicLink ? "signup" : "verification"}</li>
                  </ol>
                </div>
                
                <div className="text-center">
                  <p className="text-gray-400 text-sm mb-4">
                    Didn't receive an email? Check your spam folder or try again.
                  </p>
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="border-indigo-600/50 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/30"
                    onClick={handleResendVerification}
                    disabled={resendDisabled || isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        Sending...
                      </div>
                    ) : resendDisabled ? (
                      `Resend email (${timeLeft}s)`
                    ) : (
                      `Resend ${isMagicLink ? "magic link" : "verification email"}`
                    )}
                  </Button>
                  
                  {/* Add debug info for troubleshooting */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="mt-6 text-xs text-gray-500">
                      <p>Email: {email || "Not provided"}</p>
                      <p>Mode: {isMagicLink ? "Magic Link" : "Verification Email"}</p>
                      <p>Redirect URL: {`${window.location.origin}/auth/callback`}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-center relative z-10">
            <Link href="/auth/signin" className="text-indigo-400 hover:text-indigo-300 text-sm">
              Back to Sign In
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}