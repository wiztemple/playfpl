// /app/components/join-league/FplTeamVerification.tsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, CheckCircle, RefreshCw, ArrowRight } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { CardFooter } from "@/app/components/ui/card";
import { useVerifyFplTeam, useCheckTeamOwnership } from "@/app/hooks/fpl";
import { useUpdateProfile } from "@/app/hooks/user";

interface FplTeamVerificationProps {
  fplTeamId: string;
  setFplTeamId: (id: string) => void;
  teamInfo: any;
  setTeamInfo: (info: any) => void;
  userProfile: any;
  setError: (error: string | null) => void;
  minutesUntilFirstKickoff: number | null;
  onContinue: () => void;
  onCancel: () => void;
}

export default function FplTeamVerification({
  fplTeamId,
  setFplTeamId,
  teamInfo,
  setTeamInfo,
  userProfile,
  setError,
  minutesUntilFirstKickoff,
  onContinue,
  onCancel
}: FplTeamVerificationProps) {
  const verifyTeam = useVerifyFplTeam();
  const checkTeamOwnership = useCheckTeamOwnership();
  const updateProfile = useUpdateProfile();

  // Set initial FPL team ID from user profile - fixed to use useEffect instead of useState
  useEffect(() => {
    if (userProfile?.fplTeamId && !fplTeamId) {
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
  }, [userProfile, fplTeamId, teamInfo, setFplTeamId, setTeamInfo, verifyTeam]);

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
      onContinue();
    }
  };

  return (
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

      <CardFooter className="flex justify-between pt-6 pb-6 relative z-10 border-t border-gray-800">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            onClick={onCancel}
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
      </CardFooter>
    </div>
  );
}