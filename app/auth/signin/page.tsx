// /app/auth/signin/page.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { AlertTriangle, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");
  const success = searchParams.get("success");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Remove setError line since error state is not defined

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (result?.error) {
        if (result.error === "Email not verified. Please verify your email first.") {
          window.location.href = `/auth/verify-email?email=${encodeURIComponent(formData.email)}`;
        } else {
          window.location.href = `/auth/signin?error=Invalid email or password`;
        }
        setIsLoading(false);
        return;
      }

      window.location.href = callbackUrl;
    } catch (error) {
      console.error("Sign in error:", error);
      window.location.href = `/auth/signin?error=An unexpected error occurred. Please try again.`;
      setIsLoading(false);
    }
  };

  const handleProviderSignIn = async (provider: string) => {
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
                    : "Invalid email or password. Please try again."}
                </p>
              </div>
            )}

            {success === "account-created" && (
              <div className="p-4 bg-green-900/30 border border-green-800/50 text-green-300 rounded-md text-sm">
                Account created successfully! Please sign in.
              </div>
            )}

            {success === "email-verified" && (
              <div className="p-4 bg-green-900/30 border border-green-800/50 text-green-300 rounded-md text-sm">
                Email verified successfully! Please sign in.
              </div>
            )}

            <form onSubmit={handleCredentialsSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-gray-800/50 border-gray-700 text-gray-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="bg-gray-800/50 border-gray-700 text-gray-100 pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing In...
                  </div>
                ) : (
                  "Sign In with Email"
                )}
              </Button>
            </form>

            <div className="relative flex items-center justify-center mt-6 mb-2">
              <div className="absolute border-t border-gray-700 w-full"></div>
              <div className="relative bg-gray-900 px-4 text-gray-500 text-sm">Or continue with</div>
            </div>

            <Button
              onClick={() => handleProviderSignIn("google")}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </Button>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 items-center text-sm text-gray-500 relative z-10">
            <div className="text-center">
              Don't have an account?{" "}
              <Link href="/auth/signup" className="text-indigo-400 hover:text-indigo-300">
                Sign up
              </Link>
            </div>
            <Link href="/auth/forgot-password" className="text-indigo-400 hover:text-indigo-300">
              Forgot your password?
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
