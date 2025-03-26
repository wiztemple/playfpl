// app/components/user/ConnectFplTeam.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { AlertTriangle, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface ConnectFplTeamProps {
  existingTeamId?: number | null;
  existingTeamName?: string | null;
  onTeamConnected?: (teamId: number, teamName: string) => void;
  className?: string;
}

export default function ConnectFplTeam({ 
  existingTeamId, 
  existingTeamName, 
  onTeamConnected,
  className 
}: ConnectFplTeamProps) {
  const [fplTeamId, setFplTeamId] = useState(existingTeamId ? String(existingTeamId) : '');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamInfo, setTeamInfo] = useState<{
    teamName: string;
    managerName: string;
    overallRank?: number;
  } | null>(null);

  const verifyAndConnectTeam = async () => {
    if (!fplTeamId || isNaN(Number(fplTeamId))) {
      setError('Please enter a valid FPL Team ID');
      return;
    }
    
    try {
      setVerifying(true);
      setError(null);
      
      // First verify the team exists
      const verifyResponse = await fetch(`/api/fpl/verify-team?id=${fplTeamId}`);
      const verifyData = await verifyResponse.json();
      
      if (!verifyResponse.ok || !verifyData.valid) {
        setError(verifyData.error || 'Invalid FPL Team ID');
        return;
      }
      
      // Then connect it to the user's account
      const connectResponse = await fetch('/api/user/connect-team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fplTeamId: parseInt(fplTeamId)
        })
      });
      
      const connectData = await connectResponse.json();
      
      if (!connectResponse.ok) {
        setError(connectData.error || 'Failed to connect team');
        return;
      }
      
      // Set team info for UI feedback
      setTeamInfo({
        teamName: verifyData.teamName,
        managerName: verifyData.managerName,
        overallRank: verifyData.overallRank
      });
      
      toast.success('FPL team connected successfully!');
      
      // Call the callback if provided
      if (onTeamConnected) {
        onTeamConnected(parseInt(fplTeamId), verifyData.teamName);
      }
      
    } catch (error) {
      console.error('Error connecting team:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className={className}>
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-md flex items-start">
            <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}
        
        {existingTeamId && existingTeamName ? (
          <div className="bg-green-50 p-4 rounded-md border border-green-100">
            <h3 className="font-medium text-green-800 mb-2">Team Connected!</h3>
            <div className="space-y-1">
              <p><span className="font-medium">Team ID:</span> {existingTeamId}</p>
              <p><span className="font-medium">Team Name:</span> {existingTeamName}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="fplTeamId">FPL Team ID</Label>
              <div className="flex gap-2">
                <Input
                  id="fplTeamId"
                  placeholder="Enter your FPL Team ID"
                  value={fplTeamId}
                  onChange={(e) => setFplTeamId(e.target.value)}
                />
                <Button 
                  onClick={verifyAndConnectTeam} 
                  disabled={verifying || !fplTeamId}
                  className="flex items-center"
                >
                  {verifying ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Connect
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                You can find your team ID in the URL when you visit your FPL team page:
                https://fantasy.premierleague.com/entry/<span className="font-bold">YOUR-ID</span>/event/1
              </p>
            </div>
            
            {teamInfo && (
              <div className="bg-green-50 p-4 rounded-md border border-green-100">
                <h3 className="font-medium text-green-800 mb-2">Team Verified!</h3>
                <div className="space-y-1">
                  <p><span className="font-medium">Team Name:</span> {teamInfo.teamName}</p>
                  <p><span className="font-medium">Manager:</span> {teamInfo.managerName}</p>
                  {teamInfo.overallRank && (
                    <p><span className="font-medium">Overall Rank:</span> {teamInfo.overallRank.toLocaleString()}</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}