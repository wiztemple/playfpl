import { useState, useEffect } from 'react';

/**
 * Hook to check if a gameweek deadline has passed and if games are in progress
 * @param deadlineTimeString - The deadline time as a string
 * @param fixtures - The fixtures for the gameweek
 * @returns Object containing deadline and fixture status information
 */
export function useDeadlineCheck(deadlineTimeString?: string, fixtures?: any[]) {
  const [isDeadlinePassed, setIsDeadlinePassed] = useState(false);
  const [gamesInProgress, setGamesInProgress] = useState(false);
  
  useEffect(() => {
    // Function to check deadline and game status
    const checkStatus = () => {
      const now = new Date();
      
      // Check if deadline has passed
      if (deadlineTimeString) {
        const deadlineTime = new Date(deadlineTimeString);
        setIsDeadlinePassed(now > deadlineTime);
      }
      
      // Check if any games are in progress
      if (fixtures && fixtures.length > 0) {
        const inProgress = fixtures.some(fixture => {
          const kickoffTime = new Date(fixture.kickoff_time);
          // A game is considered in progress if it has started but not finished
          // (using a simple 2-hour window for game duration)
          return now > kickoffTime && now < new Date(kickoffTime.getTime() + 2 * 60 * 60 * 1000);
        });
        
        setGamesInProgress(inProgress);
      }
    };
    
    // Check immediately
    checkStatus();
    
    // Set up interval to check every minute
    const intervalId = setInterval(checkStatus, 60000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [deadlineTimeString, fixtures]);
  
  return {
    isDeadlinePassed,
    gamesInProgress,
    deadlineTime: deadlineTimeString ? new Date(deadlineTimeString) : null
  };
}