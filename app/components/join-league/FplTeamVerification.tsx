// /app/components/join-league/FplTeamVerification.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, CheckCircle, ArrowRight, AlertTriangle, Loader2 } from "lucide-react"; // Added Loader2, AlertTriangle
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { CardFooter } from "@/app/components/ui/card";
import { useVerifyFplTeam, useCheckTeamOwnership } from "@/app/hooks/fpl"; // Adjust path if needed
import { useUpdateProfile } from "@/app/hooks/user"; // Adjust path if neededpe
import { toast } from "sonner"; // For profile update notification
import { UserProfile } from "@/app/types/wallet";

// Define type for team info state/prop more accurately
interface VerifiedTeamInfo {
  teamName: string;
  managerName: string;
  overallRank: number | null;
}

// Corrected Props Interface
interface FplTeamVerificationProps {
  userProfile: Pick<UserProfile, 'id' | 'fplTeamId' | 'fplTeamName'> | null | undefined;
  setError: (error: string | null) => void;
  onContinue: (verifiedTeamId: string, verifiedTeamInfo: VerifiedTeamInfo) => void;
  onCancel: () => void;
  error: string | null;
}

export default function FplTeamVerification({
  userProfile,
  setError,
  onContinue,
  onCancel,
  error
}: FplTeamVerificationProps) {

  // Local State
  const [fplTeamIdInput, setFplTeamIdInput] = useState('');
  const [verifiedTeamInfo, setVerifiedTeamInfo] = useState<VerifiedTeamInfo | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Mutations
  const verifyTeamMutation = useVerifyFplTeam();
  const checkTeamOwnershipMutation = useCheckTeamOwnership();
  const updateProfileMutation = useUpdateProfile();

  // Effect to pre-fill and potentially pre-verify ID from profile
  useEffect(() => {
    if (userProfile?.fplTeamId && fplTeamIdInput === '' && !verifiedTeamInfo) {
      const linkedTeamId = userProfile.fplTeamId.toString();
      setFplTeamIdInput(linkedTeamId);
      console.log(`[FPL_VERIFY_EFFECT] Profile loaded with FPL ID: ${linkedTeamId}. Input empty, no local verification yet.`);

      // Automatically trigger verification for the linked ID
      if (!verifyTeamMutation.isPending) { // Avoid triggering if already running
        console.log(`[FPL_VERIFY_EFFECT] Auto-verifying linked team ID: ${linkedTeamId}`);
        setIsVerifying(true);
        setError(null);
        verifyTeamMutation.mutate(linkedTeamId, {
          onSuccess: (data) => {
            console.log("[FPL_VERIFY_EFFECT] Auto-verify API Success Data:", data);
            if (data.valid && data.teamName && data.managerName) {
              setVerifiedTeamInfo({
                teamName: data.teamName,
                managerName: data.managerName,
                overallRank: data.overallRank ?? null
              });
              setError(null);
              console.log("[FPL_VERIFY_EFFECT] Auto-verification successful, teamInfo set.");
            } else {
              console.warn("[FPL_VERIFY_EFFECT] Auto-verification failed condition check. API data:", data);
              setError(data.error || "Failed to auto-verify linked FPL team.");
              setVerifiedTeamInfo(null);
            }
          },
          onError: (error) => {
            console.error("[FPL_VERIFY_EFFECT] Auto-verification mutation error:", error);
            setError(`Error auto-verifying linked team: ${error.message}`);
            setVerifiedTeamInfo(null);
          },
          onSettled: () => {
            setIsVerifying(false);
            console.log("[FPL_VERIFY_EFFECT] Auto-verification settled.");
          }
        });
      }
    }
  }, [userProfile, fplTeamIdInput, verifiedTeamInfo, verifyTeamMutation.isPending, verifyTeamMutation, setError, setFplTeamIdInput]);


  // Input Handler
  const handleFplTeamIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTeamId = e.target.value.replace(/[^0-9]/g, '');
    setFplTeamIdInput(newTeamId);
    setError(null);
    setVerifiedTeamInfo(null);
  };

  // Verification Logic (called by button or continue)
  const verifyFplTeamHandler = async (): Promise<{ isValid: boolean; teamId: string | null; teamInfo: VerifiedTeamInfo | null }> => {
    if (!fplTeamIdInput || isNaN(Number(fplTeamIdInput)) || Number(fplTeamIdInput) <= 0) {
      setError("Please enter a valid positive FPL Team ID number");
      return { isValid: false, teamId: null, teamInfo: null };
    }
    const idToVerify = fplTeamIdInput;
    const idToVerifyNum = parseInt(idToVerify);

    if (userProfile?.fplTeamId != null && userProfile.fplTeamId !== idToVerifyNum) {
      setError(`You must use your already linked FPL team ID: ${userProfile.fplTeamId}`);
      return { isValid: false, teamId: null, teamInfo: null };
    }

    setError(null);
    setIsVerifying(true);

    try {
      console.log(`Verifying FPL ID: ${idToVerify}`);
      const data = await verifyTeamMutation.mutateAsync(idToVerify);
      if (!data.valid || !data.teamName || !data.managerName) {
        throw new Error(data.error || "Invalid FPL Team ID or missing data.");
      }

      const currentTeamInfo = {
        teamName: data.teamName,
        managerName: data.managerName,
        overallRank: data.overallRank || null,
      };

      if (!userProfile?.fplTeamId) { // Only check ownership if linking for first time
        console.log(`Checking ownership for new team ID ${idToVerifyNum}`);
        const ownershipData = await checkTeamOwnershipMutation.mutateAsync(idToVerifyNum);
        if (ownershipData.isOwned && !ownershipData.isOwner) {
          throw new Error("This FPL team ID is already linked to another account.");
        }
        console.log(`Ownership check passed for team ID ${idToVerifyNum}`);
      }

      setVerifiedTeamInfo(currentTeamInfo);

      // Update profile only if ID is new AND differs from existing profile ID (if any)
      if (currentTeamInfo.teamName && (!userProfile?.fplTeamId || userProfile.fplTeamId !== idToVerifyNum)) {
        console.log(`Updating profile for user ${userProfile?.id} with new FPL details...`);
        try {
          await updateProfileMutation.mutateAsync({ fplTeamId: idToVerifyNum, fplTeamName: currentTeamInfo.teamName });
          toast.success("FPL Team Linked!", { description: `Team ${currentTeamInfo.teamName} linked.` });
        } catch (profileUpdateError: any) {
          console.error("Failed to auto-update profile FPL details:", profileUpdateError);
          toast.warning("FPL Team Verified", { description: "Could not save team to profile." });
        }
      }
      return { isValid: true, teamId: idToVerify, teamInfo: currentTeamInfo };
    } catch (error: any) {
      console.error("Error during verifyFplTeamHandler:", error);
      setError(error.message || "Failed to verify team.");
      setVerifiedTeamInfo(null);
      return { isValid: false, teamId: null, teamInfo: null };
    } finally {
      setIsVerifying(false);
    }
  };

  // Continue Button Handler
  const handleContinue = async () => {
    // Use already verified info if input matches profile ID
    if (verifiedTeamInfo && fplTeamIdInput === userProfile?.fplTeamId?.toString()) {
      console.log("Continuing with pre-verified linked team info.");
      onContinue(fplTeamIdInput, verifiedTeamInfo);
      return;
    }
    // Otherwise, run verification first
    const verificationResult = await verifyFplTeamHandler();
    if (verificationResult.isValid && verificationResult.teamId && verificationResult.teamInfo) {
      onContinue(verificationResult.teamId, verificationResult.teamInfo);
    }
    // Error state should be set by verifyFplTeamHandler if it fails
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="space-y-2">
        <Label htmlFor="fplTeamIdInput" className="text-gray-300">Your FPL Team ID</Label>
        <div className="flex items-center space-x-2">
          <div className="relative flex-grow">
            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-indigo-400" />
            <Input
              id="fplTeamIdInput"
              type="text" inputMode="numeric" pattern="[0-9]*"
              value={fplTeamIdInput}
              onChange={handleFplTeamIdChange}
              placeholder="Enter FPL Team ID"
              disabled={isVerifying || !!userProfile?.fplTeamId} // Disable if profile has ID or verifying
              className={`pl-10 bg-gray-800/50 border-gray-700 text-gray-200 focus:border-indigo-600 focus:ring-indigo-600/20 ${userProfile?.fplTeamId ? 'disabled:cursor-not-allowed disabled:opacity-70' : ''}`}
            />
          </div>
          {/* Verify Button: Show only if no profile ID linked AND team not currently verified locally */}
          {!userProfile?.fplTeamId && !verifiedTeamInfo && (
            <Button type="button" variant="secondary" onClick={verifyFplTeamHandler} disabled={isVerifying || !fplTeamIdInput} className="border-gray-600 bg-gray-700 hover:bg-gray-600 text-gray-100" >
              {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
            </Button>
          )}
        </div>
        {/* Explanatory Text */}
        {userProfile?.fplTeamId ? (<p className="text-sm text-gray-400 pt-1">Using linked FPL Team ID: {userProfile.fplTeamId}</p>) : (<p className="text-sm text-gray-400 pt-1"> Find ID in FPL URL (fantasy.premierleague.com/entry/YOUR_ID/...). </p>)}
        {/* Error Display */}
        {error && ( // Display local error state
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 mt-2 bg-red-900/30 border border-red-800/50 rounded-md flex items-start text-sm text-red-300">
            <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" /> {error}
          </motion.div>
        )}
      </div>

      {/* --- COMPLETED: Verified Team Info Display --- */}
      {verifiedTeamInfo && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="p-4 bg-gradient-to-br from-green-900/40 via-emerald-900/30 to-teal-900/20 border border-green-700/40 rounded-lg shadow-sm mt-4"
        >
          <div className="flex items-center mb-2">
            <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
            <h3 className="font-semibold text-md text-green-300"> Team Verified! </h3>
          </div>
          <div className="mt-2 space-y-1 pl-2 text-sm">
            <p><span className="text-gray-400 w-24 inline-block">Team:</span><span className="font-medium text-gray-100">{verifiedTeamInfo.teamName}</span></p>
            <p><span className="text-gray-400 w-24 inline-block">Manager:</span><span className="font-medium text-gray-100">{verifiedTeamInfo.managerName}</span></p>
            <p><span className="text-gray-400 w-24 inline-block">Rank:</span>
              <span className="font-medium text-gray-100">
                {verifiedTeamInfo.overallRank?.toLocaleString() ?? 'N/A'}
                {/* Optional: Add rank badge back if desired */}
              </span>
            </p>
          </div>
        </motion.div>
      )}
      {/* --- END COMPLETED --- */}


      {/* Footer Buttons */}
      <CardFooter className="flex justify-between pt-8 pb-0 px-0">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}> <Button type="button" variant="outline" onClick={onCancel} disabled={isVerifying || updateProfileMutation.isPending} className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-indigo-400 bg-transparent" > Cancel </Button> </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button type="button" onClick={handleContinue}
            // Disable Continue button if any mutation is running, or if an ID is required but not entered, or if entered but not yet verified (unless it matches profile)
            disabled={isVerifying || verifyTeamMutation.isPending || checkTeamOwnershipMutation.isPending || updateProfileMutation.isPending || !fplTeamIdInput || (!verifiedTeamInfo && !userProfile?.fplTeamId)}
            className="text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-0">
            {isVerifying ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying...</>) : (<><ArrowRight className="mr-2 h-4 w-4" /> Continue </>)}
          </Button>
        </motion.div>
      </CardFooter>
    </div>
  );
}