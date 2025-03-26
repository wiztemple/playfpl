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
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import Loading from '@/app/components/shared/Loading';
import { formatCurrency } from '@/lib/utils';

export default function WalletPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [walletData, setWalletData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin?callbackUrl=/wallet');
    }
  }, [status, router]);

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
      <div className="container mx-auto py-6 max-w-4xl">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <div className="p-4 text-red-500 text-center">
          <p>{error}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => router.push('/')}
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  if (!walletData) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <div className="p-4 text-center">
          <p>Wallet data not available.</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => router.push('/')}
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Wallet</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Balance</CardTitle>
            <CardDescription>Your current available balance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-500 mr-2" />
              <span className="text-3xl font-bold">{formatCurrency(walletData.balance)}</span>
            </div>
          </CardContent>
          <CardFooter className="flex gap-4">
            <Button onClick={handleDeposit} className="flex-1">
              <Plus className="mr-2 h-4 w-4" />
              Deposit
            </Button>
            <Button onClick={handleWithdraw} variant="outline" className="flex-1">
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Withdraw
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Total Winnings</p>
              <p className="text-xl font-medium text-green-600">
                {formatCurrency(walletData.transactions
                  .filter((t: any) => t.type === 'winnings' && t.status === 'completed')
                  .reduce((sum: number, t: any) => sum + t.amount, 0)
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Spent</p>
              <p className="text-xl font-medium">
                {formatCurrency(Math.abs(walletData.transactions
                  .filter((t: any) => t.type === 'entry_fee' && t.status === 'completed')
                  .reduce((sum: number, t: any) => sum + t.amount, 0)
                ))}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Withdrawals</p>
              <p className="text-xl font-medium">
                {formatCurrency(Math.abs(walletData.transactions
                  .filter((t: any) => t.type === 'withdrawal' && t.status === 'pending')
                  .reduce((sum: number, t: any) => sum + t.amount, 0)
                ))}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="all">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Transactions</TabsTrigger>
          <TabsTrigger value="deposits">Deposits & Withdrawals</TabsTrigger>
          <TabsTrigger value="leagues">League Entries & Winnings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <TransactionsList 
            transactions={walletData.transactions}
            filter="all"
          />
        </TabsContent>
        
        <TabsContent value="deposits">
          <TransactionsList 
            transactions={walletData.transactions.filter((t: any) => 
              t.type === 'deposit' || t.type === 'withdrawal'
            )}
            filter="deposits"
          />
        </TabsContent>
        
        <TabsContent value="leagues">
          <TransactionsList 
            transactions={walletData.transactions.filter((t: any) => 
              t.type === 'entry_fee' || t.type === 'winnings' || t.type === 'refund'
            )}
            filter="leagues"
          />
        </TabsContent>
      </Tabs>
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
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          <p>No transactions found</p>
        </CardContent>
      </Card>
    );
  }

  // Sort transactions by date (newest first)
  const sortedTransactions = [...transactions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedTransactions.map((transaction) => (
                <tr key={transaction.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    {new Date(transaction.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      {transaction.type === 'deposit' && <ArrowDownLeft className="h-4 w-4 text-green-500 mr-2" />}
                      {transaction.type === 'withdrawal' && <ArrowUpRight className="h-4 w-4 text-orange-500 mr-2" />}
                      {transaction.type === 'entry_fee' && <ArrowUpRight className="h-4 w-4 text-blue-500 mr-2" />}
                      {transaction.type === 'winnings' && <ArrowDownLeft className="h-4 w-4 text-green-500 mr-2" />}
                      {transaction.type === 'refund' && <ArrowDownLeft className="h-4 w-4 text-purple-500 mr-2" />}
                      {transaction.description}
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${
                    transaction.amount > 0 ? 'text-green-600' : 'text-gray-900'
                  }`}>
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      {transaction.status === 'completed' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Completed
                        </span>
                      )}
                      {transaction.status === 'pending' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </span>
                      )}
                      {transaction.status === 'failed' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
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
      </CardContent>
    </Card>
  );
}