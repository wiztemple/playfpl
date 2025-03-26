'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  DollarSign,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Wallet,
  BarChart3,
  History,
  CreditCard,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import Loading from '@/app/components/shared/Loading';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function WalletPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [walletData, setWalletData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Check if user is authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin?callbackUrl=/wallet');
    }
  }, [status, router]);

  // Check URL for success parameter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('success') === 'deposit') {
        setShowSuccess(true);
        setSuccessMessage('Funds have been added to your wallet successfully!');
        // Clear the success parameter after a delay
        setTimeout(() => {
          router.replace('/wallet');
        }, 5000);
      } else if (urlParams.get('success') === 'withdraw') {
        setShowSuccess(true);
        setSuccessMessage('Withdrawal request has been submitted successfully!');
        // Clear the success parameter after a delay
        setTimeout(() => {
          router.replace('/wallet');
        }, 5000);
      }
    }
  }, [router]);

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        setLoading(true);
        // In a real app, you would fetch this from the API
        // For now, use mock data
        const mockWalletData = {
          balance: 125.75,
          currency: 'USD',
          transactions: [
            {
              id: '1',
              type: 'deposit',
              amount: 100.00,
              status: 'completed',
              date: '2025-03-15T14:32:21Z',
              description: 'Initial deposit'
            },
            {
              id: '2',
              type: 'entry_fee',
              amount: -10.00,
              status: 'completed',
              date: '2025-03-16T09:15:44Z',
              description: 'Entry fee for Gameweek 29 Cash League'
            },
            {
              id: '3',
              type: 'winnings',
              amount: 45.00,
              status: 'completed',
              date: '2025-03-18T18:02:11Z',
              description: 'Winnings from Gameweek 29 Cash League'
            },
            {
              id: '4',
              type: 'withdrawal',
              amount: -50.00,
              status: 'pending',
              date: '2025-03-20T11:44:32Z',
              description: 'Withdrawal to bank account'
            },
            {
              id: '5',
              type: 'entry_fee',
              amount: -25.00,
              status: 'completed',
              date: '2025-03-22T10:21:05Z',
              description: 'Entry fee for Gameweek 30 Premium League'
            },
            {
              id: '6',
              type: 'refund',
              amount: 25.00,
              status: 'completed',
              date: '2025-03-22T16:33:18Z',
              description: 'Refund for Gameweek 30 Premium League (Cancelled)'
            },
            {
              id: '7',
              type: 'withdrawal',
              amount: -20.00,
              status: 'failed',
              date: '2025-03-23T14:12:53Z',
              description: 'Withdrawal to bank account'
            },
            {
              id: '8',
              type: 'entry_fee',
              amount: -15.00,
              status: 'completed',
              date: '2025-03-24T09:45:11Z',
              description: 'Entry fee for Gameweek 30 Cash League'
            }
          ]
        };
        
        setWalletData(mockWalletData);
      } catch (error) {
        console.error('Error fetching wallet data:', error);
        setError('Failed to load wallet data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchWalletData();
    }
  }, [status]);

  const handleDeposit = () => {
    router.push('/wallet/deposit');
  };

  const handleWithdraw = () => {
    router.push('/wallet/withdraw');
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <div className="container mx-auto py-12 px-4 max-w-4xl">
          <Loading />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <div className="container mx-auto py-12 px-4 max-w-4xl">
          <div className="p-6 bg-gray-900 border border-red-800/50 rounded-lg text-red-400 text-center backdrop-blur-sm">
            <p>{error}</p>
            <Button 
              variant="outline" 
              className="mt-4 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-indigo-400 bg-transparent"
              onClick={() => router.push('/')}
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!walletData) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <div className="container mx-auto py-12 px-4 max-w-4xl">
          <div className="p-6 bg-gray-900 border border-gray-800 rounded-lg text-gray-400 text-center backdrop-blur-sm">
            <p>Wallet data not available.</p>
            <Button 
              variant="outline" 
              className="mt-4 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-indigo-400 bg-transparent"
              onClick={() => router.push('/')}
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="container mx-auto py-12 px-4 max-w-4xl">
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-8 p-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-800/50 rounded-lg backdrop-blur-sm"
          >
            <div className="flex items-start">
              <CheckCircle2 className="h-5 w-5 text-green-400 mr-3 mt-0.5" />
              <div>
                <p className="font-medium text-green-400">Success!</p>
                <p className="text-green-300/80">{successMessage}</p>
              </div>
            </div>
          </motion.div>
        )}
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex justify-between items-center mb-8"
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Wallet
          </h1>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <Card className="md:col-span-2 bg-gray-900 border border-gray-800 overflow-hidden backdrop-blur-sm relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-xl pointer-events-none"></div>
            
            <CardHeader className="relative z-10 border-b border-gray-800">
              <CardTitle className="text-gray-100 flex items-center">
                <Wallet className="h-5 w-5 mr-2 text-indigo-400" />
                Balance
              </CardTitle>
              <CardDescription className="text-gray-400">
                Your current available balance
              </CardDescription>
            </CardHeader>
            
            <CardContent className="relative z-10 pt-6">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center mr-4">
                  <DollarSign className="h-6 w-6 text-green-400" />
                </div>
                <span className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  {formatCurrency(walletData.balance)}
                </span>
              </div>
            </CardContent>
            
            <CardFooter className="flex gap-4 relative z-10 pt-2 pb-6 border-t border-gray-800">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex-1">
                <Button 
                  onClick={handleDeposit} 
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-0"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Deposit
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex-1">
                <Button 
                  onClick={handleWithdraw} 
                  variant="outline" 
                  className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-indigo-400 bg-transparent"
                >
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  Withdraw
                </Button>
              </motion.div>
            </CardFooter>
          </Card>
          
          <Card className="bg-gray-900 border border-gray-800 overflow-hidden backdrop-blur-sm relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-xl pointer-events-none"></div>
            
            <CardHeader className="relative z-10 border-b border-gray-800">
              <CardTitle className="text-gray-100 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-indigo-400" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-5 relative z-10 pt-6">
              <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                <p className="text-sm text-gray-400 mb-1 flex items-center">
                  <TrendingUp className="h-3.5 w-3.5 mr-1.5 text-green-400" />
                  Total Winnings
                </p>
                <p className="text-xl font-medium text-green-400">
                  {formatCurrency(walletData.transactions
                    .filter((t: any) => t.type === 'winnings' && t.status === 'completed')
                    .reduce((sum: number, t: any) => sum + t.amount, 0)
                  )}
                </p>
              </div>
              
              <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                <p className="text-sm text-gray-400 mb-1 flex items-center">
                  <CreditCard className="h-3.5 w-3.5 mr-1.5 text-indigo-400" />
                  Total Spent
                </p>
                <p className="text-xl font-medium text-gray-200">
                  {formatCurrency(Math.abs(walletData.transactions
                    .filter((t: any) => t.type === 'entry_fee' && t.status === 'completed')
                    .reduce((sum: number, t: any) => sum + t.amount, 0)
                  ))}
                </p>
              </div>
              
              <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                <p className="text-sm text-gray-400 mb-1 flex items-center">
                  <Clock className="h-3.5 w-3.5 mr-1.5 text-yellow-400" />
                  Pending Withdrawals
                </p>
                <p className="text-xl font-medium text-yellow-300">
                  {formatCurrency(Math.abs(walletData.transactions
                    .filter((t: any) => t.type === 'withdrawal' && t.status === 'pending')
                    .reduce((sum: number, t: any) => sum + t.amount, 0)
                  ))}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden backdrop-blur-sm relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-xl pointer-events-none"></div>
            
            <div className="relative z-10 p-6">
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="mb-6 bg-gray-800/50 border border-gray-700">
                  <TabsTrigger 
                    value="all" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=inactive]:text-gray-400 data-[state=inactive]:hover:text-gray-200"
                  >
                    <History className="h-4 w-4 mr-2" />
                    All Transactions
                  </TabsTrigger>
                  <TabsTrigger 
                    value="deposits" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=inactive]:text-gray-400 data-[state=inactive]:hover:text-gray-200"
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    Deposits & Withdrawals
                  </TabsTrigger>
                  <TabsTrigger 
                    value="leagues" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=inactive]:text-gray-400 data-[state=inactive]:hover:text-gray-200"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    League Entries & Winnings
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="mt-0">
                  <TransactionsList 
                    transactions={walletData.transactions}
                    filter="all"
                  />
                </TabsContent>
                
                <TabsContent value="deposits" className="mt-0">
                  <TransactionsList 
                    transactions={walletData.transactions.filter((t: any) => 
                      t.type === 'deposit' || t.type === 'withdrawal'
                    )}
                    filter="deposits"
                  />
                </TabsContent>
                
                <TabsContent value="leagues" className="mt-0">
                  <TransactionsList 
                    transactions={walletData.transactions.filter((t: any) => 
                      t.type === 'entry_fee' || t.type === 'winnings' || t.type === 'refund'
                    )}
                    filter="leagues"
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

