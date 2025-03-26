// /app/auth/signin/page.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");

  const handleSignIn = async (provider: string) => {
    setIsLoading(true);
    await signIn(provider, { callbackUrl });
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
              Sign In
            </CardTitle>
            <CardDescription className="text-center text-gray-400">
              Sign in to your FPL Stakes account
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4 relative z-10">
            {error && (
              <div className="p-4 bg-red-900/30 border border-red-800/50 text-red-300 rounded-md text-sm flex items-start">
                <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-red-400" />
                <p>
                  {error === "OAuthCallback"
                    ? "There was a problem with the sign-in link. Please try again."
                    : "An error occurred during sign in. Please try again."}
                </p>
              </div>
            )}

            <Button
              className="w-full flex items-center justify-center bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 transition-all duration-200"
              onClick={() => handleSignIn("google")}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </div>
              ) : (
                "Sign in with Google"
              )}
            </Button>
          </CardContent>
          
          <CardFooter className="flex justify-center text-sm text-gray-500 relative z-10">
            <p className="text-center text-xs text-gray-500">
              By signing in, you agree to our{" "}
              <a href="#" className="text-indigo-400 hover:text-indigo-300">Terms of Service</a>
              {" "}and{" "}
              <a href="#" className="text-indigo-400 hover:text-indigo-300">Privacy Policy</a>.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
