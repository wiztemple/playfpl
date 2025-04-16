'use client';

import { motion } from "framer-motion";
import { Sparkles, Wallet as WalletIcon, Loader2, AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { CardFooter } from "@/app/components/ui/card"; // Only CardFooter needed maybe
import { useJoinLeagueWithWallet } from "@/app/hooks/leagues"; // Import the correct hook (adjust path if needed)
import { formatCurrency } from "@/lib/utils";
import type { League } from "@/app/types"; // Use consistent types
import { UserProfile } from "@/app/types/wallet";

// Define the props expected by this component
interface PaymentDetailsProps {
    // Use Pick to only require specific fields from the League type
    league: Pick<League, 'id' | 'name' | 'gameweek' | 'entryFee'>;
    // Expect only the fplTeamId part of the UserProfile, can be null/undefined
    userProfile: Pick<UserProfile, 'fplTeamId'> | null | undefined;
    leagueId: string; // Expecting string, parent JoinLeaguePage ensures it's valid before rendering
    isJoinDisabled: boolean;
    minutesUntilFirstKickoff: number | null;
    setError: (error: string | null) => void;
    onBack: () => void;
    onJoinSuccess?: (data: any) => void; // Optional: type the data argument more specifically if needed
}


export default function PaymentDetails({
    league,
    userProfile, // Use the userProfile prop
    leagueId,
    isJoinDisabled,
    minutesUntilFirstKickoff,
    setError,
    onBack,
    onJoinSuccess
}: PaymentDetailsProps) {

    // Use the mutation hook for joining via wallet
    const joinLeagueMutation = useJoinLeagueWithWallet(onJoinSuccess); // Pass success callback if needed

    // Handler to call the join mutation
    const handleJoin = async () => {
        setError(null); // Clear previous errors

        // Final validation checks
        if (isJoinDisabled) {
            setError("Sorry, joining is no longer available.");
            return;
        }
        if (!leagueId) {
            setError("League ID is missing.");
            return;
        }

        // Get FPL Team ID from the passed userProfile prop
        const fplTeamId = userProfile?.fplTeamId;
        if (!fplTeamId) {
            setError("Your FPL Team ID is not linked or available. Please link it in your profile.");
            return;
        }

        // Call the mutation with leagueId and string fplTeamId
        joinLeagueMutation.mutate({ leagueId, fplTeamId: fplTeamId.toString() });
    };

    // Calculate entry fee safely
    let entryFeeNumber: number = 0;
    const rawEntryFee = league?.entryFee; // Get the value which might be Decimal | number | null
    if (rawEntryFee != null) {
        if (typeof rawEntryFee === 'number') {
            entryFeeNumber = rawEntryFee; // It's already a number
        } else if (typeof (rawEntryFee as any)?.toNumber === 'function') {
            entryFeeNumber = (rawEntryFee as any).toNumber(); // It's a Decimal object, convert it
        } else {
            // Try parsing if it's something else (like a string representation)
            entryFeeNumber = parseFloat(String(rawEntryFee));
        }
    }
    // Final check if conversion resulted in NaN
    if (isNaN(entryFeeNumber)) {
        entryFeeNumber = 0;
    }
    const displayFplTeamId = userProfile?.fplTeamId;

    return (
        <div className="space-y-6">
            {/* Summary Confirmation Section */}
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700 p-4 rounded-lg backdrop-blur-sm">
                <h3 className="font-medium mb-3 text-gray-200 flex items-center">
                    <Sparkles className="h-4 w-4 mr-2 text-indigo-400" />
                    Confirm Entry
                </h3>
                <div className="space-y-3 text-sm">
                    {/* Display relevant details */}
                    <div className="flex justify-between items-center py-2 border-b border-gray-800">
                        <span className="text-gray-400">League:</span>
                        <span className="font-medium text-gray-200 text-right">{league?.name ?? 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-800">
                        <span className="text-gray-400">Gameweek:</span>
                        <span className="font-medium text-gray-200">{league?.gameweek ?? 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-800">
                        <span className="text-gray-400">Your FPL Team ID:</span>
                        <span className="font-medium text-gray-200">{displayFplTeamId ?? 'Not Linked'}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                        <span className="text-gray-400">Entry Fee:</span>
                        <span className="font-semibold text-xl text-emerald-400">
                        {formatCurrency(entryFeeNumber)}
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 text-center pt-2">
                        This amount will be deducted from your wallet balance upon joining.
                    </p>
                </div>
            </div>

            {/* Warning Messages */}
            {minutesUntilFirstKickoff !== null && minutesUntilFirstKickoff < 30 && !isJoinDisabled && (
                <motion.div /* ... animation ... */ className="p-3 bg-amber-900/30 border border-amber-800/40 rounded-md flex items-start">
                    <Clock className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-amber-400" />
                    <p className="text-sm text-amber-300"> <span className="font-medium">Time-sensitive:</span> Joining closes in {minutesUntilFirstKickoff} mins. </p>
                </motion.div>
            )}
            {isJoinDisabled && (
                <motion.div /* ... animation ... */ className="p-3 bg-red-900/30 border border-red-800/50 rounded-md flex items-start">
                    <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-red-400" />
                    <p className="text-sm text-red-200"> Joining is currently closed for this league. </p>
                </motion.div>
            )}

            {/* Footer with Actions */}
            <CardFooter className="flex justify-between pt-6 pb-0 px-0">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button type="button" variant="outline" onClick={onBack} disabled={joinLeagueMutation.isPending} className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-indigo-400 bg-transparent" > Back </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                        type="button" // Important: Not submit
                        onClick={handleJoin}
                        // Disable if mutation pending, if joining is generally disabled, or if FPL ID missing
                        disabled={joinLeagueMutation.isPending || isJoinDisabled || !displayFplTeamId}
                        className="text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-0 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {joinLeagueMutation.isPending ? (<> <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Joining... </>) : (<> <WalletIcon className="h-4 w-4 mr-2" /> Join (Pay   {formatCurrency(entryFeeNumber)}) </>)}
                    </Button>
                </motion.div>
            </CardFooter>
        </div>
    );
}