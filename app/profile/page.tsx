'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Skeleton } from '@/app/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { toast } from 'sonner';
import {
    useUserProfile,
    useUserStats,
    useWalletData,
    useUpdateProfile
} from '@/app/hooks/user';

import { BackgroundGradients } from '../components/shared/BackgroundGradient';
import { UserProfileCard } from '../components/profile/UserProfileCard';
import { StatsOverviewCard } from '../components/profile/StatsOverviewCard';
import { FplPerformanceCard } from '../components/profile/FplPerformanceCard';
import { FplTeamCard } from '../components/profile/FplTeamCard';
import { ActiveLeaguesCard } from '../components/profile/ActiveLeaguesCard';
import { CompletedLeaguesCard } from '../components/profile/CompletedLeaguesCard';
import { TransactionsCard } from '../components/profile/TransactionCard';
import { AccountSettingsCard } from '../components/profile/AccountSettingsCard';
import { useVerifyFplTeam } from '../hooks/fpl';
import { formatDate } from '@/lib/utils';
import { TeamInfo } from '../types';
import { useMyLeagues } from '../hooks/leagues';

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    // State for FPL team verification
    const [fplTeamId, setFplTeamId] = useState('');
    const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Use React Query hooks
    const {
        profile: userProfile,
        isLoading: profileLoading,
        error: profileError
    } = useUserProfile();

    const {
        stats,
        isLoading: statsLoading
    } = useUserStats();

    const {
        data: walletData,
        isLoading: walletLoading
    } = useWalletData();

    const {
        activeLeagues,
        completedLeagues,
        isLoading: leaguesLoading,
        error: leaguesError
    } = useMyLeagues();

    // Mutations
    const verifyTeamMutation = useVerifyFplTeam();
    const updateProfileMutation = useUpdateProfile();

    // Combined loading state
    const loading = profileLoading || statsLoading || walletLoading || leaguesLoading || status === 'loading';

    // Check if user is authenticated
    if (status === 'unauthenticated') {
        router.push('/api/auth/signin?callbackUrl=/profile');
    }

    // Set FPL team ID from profile data when it loads
    useEffect(() => {
        if (userProfile?.fplTeamId && fplTeamId === '' && !teamInfo) {
            setFplTeamId(userProfile.fplTeamId.toString());
            // Fetch team details if available
            fetch(`/api/fpl/verify-team?id=${userProfile.fplTeamId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.valid) {
                        setTeamInfo({
                            teamName: data.teamName,
                            managerName: data.managerName,
                            overallRank: data.overallRank,
                            totalPoints: data.totalPoints,       // Add this
                            teamValue: data.teamValue,         // Add this
                            currentGameweek: data.currentGameweek, // Add this
                            gameweekPoints: data.gameweekPoints,   // Add this
                            transfersMade: data.transfersMade,     // Add this
                            transfersAvailable: data.transfersAvailable, // Add this (will likely be null)
                        });
                    }
                })
                .catch(error => console.error('Error fetching team details:', error));
        }
    }, [userProfile, fplTeamId, teamInfo]);

    const verifyFplTeam = async () => {
        if (!fplTeamId || isNaN(Number(fplTeamId))) {
            toast.error('Please enter a valid FPL Team ID');
            return;
        }

        setError(null);
        try {
            const data = await verifyTeamMutation.mutateAsync(fplTeamId);
            setTeamInfo({
                teamName: data.teamName,
                managerName: data.managerName,
                overallRank: data.overallRank
            });
        } catch (error: any) {
            setError(error.message || 'Invalid FPL Team ID');
            setTeamInfo(null);
        }
    };

    const saveProfile = async () => {
        if (!teamInfo) {
            verifyFplTeam();
            return;
        }

        try {
            await updateProfileMutation.mutateAsync({
                fplTeamId: Number(fplTeamId),
                fplTeamName: teamInfo.teamName
            });
        } catch (error) {
            // Error is handled by the mutation
        }
    };

    // Show loading state
    if (loading) {
        return <LoadingState />;
    }

    // Redirect if not logged in
    if (!session) {
        router.push('/api/auth/signin?callbackUrl=/profile');
        return null;
    }

    // Helper functions
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 2
        }).format(amount);
    };

    // Get user initials for avatar fallback
    const userInitials = session.user.name
        ? session.user.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
        : session.user.email?.charAt(0).toUpperCase() || 'U';

    // Recent transactions
    const recentTransactions = walletData?.transactions?.slice(0, 5) || [];

    return (
        <div className="min-h-screen bg-gray-950 relative overflow-hidden">
            <BackgroundGradients />

            <div className="container mx-auto py-6 max-w-4xl relative z-10">
                <h1 className="text-2xl font-bold mb-6 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">My Profile</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <UserProfileCard
                        session={session}
                        userInitials={userInitials}
                        userProfile={userProfile}
                        walletData={walletData}
                        formatDate={formatDate}
                        formatCurrency={formatCurrency}
                        router={router}
                    />

                    <StatsOverviewCard stats={stats} formatCurrency={formatCurrency} />
                </div>

                <Tabs defaultValue="fpl" className="relative z-10">
                    <TabsList className="bg-gray-800/60 backdrop-blur-md border border-gray-700">
                        <TabsTrigger value="fpl" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-gray-300 hover:text-gray-100">FPL Team</TabsTrigger>
                        <TabsTrigger value="leagues" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-gray-300 hover:text-gray-100">My Leagues</TabsTrigger>
                        <TabsTrigger value="transactions" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-gray-300 hover:text-gray-100">Transactions</TabsTrigger>
                        <TabsTrigger value="account" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-gray-300 hover:text-gray-100">Account Settings</TabsTrigger>
                    </TabsList>

                    <TabsContent value="fpl" className="space-y-4">
                        <FplTeamCard
                            fplTeamId={fplTeamId}
                            setFplTeamId={setFplTeamId}
                            verifyFplTeam={verifyFplTeam}
                            verifyTeamMutation={verifyTeamMutation}
                            error={error}
                            teamInfo={teamInfo}
                            saveProfile={saveProfile}
                            updateProfileMutation={updateProfileMutation}
                            userProfile={userProfile}
                        />

                        <FplPerformanceCard
                            userProfile={userProfile}
                            teamInfo={teamInfo}
                        />
                    </TabsContent>

                    <TabsContent value="leagues" className="space-y-4">
                        <ActiveLeaguesCard
                            activeLeagues={activeLeagues || []}
                            formatCurrency={formatCurrency}
                            formatDate={formatDate}
                        />

                        <CompletedLeaguesCard
                            completedLeagues={completedLeagues || []}
                            formatCurrency={formatCurrency}
                            formatDate={formatDate}
                        />
                    </TabsContent>

                    <TabsContent value="transactions" className="space-y-4">
                        <TransactionsCard
                            walletData={walletData}
                            recentTransactions={recentTransactions}
                            formatCurrency={formatCurrency}
                            formatDate={formatDate}
                        />
                    </TabsContent>

                    <TabsContent value="account" className="space-y-4">
                        <AccountSettingsCard
                            session={session}
                            userProfile={userProfile}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

// Loading state component
const LoadingState = () => (
    <div className="min-h-screen bg-gray-950 relative overflow-hidden">
        <div className="container mx-auto py-6 max-w-4xl">
            <div className="space-y-6">
                <Skeleton className="h-10 w-48 bg-gray-800" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-64 w-full bg-gray-800 rounded-xl" />
                    <Skeleton className="h-64 w-full bg-gray-800 rounded-xl md:col-span-2" />
                </div>
                <Skeleton className="h-10 w-full bg-gray-800 rounded-lg" />
                <Skeleton className="h-96 w-full bg-gray-800 rounded-xl" />
            </div>
        </div>
    </div>
);