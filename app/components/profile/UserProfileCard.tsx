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
import {
    Avatar,
    AvatarFallback,
    AvatarImage
} from '@/app/components/ui/avatar';
import { Wallet, LogOut } from 'lucide-react';

interface UserProfileCardProps {
    session: any;
    userInitials: string;
    userProfile: any;
    walletData: any;
    formatDate: (date: string) => string;
    formatCurrency: (amount: number) => string;
    router: any;
}

export const UserProfileCard = ({ 
    session, 
    userInitials, 
    userProfile, 
    walletData, 
    formatDate, 
    formatCurrency, 
    router 
}: UserProfileCardProps) => (
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
);