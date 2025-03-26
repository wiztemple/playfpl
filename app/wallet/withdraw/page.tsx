'use client';

// /app/wallet/withdraw/page.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ChevronLeft, DollarSign, Banknote } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import Loading from '@/app/components/shared/Loading';
import { formatCurrency } from '@/lib/utils';

export default function WithdrawPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin?callbackUrl=/wallet/withdraw');
    }
  }, [status, router]);

  // Fetch wallet balance
  useEffect(() => {
    const fetchWalletBalance = async () => {
      try {
        setLoading(true);
        // In a real app, you would fetch this from the API
        // For now, use mock data
        await new Promise(resolve => setTimeout(resolve, 500));
        setWalletBalance(125.75);
      } catch (error) {
        console.error('Error fetching wallet balance:', error);
        setError('Failed to load wallet data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchWalletBalance();
    }
  }, [status]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate amount
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (numAmount < 5) {
      setError('Minimum withdrawal amount is $5');
      return;
    }
    
    if (numAmount > walletBalance) {
      setError('Withdrawal amount exceeds your available balance');
      return;
    }
    
    try {
      setIsProcessing(true);
      
      // This is a mock implementation
      // In a real app, you would call your payment API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Redirect to wallet with success message
      router.push('/wallet?success=withdraw');
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      setError('Failed to process your withdrawal. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto py-6 max-w-md">
        <Loading />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-md">
      <div className="mb-6">
        <Link href="/wallet">
          <Button variant="ghost" className="pl-0">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Wallet
          </Button>
        </Link>
      </div>
      
      <h1 className="text-2xl font-bold mb-6">Withdraw Funds</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Withdraw from your wallet</CardTitle>
          <CardDescription>
            Withdraw your winnings to your bank account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 p-3 rounded-md flex justify-between items-center">
              <span>Available Balance</span>
              <span className="font-bold">{formatCurrency(walletBalance)}</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="amount">Amount</Label>
                <button
                  type="button"
                  onClick={handleWithdrawMax}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Max
                </button>
              </div>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <Input
                  id="amount"
                  type="text"
                  placeholder="0.00"
                  value={amount}
                  onChange={handleAmountChange}
                  className="pl-9"
                />
              </div>
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Withdrawal Method</Label>
              <div className="border rounded-md p-3 flex items-center justify-between bg-gray-50">
                <div className="flex items-center">
                  <Banknote className="h-4 w-4 mr-2 text-gray-500" />
                  <span>Demo Bank Account</span>
                </div>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Demo Mode</span>
              </div>
              <p className="text-xs text-gray-500">
                This is a demo app. No actual withdrawal will be processed.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isProcessing || !amount}
            >
              {isProcessing ? 'Processing...' : `Withdraw ${amount ? formatCurrency(parseFloat(amount)) : '$0.00'}`}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}