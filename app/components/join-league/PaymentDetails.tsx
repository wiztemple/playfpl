// /app/components/join-league/PaymentDetails.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, DollarSign, CreditCard, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { CardFooter } from "@/app/components/ui/card";
import { useInitiatePayment } from "@/app/hooks/wallet";
import { formatCurrency } from "@/lib/utils";

interface PaymentDetailsProps {
    league: any;
    teamInfo: any;
    fplTeamId: string;
    leagueId: string;
    session: any;
    isJoinDisabled: boolean;
    minutesUntilFirstKickoff: number | null;
    setError: (error: string | null) => void;
    onBack: () => void;
    router: any;
}

export default function PaymentDetails({
    league,
    teamInfo,
    fplTeamId,
    leagueId,
    session,
    isJoinDisabled,
    minutesUntilFirstKickoff,
    setError,
    onBack,
    router
}: PaymentDetailsProps) {
    const [submitting, setSubmitting] = useState(false);
    const initiatePaymentMutation = useInitiatePayment();

    const initiatePayment = async () => {
        try {
            // Final check for joinability before payment
            if (isJoinDisabled) {
                setError("Sorry, joining is no longer available as the first match is about to start.");
                router.push(`/leagues/weekly/${leagueId}`);
                return;
            }

            // Check if leagueId exists before proceeding
            if (!leagueId) {
                setError("League ID is missing. Please try again.");
                return;
            }

            setSubmitting(true);
            setError(null);

            const paymentData = {
                leagueId: leagueId,
                fplTeamId,
                amount: Math.round((league?.entryFee || 0) * 100), // Convert to kobo (smallest currency unit)
                email: session?.user?.email || '',
                name: session?.user?.name || 'FPL Player',
                metadata: {
                    league_name: league?.name || 'Unknown League',
                    gameweek: league?.gameweek || 0,
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

    return (
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

            {/* Time remaining warning in payment step */}
            {minutesUntilFirstKickoff !== null && minutesUntilFirstKickoff < 30 && (
                <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-amber-900/30 border border-amber-800/40 rounded-md flex items-start"
                >
                    <Clock className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-amber-400" />
                    <p className="text-sm text-amber-300">
                        <span className="font-medium">Time-sensitive:</span>{" "}
                        Complete payment quickly. First match starts in {minutesUntilFirstKickoff} minutes.
                    </p>
                </motion.div>
            )}

            <CardFooter className="flex justify-between pt-6 pb-6 relative z-10 border-t border-gray-800">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                        variant="outline"
                        onClick={onBack}
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
                                Complete Payment
                            </div>
                        )}
                    </Button>
                </motion.div>
            </CardFooter>
        </div>
    );
}