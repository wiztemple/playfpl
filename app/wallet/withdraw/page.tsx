// /app/wallet/withdraw/page.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, AlertTriangle, Loader2, Wallet as WalletIcon, Banknote as BankIcon, Check } from 'lucide-react'; // Use Banknote as BankIcon or import University
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/app/components/ui/select"; // Import Select
import { formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';
import Loading from '@/app/components/shared/Loading';
import { toast } from 'sonner';
// Import needed hooks and types (adjust path if hooks are elsewhere)
import { useWalletBalance } from '@/app/hooks/wallet';
import { useUserBankAccounts } from '@/app/hooks/banks';


// --- Define Types for this page ---
interface RequestWithdrawalVars {
    amount: number;
    bankAccountId: string;
}
interface RequestWithdrawalResponse {
    success: boolean;
    message: string;
    transactionId: string;
    status: string;
}

// --- Hook for Requesting Withdrawal ---
function useRequestWithdrawal(onSuccessCallback?: () => void) {
    const queryClient = useQueryClient();
    return useMutation<RequestWithdrawalResponse, Error, RequestWithdrawalVars>({
        mutationFn: async (vars: RequestWithdrawalVars): Promise<RequestWithdrawalResponse> => {
            const response = await fetch('/api/wallet/withdraw', { // Calls the route we just updated
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(vars)
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || `Withdrawal request failed (${response.status})`);
            }
            return data;
        },
        onSuccess: (data) => {
            toast.success("Withdrawal Requested", { description: data.message });
            queryClient.invalidateQueries({ queryKey: ['transactions'] }); // Refresh transaction history
            if (onSuccessCallback) onSuccessCallback();
        },
        onError: (error: Error) => {
            toast.error("Withdrawal Request Failed", { description: error.message });
        }
    });
}
// --- End Hooks ---


export default function WithdrawPage() {
    const { data: session, status: authStatus } = useSession();
    const router = useRouter();

    // State
    const [amount, setAmount] = useState('');
    const [selectedAccountId, setSelectedAccountId] = useState<string>(''); // Store ID of selected account
    const [error, setError] = useState<string | null>(null);

    // Fetch necessary data
    const { data: walletBalanceData, isLoading: balanceLoading, error: balanceError } = useWalletBalance();
    const { data: bankAccounts = [], isLoading: accountsLoading, error: accountsError } = useUserBankAccounts();

    // Use the withdrawal request mutation
    const requestWithdrawalMutation = useRequestWithdrawal(() => {
        // On success, navigate back to wallet page
        router.push('/wallet');
    });

    // Combined loading/error
    const isLoading = authStatus === 'loading' || balanceLoading || accountsLoading;
    const queryError = balanceError || accountsError;

    // --- Effects ---
    useEffect(() => { if (authStatus === 'unauthenticated') router.push('/api/auth/signin?callbackUrl=/wallet/withdraw'); }, [authStatus, router]);

    // --- Handlers ---
    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => { /* Keep existing logic */
        const value = e.target.value.replace(/[^0-9.]/g, '');
        const parts = value.split('.');
        if (parts.length > 2) return;
        if (parts[1] && parts[1].length > 2) return;
        if (value !== '' && !/^\d*\.?\d*$/.test(value)) return;
        setAmount(value); setError(null);
    };

    const handleWithdrawMax = () => { setAmount(walletBalanceData?.balance?.toString() ?? '0'); setError(null); };

    // Form Submit Handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validate amount
        const numAmount = parseFloat(amount);
        const MIN_WITHDRAWAL = 500; // Define your minimum
        const currentBalance = walletBalanceData?.balance ?? 0;

        if (isNaN(numAmount) || numAmount <= 0) { setError('Please enter a valid positive amount'); return; }
        if (numAmount < MIN_WITHDRAWAL) { setError(`Minimum withdrawal amount is ${formatCurrency(MIN_WITHDRAWAL)}`); return; }
        if (numAmount > currentBalance) { setError('Withdrawal amount exceeds available balance'); return; }
        if (!selectedAccountId) { setError('Please select a bank account'); return; }

        // Call the mutation
        requestWithdrawalMutation.mutate({ amount: numAmount, bankAccountId: selectedAccountId });
    };

    // --- Loading / Error / Auth States ---
    if (isLoading) { /* ... return loading ... */ }
    if (authStatus === 'unauthenticated') { return null; }
    if (queryError) { /* ... return error alert ... */ }


    // --- Render Page ---
    return (
        <div className="min-h-screen bg-gray-950 text-gray-100">
            <div className="container mx-auto py-12 px-4 max-w-md">
                {/* Back Button */}
                <motion.div /* ... */ className="mb-8">
                     <Link href="/wallet"> <Button variant="ghost" className="pl-0 text-gray-400 hover:text-indigo-400 hover:bg-transparent"> <ChevronLeft className="mr-1 h-4 w-4" /> Back to Wallet </Button> </Link>
                </motion.div>

                <motion.div /* ... */ >
                    <Card className="backdrop-blur-md bg-gray-900/60 border border-gray-800 shadow-xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-xl pointer-events-none"></div>
                        <CardHeader className="relative z-10">
                            <CardTitle className="text-xl bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"> Withdraw Funds </CardTitle>
                            <CardDescription className="text-gray-400"> Request withdrawal to your linked bank account. </CardDescription>
                        </CardHeader>

                        <form onSubmit={handleSubmit}>
                            <CardContent className="space-y-6 relative z-10">
                                {/* Error Display */}
                                {error && ( <div className="p-3 bg-red-900/30 border border-red-800/50 text-red-300 rounded-md text-sm flex items-start"> <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-red-400" /> <p>{error}</p> </div> )}

                                {/* Amount Input */}
                                <div>
                                    <div className="flex justify-between items-center mb-2"> <Label htmlFor="amount" className="text-gray-300">Amount to Withdraw</Label> <p className="text-sm text-gray-400"> Available: <span className="text-indigo-400">{formatCurrency(walletBalanceData?.balance ?? 0)}</span> </p> </div>
                                    <div className="relative"> <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"> <span className="text-gray-400">₦</span> </div> <Input id="amount" type="text" inputMode="decimal" value={amount} onChange={handleAmountChange} className="pl-8 bg-gray-800/50 border-gray-700 text-gray-100 focus:ring-indigo-500 focus:border-indigo-500" placeholder="0.00" /> <Button type="button" variant="ghost" size="sm" onClick={handleWithdrawMax} className="absolute inset-y-0 right-0 px-3 text-xs text-indigo-400 hover:text-indigo-300"> MAX </Button> </div>
                                </div>

                                {/* Bank Account Selection */}
                                <div>
                                    <Label htmlFor="bankAccount" className="text-gray-300 mb-2 block">Withdraw To</Label>
                                     {accountsLoading && <p className='text-sm text-gray-500'>Loading accounts...</p>}
                                     {!accountsLoading && bankAccounts.length === 0 && (
                                         <div className='text-sm text-center p-4 border border-dashed border-gray-700 rounded-md text-gray-400'>
                                             <p className='mb-2'>No bank accounts found.</p>
                                             <Link href="/wallet"> {/* Link back to wallet where Add Account is */}
                                                 <Button variant="outline" size="sm" className='text-indigo-300 border-indigo-600/30 hover:bg-indigo-950/30'>Add Bank Account</Button>
                                             </Link>
                                         </div>
                                     )}
                                     {/* Use ShadCN Select component */}
                                     {bankAccounts.length > 0 && (
                                        <Select
                                            value={selectedAccountId}
                                            onValueChange={setSelectedAccountId} // Update state on change
                                            required={true}
                                        >
                                            <SelectTrigger className="w-full bg-gray-800/50 border-gray-700 text-gray-100 focus:ring-indigo-500 focus:border-indigo-500">
                                                <SelectValue placeholder="Select saved bank account" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-gray-800 border-gray-700 text-gray-200">
                                                <SelectGroup>
                                                    <SelectLabel className="text-gray-400">Your Saved Accounts</SelectLabel>
                                                    {bankAccounts.map((account) => (
                                                        <SelectItem key={account.id} value={account.id} className="focus:bg-indigo-900/50 focus:text-white">
                                                             <div className="flex items-center space-x-2">
                                                                <BankIcon className="h-4 w-4 text-gray-400" />
                                                                <span>{account.bankName} - ****{account.accountNumber.slice(-4)} ({account.accountName})</span>
                                                             </div>
                                                        </SelectItem>
                                                    ))}
                                                 </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                     )}
                                </div>
                                {/* Removed Account Verification Section */}
                            </CardContent>

                            <CardFooter className="relative z-10 pt-6">
                                <Button
                                    type="submit" // Submit the form
                                    disabled={requestWithdrawalMutation.isPending || !amount || !selectedAccountId || parseFloat(amount) <= 0 || parseFloat(amount) > (walletBalanceData?.balance ?? 0)}
                                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 transition-all duration-200 disabled:opacity-70"
                                >
                                    {requestWithdrawalMutation.isPending ? (
                                        <> <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Requesting... </>
                                    ) : ( 'Request Withdrawal' )}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}