import Link from 'next/link';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import {
    ArrowDownLeft,
    ArrowUpRight,
    Trophy,
    DollarSign,
    CreditCard,
    CheckCircle2,
    Clock,
    XCircle
} from 'lucide-react';

interface Transaction {
    id: string;
    type: string;
    amount: number;
    status: string;
    createdAt: string;
    description?: string;
}

interface TransactionsCardProps {
    walletData: any;
    recentTransactions: Transaction[];
    formatCurrency: (amount: number) => string;
    formatDate: (date: string) => string;
}

export const TransactionsCard = ({
    walletData,
    recentTransactions,
    formatCurrency,
    formatDate
}: TransactionsCardProps) => (
    <Card className="backdrop-blur-md bg-gray-900/60 border border-gray-800 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-xl pointer-events-none"></div>
        <CardHeader className="relative z-10 flex flex-row items-center justify-between">
            <div>
                <CardTitle className="text-gray-100">Wallet Balance</CardTitle>
                <CardDescription className="text-gray-400">
                    Your current balance and transaction history
                </CardDescription>
            </div>
            <div className="text-right">
                <p className="text-sm text-gray-400">Available Balance</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                    {walletData ? formatCurrency(walletData.balance) : '₦0.00'}
                </p>
            </div>
        </CardHeader>
        <CardContent className="relative z-10">
            <div className="flex justify-between mb-6">
                <Link href="/wallet/deposit">
                    <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0 transition-all duration-200">
                        <ArrowDownLeft className="mr-2 h-4 w-4" />
                        Deposit
                    </Button>
                </Link>
                <Link href="/wallet/withdraw">
                    <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white">
                        <ArrowUpRight className="mr-2 h-4 w-4" />
                        Withdraw
                    </Button>
                </Link>
            </div>

            <div>
                <h3 className="font-medium text-gray-300 mb-3">Recent Transactions</h3>
                {recentTransactions.length === 0 ? (
                    <div className="bg-blue-900/30 border border-blue-800/50 text-blue-300 p-4 rounded-md text-center">
                        <p>No transactions yet</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {recentTransactions.map((transaction) => (
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
                                                        : 'bg-gray-900/30 text-gray-400'
                                        }`}>
                                        {transaction.type === 'deposit' && <ArrowDownLeft className="h-5 w-5" />}
                                        {transaction.type === 'withdrawal' && <ArrowUpRight className="h-5 w-5" />}
                                        {transaction.type === 'entry_fee' && <Trophy className="h-5 w-5" />}
                                        {transaction.type === 'winnings' && <DollarSign className="h-5 w-5" />}
                                        {!['deposit', 'withdrawal', 'entry_fee', 'winnings'].includes(transaction.type) && <CreditCard className="h-5 w-5" />}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-200">
                                            {transaction.type === 'deposit' && 'Deposit'}
                                            {transaction.type === 'withdrawal' && 'Withdrawal'}
                                            {transaction.type === 'entry_fee' && 'League Entry'}
                                            {transaction.type === 'winnings' && 'League Winnings'}
                                            {!['deposit', 'withdrawal', 'entry_fee', 'winnings'].includes(transaction.type) && 'Transaction'}
                                        </p>
                                        <p className="text-sm text-gray-400">
                                            {formatDate(transaction.createdAt)}
                                            {transaction.type === 'entry_fee' && ' • League Entry Fee'}
                                            {transaction.type === 'winnings' && ' • League Prize'}
                                            {transaction.type === 'deposit' && ' • Wallet Deposit'}
                                            {transaction.type === 'withdrawal' && ' • Wallet Withdrawal'}
                                            {transaction.type === 'refund' && ' • Refund'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`font-medium ${transaction.type === 'deposit' || transaction.type === 'winnings'
                                            ? 'text-emerald-400'
                                            : 'text-amber-400'
                                        }`}>
                                        {transaction.type === 'deposit' || transaction.type === 'winnings' ? '+' : '-'}
                                        {formatCurrency(transaction.amount)}
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
            </div>
        </CardContent>
        <CardFooter className="relative z-10">
            <Link href="/wallet" className="w-full">
                <Button variant="outline" className="w-full border-indigo-600/40 bg-indigo-950/30 text-indigo-300 hover:bg-indigo-900/40 hover:text-indigo-200">
                    View All Transactions
                </Button>
            </Link>
        </CardFooter>
    </Card>
);