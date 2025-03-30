import { Button } from '@/app/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { AlertTriangle, Check, RefreshCw } from 'lucide-react';

interface FplTeamCardProps {
    fplTeamId: string;
    setFplTeamId: (id: string) => void;
    verifyFplTeam: () => Promise<void>;
    verifyTeamMutation: any;
    error: string | null;
    teamInfo: any;
    saveProfile: () => Promise<void>;
    updateProfileMutation: any;
    userProfile: any;
}

export const FplTeamCard = ({
    fplTeamId,
    setFplTeamId,
    verifyFplTeam,
    verifyTeamMutation,
    error,
    teamInfo,
    saveProfile,
    updateProfileMutation,
    userProfile
}: FplTeamCardProps) => (
    <Card className="backdrop-blur-md bg-gray-900/60 border border-gray-800 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-xl pointer-events-none"></div>
        <CardHeader className="relative z-10">
            <CardTitle className="text-gray-100">Fantasy Premier League Team</CardTitle>
            <CardDescription className="text-gray-400">
                Connect your official FPL team to participate in leagues
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 relative z-10">
            {error && (
                <div className="p-4 bg-red-900/30 border border-red-800/50 text-red-300 rounded-md text-sm flex items-start">
                    <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-red-400" />
                    <p>{error}</p>
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="fplTeamId" className="text-gray-300">FPL Team ID</Label>
                <div className="flex gap-2">
                    <Input
                        id="fplTeamId"
                        placeholder="Enter your FPL Team ID"
                        value={fplTeamId}
                        onChange={(e) => setFplTeamId(e.target.value)}
                        className="bg-gray-800/60 border-gray-700 text-gray-200 placeholder:text-gray-500 focus:border-indigo-500"
                    />
                    <Button
                        onClick={verifyFplTeam}
                        disabled={verifyTeamMutation.isPending || !fplTeamId}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 transition-all duration-200 flex items-center"
                    >
                        {verifyTeamMutation.isPending ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Check className="h-4 w-4 mr-2" />
                        )}
                        Verify
                    </Button>
                </div>
                <p className="text-sm text-gray-500">
                    You can find your team ID in the URL when you visit your FPL team page:
                    https://fantasy.premierleague.com/entry/<span className="font-bold text-indigo-400">YOUR-ID</span>/event/1
                </p>
            </div>

            {teamInfo && (
                <div className="bg-green-900/30 p-4 rounded-md border border-green-800/50 text-green-300">
                    <h3 className="font-medium text-green-200 mb-2">Team Verified!</h3>
                    <div className="space-y-1">
                        <p><span className="font-medium">Team Name:</span> {teamInfo.teamName}</p>
                        <p><span className="font-medium">Manager:</span> {teamInfo.managerName}</p>
                        <p><span className="font-medium">Overall Rank:</span> {teamInfo.overallRank?.toLocaleString() || 'N/A'}</p>
                    </div>
                </div>
            )}
        </CardContent>
        <CardFooter className="relative z-10">
            <Button
                onClick={saveProfile}
                disabled={updateProfileMutation.isPending}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 transition-all duration-200"
            >
                {updateProfileMutation.isPending ? (
                    <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                    </div>
                ) : (userProfile?.fplTeamId ? 'Update Team' : 'Connect Team')}
            </Button>
        </CardFooter>
    </Card>
);