"use client";

// /app/leagues/weekly/[id]/join/page.tsx
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import Loading from "@/app/components/shared/Loading";
import { formatCurrency } from "@/lib/utils";

export default function JoinLeaguePage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const [league, setLeague] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fplTeamId, setFplTeamId] = useState("");
  const [step, setStep] = useState(1); // 1 = FPL Team, 2 = Payment
  const [teamInfo, setTeamInfo] = useState<{
    teamName: string;
    managerName: string;
    overallRank: number;
  } | null>(null);

  const leagueId = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    const fetchLeague = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/leagues/weekly/${leagueId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch league details");
        }

        const leagueData = await response.json();
        setLeague(leagueData);
      } catch (error) {
        console.error("Error fetching league:", error);
        setError("Failed to load league information. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchLeague();
  }, [leagueId]);

  // Check if user is authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(
        `/api/auth/signin?callbackUrl=${encodeURIComponent(
          `/leagues/weekly/${leagueId}/join`
        )}`
      );
    }
  }, [status, router, leagueId]);

  const handleFplTeamIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFplTeamId(e.target.value);
    // Reset team info when id changes
    if (teamInfo) {
      setTeamInfo(null);
    }
  };

  const verifyFplTeam = async () => {
    if (!fplTeamId || isNaN(Number(fplTeamId))) {
      setError("Please enter a valid FPL Team ID");
      return false;
    }

    try {
      setVerifying(true);
      setError(null);

      const response = await fetch(`/api/fpl/verify-team?id=${fplTeamId}`);
      const data = await response.json();

      if (!response.ok || !data.valid) {
        setError(
          data.error || "Invalid FPL Team ID. Please check and try again."
        );
        setTeamInfo(null);
        return false;
      }

      setTeamInfo({
        teamName: data.teamName,
        managerName: data.managerName,
        overallRank: data.overallRank,
      });

      return true;
    } catch (error) {
      console.error("Error verifying team:", error);
      setError("Failed to verify team. Please try again.");
      return false;
    } finally {
      setVerifying(false);
    }
  };

  const handleContinueToPayment = async () => {
    const isValid = await verifyFplTeam();
    if (isValid) {
      setStep(2);
    }
  };

  const handleSubmitPayment = async () => {
    try {
      setSubmitting(true);
      setError(null);

      // Submit the join request to the API
      const response = await fetch(`/api/leagues/weekly/${leagueId}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fplTeamId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error || `Server error: ${response.status}`);
      }

      // Success! Redirect to my leagues page
      router.push("/leagues/my-leagues?success=true");
    } catch (err: any) {
      console.error("Error joining league:", err);
      setError(err.message || "Failed to join league. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto py-6 max-w-md">
        <Loading />
      </div>
    );
  }

  if (error && !league) {
    return (
      <div className="container mx-auto py-6 max-w-md">
        <Card>
          <CardContent className="pt-6">
            <div className="text-red-500 text-center">
              <p>{error}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push("/leagues/weekly")}
              >
                Back to Leagues
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!league) {
    return (
      <div className="container mx-auto py-6 max-w-md">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p>League not found or no longer available.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push("/leagues/weekly")}
              >
                Back to Leagues
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-md">
      <div className="mb-6">
        <Link href="/leagues/weekly">
          <Button variant="ghost" className="pl-0">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Leagues
          </Button>
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">Join League</h1>

      <Card>
        <CardHeader>
          <CardTitle>{league.name}</CardTitle>
          <CardDescription>
            Entry Fee: {formatCurrency(league.entryFee)} - Gameweek{" "}
            {league.gameweek}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md">
              {error}
            </div>
          )}

          {step === 1 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fplTeamId">Your FPL Team ID</Label>
                <Input
                  id="fplTeamId"
                  type="text"
                  value={fplTeamId}
                  onChange={handleFplTeamIdChange}
                  placeholder="Enter your FPL Team ID"
                />
                <p className="text-sm text-gray-500">
                  You can find your team ID in the URL when you visit your FPL
                  team page.
                </p>
              </div>

              {teamInfo && (
                <div className="mt-3 p-3 bg-green-50 border border-green-100 rounded-md">
                  <h3 className="font-medium text-green-800">Team Verified!</h3>
                  <div className="mt-1">
                    <p>
                      <span className="font-medium">Team Name:</span>{" "}
                      {teamInfo.teamName}
                    </p>
                    <p>
                      <span className="font-medium">Manager:</span>{" "}
                      {teamInfo.managerName}
                    </p>
                    <p>
                      <span className="font-medium">Overall Rank:</span>{" "}
                      {teamInfo.overallRank.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {verifying && (
                <div className="mt-3 flex items-center text-blue-600">
                  <div className="w-4 h-4 mr-2 rounded-full animate-pulse bg-blue-600"></div>
                  Verifying team...
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-md">
                <h3 className="font-medium mb-2">League Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>League:</span>
                    <span className="font-medium">{league.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Entry Fee:</span>
                    <span className="font-medium">
                      {formatCurrency(league.entryFee)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>FPL Team:</span>
                    <span className="font-medium">
                      {teamInfo ? teamInfo.teamName : fplTeamId}
                    </span>
                  </div>
                  {teamInfo && (
                    <div className="flex justify-between">
                      <span>Manager:</span>
                      <span className="font-medium">
                        {teamInfo.managerName}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-md">
                <h3 className="font-medium mb-2">Payment Method</h3>
                <p className="text-sm text-gray-600 mb-4">
                  This is a demo app, so no actual payment will be processed.
                </p>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="creditCard"
                    name="paymentMethod"
                    checked
                    readOnly
                  />
                  <label htmlFor="creditCard">Demo Credit Card</label>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {step === 1 ? (
            <>
              <Button
                variant="outline"
                onClick={() => router.push("/leagues/weekly")}
                disabled={verifying}
              >
                Cancel
              </Button>
              <Button onClick={handleContinueToPayment} disabled={verifying}>
                {verifying ? "Verifying..." : "Continue to Payment"}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                disabled={submitting}
              >
                Back
              </Button>
              <Button onClick={handleSubmitPayment} disabled={submitting}>
                {submitting ? "Processing..." : "Complete Payment"}
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
