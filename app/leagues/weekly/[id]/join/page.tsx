"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { motion } from "framer-motion";
import { useLeague, useLeagueJoinability } from "@/app/hooks/leagues";
import { useUserProfile } from "@/app/hooks/user";
import Loading from "@/app/components/shared/Loading";
import JoinLeagueHeader from "@/app/components/join-league/JoinLeagueHeader";
import FplTeamVerification from "@/app/components/join-league/FplTeamVerification";
import ErrorMessage from "@/app/components/join-league/ErrorMessage";
import PaymentDetails from "@/app/components/join-league/PaymentDetails";
import JoinClosedMessage from "@/app/components/join-league/JoinClosedMessage";

export default function JoinLeaguePage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1); // 1 = FPL Team, 2 = Payment
  const [teamInfo, setTeamInfo] = useState(null);
  const [fplTeamId, setFplTeamId] = useState("");

  const leagueId = Array.isArray(params.id) ? params.id[0] : params.id;

  // React Query hooks
  const { data: league, isLoading: isLoadingLeague, error: leagueError } = useLeague(leagueId || '');

  // Check if league is joinable based on kickoff time
  const { isJoinDisabled, minutesUntilFirstKickoff } = useLeagueJoinability(league?.gameweek, 10); // 10 minutes threshold

  const { profile: userProfile, isLoading: isLoadingProfile } = useUserProfile();

  // Check joinability and redirect if necessary
  useEffect(() => {
    if (league && isJoinDisabled) {
      router.push(`/leagues/weekly/${leagueId}`);
    }
  }, [league, isJoinDisabled, leagueId, router]);

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

  // Handle errors from queries
  useEffect(() => {
    if (leagueError) {
      setError("Failed to load league information. Please try again.");
    }
  }, [leagueError]);

  const handleContinueToPayment = () => {
    // Double-check joinability before proceeding
    if (isJoinDisabled) {
      setError("Sorry, joining is no longer available as the first match is about to start.");
      router.push(`/leagues/weekly/${leagueId}`);
      return;
    }
    setStep(2);
  };

  const goBack = () => {
    if (step === 2) {
      setStep(1);
    } else {
      router.push("/leagues/weekly");
    }
  };

  const isLoading = isLoadingLeague || isLoadingProfile;

  // If league is not joinable, show error and redirect
  if (league && isJoinDisabled) {
    return <JoinClosedMessage
      leagueId={leagueId || ''}
      minutesUntilFirstKickoff={minutesUntilFirstKickoff}
    />;
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <div className="container mx-auto py-12 px-4 max-w-md">
          <Loading />
        </div>
      </div>
    );
  }

  if (error && !league) {
    return <ErrorMessage error={error} />;
  }

  if (!league) {
    return <ErrorMessage error="League not found or no longer available." />;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="container mx-auto py-12 px-4 max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <Link href="/leagues/weekly">
            <Button
              variant="ghost"
              className="group flex items-center space-x-1.5 pl-1 pr-3 text-gray-400 hover:text-indigo-400 hover:bg-gray-900/40 transition-all duration-200"
            >
              <motion.span
                initial={{ x: 0 }}
                whileHover={{ x: -2 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="flex items-center justify-center"
              >
                <ChevronLeft className="h-4 w-4 text-indigo-400" />
              </motion.span>
              <span className="font-medium">Back to Leagues</span>
            </Button>
          </Link>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-3xl font-bold mb-8 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
        >
          Join League
        </motion.h1>

        <JoinLeagueHeader
          league={league}
          step={step}
          error={error}
          minutesUntilFirstKickoff={minutesUntilFirstKickoff}
        >
          {step === 1 ? (
            <FplTeamVerification
              fplTeamId={fplTeamId}
              setFplTeamId={setFplTeamId}
              teamInfo={teamInfo}
              setTeamInfo={setTeamInfo}
              userProfile={userProfile}
              setError={setError}
              minutesUntilFirstKickoff={minutesUntilFirstKickoff}
              onContinue={handleContinueToPayment}
              onCancel={goBack}
            />
          ) : (
            <PaymentDetails
              league={league}
              teamInfo={teamInfo}
              fplTeamId={fplTeamId}
              leagueId={leagueId || ''}
              session={session}
              isJoinDisabled={isJoinDisabled}
              minutesUntilFirstKickoff={minutesUntilFirstKickoff}
              setError={setError}
              onBack={goBack}
              router={router}
            />
          )}
        </JoinLeagueHeader>
      </div>
    </div>
  );
}
