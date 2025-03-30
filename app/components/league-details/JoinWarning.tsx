import { AlertTriangle } from "lucide-react";

interface JoinWarningProps {
    isJoinDisabled: boolean;
    minutesUntilFirstKickoff: number | null;
}

export default function JoinWarning({ isJoinDisabled, minutesUntilFirstKickoff }: JoinWarningProps) {
    return (
        <div className="my-3 p-3 bg-blue-900/20 border border-blue-800/30 rounded-lg">
            <p className="text-blue-300 text-sm flex items-start">
                <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                {isJoinDisabled
                    ? `Joining is now closed as the first match starts in ${minutesUntilFirstKickoff} minutes.`
                    : "Make sure to join before the gameweek deadline. Once the gameweek starts, you won't be able to join this league."}
            </p>
        </div>
    );
}