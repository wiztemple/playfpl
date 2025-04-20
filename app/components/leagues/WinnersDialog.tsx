"use client";

// Keeping original imports and structure
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog"; // Adjust path if needed
import { Trophy, Award, Coins } from "lucide-react";
import { formatCurrency } from "@/lib/utils"; // Adjust path if needed
import Confetti from "react-confetti";
import useWindowSize from "@/app/hooks/useWindowSize"; // Adjust path if needed

// Keeping original props interface with 'any' types
interface WinnersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  league: any;
  winners: any[];
}

// Keeping original component structure
export default function WinnersDialog({
  isOpen,
  onClose,
  league,
  winners = [],
}: WinnersDialogProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize(); // Assuming this hook works

  useEffect(() => {
    let timer: NodeJS.Timeout; // Define timer type
    if (isOpen) {
      setShowConfetti(true);
      timer = setTimeout(() => setShowConfetti(false), 5000); // Use original timeout
    }
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Keeping original getTrophyIcon function
  const getTrophyIcon = (position: number) => {
    switch (position) {
      case 1:
        return (
          <div className="relative">
            {" "}
            <Trophy className="h-12 w-12 text-yellow-500" />{" "}
            <motion.div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold text-black"
            >
              {" "}
              1{" "}
            </motion.div>{" "}
          </div>
        );
      case 2:
        return (
          <div className="relative">
            {" "}
            <Trophy className="h-10 w-10 text-gray-300" />{" "}
            <motion.div
              /*...*/ className="absolute -top-1 -right-1 bg-gray-300 rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold text-black"
            >
              {" "}
              2{" "}
            </motion.div>{" "}
          </div>
        );
      case 3:
        return (
          <div className="relative">
            {" "}
            <Trophy className="h-8 w-8 text-amber-700" />{" "}
            <motion.div
              /*...*/ className="absolute -top-1 -right-1 bg-amber-700 rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold text-black"
            >
              {" "}
              3{" "}
            </motion.div>{" "}
          </div>
        );
      default:
        return <Award className="h-7 w-7 text-indigo-400" />;
    }
  };

  // Calculate total prize pool from original winners array structure
  const totalPrizePool = winners.reduce(
    (total, w) => total + (w.winnings || 0),
    0
  );

  if (!isOpen || winners.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* Keep original DialogContent styling */}
      <DialogContent className="max-w-md bg-gray-900/95 border border-gray-800 backdrop-blur-lg shadow-lg text-white overflow-hidden">
        {showConfetti && width && height && (
          <Confetti
            width={width}
            height={height}
            recycle={false}
            numberOfPieces={200}
          />
        )}

        {/* Keep original DialogHeader */}
        <DialogHeader className="relative">
          <div className="flex flex-col items-center justify-center pt-4">
            {" "}
            <motion.div /*...*/>
              {" "}
              <Trophy className="h-16 w-16 text-yellow-500 mb-2" />{" "}
            </motion.div>{" "}
            <DialogTitle> Gameweek Winners </DialogTitle>{" "}
            <motion.p className="text-gray-400 text-sm text-center my-2"
            >
              {" "}
              Congratulations to the top performers in Gameweek{" "}
              {league?.gameweek ?? ""}!{" "}
            </motion.p>{" "}
          </div>
        </DialogHeader>

        {/* Keep original layout */}
        <span className="block text-center font-semibold text-xl">{league.name}</span>
        <div className="p-4">
          <div className="grid grid-cols-1 gap-4 mb-4">
            {/* Map over original winners array */}
            {winners.map((winner, index) => (
              <motion.div
                key={winner.id} // Assume winner objects have an id
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 * (index + 1) }}
                // Keep original styling logic based on index
                className={`flex items-center p-4 rounded-xl ${
                  index === 0
                    ? "bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border border-yellow-500/30"
                    : index === 1
                    ? "bg-gradient-to-r from-gray-500/20 to-gray-600/10 border border-gray-500/30"
                    : index === 2
                    ? "bg-gradient-to-r from-amber-700/20 to-amber-800/10 border border-amber-700/30"
                    : "bg-gradient-to-r from-indigo-500/20 to-indigo-600/10 border border-indigo-500/30"
                }`}
              >
                <div className="mr-4 flex-shrink-0">
                  {/* Use index + 1 for trophy icon as before */}
                  {getTrophyIcon(index + 1)}
                </div>

                <div className="flex-grow">
                  {/* Keep original name/team display logic */}
                  <div className="font-medium text-lg">
                    {winner.user?.name || winner.userName || "Unknown"}
                  </div>
                  <div className="text-sm text-gray-400">
                    {winner.teamName || "Team Unknown"}
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  {/* --- THE ONLY CHANGE: Use weeklyPoints --- */}
                  <div className="text-sm font-medium text-gray-300 mb-1">
                    {/* Access weeklyPoints, fallback to 0 */}
                    {winner.weeklyPoints ?? winner.gwPoints ?? 0} pts
                  </div>
                  {/* --- END CHANGE --- */}
                  <div className="flex items-center text-green-400 font-bold">
                    <Coins className="h-3.5 w-3.5 mr-1" />
                    {/* Keep original winnings display */}
                    {formatCurrency(winner.winnings || 0)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Keep original prize pool display */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center text-gray-400 text-xs mt-2"
          >
            Prize pool: {formatCurrency(totalPrizePool)}
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
