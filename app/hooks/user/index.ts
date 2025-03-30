import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Fetch user profile data
export const useUserProfile = () => {
    return useQuery({
        queryKey: ['userProfile'],
        queryFn: async () => {
            const response = await fetch('/api/user/profile');
            if (!response.ok) throw new Error('Failed to fetch profile');
            return response.json();
        },
    });
};

// Fetch user stats
export const useUserStats = () => {
    return useQuery({
        queryKey: ['userStats'],
        queryFn: async () => {
            const response = await fetch('/api/user/stats');
            if (!response.ok) throw new Error('Failed to fetch user stats');
            return response.json();
        },
        // Default values if data not yet loaded
        placeholderData: {
            totalLeaguesJoined: 0,
            totalWinnings: 0,
            bestRank: '-',
            currentLeagues: 0,
            winningRate: '0%'
        }
    });
};

// Fetch wallet data
export const useWalletData = () => {
    return useQuery({
        queryKey: ['walletData'],
        queryFn: async () => {
            const response = await fetch('/api/wallet');
            if (!response.ok) throw new Error('Failed to fetch wallet data');
            return response.json();
        },
    });
};

// Fetch user leagues
export const useUserLeagues = () => {
    return useQuery({
        queryKey: ['userLeagues'],
        queryFn: async () => {
            const response = await fetch('/api/leagues/user');
            if (!response.ok) throw new Error('Failed to fetch user leagues');
            return response.json();
        },
        placeholderData: []
    });
};

export const useUpdateProfile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (profileData: { fplTeamId: number; fplTeamName: string }) => {
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(profileData)
            });

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }

            return response.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['userProfile'] });
            toast.success('Profile updated successfully!');
            return data;
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to update profile');
            throw error;
        }
    });
};