
/// app/admin/leagues/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Badge } from '@/app/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';
import { Loader2, RefreshCw, CheckCircle, AlertTriangle, Eye, PlusCircle, ThumbsUp, ThumbsDown, CheckCheck } from 'lucide-react';
import AdminLeagueActions from '@/app/components/leagues/AdminLeagueAction'; // Admin Edit/Delete buttons

import type { LeagueWithUserStatus } from "@/app/types"; // Main League type (aliased Prisma), extended type, UserStats
import type { AdminLeagueData } from '@/app/api/admin/leagues/route'; // Type from GET /api/admin/leagues // Type from GET /api/admin/deposits

import { formatCurrency, formatDate } from "@/lib/utils"; // Assuming formatDate handles Date object
import { PendingDepositInfo } from '@/app/types/wallet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { ClientAdminWithdrawalRequest } from '@/app/types/bank';
import { useApproveWithdrawal, useCompleteWithdrawal, useRejectWithdrawal, useWithdrawalRequests } from '@/app/hooks/admin';
import { useUserBankAccounts } from '@/app/hooks/banks';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';

// --- Define Mutation Response Types ---
interface FinalizeSuccessResponse {
    success: boolean; message: string; entriesUpdated?: number; ranksUpdated?: number; leagueId: string;
}
interface TriggerCronSuccessResponse {
    message: string; processedLeagues: number; totalEntriesUpdated: number; totalRanksUpdated: number; errors: { leagueId: string, error: string }[];
}
interface ConfirmDepositSuccessResponse {
    success: boolean; message: string; transactionId: string; userId: string;
}
interface AdminActionSuccessResponse { success: boolean; message: string; transactionId: string; status?: string; }

// --- React Query Hook for Fetching Admin Leagues ---
function useAdminLeagues() {
    return useQuery<AdminLeagueData[]>({
        queryKey: ['adminLeagues'],
        queryFn: async (): Promise<AdminLeagueData[]> => {
            const response = await fetch('/api/admin/leagues');
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                if (response.status === 401 || response.status === 403) throw new Error(errorData.error || 'Unauthorized');
                throw new Error(errorData.error || 'Failed to fetch leagues for admin');
            }
            return response.json();
        },
        refetchInterval: 60000, // Refetch list every 60 seconds
        refetchOnWindowFocus: true,
    });
}

// --- React Query Hook for Fetching Pending Deposits ---
function usePendingDeposits() {
    return useQuery<PendingDepositInfo[]>({
        queryKey: ['pendingDeposits'],
        queryFn: async (): Promise<PendingDepositInfo[]> => {
            const response = await fetch('/api/admin/deposits?status=PENDING');
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                if (response.status === 401 || response.status === 403) throw new Error(errorData.error || 'Unauthorized');
                throw new Error(errorData.error || 'Failed to fetch pending deposits');
            }
            // Ensure amount is number if needed later, API might return string/Decimal
            const data = await response.json();
            return data.map((d: any) => ({ ...d, amount: Number(d.amount) })); // Example conversion
            // return data as PendingDepositInfo[]; // Use if API guarantees correct types
        },
        refetchInterval: 30000, // Refetch pending deposits every 30 seconds
        refetchOnWindowFocus: true,
    });
}