interface TransactionsListProps {
  transactions: any[];
  filter: 'all' | 'deposits' | 'leagues';
}

function TransactionsList({ transactions, filter }: TransactionsListProps) {
  if (transactions.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 bg-gray-800/30 rounded-lg border border-gray-700">
        <p>No transactions found</p>
      </div>
    );
  }

  // Sort transactions by date (newest first)
  const sortedTransactions = [...transactions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="bg-gray-800/30 rounded-lg border border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="px-4 py-3 text-left text-gray-400 font-medium">Date</th>
              <th className="px-4 py-3 text-left text-gray-400 font-medium">Description</th>
              <th className="px-4 py-3 text-right text-gray-400 font-medium">Amount</th>
              <th className="px-4 py-3 text-left text-gray-400 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {sortedTransactions.map((transaction) => (
              <tr key={transaction.id} className="border-b border-gray-700/50 hover:bg-gray-800/50 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-400">
                  {new Date(transaction.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </td>
                <td className="px-4 py-3 text-gray-300">
                  <div className="flex items-center">
                    {transaction.type === 'deposit' && (
                      <div className="h-6 w-6 rounded-full bg-green-900/30 flex items-center justify-center mr-2">
                        <ArrowDownLeft className="h-3.5 w-3.5 text-green-400" />
                      </div>
                    )}
                    {transaction.type === 'withdrawal' && (
                      <div className="h-6 w-6 rounded-full bg-orange-900/30 flex items-center justify-center mr-2">
                        <ArrowUpRight className="h-3.5 w-3.5 text-orange-400" />
                      </div>
                    )}
                    {transaction.type === 'entry_fee' && (
                      <div className="h-6 w-6 rounded-full bg-blue-900/30 flex items-center justify-center mr-2">
                        <ArrowUpRight className="h-3.5 w-3.5 text-blue-400" />
                      </div>
                    )}
                    {transaction.type === 'winnings' && (
                      <div className="h-6 w-6 rounded-full bg-green-900/30 flex items-center justify-center mr-2">
                        <ArrowDownLeft className="h-3.5 w-3.5 text-green-400" />
                      </div>
                    )}
                    {transaction.type === 'refund' && (
                      <div className="h-6 w-6 rounded-full bg-purple-900/30 flex items-center justify-center mr-2">
                        <ArrowDownLeft className="h-3.5 w-3.5 text-purple-400" />
                      </div>
                    )}
                    {transaction.description}
                  </div>
                </td>
                <td className={`px-4 py-3 text-right font-medium ${
                  transaction.amount > 0 ? 'text-green-400' : 'text-gray-300'
                }`}>
                  {formatCurrency(transaction.amount)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    {transaction.status === 'completed' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-400 border border-green-800/50">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Completed
                      </span>
                    )}
                    {transaction.status === 'pending' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-900/30 text-yellow-400 border border-yellow-800/50">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </span>
                    )}
                    {transaction.status === 'failed' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/30 text-red-400 border border-red-800/50">
                        <XCircle className="h-3 w-3 mr-1" />
                        Failed
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}