"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

// Types for our user data
interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  username: string | null;
  fplTeamId: number | null;
  fplTeamName: string | null;
  createdAt: string;
}

interface UserStats {
  totalLeaguesJoined: number;
  totalWinnings: number;
  highestRank: number | null;
  averageRank: number | null;
  winRate: number;
}

// Hook to fetch user profile data
export function useUserProfile() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/user/profile");

        if (!response.ok) {
          throw new Error("Failed to fetch user profile");
        }

        const data = await response.json();
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Error fetching user profile:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [session]);

  return { profile, isLoading, error };
}

// Hook to fetch user statistics
export function useUserStats() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/user/stats");

        if (!response.ok) {
          throw new Error("Failed to fetch user stats");
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Error fetching user stats:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [session]);

  return { stats, isLoading, error };
}

// Hook to fetch user leagues
export function useUserLeagues() {
  const { data: session } = useSession();
  const [leagues, setLeagues] = useState<UserLeague[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeagues = async () => {
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/user/leagues");

        if (!response.ok) {
          throw new Error("Failed to fetch user leagues");
        }

        const data = await response.json();
        setLeagues(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Error fetching user leagues:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeagues();
  }, [session]);

  return { leagues, isLoading, error };
}

// Add these imports if they don't exist
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserLeague } from "../types";

// Fetch wallet data
export function useWalletData() {
  return useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const response = await fetch('/api/wallet');
      if (!response.ok) {
        throw new Error('Failed to fetch wallet data');
      }
      return response.json();
    },
    refetchOnWindowFocus: false,
  });
}

// Update user profile
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update profile');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });
}
