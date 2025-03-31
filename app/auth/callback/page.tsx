"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Processing your login...");
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  useEffect(() => {
    async function handleAuthCallback() {
      try {
        // Get the hash fragment from the URL
        const hashFragment = window.location.hash;
        
        if (hashFragment && hashFragment.includes('access_token')) {
          // Extract the tokens from the hash
          const hashParams = new URLSearchParams(hashFragment.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          
          if (!accessToken) {
            throw new Error('No access token found');
          }
          
          // Set the session with the tokens
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
          
          if (error) {
            throw error;
          }
          
          if (data?.session) {
            // Get the user
            const user = data.session.user;
            
            // Call our server API to handle the admin operations
            try {
              const response = await fetch('/api/auth/process-auth-callback', {
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
                const errorData = await response.json();
                console.warn('Failed to process auth callback:', errorData);
              } else {
                console.log('Auth callback processed successfully');
              }
            } catch (processError) {
              console.warn('Error processing auth callback:', processError);
              // Continue anyway - we don't want to block the user
            }
            
            // Successfully authenticated
            setMessage("Authentication successful! Redirecting...");
            
            // Redirect to the dashboard or home page
            setTimeout(() => {
              router.push("/");
            }, 1500);
            return;
          }
        }
        
        // If no hash fragment with access_token, try the code flow
        const code = searchParams.get('code');
        if (!code) {
          setError("No authentication code found in the URL. This could happen if you accessed this page directly or if there was an issue with the email link.");
          return;
        }

        // Exchange the code for a session
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          console.error("Auth callback error:", error);
          setError(error.message);
          return;
        }

        if (data?.session?.user) {
          // Call our server API to handle the admin operations
          try {
            const response = await fetch('/api/auth/process-auth-callback', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                userId: data.session.user.id, 
                email: data.session.user.email 
              }),
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              console.warn('Failed to process auth callback:', errorData);
            }
          } catch (processError) {
            console.warn('Error processing auth callback:', processError);
            // Continue anyway
          }
        }

        // Successfully authenticated
        setMessage("Authentication successful! Redirecting...");
        
        // Redirect to the dashboard or home page
        setTimeout(() => {
          router.push("/");
        }, 1500);
        
      } catch (err: any) {
        console.error("Unexpected error during auth callback:", err);
        setError(err.message || "An unexpected error occurred");
      }
    }

    handleAuthCallback();
  }, [searchParams, router]);

  // Rest of the component remains the same
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-gray-800 bg-gray-900 p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-white">Authentication</h1>
        
        {!error ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            <p className="text-center text-gray-300">{message}</p>
          </div>
        ) : (
          <div className="p-3 bg-red-900/30 border border-red-800/50 text-red-300 rounded-md">
            <p className="font-medium">Authentication Error</p>
            <p className="text-sm">{error}</p>
            <div className="mt-4">
              <button 
                onClick={() => router.push('/auth/magic-link')}
                className="text-sm text-indigo-400 hover:text-indigo-300"
              >
                Try again with magic link
              </button>
            </div>
          </div>
        )}
        
        {debugInfo && (
          <div className="mt-6 p-3 bg-gray-800 rounded-md">
            <p className="text-sm font-medium text-gray-300 mb-2">Debug Information:</p>
            <pre className="text-xs text-gray-400 overflow-auto max-h-40">
              {debugInfo}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}