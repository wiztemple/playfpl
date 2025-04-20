import { AlertTriangle, Clock } from "lucide-react";

interface JoinWarningProps {
    isJoinDisabled: boolean;
    minutesUntilFirstKickoff: number | null;
}

export default function JoinWarning({ isJoinDisabled, minutesUntilFirstKickoff }: JoinWarningProps) {
    return (
        <div className={`my-4 p-4 rounded-lg shadow-md flex items-start ${isJoinDisabled
                ? "bg-red-950/40 border-l-4 border-red-500"
                : "bg-amber-950/40 border-l-4 border-amber-500"
            }`}>
            <div className={`p-2 rounded-full mr-3 ${isJoinDisabled ? "bg-red-900/30" : "bg-amber-900/30"
                }`}>
                {isJoinDisabled
                    ? <Clock className="h-5 w-5 text-red-400" />
                    : <AlertTriangle className="h-5 w-5 text-amber-400" />
                }
            </div>
            <div>
                <h4 className={`font-semibold mb-1 ${isJoinDisabled ? "text-red-400" : "text-amber-400"
                    }`}>
                    {isJoinDisabled ? "Joining Closed" : "Deadline Warning"}
                </h4>
                <p className="text-sm text-gray-300">
                    {isJoinDisabled
                        ? `You can no longer join this league as the first match starts in ${minutesUntilFirstKickoff} minutes.`
                        : "Make sure to join before the gameweek deadline. Once the gameweek starts, you won't be able to join this league."}
                </p>
            </div>
        </div>
    );
}