"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { AlertTriangle, Eye, EyeOff, Loader2 } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [verifyingTeamId, setVerifyingTeamId] = useState(false);
  const [teamIdVerified, setTeamIdVerified] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    username: "",
    fplTeamId: "",
    fplTeamName: "", // Add this field
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Reset verification if team ID changes
    if (name === "fplTeamId") {
      setTeamIdVerified(false);
      setTeamName("");
    }
  };

  const verifyFplTeamId = async () => {
    if (!formData.fplTeamId) {
      setError("FPL Team ID is required");
      return false;
    }

    setVerifyingTeamId(true);
    setError(null);

    try {
      const response = await fetch(`/api/fpl/verify-team?teamId=${formData.fplTeamId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify FPL Team ID");
      }

      setTeamIdVerified(true);
      setTeamName(data.teamName);
      
      // Update the form data with the team name
      setFormData(prev => ({
        ...prev,
        fplTeamName: data.teamName
      }));
      
      return true;
    } catch (error: any) {
      setError(error.message || "Failed to verify FPL Team ID. Please check and try again.");
      return false;
    } finally {
      setVerifyingTeamId(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Verify team ID if not already verified
    if (!teamIdVerified) {
      const isVerified = await verifyFplTeamId();
      if (!isVerified) {
        setIsLoading(false);
        return;
      }
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          fplTeamId: parseInt(formData.fplTeamId),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      // Redirect to email verification page
      router.push(`/auth/verify-email?userId=${data.userId}&email=${encodeURIComponent(formData.email)}`);
    } catch (error: any) {
      setError(error.message || "An error occurred. Please try again.");
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
              Create Account
            </CardTitle>
            <CardDescription className="text-center text-gray-400">
              Sign up for your FPL Stakes account
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4 relative z-10">
            {error && (
              <div className="p-4 bg-red-900/30 border border-red-800/50 text-red-300 rounded-md text-sm flex items-start">
                <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-red-400" />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
                <Label htmlFor="name" className="text-gray-300">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="John Doe"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="bg-gray-800/50 border-gray-700 text-gray-100"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-300">Username</Label>
                <Input
                  id="username"
                  name="username"
                  placeholder="johndoe"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="bg-gray-800/50 border-gray-700 text-gray-100"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fplTeamId" className="text-gray-300">FPL Team ID</Label>
                <div className="flex space-x-2">
                  <Input
                    id="fplTeamId"
                    name="fplTeamId"
                    type="number"
                    placeholder="Your FPL Team ID"
                    required
                    value={formData.fplTeamId}
                    onChange={handleChange}
                    className={`bg-gray-800/50 border-gray-700 text-gray-100 ${
                      teamIdVerified ? "border-green-500/50" : ""
                    }`}
                    disabled={teamIdVerified || verifyingTeamId}
                  />
                  <Button
                    type="button"
                    onClick={verifyFplTeamId}
                    disabled={!formData.fplTeamId || teamIdVerified || verifyingTeamId}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {verifyingTeamId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : teamIdVerified ? (
                      "Verified"
                    ) : (
                      "Verify"
                    )}
                  </Button>
                </div>
                {teamIdVerified && teamName && (
                  <p className="text-sm text-green-400 mt-1">
                    ✓ Verified: {teamName}
                  </p>
                )}
                <p className="text-xs text-gray-400">
                  You can find this in your FPL team URL: https://fantasy.premierleague.com/entry/TEAM_ID/
                </p>
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
                disabled={isLoading || !teamIdVerified}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </div>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4 items-center text-sm text-gray-500 relative z-10">
            <div className="text-center">
              Already have an account?{" "}
              <Link href="/auth/signin" className="text-indigo-400 hover:text-indigo-300">
                Sign in
              </Link>
            </div>
            <p className="text-center text-xs text-gray-500">
              By signing up, you agree to our{" "}
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