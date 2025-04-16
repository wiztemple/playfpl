// app/wallet/page.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

import {
  ArrowDownLeft, ArrowUpRight, ChevronLeft, CreditCard, Filter, Search, Trophy, Wallet as WalletIcon, Banknote, Loader2, Calendar as CalendarIcon,
  AlertTriangle,
  Trash2,
  BanknoteIcon,
  Plus
} from 'lucide-react'; // Added Loader2
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { formatCurrency, formatDate } from '@/lib/utils'; // Assuming these handle inputs correctly
import { useTransactions, useWalletBalance } from '../hooks/wallet';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { ClientTransaction } from '../types/wallet';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { useAddBankAccount, useDeleteBankAccount, useUserBankAccounts } from '../hooks/banks';


const ITEMS_PER_PAGE = 10; // Number of transactions per page



export default function WalletPage() {
  const { status: authStatus } = useSession();
  const router = useRouter();

  // State for filters, search, and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null); // e.g., 'DEPOSIT', 'ENTRY_FEE'
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  // Add Bank Account Dialog
  const [isAddAccountDialogOpen, setIsAddAccountDialogOpen] = useState(false);
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [newBankName, setNewBankName] = useState('');
  const [newBankCode, setNewBankCode] = useState('');
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);


  // Fetch data using the new hooks
  const { data: walletBalanceData, isLoading: balanceLoading, error: balanceError } = useWalletBalance();
  const { data: transactionData, isLoading: transactionsLoading, error: transactionsError } = useTransactions(
    currentPage,
    ITEMS_PER_PAGE,
    filterType,
    searchTerm // Pass search term directly, debounce is handled in the hook
  );
  const { data: bankAccounts = [], isLoading: bankAccountsLoading, error: bankAccountsError } = useUserBankAccounts();
  const addBankAccountMutation = useAddBankAccount();
  const deleteBankAccountMutation = useDeleteBankAccount();

  // Combined loading/error states
  const isLoading = authStatus === 'loading' || balanceLoading || transactionsLoading;
  const queryError = balanceError || transactionsError;

  // --- Effect for Authentication Redirect ---
  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/api/auth/signin?callbackUrl=/wallet');
    }
  }, [authStatus, router]);


  // --- Handlers ---
  const handleDeposit = () => router.push('/wallet/deposit');
  const handleWithdraw = () => router.push('/wallet/withdraw');

  // Reset page to 1 when filters change
  const handleFilterChange = (newFilter: string | null) => {
    setFilterType(newFilter);
    setCurrentPage(1); // Reset to first page on filter change
  }
  const handleAddAccount = async (e: FormEvent) => {
    e.preventDefault(); // Prevent default form submission
    // Basic Client-Side Validation
    if (!newBankName.trim() || !newAccountNumber.trim() || !newAccountName.trim()) {
      toast.error("Please fill in Bank Name, Account Number, and Account Name.");
      return;
    }
    if (!/^\d{10}$/.test(newAccountNumber)) { // Simple 10-digit check
      toast.error("Account number must be exactly 10 digits.");
      return;
    }

    addBankAccountMutation.mutate({
      accountNumber: newAccountNumber,
      accountName: newAccountName,
      bankName: newBankName,
      bankCode: newBankCode || undefined,
      // isDefault: newIsDefault, // Add if using default checkbox
    }, {
      onSuccess: () => {
        setIsAddAccountDialogOpen(false); // Close dialog on success
        // Reset form fields
        setNewAccountNumber(''); setNewAccountName(''); setNewBankName(''); setNewBankCode(''); // setNewIsDefault(false);
      },
      // onError handled globally by the hook's definition
    });
  };

  // Handle Delete Bank Account
  const handleDeleteAccount = (accountId: string, accountLabel: string) => {
    // Simple browser confirm
    if (window.confirm(`Are you sure you want to delete the account: ${accountLabel}? This cannot be undone.`)) {
      setDeletingAccountId(accountId);
      deleteBankAccountMutation.mutate(accountId, {
        // Reset loading state regardless of outcome
        onSettled: () => setDeletingAccountId(null)
      });
    }
  };

  // --- Memoize data for display ---
  const balance = walletBalanceData?.balance ?? 0;
  const currency = walletBalanceData?.currency ?? 'NGN';
  const transactions = transactionData?.transactions ?? [];
  const totalPages = transactionData?.totalPages ?? 1;


  // --- Loading and Unauthenticated States ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          <p className="text-indigo-200">Loading Wallet...</p>
        </div>
      </div>
    );
  }
  if (authStatus === 'unauthenticated') { return null; } // Redirecting
  if (queryError) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-lg">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Wallet</AlertTitle>
          <AlertDescription>{(queryError as Error)?.message || "Could not load wallet data."}</AlertDescription>
        </Alert>
      </div>
    );
  }


  // --- Render Page ---
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="container mx-auto py-12 px-4 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div> <Link href="/profile"> <Button variant="ghost" className="pl-0 text-gray-400 hover:text-indigo-400 hover:bg-transparent mb-4 md:mb-0"> <ChevronLeft className="mr-1 h-4 w-4" /> Back to Profile </Button> </Link> </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"> Wallet </h1>
        </div>

        {/* Balance and Quick Actions Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Balance Card */}
          <Card className="backdrop-blur-md bg-gray-900/60 border border-gray-800 shadow-xl relative overflow-hidden md:col-span-2">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-xl pointer-events-none"></div>
            <CardHeader className="relative z-10"> <CardTitle className="text-gray-100">Balance</CardTitle> <CardDescription className="text-gray-400"> Your current wallet balance </CardDescription> </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div> <p className="text-sm text-gray-400 mb-1">Available Balance</p> <p className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent"> {formatCurrency(balance)} </p> </div>
                <div className="flex space-x-3 mt-4 md:mt-0"> <Button onClick={handleDeposit} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0 transition-all duration-200"> <ArrowDownLeft className="mr-2 h-4 w-4" /> Deposit </Button> <Button onClick={handleWithdraw} variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"> <ArrowUpRight className="mr-2 h-4 w-4" /> Withdraw </Button> </div>
              </div>
            </CardContent>
          </Card>
          {/* Quick Actions Card */}
          <Card className="backdrop-blur-md bg-gray-900/60 border border-gray-800 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-xl pointer-events-none"></div>
            <CardHeader className="relative z-10"> <CardTitle className="text-gray-100">Quick Actions</CardTitle> <CardDescription className="text-gray-400"> Manage your wallet </CardDescription> </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-3"> <Link href="/wallet/deposit"> <Button variant="outline" className="w-full justify-start border-gray-800 bg-gray-800/50 text-gray-200 hover:bg-gray-700 hover:text-white"> <ArrowDownLeft className="mr-2 h-4 w-4 text-emerald-400" /> Deposit Funds </Button> </Link> <Link href="/wallet/withdraw"> <Button variant="outline" className="w-full justify-start border-gray-800 bg-gray-800/50 text-gray-200 hover:bg-gray-700 hover:text-white"> <ArrowUpRight className="mr-2 h-4 w-4 text-amber-400" /> Withdraw Funds </Button> </Link> <Link href="/leagues/weekly"> <Button variant="outline" className="w-full justify-start border-gray-800 bg-gray-800/50 text-gray-200 hover:bg-gray-700 hover:text-white"> <Trophy className="mr-2 h-4 w-4 text-indigo-400" /> Join Leagues </Button> </Link> </div>
            </CardContent>
          </Card>
        </div>

        <Card className="backdrop-blur-md bg-gray-900/60 border border-gray-800 shadow-xl relative overflow-hidden">
          <CardHeader className="relative z-10 flex flex-row justify-between items-center">
            <div>
              <CardTitle className="text-gray-100">Withdrawal Accounts</CardTitle>
              <CardDescription className="text-gray-400"> Manage bank accounts for withdrawals </CardDescription>
            </div>
            {/* Add Account Button opens Dialog */}
            <Dialog open={isAddAccountDialogOpen} onOpenChange={setIsAddAccountDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white"> <Plus className="h-4 w-4 mr-1" /> Add Account </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[475px] bg-gray-900 border-gray-700 text-gray-100">
                <DialogHeader> <DialogTitle className="text-gray-100">Add New Bank Account</DialogTitle> <DialogDescription className="text-gray-400"> Enter details for withdrawal. Ensure accuracy. </DialogDescription> </DialogHeader>
                {/* Add Account Form */}
                <form onSubmit={handleAddAccount}>
                  <div className="grid gap-4 py-4">
                    {/* TODO: Consider replacing Bank Name Input with a Select dropdown populated from /api/banks */}
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="bankName" className="text-right text-gray-300"> Bank Name </Label>
                      <Input id="bankName" placeholder="E.g., Zenith Bank" value={newBankName} onChange={(e) => setNewBankName(e.target.value)} required className="col-span-3 bg-gray-800 border-gray-600" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="accNum" className="text-right text-gray-300"> Account No. </Label>
                      <Input id="accNum" placeholder="10 digits" value={newAccountNumber} onChange={(e) => setNewAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))} maxLength={10} required className="col-span-3 bg-gray-800 border-gray-600" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="accName" className="text-right text-gray-300"> Account Name </Label>
                      <Input id="accName" placeholder="Account holder name" value={newAccountName} onChange={(e) => setNewAccountName(e.target.value)} required className="col-span-3 bg-gray-800 border-gray-600" />
                    </div>
                    {/* Optional: Add Bank Code Input if needed/useful */}
                    {/* <div className="grid grid-cols-4 items-center gap-4"> <Label htmlFor="bankCode" className="text-right text-gray-300"> Bank Code </Label> <Input id="bankCode" value={newBankCode} onChange={(e) => setNewBankCode(e.target.value)} className="col-span-3 bg-gray-800 border-gray-600" /> </div> */}
                  </div>
                  <DialogFooter>
                    {/* Close button implicitly handled by Dialog/X, but explicit cancel is good */}
                    <Button type="button" variant="ghost" onClick={() => setIsAddAccountDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={addBankAccountMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                      {addBankAccountMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                      Save Account
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="relative z-10">
            {/* Display Loading/Error/Empty States for Bank Accounts */}
            {bankAccountsLoading && (<div className="text-center text-gray-500 py-4"><Loader2 className="h-4 w-4 animate-spin inline mr-1" /> Loading accounts...</div>)}
            {bankAccountsError && (<div className="text-center text-red-400 py-4">Error loading accounts: {(bankAccountsError as Error).message}</div>)}
            {!bankAccountsLoading && bankAccounts.length === 0 && (
              <div className="bg-gray-800/30 border border-gray-700/50 text-gray-400 p-4 rounded-md text-center text-sm">
                You haven't added any bank accounts for withdrawal yet. Click 'Add Account' above.
              </div>
            )}
            {/* List Saved Bank Accounts */}
            {bankAccounts.length > 0 && (
              <div className="space-y-3">
                {bankAccounts.map((account) => (
                  <div key={account.id} className="p-3 rounded-lg border border-gray-700 bg-gray-800/50 flex justify-between items-center flex-wrap gap-2">
                    <div className="flex items-center space-x-3">
                      <BanknoteIcon className="h-5 w-5 text-indigo-400 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-100 text-sm">{account.bankName}</p>
                        <p className="text-xs text-gray-400">
                          {account.accountName} - ****{account.accountNumber.slice(-4)} {/* Mask number */}
                        </p>
                      </div>
                      {/* Optional: Show Default Badge */}
                      {/* {account.isDefault && <Badge variant="secondary" size="sm">Default</Badge>} */}
                    </div>
                    {/* Delete Button */}
                    <Button
                      variant="ghost" // Use ghost for less emphasis
                      size="sm"
                      onClick={() => handleDeleteAccount(account.id, `${account.bankName} - ****${account.accountNumber.slice(-4)}`)}
                      disabled={deletingAccountId === account.id || deleteBankAccountMutation.isPending}
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20 px-2 py-1 h-auto"
                      aria-label={`Delete account ${account.accountNumber.slice(-4)}`}
                    >
                      {deletingAccountId === account.id && deleteBankAccountMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      <span className="ml-1 hidden sm:inline">Delete</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction History Card */}
        <Card className="backdrop-blur-md bg-gray-900/60 border border-gray-800 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-xl pointer-events-none"></div>
          <CardHeader className="relative z-10">
            {/* Search and Filter Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div> <CardTitle className="text-gray-100">Transaction History</CardTitle> <CardDescription className="text-gray-400"> View all your transactions </CardDescription> </div>
              <div className="flex space-x-2 mt-4 md:mt-0">
                <div className="relative"> <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" /> <Input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); /* Reset page on search */ }} className="pl-10 bg-gray-800/50 border-gray-700 text-gray-100 focus:ring-indigo-500 focus:border-indigo-500 w-40 md:w-auto" /> </div>
                <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white" onClick={() => setShowFilters(!showFilters)}> <Filter className="h-4 w-4" /> </Button>
              </div>
            </div>
          </CardHeader>

          {/* Filter Buttons (Conditionally Shown) */}
          {showFilters && (
            <div className="px-6 pb-4 relative z-10 border-b border-gray-800"> {/* Added border-b */}
              <div className="flex flex-wrap gap-2">
                <Button variant={filterType === null ? "default" : "outline"} size="sm" onClick={() => handleFilterChange(null)} className={filterType === null ? "bg-indigo-600 hover:bg-indigo-700" : "border-gray-700 text-gray-300"}> All </Button>
                {/* Provide Enum values or exact strings used in DB */}
                <Button variant={filterType === "DEPOSIT" ? "default" : "outline"} size="sm" onClick={() => handleFilterChange("DEPOSIT")} className={filterType === "DEPOSIT" ? "bg-emerald-600 hover:bg-emerald-700" : "border-gray-700 text-gray-300"}> Deposits </Button>
                <Button variant={filterType === "WITHDRAWAL" ? "default" : "outline"} size="sm" onClick={() => handleFilterChange("WITHDRAWAL")} className={filterType === "WITHDRAWAL" ? "bg-amber-600 hover:bg-amber-700" : "border-gray-700 text-gray-300"}> Withdrawals </Button>
                <Button variant={filterType === "ENTRY_FEE" ? "default" : "outline"} size="sm" onClick={() => handleFilterChange("ENTRY_FEE")} className={filterType === "ENTRY_FEE" ? "bg-indigo-600 hover:bg-indigo-700" : "border-gray-700 text-gray-300"}> Entries </Button>
                <Button variant={filterType === "WINNINGS_PAYOUT" ? "default" : "outline"} size="sm" onClick={() => handleFilterChange("WINNINGS_PAYOUT")} className={filterType === "WINNINGS_PAYOUT" ? "bg-purple-600 hover:bg-purple-700" : "border-gray-700 text-gray-300"}> Winnings </Button>
                <Button variant={filterType === "REFUND" ? "default" : "outline"} size="sm" onClick={() => handleFilterChange("REFUND")} className={filterType === "REFUND" ? "bg-blue-600 hover:bg-blue-700" : "border-gray-700 text-gray-300"}> Refunds </Button>
              </div>
            </div>
          )}

          {/* Transaction List */}
          <CardContent className="relative z-10 pt-4"> {/* Added pt-4 */}
            {/* Loading indicator specifically for transactions */}
            {transactionsLoading && !transactionData && ( // Show only if loading initial data
              <div className='flex justify-center items-center py-10'> <Loader2 className="h-6 w-6 animate-spin text-indigo-300" /> </div>
            )}
            {/* No transactions message */}
            {!transactionsLoading && transactions.length === 0 && (
              <div className="bg-gray-800/30 border border-gray-700/50 text-gray-400 p-4 rounded-md text-center">
                <p>{filterType || searchTerm ? 'No transactions found matching your criteria.' : 'No transactions yet.'}</p>
              </div>
            )}
            {/* Transaction items */}
            {transactions.length > 0 && (
              <div className="space-y-3">
                {transactions.map((transaction: ClientTransaction) => ( // Use ClientTransaction type
                  <div key={transaction.id} className="p-4 rounded-lg border border-gray-800 bg-gray-800/50 flex justify-between items-center flex-wrap gap-2"> {/* Added flex-wrap */}
                    {/* Left side: Icon and Details */}
                    <div className="flex items-center">
                      {/* Icon based on type */}
                      <div className={`p-2 rounded-full mr-3 self-start ${/* Color classes */
                        transaction.type === 'DEPOSIT' ? 'bg-emerald-900/30 text-emerald-400' :
                          transaction.type === 'WITHDRAWAL' ? 'bg-amber-900/30 text-amber-400' :
                            transaction.type === 'ENTRY_FEE' ? 'bg-indigo-900/30 text-indigo-400' :
                              transaction.type === 'WINNINGS_PAYOUT' ? 'bg-purple-900/30 text-purple-400' :
                                transaction.type === 'REFUND' ? 'bg-blue-900/30 text-blue-400' :
                                  'bg-gray-700/30 text-gray-400' // Default for adjustments etc
                        }`}>
                        {/* Select icon based on type */}
                        {transaction.type === 'DEPOSIT' && <ArrowDownLeft className="h-5 w-5" />}
                        {transaction.type === 'WITHDRAWAL' && <ArrowUpRight className="h-5 w-5" />}
                        {transaction.type === 'ENTRY_FEE' && <Trophy className="h-5 w-5" />}
                        {transaction.type === 'WINNINGS_PAYOUT' && <Banknote className="h-5 w-5" />}
                        {transaction.type === 'REFUND' && <CreditCard className="h-5 w-5" />}
                        {!['DEPOSIT', 'WITHDRAWAL', 'ENTRY_FEE', 'WINNINGS_PAYOUT', 'REFUND'].includes(transaction.type) && <WalletIcon className="h-5 w-5" />}
                      </div>
                      {/* Text Details */}
                      <div>
                        <p className="font-medium text-gray-200 capitalize">
                          {/* Format type string for display */}
                          {transaction.type.replace(/_/g, ' ').toLowerCase()}
                        </p>
                        <p className="text-sm text-gray-400">
                          {/* Format date string from API */}
                          {formatDate(transaction.createdAt)}
                        </p>
                        {/* Optional: Show description or reference */}
                        {transaction.description && <p className="text-xs text-gray-500 pt-1">{transaction.description}</p>}
                        {!transaction.description && transaction.externalReference && <p className="text-xs text-gray-500 pt-1">Ref: {transaction.externalReference}</p>}
                      </div>
                    </div>
                    {/* Right side: Amount and Status */}
                    <div className="text-right">
                      <p className={`font-medium text-lg ${ // Larger amount text
                        ['DEPOSIT', 'WINNINGS_PAYOUT', 'REFUND', 'ADJUSTMENT_CREDIT'].includes(transaction.type)
                          ? 'text-emerald-400' // Green for credits
                          : 'text-red-400' // Red for debits
                        }`}>
                        {/* Show + or - sign */}
                        {['DEPOSIT', 'WINNINGS_PAYOUT', 'REFUND', 'ADJUSTMENT_CREDIT'].includes(transaction.type) ? '+' : '-'}
                        {/* Format amount string from API */}
                        {formatCurrency(Math.abs(Number(transaction.amount)))}
                      </p>
                      {/* Format status string */}
                      <p className={`text-xs capitalize mt-1 ${transaction.status === 'COMPLETED' ? 'text-emerald-400' :
                        transaction.status === 'PENDING' ? 'text-amber-400' :
                          transaction.status === 'REQUIRES_APPROVAL' ? 'text-blue-400' :
                            transaction.status === 'PROCESSING' ? 'text-purple-400' :
                              transaction.status === 'FAILED' ? 'text-red-400' :
                                transaction.status === 'CANCELLED' ? 'text-gray-500' :
                                  'text-gray-400'
                        }`}>
                        {/* Optionally show icons for status */}
                        {transaction.status.replace(/_/g, ' ').toLowerCase()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {/* Use totalPages from transactionData */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-6 pt-4 border-t border-gray-800">
                <div className="flex space-x-2">
                  {/* Previous Button */}
                  <Button
                    variant="outline" size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1 || transactionsLoading} // Disable while loading too
                    className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white disabled:opacity-50" > Previous
                  </Button>
                  {/* Page Indicator */}
                  <div className="flex items-center px-3 py-1 text-sm text-gray-400">
                    {/* Show page from state, total from API data */}
                    Page {currentPage} of {totalPages}
                  </div>
                  {/* Next Button */}
                  <Button
                    variant="outline" size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || transactionsLoading} // Disable while loading
                    className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white disabled:opacity-50" > Next
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