// --- Main Admin Page Component ---
export default function AdminLeaguesPage() {
    const { data: session, status: authStatus } = useSession();
    const router = useRouter();
    const queryClient = useQueryClient();

    const [activeTab, setActiveTab] = useState("leagues");

    // Component State
    const [finalizingLeagueId, setFinalizingLeagueId] = useState<string | null>(null);
    const [confirmingDepositId, setConfirmingDepositId] = useState<string | null>(null);
    // Withdrawal state
    const [withdrawalStatusFilter, setWithdrawalStatusFilter] = useState('REQUIRES_APPROVAL'); // Default filter
    const [processingWithdrawalId, setProcessingWithdrawalId] = useState<string | null>(null); // Tracks loading state for any withdrawal action
    const [showRejectModal, setShowRejectModal] = useState<ClientAdminWithdrawalRequest | null>(null); // Store tx data for modal
    const [rejectReason, setRejectReason] = useState('');
    const [showCompleteModal, setShowCompleteModal] = useState<ClientAdminWithdrawalRequest | null>(null); // Store tx data for modal
    const [bankReference, setBankReference] = useState('');

    // --- Data Fetching Hooks ---
    const { data: allLeagues = [], isLoading: leaguesLoading, error: leaguesError } = useAdminLeagues();
    const { data: pendingDeposits = [], isLoading: depositsLoading, error: depositsError } = usePendingDeposits();
    const { data: withdrawalRequests = [], isLoading: withdrawalsLoading, error: withdrawalsError } = useWithdrawalRequests(withdrawalStatusFilter);
    const { data: bankAccounts = [], isLoading: bankAccountsLoading, error: bankAccountsError } = useUserBankAccounts(); // Use user's accounts for management view



    // --- Mutations ---

    // Mutation for triggering points/rank sync
    const triggerSyncMutation = useMutation<TriggerCronSuccessResponse, Error, void>({
        mutationFn: async () => {
            console.log("[ADMIN_SYNC_MUTATION] Calling POST /api/admin/trigger-cron...");
            const response = await fetch('/api/admin/trigger-cron', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || data.message || `Sync trigger failed: ${response.statusText}`);
            return data;
        },
        onSuccess: (data) => {
            let description = `Processed ${data.processedLeagues || 0} active leagues. Updates: ${data.totalEntriesUpdated || 0} points, ${data.totalRanksUpdated || 0} ranks.`;
            if (data.errors?.length > 0) { description += ` Errors: ${data.errors.length}.`; toast.warning("Sync Completed with Errors", { description }); }
            else { toast.success("Sync Triggered Successfully", { description }); }
            queryClient.invalidateQueries({ queryKey: ['adminLeagues'] }); // Refresh league list potentially
        },
        onError: (error: Error) => { toast.error("Sync Trigger Failed", { description: error.message }); },
    });

    // Mutation for finalizing a league
    const finalizeLeagueMutation = useMutation<FinalizeSuccessResponse, Error, string>({
        mutationFn: async (leagueId: string): Promise<FinalizeSuccessResponse> => {
            const response = await fetch(`/api/admin/leagues/${leagueId}/finalize`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || data.details || `Finalization failed: ${response.statusText}`);
            return { ...data, leagueId: leagueId };
        },
        onMutate: (leagueId: string) => { setFinalizingLeagueId(leagueId); },
        onSuccess: (data) => {
            toast.success(`League Finalized Successfully!`, { description: `League ${data.leagueId} marked as complete.` });
            queryClient.invalidateQueries({ queryKey: ['adminLeagues'] });
            queryClient.invalidateQueries({ queryKey: ['league', data.leagueId] });
            queryClient.invalidateQueries({ queryKey: ['leaderboard', data.leagueId] });
        },
        onError: (error: Error, leagueId) => { toast.error(`Failed to Finalize League ${leagueId}`, { description: error.message }); },
        onSettled: () => { setFinalizingLeagueId(null); },
    });

    // Mutation for confirming a deposit
    const confirmDepositMutation = useMutation<ConfirmDepositSuccessResponse, Error, string>({
        mutationFn: async (transactionId: string): Promise<ConfirmDepositSuccessResponse> => {
            const response = await fetch('/api/admin/deposits/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ transactionId }) });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || data.details || `Confirmation failed: ${response.statusText}`);
            return data;
        },
        onMutate: (transactionId: string) => { setConfirmingDepositId(transactionId); },
        onSuccess: (data) => {
            toast.success(`Deposit Confirmed!`, { description: `Tx ID: ${data.transactionId} for user ${data.userId}.` });
            queryClient.invalidateQueries({ queryKey: ['pendingDeposits'] }); // Refresh list <<< IMPORTANT
            queryClient.invalidateQueries({ queryKey: ['walletData'] }); // Refresh wallet data if displayed elsewhere
            queryClient.invalidateQueries({ queryKey: ['userStats'] }); // Refresh user stats
        },
        onError: (error: Error, transactionId) => { toast.error(`Failed to Confirm Deposit ${transactionId}`, { description: error.message }); },
        onSettled: () => { setConfirmingDepositId(null); },
    });

    // Withdrawal Mutations
    const approveWithdrawalMutation = useApproveWithdrawal();
    const rejectWithdrawalMutation = useRejectWithdrawal();
    const completeWithdrawalMutation = useCompleteWithdrawal();

    // --- Authorization & Loading States ---
    useEffect(() => {
        if (authStatus === "unauthenticated") {
            router.push('/api/auth/signin?callbackUrl=/admin/leagues');
        }
        // Add actual Admin role check here based on session?.user?.isAdmin
        // if (authStatus === "authenticated" && !(session?.user as any)?.isAdmin) {
        //     toast.error("Access Denied"); router.push('/');
        // }
    }, [authStatus, router, session]);

    // Withdrawal Action Handlers
    const handleApproveWithdrawal = (txId: string) => {
        if (processingWithdrawalId) return;
        setProcessingWithdrawalId(txId);
        approveWithdrawalMutation.mutate({ transactionId: txId }, { onSettled: () => setProcessingWithdrawalId(null) });
    };
    const handleOpenRejectModal = (tx: ClientAdminWithdrawalRequest) => { setShowRejectModal(tx); setRejectReason(''); };
    const handleConfirmRejectWithdrawal = () => {
        if (!showRejectModal || processingWithdrawalId) return;
        setProcessingWithdrawalId(showRejectModal.id);
        rejectWithdrawalMutation.mutate(
            { transactionId: showRejectModal.id, reason: rejectReason || "Rejected by admin" },
            { onSettled: () => { setProcessingWithdrawalId(null); setShowRejectModal(null); } }
        );
    };
    const handleOpenCompleteModal = (tx: ClientAdminWithdrawalRequest) => { setShowCompleteModal(tx); setBankReference(''); };
    const handleConfirmCompleteWithdrawal = () => {
        if (!showCompleteModal || processingWithdrawalId) return;
        setProcessingWithdrawalId(showCompleteModal.id);
        completeWithdrawalMutation.mutate(
            { transactionId: showCompleteModal.id, bankReference: bankReference || undefined },
            { onSettled: () => { setProcessingWithdrawalId(null); setShowCompleteModal(null); } }
        );
    };

    // Combined loading state
    const isLoading = authStatus === 'loading' || leaguesLoading || depositsLoading;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
                <div className="flex flex-col items-center space-y-2">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                    <p className="text-indigo-200">Loading Admin Data...</p>
                </div>
            </div>
        );
    }
    if (authStatus === 'unauthenticated') { return null; } // Redirect handled by useEffect
    const combinedError = leaguesError || depositsError;
    if (combinedError) {
        return (
            <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-4">
                <Alert variant="destructive" className="max-w-lg">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error Loading Data</AlertTitle>
                    <AlertDescription>{(combinedError as Error)?.message || "Could not load admin data."}</AlertDescription>
                </Alert>
            </div>
        );
    }

    // --- Render Page ---
    return (
        <div className="min-h-screen max-w-6xl mx-auto bg-gray-950 text-gray-100 py-8 px-4 md:px-8 space-y-8">
            {/* Header Row */}
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h1 className="text-3xl font-bold text-gray-100">Admin Dashboard</h1>
                <Link href="/admin/leagues/create" passHref legacyBehavior>
                    <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        <a><PlusCircle className="h-4 w-4 mr-2" />Create League</a>
                    </Button>
                </Link>
            </div>

            {/* Tab Navigation */}
            <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="leagues">
                <TabsList className="grid w-full grid-cols-5 bg-gray-800/60 border border-gray-700 mb-6"> {/* Adjusted grid-cols */}
                    <TabsTrigger value="leagues">Leagues</TabsTrigger>
                    <TabsTrigger value="deposits">Deposits</TabsTrigger>
                    <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
                    <TabsTrigger value="sync">Manual Sync</TabsTrigger>
                </TabsList>
                {/* Leagues Tab */}
                <TabsContent value="leagues">
                    {/* League List Section */}
                    <Card className="backdrop-blur-md bg-gray-900/60 border border-gray-800 shadow-lg">
                        <CardHeader> <CardTitle>Leagues</CardTitle> <CardDescription>View and manage weekly leagues.</CardDescription> </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-gray-700 hover:bg-transparent">
                                        <TableHead className="text-gray-300">Name</TableHead>
                                        <TableHead className="text-gray-300">GW</TableHead>
                                        <TableHead className="text-gray-300">Status</TableHead>
                                        <TableHead className="text-gray-300">Participants</TableHead>
                                        <TableHead className="text-right text-gray-300">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {!leaguesLoading && allLeagues.length === 0 && (
                                        <TableRow className="border-gray-800">
                                            <TableCell colSpan={5} className="text-center text-gray-500 py-8"> No leagues found.</TableCell>
                                        </TableRow>)}
                                    {allLeagues.map((league) => (
                                        <TableRow key={league.id} className="border-gray-800 hover:bg-gray-800/50">
                                            <TableCell className="font-medium text-gray-100">{league.name}</TableCell>
                                            <TableCell className="text-gray-300">GW {league.gameweek}</TableCell>
                                            <TableCell> <Badge variant={league.status === 'completed' ? 'success' : league.status === 'active' ? 'warning' : 'secondary'} className="capitalize">{league.status}</Badge> </TableCell>
                                            <TableCell className="text-gray-300">{league.currentParticipants} / {league.maxParticipants}</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                {/* View Results Button */}
                                                {league.status === 'completed' && (<Link href={`/leagues/weekly/${league.id}`} passHref legacyBehavior><Button asChild variant="outline" size="sm" className="text-blue-300 border-blue-600/30 hover:bg-blue-950/30 hover:border-blue-500/50"><a><Eye className="h-4 w-4 mr-1" /> View</a></Button></Link>)}
                                                {/* Finalize Button */}
                                                {league.status === 'active' && league.isReadyToFinalize && (<Button size="sm" variant="default" onClick={() => { if (!(finalizingLeagueId === league.id || finalizeLeagueMutation.isPending)) finalizeLeagueMutation.mutate(league.id); }} disabled={finalizingLeagueId === league.id || finalizeLeagueMutation.isPending} className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-70"> {(finalizingLeagueId === league.id && finalizeLeagueMutation.isPending) ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />} <span className="ml-1">Finalize</span> </Button>)}
                                                {/* Awaiting Badge */}
                                                {league.status === 'active' && !league.isReadyToFinalize && (<Badge variant="outline" className="text-xs text-amber-400 border-amber-600/30 bg-amber-950/20">Awaiting FPL</Badge>)}
                                                {/* Admin Actions for Upcoming */}
                                                {league.status === 'upcoming' && (<AdminLeagueActions league={league as LeagueWithUserStatus} isAdmin={true} />)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {/* Optional: Loading indicator within table */}
                                    {leaguesLoading && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-4">
                                                <div className='flex justify-center items-center pt-4'>
                                                    <Loader2 className="h-5 w-5 animate-spin text-indigo-300" />
                                                    <span className='ml-2 text-sm text-gray-400'>Loading leagues...</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Deposits Tab */}
                <TabsContent value="deposits">
                    {/* --- Pending Deposits Section --- */}
                    <Card className="backdrop-blur-md bg-gray-900/60 border border-gray-800 shadow-lg">
                        <CardHeader>
                            <CardTitle>Pending Deposits</CardTitle>
                            <CardDescription>Review and confirm manual bank transfer deposits.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-gray-700 hover:bg-transparent">
                                        <TableHead className="text-gray-300">Requested</TableHead>
                                        <TableHead className="text-gray-300">User</TableHead>
                                        <TableHead className="text-gray-300">Amount</TableHead>
                                        <TableHead className="text-gray-300">Reference</TableHead>
                                        <TableHead className="text-right text-gray-300">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {!depositsLoading && pendingDeposits.length === 0 && (
                                        <TableRow className="border-gray-800">
                                            <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                                                No pending deposits found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {pendingDeposits.map((deposit) => (
                                        <TableRow key={deposit.id} className="border-gray-800 hover:bg-gray-800/50">
                                            <TableCell className="text-gray-300 text-xs">
                                                {deposit.createdAt ? formatDate(new Date(deposit.createdAt)) : '-'}
                                            </TableCell>
                                            <TableCell className="text-gray-100 text-sm">
                                                {deposit.user?.name || deposit.user?.email || <span className='text-gray-500 italic'>User ID: {deposit.userId.substring(0, 6)}...</span>}
                                            </TableCell>
                                            <TableCell className="text-gray-100 font-medium">
                                                {/* Ensure amount is treated as number */}
                                                {formatCurrency(Number(deposit.amount || 0))}
                                            </TableCell>
                                            <TableCell className="font-mono text-amber-400 text-xs">
                                                {deposit.externalReference || <span className='text-gray-500 italic'>N/A</span>}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    variant="success" // Assumes you have a 'success' variant defined, otherwise use default/outline + classes
                                                    onClick={() => {
                                                        if (confirmingDepositId === deposit.id || confirmDepositMutation.isPending) return;
                                                        confirmDepositMutation.mutate(deposit.id);
                                                    }}
                                                    disabled={confirmingDepositId === deposit.id || confirmDepositMutation.isPending}
                                                    className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-70 px-3"
                                                >
                                                    {(confirmingDepositId === deposit.id && confirmDepositMutation.isPending) ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <CheckCircle className="h-4 w-4" />
                                                    )}
                                                    <span className="ml-1">Confirm</span>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {/* Optional: Show loading indicator within table content area */}
                                    {depositsLoading && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-4">
                                                <div className='flex justify-center items-center pt-4'>
                                                    <Loader2 className="h-5 w-5 animate-spin text-indigo-300" />
                                                    <span className='ml-2 text-sm text-gray-400'>Loading deposits...</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                    {/* --- END: Pending Deposits Section --- */}
                </TabsContent>
                {/* Withdrawals Tab */}
                <TabsContent value="withdrawals">
                    <Card className="backdrop-blur-md bg-gray-900/60 border border-gray-800 shadow-lg">
                        <CardHeader>
                            <CardTitle>Withdrawal Requests</CardTitle>
                            <CardDescription>Approve, reject, or complete withdrawal requests.</CardDescription>
                            {/* Status Filter */}
                            <div className="pt-4">
                                <Label className="mr-2 text-sm text-gray-400">Filter Status:</Label>
                                <Select value={withdrawalStatusFilter} onValueChange={setWithdrawalStatusFilter}>
                                    <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700"> <SelectValue /> </SelectTrigger>
                                    <SelectContent className="bg-gray-800 border-gray-700 text-gray-200">
                                        <SelectItem value="REQUIRES_APPROVAL">Requires Approval</SelectItem>
                                        <SelectItem value="PROCESSING">Processing (Awaiting Payout)</SelectItem>
                                        <SelectItem value="COMPLETED">Completed</SelectItem>
                                        <SelectItem value="FAILED">Failed</SelectItem>
                                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                        <SelectItem value="PENDING">Pending (Legacy/Other)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Requested</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Bank Details</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {/* Loading/Empty States */}
                                    {withdrawalsLoading && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-6"><Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Loading...</TableCell>
                                        </TableRow>)}
                                    {!withdrawalsLoading && withdrawalRequests.length === 0 && (<TableRow>
                                        <TableCell colSpan={6} className="text-center text-gray-500 py-8"> No withdrawals found with status '{withdrawalStatusFilter}'.
                                        </TableCell>
                                    </TableRow>)}
                                    {/* Withdrawal Rows */}
                                    {withdrawalRequests.map((tx) => {
                                        const bankDetails = tx.metadata as any; // Assuming metadata holds bank info
                                        const isLoadingThisTx = processingWithdrawalId === tx.id; // Is action running for THIS tx?
                                        return (
                                            <TableRow key={tx.id} className="border-gray-800 hover:bg-gray-800/50 text-sm">
                                                <TableCell className="text-xs">{formatDate(new Date(tx.createdAt))}</TableCell>
                                                <TableCell className="text-gray-200">{tx.user?.name || tx.user?.email || 'N/A'}</TableCell>
                                                <TableCell className="font-medium text-amber-400">{formatCurrency(Number(tx.amount || 0))}</TableCell>
                                                <TableCell className="text-xs text-gray-400">
                                                    {bankDetails?.bankName && <>{bankDetails.bankName}<br /></>}
                                                    {bankDetails?.accountNumber && <>{bankDetails.accountNumber}<br /></>}
                                                    {bankDetails?.accountName && <>{bankDetails.accountName}</>}
                                                    {!bankDetails?.bankName && <span className='italic'>Details missing</span>}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={tx.status === 'COMPLETED' ? 'success' : tx.status === 'PROCESSING' ? 'secondary' : tx.status === 'FAILED' || tx.status === 'CANCELLED' ? 'destructive' : 'secondary'} className="capitalize">{tx.status.replace(/_/g, ' ').toLowerCase()}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right space-x-1">
                                                    {/* Actions based on current status */}
                                                    {tx.status === 'REQUIRES_APPROVAL' && (
                                                        <>
                                                            <Button size="sm" variant="success" onClick={() => handleApproveWithdrawal(tx.id)} disabled={isLoadingThisTx || approveWithdrawalMutation.isPending} title="Approve & Debit Wallet"> {isLoadingThisTx ? <Loader2 className='h-3 w-3 animate-spin' /> : <ThumbsUp className="h-3 w-3" />} Approve </Button>
                                                            <Button size="sm" variant="destructive" onClick={() => handleOpenRejectModal(tx)} disabled={isLoadingThisTx || rejectWithdrawalMutation.isPending} title="Reject Request"> {isLoadingThisTx ? <Loader2 className='h-3 w-3 animate-spin' /> : <ThumbsDown className="h-3 w-3" />} Reject </Button>
                                                        </>
                                                    )}
                                                    {tx.status === 'PROCESSING' && (
                                                        <Button size="sm" variant="outline" className="text-emerald-400 border-emerald-600" onClick={() => handleOpenCompleteModal(tx)} disabled={isLoadingThisTx || completeWithdrawalMutation.isPending} title="Mark as Paid/Completed"> {isLoadingThisTx ? <Loader2 className='h-3 w-3 animate-spin' /> : <CheckCheck className="h-3 w-3" />} Mark Paid </Button>
                                                        // Optional: Add a Mark Failed button here too?
                                                    )}
                                                    {/* No actions needed for Completed/Failed/Cancelled? */}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                {/* Sync Tab Content */}
                <TabsContent value="sync">
                    {/* Manual Sync Section */}
                    <Card className="backdrop-blur-md bg-gray-900/60 border border-gray-800 shadow-lg">
                        <CardHeader>
                            <CardTitle>Manual Data Sync</CardTitle>
                            <CardDescription>
                                Trigger background update of points/ranks for active leagues.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                onClick={() => { if (!triggerSyncMutation.isPending) triggerSyncMutation.mutate(); }}
                                disabled={triggerSyncMutation.isPending}
                                className="bg-violet-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center justify-center transition-colors duration-200 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {triggerSyncMutation.isPending ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Syncing...</>) : (<><RefreshCw className="h-4 w-4 mr-2" /> Trigger Sync</>)}
                            </Button>
                            {triggerSyncMutation.isError && (<p className='text-red-400 text-sm mt-3 p-3 bg-red-900/20 border border-red-800/50 rounded-md'> <span className="font-medium">Sync Failed:</span> {(triggerSyncMutation.error as Error)?.message || "Unknown error"} </p>)}
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
            <Dialog open={!!showRejectModal} onOpenChange={(isOpen) => !isOpen && setShowRejectModal(null)}>
                <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700"> <DialogHeader> <DialogTitle className="text-amber-400">Reject Withdrawal</DialogTitle> <DialogDescription> Tx ID: {showRejectModal?.id} <br /> User: {showRejectModal?.user?.name || showRejectModal?.user?.email}<br /> Amount: {formatCurrency(Number(showRejectModal?.amount || 0))} </DialogDescription> </DialogHeader> <div className="py-4 space-y-2"> <Label htmlFor="rejectReason" className="text-gray-300">Reason for Rejection (Optional)</Label> <Textarea id="rejectReason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="bg-gray-800 border-gray-600" /> </div> <DialogFooter> <Button type="button" variant="ghost" onClick={() => setShowRejectModal(null)}>Cancel</Button> <Button type="button" variant="destructive" onClick={handleConfirmRejectWithdrawal} disabled={processingWithdrawalId === showRejectModal?.id}> {processingWithdrawalId === showRejectModal?.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Confirm Rejection </Button> </DialogFooter> </DialogContent>
            </Dialog>

            {/* Complete Modal */}
            <Dialog open={!!showCompleteModal} onOpenChange={(isOpen) => !isOpen && setShowCompleteModal(null)}>
                <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700"> <DialogHeader> <DialogTitle className="text-green-400">Complete Withdrawal</DialogTitle> <DialogDescription> Tx ID: {showCompleteModal?.id} <br /> User: {showCompleteModal?.user?.name || showCompleteModal?.user?.email}<br /> Amount: {formatCurrency(Number(showCompleteModal?.amount || 0))} </DialogDescription> </DialogHeader> <div className="py-4 space-y-2"> <Label htmlFor="bankRef" className="text-gray-300">Bank Transfer Reference (Optional)</Label> <Input id="bankRef" value={bankReference} onChange={(e) => setBankReference(e.target.value)} className="bg-gray-800 border-gray-600" /> <p className="text-xs text-gray-500">Enter the reference from your bank transaction if available.</p> </div> <DialogFooter> <Button type="button" variant="ghost" onClick={() => setShowCompleteModal(null)}>Cancel</Button> <Button type="button" variant="success" onClick={handleConfirmCompleteWithdrawal} disabled={processingWithdrawalId === showCompleteModal?.id}> {processingWithdrawalId === showCompleteModal?.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Mark as Completed </Button> </DialogFooter> </DialogContent>
            </Dialog>
        </div>
    );
}