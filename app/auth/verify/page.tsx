"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token");
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push("/auth/signin?success=email-verified");
          }, 3000);
        } else {
          setStatus("error");
          setMessage(data.error || "Failed to verify email");
        }
      } catch (error) {
        setStatus("error");
        setMessage("An error occurred during verification");
      }
    };

    verifyEmail();
  }, [token, router]);

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
              Email Verification
            </CardTitle>
            <CardDescription className="text-center text-gray-400">
              Verifying your email address
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4 relative z-10 flex flex-col items-center justify-center py-6">
            {status === "loading" && (
              <>
                <Loader2 className="h-12 w-12 text-indigo-400 animate-spin mb-4" />
                <p className="text-gray-300 text-center">Verifying your email address...</p>
              </>
            )}
            
            {status === "success" && (
              <>
                <CheckCircle className="h-12 w-12 text-green-400 mb-4" />
                <p className="text-gray-300 text-center">Your email has been verified successfully!</p>
                <p className="text-gray-400 text-center text-sm mt-2">
                  Redirecting you to the login page...
                </p>
              </>
            )}
            
            {status === "error" && (
              <>
                <AlertTriangle className="h-12 w-12 text-red-400 mb-4" />
                <p className="text-gray-300 text-center">Verification failed</p>
                <p className="text-red-300 text-center text-sm mt-2">{message}</p>
              </>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-center relative z-10">
            {status !== "loading" && (
              <Link href="/auth/signin">
                <Button 
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white transition-all duration-200"
                >
                  Go to Sign In
                </Button>
              </Link>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}