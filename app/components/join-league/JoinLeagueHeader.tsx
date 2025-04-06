// /app/components/join-league/JoinLeagueHeader.tsx
import { ReactNode } from "react";
import { AlertTriangle, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/app/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface JoinLeagueHeaderProps {
  league: any;
  step: number;
  error: string | null;
  minutesUntilFirstKickoff: number | null;
  children: ReactNode;
}

export default function JoinLeagueHeader({
  league,
  error,
  children
}: JoinLeagueHeaderProps) {
  return (
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

          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}