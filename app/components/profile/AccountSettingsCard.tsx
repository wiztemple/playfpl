import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Switch } from '@/app/components/ui/switch';
import {
    User,
    Bell,
    Shield,
    Key,
    LogOut
} from 'lucide-react';

interface AccountSettingsCardProps {
    session: any;
    userProfile: any;
}

export const AccountSettingsCard = ({ session, userProfile }: AccountSettingsCardProps) => (
    <Card className="backdrop-blur-md bg-gray-900/60 border border-gray-800 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-xl pointer-events-none"></div>
        <CardHeader className="relative z-10">
            <CardTitle className="text-gray-100">Account Settings</CardTitle>
            <CardDescription className="text-gray-400">
                Manage your account preferences and security
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 relative z-10">
            <div className="space-y-4">
                <h3 className="font-medium text-gray-300 flex items-center">
                    <User className="h-4 w-4 mr-2 text-indigo-400" />
                    Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-gray-300">Full Name</Label>
                        <Input
                            id="fullName"
                            defaultValue={session.user.name || ''}
                            className="bg-gray-800/60 border-gray-700 text-gray-200 placeholder:text-gray-500 focus:border-indigo-500"
                            disabled
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-gray-300">Email Address</Label>
                        <Input
                            id="email"
                            defaultValue={session.user.email || ''}
                            className="bg-gray-800/60 border-gray-700 text-gray-200 placeholder:text-gray-500 focus:border-indigo-500"
                            disabled
                        />
                    </div>
                </div>
                <p className="text-sm text-gray-500">
                    Your account information is managed by your authentication provider.
                </p>
            </div>

            <div className="space-y-4">
                <h3 className="font-medium text-gray-300 flex items-center">
                    <Bell className="h-4 w-4 mr-2 text-indigo-400" />
                    Notifications
                </h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-300">Email Notifications</p>
                            <p className="text-sm text-gray-500">Receive updates about your leagues and transactions</p>
                        </div>
                        <Switch defaultChecked={userProfile?.emailNotifications ?? true} />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-300">League Reminders</p>
                            <p className="text-sm text-gray-500">Get reminded before gameweek deadlines</p>
                        </div>
                        <Switch defaultChecked={userProfile?.leagueReminders ?? true} />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-300">Marketing Communications</p>
                            <p className="text-sm text-gray-500">Receive news and promotional offers</p>
                        </div>
                        <Switch defaultChecked={userProfile?.marketingEmails ?? false} />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="font-medium text-gray-300 flex items-center">
                    <Shield className="h-4 w-4 mr-2 text-indigo-400" />
                    Security
                </h3>
                <div className="space-y-3">
                    <Button variant="outline" className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white flex items-center justify-center">
                        <Key className="mr-2 h-4 w-4" />
                        Change Password
                    </Button>
                    <Button variant="outline" className="w-full border-red-800/40 bg-red-950/30 text-red-300 hover:bg-red-900/40 hover:text-red-200 flex items-center justify-center">
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out from All Devices
                    </Button>
                </div>
            </div>

            <div className="pt-4">
                <Button variant="outline" className="w-full border-red-800/40 bg-red-950/30 text-red-300 hover:bg-red-900/40 hover:text-red-200">
                    Delete Account
                </Button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                    This action is irreversible and will permanently delete all your data.
                </p>
            </div>
        </CardContent>
    </Card>
);