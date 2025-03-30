'use client';

// /app/wallet/withdraw/page.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ChevronLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';
import Loading from '@/app/components/shared/Loading';
import { useWalletData } from '@/app/hooks/user';
import { useBanks, useVerifyAccount, useWithdraw } from '@/app/hooks/banks';

export default function WithdrawPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Use the wallet data hook
  const { data: walletData, isLoading: walletLoading } = useWalletData();
  const walletBalance = walletData?.balance || 0;

  // Use our custom hooks
  const { data: banks = [], isLoading: banksLoading } = useBanks();
  const verifyAccountMutation = useVerifyAccount();
  const withdrawMutation = useWithdraw();

  // Check if user is authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin?callbackUrl=/wallet/withdraw');
    }
  }, [status, router]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove non-numeric characters except decimal point
    const value = e.target.value.replace(/[^0-9.]/g, '');

    // Ensure only one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
      return;
    }

    // Limit to 2 decimal places
    if (parts.length === 2 && parts[1].length > 2) {
      return;
    }

    setAmount(value);
    setError(null);
  };

  const handleWithdrawMax = () => {
    setAmount(walletBalance.toString());
    setError(null);
  };

  const verifyAccount = async () => {
    if (!accountNumber || !bankCode) {
      setError('Please enter account number and select a bank');
      return;
    }

    try {
      const data = await verifyAccountMutation.mutateAsync({
        account_number: accountNumber,
        bank_code: bankCode,
      });
      setAccountName(data.account_name);
      setError(null);
    } catch (error: any) {
      setError(error.message || 'Failed to verify account. Please check your details.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate amount
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (numAmount < 5) {
      setError('Minimum withdrawal amount is ₦5');
      return;
    }

    if (numAmount > walletBalance) {
      setError('Withdrawal amount exceeds your available balance');
      return;
    }

    if (!accountNumber || !bankCode || !accountName) {
      setError('Please verify your bank account details');
      return;
    }

    try {
      await withdrawMutation.mutateAsync({
        amount: numAmount,
        account_number: accountNumber,
        bank_code: bankCode,
        account_name: accountName,
        bank_name: banks.find(bank => bank.code === bankCode)?.name || '',
      });

      // Redirect to wallet with success message
      router.push('/wallet?success=withdraw');
    } catch (error: any) {
      setError(error.message || 'Failed to process your withdrawal. Please try again.');
    }
  };

  if (status === 'loading' || walletLoading || banksLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <div className="container mx-auto py-12 px-4 max-w-md">
          <Loading />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="container mx-auto py-12 px-4 max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <Link href="/wallet">
            <Button variant="ghost" className="pl-0 text-gray-400 hover:text-indigo-400 hover:bg-transparent">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to Wallet
            </Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="backdrop-blur-md bg-gray-900/60 border border-gray-800 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-xl pointer-events-none"></div>

            <CardHeader className="relative z-10">
              <CardTitle className="text-xl bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Withdraw Funds
              </CardTitle>
              <CardDescription className="text-gray-400">
                Withdraw funds from your wallet to your bank account
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 relative z-10">
              {error && (
                <div className="p-4 bg-red-900/30 border border-red-800/50 text-red-300 rounded-md text-sm flex items-start">
                  <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-red-400" />
                  <p>{error}</p>
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="amount" className="text-gray-300">Amount</Label>
                  <p className="text-sm text-gray-400">
                    Available: <span className="text-indigo-400">{formatCurrency(walletBalance)}</span>
                  </p>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400">₦</span>
                  </div>
                  <Input
                    id="amount"
                    type="text"
                    value={amount}
                    onChange={handleAmountChange}
                    className="pl-8 bg-gray-800/50 border-gray-700 text-gray-100 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="0.00"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleWithdrawMax}
                    className="absolute inset-y-0 right-0 px-3 text-xs text-indigo-400 hover:text-indigo-300"
                  >
                    MAX
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="bank" className="text-gray-300 mb-2 block">Bank</Label>
                <select
                  id="bank"
                  value={bankCode}
                  onChange={(e) => {
                    setBankCode(e.target.value);
                    setBankName(banks.find(bank => bank.code === e.target.value)?.name || '');
                    setAccountName(''); // Reset account name when bank changes
                  }}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-md py-2 px-3 text-gray-100 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select a bank</option>
                  {banks && banks.length > 0 ? (
                    banks.map((bank, index) => (
                      <option key={`${bank.code}-${index}`} value={bank.code}>
                        {bank.name}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>Loading banks...</option>
                  )}
                </select>
              </div>

              <div>
                <Label htmlFor="accountNumber" className="text-gray-300 mb-2 block">Account Number</Label>
                <div className="flex space-x-2">
                  <Input
                    id="accountNumber"
                    type="text"
                    value={accountNumber}
                    onChange={(e) => {
                      setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10));
                      setAccountName('');
                    }}
                    className="bg-gray-800/50 border-gray-700 text-gray-100 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter 10-digit account number"
                    maxLength={10}
                  />
                  <Button
                    type="button"
                    onClick={verifyAccount}
                    disabled={verifyAccountMutation.isPending || !accountNumber || !bankCode}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {verifyAccountMutation.isPending ? 'Verifying...' : 'Verify'}
                  </Button>
                </div>
              </div>

              {accountName && (
                <div className="p-3 bg-green-900/30 border border-green-800/50 text-green-300 rounded-md">
                  <p className="font-medium">Account Name: {accountName}</p>
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={withdrawMutation.isPending || !amount || !accountName}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 transition-all duration-200"
              >
                {withdrawMutation.isPending ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </div>
                ) : (
                  'Withdraw Funds'
                )}
              </Button>
            </CardContent>

            <CardFooter className="relative z-10 text-xs text-gray-500 text-center">
              <p>Withdrawals are typically processed within 24 hours. A small processing fee may apply.</p>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}