'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  Clock,
  CreditCard,
  Filter,
  Search,
  Trophy,
  Wallet,
  CheckCircle2,
  XCircle,
  Banknote
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Transaction } from '@/app/types';
import { useWalletData } from '@/app/hooks/user';
import Loading from '@/app/components/shared/Loading';

export default function WalletPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Use the wallet data hook
  const {
    data: walletData,
    isLoading: walletLoading,
    error: walletError,
    refetch: refetchWallet
  } = useWalletData();

  // Check if user is authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin?callbackUrl=/wallet');
    }
  }, [status, router]);

  // Check for success or error params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');

    if (success || error) {
      // Remove query params from URL
      window.history.replaceState({}, document.title, '/wallet');

      // Refetch wallet data
      refetchWallet();
    }
  }, [refetchWallet]);

  const handleDeposit = () => {
    router.push('/wallet/deposit');
  };

  const handleWithdraw = () => {
    router.push('/wallet/withdraw');
  };

  // Filter and search transactions
  const filteredTransactions = walletData?.transactions
    ? walletData.transactions
      .filter((transaction: Transaction) =>
        filterType ? transaction.type === filterType : true)
      .filter((transaction: Transaction) =>
        searchTerm
          ? transaction.type.includes(searchTerm.toLowerCase()) ||
          (transaction.externalReference && transaction.externalReference.includes(searchTerm))
          : true)
    : [];

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (status === 'loading' || walletLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <div className="container mx-auto py-12 px-4">
          <Loading />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="container mx-auto py-12 px-4 max-w-5xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <Link href="/profile">
              <Button variant="ghost" className="pl-0 text-gray-400 hover:text-indigo-400 hover:bg-transparent mb-4 md:mb-0">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back to Profile
              </Button>
            </Link>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Wallet
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="backdrop-blur-md bg-gray-900/60 border border-gray-800 shadow-xl relative overflow-hidden md:col-span-2">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-xl pointer-events-none"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="text-gray-100">Balance</CardTitle>
              <CardDescription className="text-gray-400">
                Your current wallet balance
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Available Balance</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                    {walletData ? formatCurrency(walletData.balance) : '₦0.00'}
                  </p>
                </div>
                <div className="flex space-x-3 mt-4 md:mt-0">
                  <Button
                    onClick={handleDeposit}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0 transition-all duration-200"
                  >
                    <ArrowDownLeft className="mr-2 h-4 w-4" />
                    Deposit
                  </Button>
                  <Button
                    onClick={handleWithdraw}
                    variant="outline"
                    className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                  >
                    <ArrowUpRight className="mr-2 h-4 w-4" />
                    Withdraw
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-gray-900/60 border border-gray-800 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-xl pointer-events-none"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="text-gray-100">Quick Actions</CardTitle>
              <CardDescription className="text-gray-400">
                Manage your wallet
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-3">
                <Link href="/wallet/deposit">
                  <Button variant="outline" className="w-full justify-start border-gray-800 bg-gray-800/50 text-gray-200 hover:bg-gray-700 hover:text-white">
                    <ArrowDownLeft className="mr-2 h-4 w-4 text-emerald-400" />
                    Deposit Funds
                  </Button>
                </Link>
                <Link href="/wallet/withdraw">
                  <Button variant="outline" className="w-full justify-start border-gray-800 bg-gray-800/50 text-gray-200 hover:bg-gray-700 hover:text-white">
                    <ArrowUpRight className="mr-2 h-4 w-4 text-amber-400" />
                    Withdraw Funds
                  </Button>
                </Link>
                <Link href="/leagues/weekly">
                  <Button variant="outline" className="w-full justify-start border-gray-800 bg-gray-800/50 text-gray-200 hover:bg-gray-700 hover:text-white">
                    <Trophy className="mr-2 h-4 w-4 text-indigo-400" />
                    Join Leagues
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="backdrop-blur-md bg-gray-900/60 border border-gray-800 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-xl pointer-events-none"></div>
          <CardHeader className="relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <CardTitle className="text-gray-100">Transaction History</CardTitle>
                <CardDescription className="text-gray-400">
                  View all your transactions
                </CardDescription>
              </div>
              <div className="flex space-x-2 mt-4 md:mt-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-800/50 border-gray-700 text-gray-100 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <Button
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {showFilters && (
            <div className="px-6 pb-2 relative z-10">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filterType === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType(null)}
                  className={filterType === null ? "bg-indigo-600 hover:bg-indigo-700" : "border-gray-700 text-gray-300"}
                >
                  All
                </Button>
                <Button
                  variant={filterType === "deposit" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("deposit")}
                  className={filterType === "deposit" ? "bg-emerald-600 hover:bg-emerald-700" : "border-gray-700 text-gray-300"}
                >
                  Deposits
                </Button>
                <Button
                  variant={filterType === "withdrawal" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("withdrawal")}
                  className={filterType === "withdrawal" ? "bg-amber-600 hover:bg-amber-700" : "border-gray-700 text-gray-300"}
                >
                  Withdrawals
                </Button>
                <Button
                  variant={filterType === "entry_fee" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("entry_fee")}
                  className={filterType === "entry_fee" ? "bg-indigo-600 hover:bg-indigo-700" : "border-gray-700 text-gray-300"}
                >
                  League Entries
                </Button>
                <Button
                  variant={filterType === "winnings" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("winnings")}
                  className={filterType === "winnings" ? "bg-purple-600 hover:bg-purple-700" : "border-gray-700 text-gray-300"}
                >
                  Winnings
                </Button>
                <Button
                  variant={filterType === "refund" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("refund")}
                  className={filterType === "refund" ? "bg-blue-600 hover:bg-blue-700" : "border-gray-700 text-gray-300"}
                >
                  Refunds
                </Button>
              </div>
            </div>
          )}

          <CardContent className="relative z-10">
            {paginatedTransactions.length === 0 ? (
              <div className="bg-blue-900/30 border border-blue-800/50 text-blue-300 p-4 rounded-md text-center">
                <p>No transactions found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {paginatedTransactions.map((transaction: Transaction) => (
                  <div
                    key={transaction.id}
                    className="p-4 rounded-lg border border-gray-800 bg-gray-800/50 flex justify-between items-center"
                  >
                    <div className="flex items-center">
                      <div className={`p-2 rounded-full mr-3 ${transaction.type === 'deposit'
                        ? 'bg-emerald-900/30 text-emerald-400'
                        : transaction.type === 'withdrawal'
                          ? 'bg-amber-900/30 text-amber-400'
                          : transaction.type === 'entry_fee'
                            ? 'bg-indigo-900/30 text-indigo-400'
                            : transaction.type === 'winnings'
                              ? 'bg-purple-900/30 text-purple-400'
                              : transaction.type === 'refund'
                                ? 'bg-blue-900/30 text-blue-400'
                                : 'bg-gray-900/30 text-gray-400'
                        }`}>
                        {transaction.type === 'deposit' && <ArrowDownLeft className="h-5 w-5" />}
                        {transaction.type === 'withdrawal' && <ArrowUpRight className="h-5 w-5" />}
                        {transaction.type === 'entry_fee' && <Trophy className="h-5 w-5" />}
                        {transaction.type === 'winnings' && <Banknote className="h-5 w-5" />}
                        {transaction.type === 'refund' && <CreditCard className="h-5 w-5" />}
                        {!['deposit', 'withdrawal', 'entry_fee', 'winnings', 'refund'].includes(transaction.type) && <Wallet className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-200">
                          {transaction.type === 'deposit' && 'Deposit'}
                          {transaction.type === 'withdrawal' && 'Withdrawal'}
                          {transaction.type === 'entry_fee' && 'League Entry'}
                          {transaction.type === 'winnings' && 'League Winnings'}
                          {transaction.type === 'refund' && 'Refund'}
                          {!['deposit', 'withdrawal', 'entry_fee', 'winnings', 'refund'].includes(transaction.type) && 'Transaction'}
                        </p>
                        <p className="text-sm text-gray-400">
                          {formatDate(transaction.createdAt)}
                          {transaction.externalReference && ` • Ref: ${transaction.externalReference.slice(-8)}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${transaction.type === 'deposit' || transaction.type === 'winnings' || transaction.type === 'refund'
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                        }`}>
                        {transaction.type === 'deposit' || transaction.type === 'winnings' || transaction.type === 'refund' ? '+' : '-'}
                        {formatCurrency(Math.abs(transaction.amount))}
                      </p>
                      <p className="text-sm text-gray-400">
                        {transaction.status === 'completed' && (
                          <span className="flex items-center justify-end text-emerald-400">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Completed
                          </span>
                        )}
                        {transaction.status === 'pending' && (
                          <span className="flex items-center justify-end text-amber-400">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </span>
                        )}
                        {transaction.status === 'failed' && (
                          <span className="flex items-center justify-end text-red-400">
                            <XCircle className="h-3 w-3 mr-1" />
                            Failed
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Actions */}
            <div className="mt-8 mb-6">
              <h2 className="text-xl font-semibold text-gray-100 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-4">
                <Link href="/wallet/deposit">
                  <Button
                    variant="outline"
                    className="w-full h-16 flex flex-col items-center justify-center space-y-1 bg-gray-800/50 border-gray-700 hover:bg-gray-700 hover:text-indigo-400 transition-all"
                  >
                    <Banknote className="h-5 w-5 text-indigo-400" />
                    <span>Deposit</span>
                  </Button>
                </Link>
                <Link href="/wallet/withdraw">
                  <Button
                    variant="outline"
                    className="w-full h-16 flex flex-col items-center justify-center space-y-1 bg-gray-800/50 border-gray-700 hover:bg-gray-700 hover:text-indigo-400 transition-all"
                  >
                    <Wallet className="h-5 w-5 text-indigo-400" />
                    <span>Withdraw</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                  >
                    Previous
                  </Button>
                  <div className="flex items-center px-3 py-1 text-sm text-gray-400">
                    Page {currentPage} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}