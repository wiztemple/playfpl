'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import {
    Avatar,
    AvatarFallback,
    AvatarImage
} from '@/app/components/ui/avatar';
import { Separator } from '@/app/components/ui/separator';
import { toast } from 'sonner';
import {
    User,
    Trophy,
    DollarSign,
    Check,
    AlertTriangle,
    RefreshCw,
    Clock,
    ChevronRight,
    ArrowUpRight,
    ArrowDownLeft,
    CheckCircle2,
    XCircle,
    CreditCard,
    Wallet,
    LogOut
} from 'lucide-react';

import { Banknote } from 'lucide-react';

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [walletData, setWalletData] = useState<any>(null);
    const [leagues, setLeagues] = useState<any[]>([]);

    const [fplTeamId, setFplTeamId] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [teamInfo, setTeamInfo] = useState<any>(null);

    // Check if user is authenticated
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/api/auth/signin?callbackUrl=/profile');
        }
    }, [status, router]);

    // Fetch user profile data
    useEffect(() => {
        const fetchUserProfile = async () => {
            if (status !== 'authenticated') return;

            try {
                setLoading(true);

                // Fetch basic profile data
                const response = await fetch('/api/user/profile');
                if (!response.ok) throw new Error('Failed to fetch profile');
                const data = await response.json();
                setUserProfile(data);

                // Set FPL team ID if it exists
                if (data.fplTeamId) {
                    setFplTeamId(data.fplTeamId.toString());
                    // Also fetch team details if available
                    try {
                        const teamResponse = await fetch(`/api/fpl/verify-team?id=${data.fplTeamId}`);
                        if (teamResponse.ok) {
                            const teamData = await teamResponse.json();
                            if (teamData.valid) {
                                setTeamInfo({
                                    teamName: teamData.teamName,
                                    managerName: teamData.managerName,
                                    overallRank: teamData.overallRank
                                });
                            }
                        }
                    } catch (error) {
                        console.error('Error fetching team details:', error);
                    }
                }

                // Fetch user stats 
                const statsResponse = await fetch('/api/user/stats');
                if (statsResponse.ok) {
                    const statsData = await statsResponse.json();
                    setStats(statsData);
                }

                // Fetch wallet data
                const walletResponse = await fetch('/api/wallet');
                if (walletResponse.ok) {
                    const walletData = await walletResponse.json();
                    setWalletData(walletData);
                }

                // Fetch user leagues
                const leaguesResponse = await fetch('/api/leagues/user');
                if (leaguesResponse.ok) {
                    const leaguesData = await leaguesResponse.json();
                    setLeagues(leaguesData);
                }

            } catch (error) {
                console.error('Error fetching profile data:', error);
                setError('Failed to load profile data');
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, [status]);

    const verifyFplTeam = async () => {
        if (!fplTeamId || isNaN(Number(fplTeamId))) {
            toast.error('Please enter a valid FPL Team ID');
            return;
        }

        try {
            setVerifying(true);
            setError(null);

            const response = await fetch(`/api/fpl/verify-team?id=${fplTeamId}`);
            const data = await response.json();

            if (!response.ok || !data.valid) {
                setError(data.error || 'Invalid FPL Team ID');
                setTeamInfo(null);
                return;
            }

            setTeamInfo({
                teamName: data.teamName,
                managerName: data.managerName,
                overallRank: data.overallRank
            });

            toast.success('Team verified successfully!');
        } catch (error) {
            console.error('Error verifying team:', error);
            setError('Failed to verify team. Please try again.');
        } finally {
            setVerifying(false);
        }
    };

    const saveProfile = async () => {
        if (!teamInfo) {
            verifyFplTeam();
            return;
        }

        try {
            setSaving(true);

            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fplTeamId: Number(fplTeamId),
                    fplTeamName: teamInfo.teamName
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }

            const updatedProfile = await response.json();
            setUserProfile(updatedProfile);

            toast.success('Profile updated successfully!');
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    // Show loading state
    if (status === 'loading' || loading) {
        return (
            <div className="container mx-auto py-6 max-w-4xl">
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-lg text-gray-600">Loading your profile...</p>
                </div>
            </div>
        );
    }

    // Redirect if not logged in
    if (!session) {
        router.push('/api/auth/signin?callbackUrl=/profile');
        return null;
    }

    // Get user initials for avatar fallback
    const userInitials = session.user.name
        ? session.user.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
        : session.user.email?.charAt(0).toUpperCase() || 'U';

    // Use default values if data not yet loaded
    const userStats = stats || {
        totalLeaguesJoined: 0,
        totalWinnings: 0,
        bestRank: '-',
        currentLeagues: 0,
        winningRate: '0%'
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Mock transactions for display
    const recentTransactions = walletData?.transactions?.slice(0, 5) || [];

    // Get active and completed leagues
    const activeLeagues = leagues.filter(l => l.status === 'active');
    const completedLeagues = leagues.filter(l => l.status === 'completed').slice(0, 3);
    return (
        <div className="min-h-screen bg-gray-950 relative overflow-hidden">
            {/* Background gradients */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-purple-900/20 to-gray-950"></div>
            <div className="absolute top-0 -left-40 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 -right-40 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl"></div>
            
            <div className="container mx-auto py-6 max-w-4xl relative z-10">
                <h1 className="text-2xl font-bold mb-6 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">My Profile</h1>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* User Card */}
                    <Card className="md:col-span-1 backdrop-blur-md bg-gray-900/60 border border-gray-800 shadow-xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-xl pointer-events-none"></div>
                        <CardHeader className="flex flex-row items-center gap-4 relative z-10">
                            <Avatar className="h-16 w-16 ring-2 ring-indigo-500/30">
                                <AvatarImage src={session.user.image || undefined} alt={session.user.name || 'User'} />
                                <AvatarFallback className="text-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white">{userInitials}</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-gray-100">{session.user.name}</CardTitle>
                                <CardDescription className="text-gray-400">{session.user.email}</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-500">Member since</p>
                                    <p className="font-medium text-gray-300">
                                        {userProfile?.createdAt
                                            ? formatDate(userProfile.createdAt)
                                            : 'Unknown'}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500">FPL Team</p>
                                    <p className="font-medium text-gray-300">
                                        {userProfile?.fplTeamName || 'Not connected'}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500">Team ID</p>
                                    <p className="font-medium text-gray-300">
                                        {userProfile?.fplTeamId || 'Not connected'}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500">Wallet Balance</p>
                                    <p className="font-medium bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                                        {walletData ? formatCurrency(walletData.balance) : '₦0.00'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="relative z-10">
                            <div className="flex gap-2 w-full">
                                <Link href="/wallet" className="flex-1">
                                    <Button variant="outline" className="w-full border-indigo-600/40 bg-indigo-950/30 text-indigo-300 hover:bg-indigo-900/40 hover:text-indigo-200 hover:border-indigo-500/60 transition-all duration-200">
                                        <Wallet className="mr-2 h-4 w-4" />
                                        Wallet
                                    </Button>
                                </Link>
                                <Button
                                    variant="outline"
                                    className="flex-1 border-purple-600/40 bg-purple-950/30 text-purple-300 hover:bg-purple-900/40 hover:text-purple-200 hover:border-purple-500/60 transition-all duration-200"
                                    onClick={() => router.push('/api/auth/signout')}
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Sign Out
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                    
                    {/* Stats Card */}
                    <Card className="md:col-span-2 backdrop-blur-md bg-gray-900/60 border border-gray-800 shadow-xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-xl pointer-events-none"></div>
                        <CardHeader className="relative z-10">
                            <CardTitle className="text-gray-100">Stats Overview</CardTitle>
                            <CardDescription className="text-gray-400">Your performance on FPL Stakes</CardDescription>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Trophy className="h-4 w-4 text-blue-400" />
                                        <p className="text-sm text-gray-400">Total Leagues</p>
                                    </div>
                                    <p className="text-xl font-bold text-gray-200">{userStats.totalLeaguesJoined}</p>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Banknote className="h-4 w-4 text-emerald-400" />
                                        <p className="text-sm text-gray-400">Total Winnings</p>
                                    </div>
                                    <p className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">{formatCurrency(userStats.totalWinnings)}</p>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Trophy className="h-4 w-4 text-yellow-400" />
                                        <p className="text-sm text-gray-400">Best Rank</p>
                                    </div>
                                    <p className="text-xl font-bold text-gray-200">{userStats.bestRank}</p>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Trophy className="h-4 w-4 text-purple-400" />
                                        <p className="text-sm text-gray-400">Active Leagues</p>
                                    </div>
                                    <p className="text-xl font-bold text-gray-200">{userStats.currentLeagues}</p>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Check className="h-4 w-4 text-blue-400" />
                                        <p className="text-sm text-gray-400">Win Rate</p>
                                    </div>
                                    <p className="text-xl font-bold text-gray-200">{userStats.winningRate}</p>
                                </div>

                                <div>
                                    <Link href="/leagues/weekly/create" className="flex items-center justify-center h-full">
                                        <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 transition-all duration-200">
                                            <Trophy className="mr-2 h-4 w-4" />
                                            Create League
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                
                <Tabs defaultValue="fpl" className="relative z-10">
                    <TabsList className="bg-gray-800/60 backdrop-blur-md border border-gray-700">
                        <TabsTrigger value="fpl" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-gray-300 hover:text-gray-100">FPL Team</TabsTrigger>
                        <TabsTrigger value="leagues" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-gray-300 hover:text-gray-100">My Leagues</TabsTrigger>
                        <TabsTrigger value="transactions" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-gray-300 hover:text-gray-100">Transactions</TabsTrigger>
                        <TabsTrigger value="account" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-gray-300 hover:text-gray-100">Account Settings</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="fpl" className="space-y-4">
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
                                            disabled={verifying || !fplTeamId}
                                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 transition-all duration-200 flex items-center"
                                        >
                                            {verifying ? (
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
                                    disabled={saving}
                                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 transition-all duration-200"
                                >
                                    {saving ? (
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

                        <Card className="backdrop-blur-md bg-gray-900/60 border border-gray-800 shadow-xl relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-xl pointer-events-none"></div>
                            <CardHeader className="relative z-10">
                                <CardTitle className="text-gray-100">FPL Performance</CardTitle>
                                <CardDescription className="text-gray-400">
                                    Statistics from your Fantasy Premier League team
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                {!userProfile?.fplTeamId ? (
                                    <div className="bg-blue-900/30 border border-blue-800/50 text-blue-300 p-4 rounded-md text-center">
                                        <p>Connect your FPL team to see performance statistics</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-sm text-gray-500">Overall Rank</p>
                                                <p className="text-xl font-bold text-gray-200">{teamInfo?.overallRank?.toLocaleString() || 'N/A'}</p>
                                            </div>

                                            <div>
                                                <p className="text-sm text-gray-500">Total Points</p>
                                                <p className="text-xl font-bold text-gray-200">{teamInfo?.totalPoints || '0'}</p>
                                            </div>

                                            <div>
                                                <p className="text-sm text-gray-500">Team Value</p>
                                                <p className="text-xl font-bold text-gray-200">£{teamInfo?.teamValue || '0.0'}m</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-sm text-gray-500">Current Gameweek</p>
                                                <p className="text-xl font-bold text-gray-200">GW {teamInfo?.currentGameweek || '30'}</p>
                                            </div>

                                            <div>
                                                <p className="text-sm text-gray-500">Gameweek Points</p>
                                                <p className="text-xl font-bold text-gray-200">{teamInfo?.gameweekPoints || '0'}</p>
                                            </div>

                                            <div>
                                                <p className="text-sm text-gray-500">Transfers</p>
                                                <p className="text-xl font-bold text-gray-200">{teamInfo?.transfersMade || '0'} / {teamInfo?.transfersAvailable || '0'}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}