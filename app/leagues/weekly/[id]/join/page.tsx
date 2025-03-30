"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ChevronLeft,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Sparkles,
  DollarSign,
  Calendar,
  Users,
  CreditCard,
  ArrowRight
} from "lucide-react";
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
import { motion } from "framer-motion";
import { useLeague } from "@/app/hooks/leagues";
import { useUserProfile, useUpdateProfile } from "@/app/hooks/user";
import { useVerifyFplTeam, useCheckTeamOwnership } from "@/app/hooks/fpl";
import { useInitiatePayment } from "@/app/hooks/wallet";

export default function JoinLeaguePage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fplTeamId, setFplTeamId] = useState("");
  const [step, setStep] = useState(1); // 1 = FPL Team, 2 = Payment
  const [teamInfo, setTeamInfo] = useState<{
    teamName: string;
    managerName: string;
    overallRank: number;
  } | null>(null);

  const leagueId = Array.isArray(params.id) ? params.id[0] : params.id;
  const isAuthenticated = status === 'authenticated';

  // React Query hooks
  const { data: league, isLoading: isLoadingLeague, error: leagueError } = useLeague(leagueId || '');
  const { profile: userProfile, isLoading: isLoadingProfile } = useUserProfile();
  const verifyTeam = useVerifyFplTeam();
  const checkTeamOwnership = useCheckTeamOwnership();
  const updateProfile = useUpdateProfile();
  const initiatePaymentMutation = useInitiatePayment();

  // Set initial FPL team ID from user profile
  useEffect(() => {
    if (userProfile?.fplTeamId) {
      setFplTeamId(userProfile.fplTeamId.toString());
      
      // If user has a connected team, pre-verify it
      if (userProfile.fplTeamId && !teamInfo) {
        verifyTeam.mutate(userProfile.fplTeamId.toString(), {
          onSuccess: (data) => {
            if (data.verified) {
              setTeamInfo({
                teamName: data.teamName || userProfile.fplTeamName,
                managerName: data.playerName || '',
                overallRank: data.overallRank || 0
              });
            }
          }
        });
      }
    }
  }, [userProfile]);

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

  const handleFplTeamIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTeamId = e.target.value;
    setFplTeamId(newTeamId);

    // If user tries to change to a different team ID than their connected one
    if (userProfile?.fplTeamId &&
      userProfile.fplTeamId.toString() !== newTeamId &&
      newTeamId.trim() !== '') {
      setError("You can only join leagues with your connected FPL team (ID: " + userProfile.fplTeamId + ")");
      return;
    }

    // Reset team info when id changes
    if (teamInfo) {
      setTeamInfo(null);
    }

    // Clear error when emptying field
    if (newTeamId === '') {
      setError(null);
    }
  };

  const verifyFplTeamHandler = async () => {
    if (!fplTeamId || isNaN(Number(fplTeamId))) {
      setError("Please enter a valid FPL Team ID");
      return false;
    }

    // If user has a connected team, ensure they're using that team
    if (userProfile?.fplTeamId &&
      userProfile.fplTeamId.toString() !== fplTeamId) {
      setError("You can only join leagues with your connected FPL team (ID: " + userProfile.fplTeamId + ")");
      return false;
    }

    try {
      setError(null);
      
      // Use the verify team mutation
      const data = await verifyTeam.mutateAsync(fplTeamId);
      
      if (!data.verified) {
        setError(data.error || "Invalid FPL Team ID. Please check and try again.");
        setTeamInfo(null);
        return false;
      }

      // If this is a new team for the user, check if another user has claimed it
      if (!userProfile?.fplTeamId || userProfile.fplTeamId.toString() !== fplTeamId) {
        try {
          const ownershipData = await checkTeamOwnership.mutateAsync(parseInt(fplTeamId));
          
          if (ownershipData.isOwned && !ownershipData.isOwner) {
            setError("This FPL team ID is already connected to another account");
            return false;
          }
        } catch (error: any) {
          setError(error.message || "Failed to verify team ownership");
          return false;
        }
      }

      setTeamInfo({
        teamName: data.teamName,
        managerName: data.playerName,
        overallRank: data.overallRank || 0,
      });

      // If user doesn't have a team connected yet, connect it now
      if (!userProfile?.fplTeamId) {
        try {
          await updateProfile.mutateAsync({
            fplTeamId: parseInt(fplTeamId),
            fplTeamName: data.teamName
          });
        } catch (error: any) {
          console.error("Error connecting team:", error);
          // Continue anyway as we still want to let them join the league
        }
      }

      return true;
    } catch (error: any) {
      console.error("Error verifying team:", error);
      setError("Failed to verify team. Please try again.");
      return false;
    }
  };

  const handleContinueToPayment = async () => {
    const isValid = await verifyFplTeamHandler();
    if (isValid) {
      setStep(2);
    }
  };

  const initiatePayment = async () => {
    try {
      // Check if leagueId exists before proceeding
      if (!leagueId) {
        setError("League ID is missing. Please try again.");
        return;
      }

      setSubmitting(true);
      setError(null);

      const paymentData = {
        leagueId: leagueId, // Now we know this is not undefined
        fplTeamId,
        amount: Math.round((league?.entryFee || 0) * 100), // Convert to kobo (smallest currency unit)
        email: session?.user?.email || '', // Provide default empty string
        name: session?.user?.name || 'FPL Player',
        metadata: {
          league_name: league?.name || 'Unknown League',
          gameweek: league?.gameweek || 0, // Provide default value for gameweek
          team_name: teamInfo?.teamName || `Team ${fplTeamId}`
        }
      };

      const data = await initiatePaymentMutation.mutateAsync(paymentData);
      
      // Redirect to Paystack payment page
      window.location.href = data.authorization_url;
    } catch (err: any) {
      console.error("Payment initiation error:", err);
      setError(err.message || "Failed to initiate payment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };



  // Loading state
  
  // const initiatePayment = async () => {
  //   try {
  //     if (!leagueId) {
  //       setError("League ID is missing. Please try again.");
  //       return;
  //     }

  //     setSubmitting(true);
  //     setError(null);

  //     const paymentData = {
  //       leagueId: leagueId,
  //       fplTeamId,
  //       amount: Math.round((league?.entryFee || 0) * 100), // Convert to kobo (smallest currency unit)
  //       email: session?.user?.email,
  //       name: session?.user?.name || 'FPL Player',
  //       metadata: {
  //         league_name: league?.name || 'Unknown League',
  //         gameweek: league?.gameweek,
  //         team_name: teamInfo?.teamName || `Team ${fplTeamId}`
  //       }
  //     };

  //     const data = await initiatePaymentMutation.mutateAsync(paymentData);
      
  //     // Redirect to Paystack payment page
  //     window.location.href = data.authorization_url;
  //   } catch (err: any) {
  //     console.error("Payment initiation error:", err);
  //     setError(err.message || "Failed to initiate payment. Please try again.");
  //   } finally {
  //     setSubmitting(false);
  //   }
  // };
  
  const isLoading = isLoadingLeague || isLoadingProfile;
  
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
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <div className="container mx-auto py-12 px-4 max-w-md">
          <Card className="bg-gray-900 border border-gray-800 overflow-hidden backdrop-blur-sm relative">
            <div className="absolute inset-0 bg-gradient-to-br from-red-900/10 to-red-800/10 rounded-xl pointer-events-none"></div>
            <CardContent className="pt-6 relative z-10">
              <div className="text-red-400 text-center">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                <p className="mb-4">{error}</p>
                <Button
                  variant="outline"
                  className="mt-4 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-indigo-400"
                  onClick={() => router.push("/leagues/weekly")}
                >
                  Back to Leagues
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!league) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <div className="container mx-auto py-12 px-4 max-w-md">
          <Card className="bg-gray-900 border border-gray-800 overflow-hidden backdrop-blur-sm relative">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-[2px] pointer-events-none"></div>
            <CardContent className="pt-6 relative z-10">
              <div className="text-center">
                <p className="mb-4 text-gray-300">League not found or no longer available.</p>
                <Button
                  variant="outline"
                  className="mt-4 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-indigo-400"
                  onClick={() => router.push("/leagues/weekly")}
                >
                  Back to Leagues
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Rest of the component remains the same
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-gray-900 border border-gray-800 overflow-hidden backdrop-blur-sm relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-xl pointer-events-none"></div>

            <CardHeader className="relative z-10 border-b border-gray-800">
              <CardTitle className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                {league.name}
              </CardTitle>
              <CardDescription className="text-gray-400 flex items-center gap-3">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-1 text-green-400" />
                  <span>{formatCurrency(league.entryFee)}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-indigo-400" />
                  <span>Gameweek {league.gameweek}</span>
                </div>
              </CardDescription>
            </CardHeader>

            <CardContent className="relative z-10 pt-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-4 p-4 bg-red-900/30 border border-red-800/50 text-red-300 rounded-md flex items-start"
                >
                  <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-red-400" />
                  <p>{error}</p>
                </motion.div>
              )}

              {step === 1 ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="fplTeamId" className="text-gray-300">Your FPL Team ID</Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-indigo-400" />
                      <Input
                        id="fplTeamId"
                        type="text"
                        value={fplTeamId}
                        onChange={handleFplTeamIdChange}
                        placeholder="Enter your FPL Team ID"
                        disabled={userProfile?.fplTeamId ? true : false}
                        className="pl-10 bg-gray-800/50 border-gray-700 text-gray-200 focus:border-indigo-600 focus:ring-indigo-600/20"
                      />
                    </div>
                    {userProfile?.fplTeamId ? (
                      <p className="text-sm text-gray-500">
                        You can only join leagues with your connected FPL team.
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500">
                        You can find your team ID in the URL when you visit your FPL
                        team page. This team will be connected to your account.
                      </p>
                    )}
                  </div>

                  {teamInfo && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.4,
                        ease: "easeOut"
                      }}
                      className="p-5 bg-gradient-to-br from-green-900/40 via-emerald-900/30 to-teal-900/20 border border-green-700/40 rounded-lg shadow-lg shadow-green-900/10 backdrop-blur-sm"
                    >
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1, duration: 0.3 }}
                        className="flex items-center mb-3"
                      >
                        <div className="bg-green-500/20 p-1.5 rounded-full mr-3">
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        </div>
                        <h3 className="font-semibold text-lg bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                          Team Verified!
                        </h3>
                      </motion.div>

                      <div className="mt-3 space-y-3 pl-2">
                        <motion.div
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.2, duration: 0.3 }}
                          className="flex items-center"
                        >
                          <span className="text-gray-400 w-28 text-sm">Team Name:</span>
                          <span className="font-medium text-gray-100">{teamInfo.teamName}</span>
                        </motion.div>

                        <motion.div
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.3, duration: 0.3 }}
                          className="flex items-center"
                        >
                          <span className="text-gray-400 w-28 text-sm">Manager:</span>
                          <span className="font-medium text-gray-100">{teamInfo.managerName}</span>
                        </motion.div>

                        <motion.div
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.4, duration: 0.3 }}
                          className="flex items-center"
                        >
                          <span className="text-gray-400 w-28 text-sm">Overall Rank:</span>
                          <span className="font-medium text-gray-100">
                            <span className="inline-flex items-center">
                              {teamInfo.overallRank.toLocaleString()}
                              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${teamInfo.overallRank < 100000
                                  ? 'bg-green-900/50 text-green-300 border border-green-700/50'
                                  : teamInfo.overallRank < 500000
                                    ? 'bg-blue-900/50 text-blue-300 border border-blue-700/50'
                                    : 'bg-gray-800/50 text-gray-300 border border-gray-700/50'
                                }`}>
                                {teamInfo.overallRank < 100000
                                  ? 'Elite'
                                  : teamInfo.overallRank < 500000
                                    ? 'Skilled'
                                    : 'Active'}
                              </span>
                            </span>
                          </span>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}

                  {verifyTeam.isPending && (
                    <div className="mt-3 flex items-center text-indigo-400">
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Verifying team...
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700 p-4 rounded-lg backdrop-blur-sm">
                    <h3 className="font-medium mb-3 text-gray-200 flex items-center">
                      <Sparkles className="h-4 w-4 mr-2 text-indigo-400" />
                      League Details
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-800">
                        <span className="text-gray-400">League:</span>
                        <span className="font-medium text-gray-200">{league.name}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-800">
                        <span className="text-gray-400">Entry Fee:</span>
                        <span className="font-medium text-gray-200 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                          {formatCurrency(league.entryFee)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-800">
                        <span className="text-gray-400">FPL Team:</span>
                        <span className="font-medium text-gray-200">
                          {teamInfo ? teamInfo.teamName : fplTeamId}
                        </span>
                      </div>
                      {teamInfo && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-800">
                          <span className="text-gray-400">Manager:</span>
                          <span className="font-medium text-gray-200">{teamInfo.managerName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700 p-4 rounded-lg backdrop-blur-sm">
                    <h3 className="font-medium mb-3 text-gray-200 flex items-center">
                      <CreditCard className="h-4 w-4 mr-2 text-purple-400" />
                      Payment Method
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">
                      Secure payment processing via Paystack. No actual payment will be processed in demo mode.
                    </p>
                    <div className="flex items-center space-x-2 bg-gray-800/50 p-3 rounded-md border border-gray-700">
                      <input
                        type="radio"
                        id="creditCard"
                        name="paymentMethod"
                        checked
                        readOnly
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="creditCard" className="text-gray-300">Demo Credit Card</label>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex justify-between pt-6 pb-6 relative z-10 border-t border-gray-800">
              {step === 1 ? (
                <>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/leagues/weekly")}
                      disabled={verifyTeam.isPending}
                      className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-indigo-400 bg-transparent"
                    >
                      Cancel
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={handleContinueToPayment}
                      disabled={verifyTeam.isPending}
                      className="text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-0"
                    >
                      {verifyTeam.isPending ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Verifying...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          Continue to Payment
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </div>
                      )}
                    </Button>
                  </motion.div>
                </>
              ) : (
                <>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      onClick={() => setStep(1)}
                      disabled={submitting || initiatePaymentMutation.isPending}
                      className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-indigo-400 bg-transparent"
                    >
                      Back
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={initiatePayment}
                      disabled={submitting || initiatePaymentMutation.isPending}
                      className="text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-0"
                    >
                      {submitting || initiatePaymentMutation.isPending ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Processing...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          Complete Payment
                        </div>
                      )}
                    </Button>
                  </motion.div>
                </>
              )}
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
