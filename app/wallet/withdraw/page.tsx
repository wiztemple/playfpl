'use client';

// /app/wallet/withdraw/page.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ChevronLeft, DollarSign, Banknote, ArrowUpRight, Wallet, AlertCircle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import Loading from '@/app/components/shared/Loading';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';

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
      setError('Minimum withdrawal amount is ₦5');
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
        
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-3xl font-bold mb-8 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
        >
          Withdraw Funds
        </motion.h1>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-gray-900 border border-gray-800 overflow-hidden backdrop-blur-sm relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-xl pointer-events-none"></div>
            
            <CardHeader className="relative z-10 border-b border-gray-800">
              <CardTitle className="text-gray-100 flex items-center">
                <ArrowUpRight className="h-5 w-5 mr-2 text-indigo-400" />
                Withdraw from your wallet
              </CardTitle>
              <CardDescription className="text-gray-400">
                Withdraw your winnings to your bank account
              </CardDescription>
            </CardHeader>
            
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6 pt-6 relative z-10">
                <div className="bg-indigo-900/20 border border-indigo-800/30 p-4 rounded-md flex justify-between items-center backdrop-blur-sm">
                  <span className="text-gray-300 flex items-center">
                    <Wallet className="h-4 w-4 mr-2 text-indigo-400" />
                    Available Balance
                  </span>
                  <span className="font-bold text-indigo-300">{formatCurrency(walletBalance)}</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="amount" className="text-gray-300">Amount</Label>
                    <button
                      type="button"
                      onClick={handleWithdrawMax}
                      className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Max
                    </button>
                  </div>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400" />
                    <Input
                      id="amount"
                      type="text"
                      placeholder="0.00"
                      value={amount}
                      onChange={handleAmountChange}
                      className="pl-10 bg-gray-800/50 border-gray-700 text-gray-200 focus:border-indigo-600 focus:ring-indigo-600/20"
                    />
                  </div>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start mt-2 text-sm text-red-400"
                    >
                      <AlertCircle className="h-4 w-4 mr-1.5 mt-0.5 flex-shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label className="text-gray-300">Withdrawal Method</Label>
                  <div className="border border-gray-700 rounded-md p-4 flex items-center justify-between bg-gray-800/50 backdrop-blur-sm">
                    <div className="flex items-center">
                      <Banknote className="h-4 w-4 mr-2 text-indigo-400" />
                      <span className="text-gray-200">Demo Bank Account</span>
                    </div>
                    <span className="text-xs bg-indigo-900/50 text-indigo-300 px-2 py-0.5 rounded border border-indigo-700/50">
                      Demo Mode
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    This is a demo app. No actual withdrawal will be processed.
                  </p>
                </div>
              </CardContent>
              
              <CardFooter className="relative z-10 pt-2 pb-6 border-t border-gray-800">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full"
                >
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-0"
                    disabled={isProcessing || !amount}
                  >
                    {isProcessing ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <ArrowUpRight className="h-4 w-4 mr-2" />
                        Withdraw {amount ? formatCurrency(parseFloat(amount)) : '$0.00'}
                      </div>
                    )}
                  </Button>
                </motion.div>
              </CardFooter>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}