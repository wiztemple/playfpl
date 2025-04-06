import {
  Card,
  CardContent,
} from "@/app/components/ui/card";
import {
  Trophy,
  Users,
  Calendar,
  CheckCircle,
  Banknote,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface RulesTabProps {
  league: any;
}

export default function RulesTab({ league }: RulesTabProps) {
  return (
    <Card className="bg-gray-900/80 border border-gray-800 overflow-hidden backdrop-blur-sm shadow-lg">
      <CardContent className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center text-indigo-400">
              <Trophy className="h-5 w-5 mr-2" />
              League Format
            </h3>
            <div className="space-y-2 text-gray-300">
              <p>This is a weekly league that runs for the duration of Gameweek {league.gameweek}.</p>
              <p>The league starts when the gameweek begins and ends when the gameweek is completed.</p>
              <p>Your final position is determined by the total points your team scores during this gameweek.</p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-800">
            <h3 className="text-lg font-semibold mb-3 flex items-center text-purple-400">
              <Users className="h-5 w-5 mr-2" />
              Eligibility & Entry
            </h3>
            <div className="space-y-2 text-gray-300">
              <p>All registered users with a valid FPL team can join this league.</p>
              <p>Entry fee: <span className="font-medium text-white">{formatCurrency(league.entryFee)}</span></p>
              <p>Maximum participants: <span className="font-medium text-white">{league.maxParticipants}</span></p>
              <p>You must join before the gameweek deadline to participate.</p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-800">
            <h3 className="text-lg font-semibold mb-3 flex items-center text-pink-400">
              <Banknote className="h-5 w-5 mr-2" />
              Scoring System
            </h3>
            <div className="space-y-2 text-gray-300">
              <p>Your score is based on the official FPL points system.</p>
              <p>All points earned by your team during Gameweek {league.gameweek} count toward your final score.</p>
              <p>This includes points from your starting XI, automatic substitutions, and your captain/vice-captain.</p>
              <p>Transfers made for this gameweek (including any point deductions) will affect your score.</p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-800">
            <h3 className="text-lg font-semibold mb-3 flex items-center text-emerald-400">
              <Calendar className="h-5 w-5 mr-2" />
              Deadlines
            </h3>
            <div className="space-y-2 text-gray-300">
              <p>You must join the league before the Gameweek {league.gameweek} deadline.</p>
              <p>Your team must be set before the gameweek deadline.</p>
              <p>Any changes to your team after the deadline won't count for this league.</p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-800">
            <h3 className="text-lg font-semibold mb-3 flex items-center text-amber-400">
              <CheckCircle className="h-5 w-5 mr-2" />
              Fair Play
            </h3>
            <div className="space-y-2 text-gray-300">
              <p>Multiple entries from the same user are not allowed.</p>
              <p>Any form of cheating or manipulation will result in disqualification.</p>
              <p>The platform reserves the right to remove users who violate the terms of service.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}