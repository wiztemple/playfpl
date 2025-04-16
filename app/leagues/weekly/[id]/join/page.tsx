// app/leagues/weekly/[id]/join/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQueryClient } from '@tanstack/react-query'; // Import useQueryClient
import { ChevronLeft } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { motion } from "framer-motion";
// Assuming hooks are correctly defined and exported from index files
import { useLeague, useLeagueJoinability } from "@/app/hooks/leagues";
import { useUserProfile } from "@/app/hooks/user"; // Hook to get profile data including fplTeamId
import { useGameweekInfo } from "@/app/hooks/leagues"; // Hook for gameweek info like deadline
import { useDeadlineCheck } from "@/app/hooks/leagues/useDeadlineCheck"; // Hook to check deadline
import Loading from "@/app/components/shared/Loading";
import JoinLeagueHeader from "@/app/components/join-league/JoinLeagueHeader";
import FplTeamVerification from "@/app/components/join-league/FplTeamVerification";
import ErrorMessage from "@/app/components/join-league/ErrorMessage";
import PaymentDetails from "@/app/components/join-league/PaymentDetails"; // The component we're fixing props for
import JoinClosedMessage from "@/app/components/join-league/JoinClosedMessage";
import { toast } from "sonner"; // For notifications

export default function JoinLeaguePage() {
  const { data: session, status: authStatus } = useSession();
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient(); // Get query client instance

  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1); // 1 = FPL Team, 2 = Payment/Confirmation
  const [verifiedFplTeamId, setVerifiedFplTeamId] = useState<string>(""); // Store verified FPL ID

  // Ensure leagueId is a string
  const leagueId = Array.isArray(params.id) ? params.id[0] : params.id;

  // --- Data Fetching ---
  const { data: league, isLoading: isLoadingLeague, error: leagueError } = useLeague(leagueId);
  const { data: gameweekInfo } = useGameweekInfo(league?.gameweek);
  // Get user profile (contains linked fplTeamId)
  const { profile: userProfile, isLoading: isLoadingProfile } = useUserProfile();

  // --- Checks ---
  // Note: useLeagueJoinability might be redundant if useDeadlineCheck provides similar info
  const { isJoinDisabled, minutesUntilFirstKickoff } = useLeagueJoinability(league?.gameweek);
  const { isDeadlinePassed } = useDeadlineCheck(gameweekInfo?.deadline_time);
  const effectiveJoinDisabled = isJoinDisabled || isDeadlinePassed; // Combine checks

  // --- Effects ---
  // Redirect if unauthenticated
  useEffect(() => {
    if (authStatus === "unauthenticated") {
      toast.error("Please sign in to join a league.");
      router.push(`/api/auth/signin?callbackUrl=/leagues/weekly/${leagueId}/join`);
    }
  }, [authStatus, router, leagueId]);

  // Redirect if joining is closed when component mounts
  useEffect(() => {
    if (league && !isLoadingLeague && effectiveJoinDisabled) {
      toast.error("Joining Closed", { description: "This league is no longer available to join." });
      router.push(`/leagues/weekly/${leagueId}`);
    }
  }, [league, isLoadingLeague, effectiveJoinDisabled, leagueId, router]);

  // Handle query errors
  useEffect(() => {
    if (leagueError) {
      setError("Failed to load league information. Please try again.");
      console.error("League Fetch Error:", leagueError);
    }
    // Handle profile fetch error if needed
  }, [leagueError]);


  // --- Step Navigation ---
  const handleVerificationSuccess = (teamId: string, teamInfo: any) => {
    setVerifiedFplTeamId(teamId); // Store the verified ID
    // setTeamInfo(teamInfo); // Don't need to store full teamInfo here anymore
    setError(null);
    setStep(2); // Move to next step
  };

  const goBackToVerification = () => {
    setStep(1); // Go back to FPL verification step
    setError(null); // Clear errors
  };

  // --- Success Handler for Payment/Join ---
  const handleJoinSuccess = () => {
    // Invalidate queries to refetch data showing user has joined
    queryClient.invalidateQueries({ queryKey: ['league', leagueId] });
    queryClient.invalidateQueries({ queryKey: ['leagues', 'my-leagues'] });
    queryClient.invalidateQueries({ queryKey: ['leaderboard', leagueId] });
    // Redirect to league page after success
    router.push(`/leagues/weekly/${leagueId}`);
  };

  // --- Loading State ---
  const isLoadingInitial = authStatus === 'loading' || isLoadingLeague || isLoadingProfile;
  if (isLoadingInitial) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <Loading className="text-indigo-400 h-8 w-8" />
      </div>
    );
  }

  // --- Error / Not Found States ---
  if (authStatus === 'unauthenticated') { return null; }
  if (leagueError) { return <ErrorMessage error={(leagueError as Error)?.message || "Failed to load league."} />; }
  if (!league || !leagueId) {
    // This now guarantees leagueId is a string if we proceed
    return <ErrorMessage error="League not found or ID missing." />;
  }

  // Show closed message if determined after initial load
  if (effectiveJoinDisabled) {
    return <JoinClosedMessage leagueId={leagueId} minutesUntilFirstKickoff={minutesUntilFirstKickoff} />;
  }


  // --- Render Page Content ---
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="container mx-auto py-12 px-4 max-w-md">
        {/* Back Button */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mb-8">
          <Button variant="ghost" onClick={() => router.back()} className="pl-0 text-gray-400 hover:text-indigo-400 hover:bg-transparent">
            <ChevronLeft className="mr-1 h-4 w-4" /> Back
          </Button>
        </motion.div>

        {/* Title */}
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="text-3xl font-bold mb-8 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent" >
          Join League
        </motion.h1>

        {/* Header and Step Content */}
        <JoinLeagueHeader
          league={league}
          step={step}
          error={error} // Pass general error state down
          minutesUntilFirstKickoff={minutesUntilFirstKickoff} // Pass timing info
        >
          {step === 1 ? (
            // Step 1: FPL Team Verification
            <FplTeamVerification
              // Pass necessary props for this component
              userProfile={userProfile} // Pass profile for default ID check
              setError={setError} // Allow child to set errors
              error={error}
              onContinue={handleVerificationSuccess} // Callback on success
              onCancel={() => router.push(`/leagues/weekly/${leagueId}`)} // Cancel goes back to league page
            />
          ) : (
            // Step 2: Payment/Confirmation Details
            <PaymentDetails
              // Pass only the necessary props
              league={league} // Pass league data (containing entryFee etc)
              userProfile={userProfile} // Pass profile (for fplTeamId)
              leagueId={leagueId}
              isJoinDisabled={effectiveJoinDisabled} // Pass combined disabled state
              minutesUntilFirstKickoff={minutesUntilFirstKickoff}
              setError={setError} // Allow child to set errors
              onBack={goBackToVerification} // Go back to step 1
              onJoinSuccess={handleJoinSuccess} // Handle successful wallet join
            />
          )}
        </JoinLeagueHeader>
      </div>
    </div>
  );
}