"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const email = searchParams.get("email");
  
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [resendDisabled, setResendDisabled] = useState(true);

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

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          code: verificationCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify email");
      }

      setSuccess(true);
      
      // Redirect to sign in page after 2 seconds
      setTimeout(() => {
        router.push("/auth/signin?success=email-verified");
      }, 2000);
    } catch (error: any) {
      setError(error.message || "Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to resend verification code");
      }

      setTimeLeft(60); // 60 seconds cooldown
      setResendDisabled(true);
    } catch (error: any) {
      setError(error.message || "Failed to resend code. Please try again.");
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
              Enter the verification code sent to {email || "your email"}
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
              <form onSubmit={handleVerify} className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-center">
                    <Input
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="text-center text-2xl tracking-widest bg-gray-800/50 border-gray-700 text-gray-100 py-6 max-w-[200px]"
                      maxLength={6}
                      placeholder="000000"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-400 text-center mt-2">
                    Enter the 6-digit code sent to your email
                  </p>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white transition-all duration-200"
                  disabled={isLoading || verificationCode.length !== 6}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                      Verifying...
                    </div>
                  ) : (
                    "Verify Email"
                  )}
                </Button>
                
                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    className="text-indigo-400 hover:text-indigo-300"
                    onClick={handleResendCode}
                    disabled={resendDisabled || isLoading}
                  >
                    {resendDisabled ? `Resend code (${timeLeft}s)` : "Resend code"}
                  </Button>
                </div>
              </form>
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