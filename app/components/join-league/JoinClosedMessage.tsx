// /app/components/join-league/JoinClosedMessage.tsx
import { AlertTriangle } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import Link from "next/link";

interface JoinClosedMessageProps {
  leagueId: string;
  minutesUntilFirstKickoff: number | null;
}

export default function JoinClosedMessage({ 
  leagueId, 
  minutesUntilFirstKickoff 
}: JoinClosedMessageProps) {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="container mx-auto py-12 px-4 max-w-md">
        <Card className="bg-gray-900 border border-gray-800 overflow-hidden backdrop-blur-sm relative">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-900/10 to-amber-800/10 rounded-xl pointer-events-none"></div>
          <CardContent className="pt-6 relative z-10">
            <div className="text-amber-400 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
              <h2 className="text-xl font-semibold mb-2">Joining Closed</h2>
              <p className="mb-4">
                Sorry, joining is no longer available because the first match starts in{" "}
                {minutesUntilFirstKickoff !== null ? (
                  minutesUntilFirstKickoff < 60
                    ? `${minutesUntilFirstKickoff} minutes`
                    : `${Math.floor(minutesUntilFirstKickoff / 60)} hours ${
                        minutesUntilFirstKickoff % 60
                      } minutes`
                ) : "soon"}
                .
              </p>
              <Link href={`/leagues/weekly/${leagueId}`}>
                <Button
                  variant="outline"
                  className="mt-4 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-indigo-400"
                >
                  Back to League Details
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}