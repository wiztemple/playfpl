'use client';

// /app/wallet/deposit/page.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ChevronLeft, Wallet, Sparkles, Loader2, ClipboardCopy, Check, AlertTriangle } from 'lucide-react'; // Added Loader2, ClipboardCopy, Check
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import { motion } from 'framer-motion';
import Loading from '@/app/components/shared/Loading';
import { toast } from 'sonner'; // Using sonner
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert'; // For instructions

// --- Define type for the data received after initiating ---
interface DepositInitiatedData {
  message: string;
  referenceCode: string;
  transactionId: string;
  depositAccountDetails: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  amountDeposited: number; // Store the amount requested
}

const MIN_DEPOSIT = 500; // Example minimum in NGN
const MAX_DEPOSIT = 100000;

export default function DepositPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // State to hold deposit instructions after successful initiation
  const [depositInitiatedData, setDepositInitiatedData] = useState<DepositInitiatedData | null>(null);
  const [copiedValue, setCopiedValue] = useState<string | null>(null); // Track what was copied

  // Quick amount options - Naira values
  const quickAmounts = [1000, 2000, 5000, 10000]; // Adjusted common values

  // Check if user is authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin?callbackUrl=/wallet/deposit');
    }
  }, [status, router]);

  // --- Input Amount Handling (Keep as is, maybe improve validation slightly) ---
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, ''); // Allow only numbers and one dot
    const parts = value.split('.');
    if (parts.length > 2) return; // Prevent multiple dots
    if (parts[1] && parts[1].length > 2) return; // Limit decimals
    if (value !== '' && !/^\d*\.?\d*$/.test(value)) return; // Ensure valid number format

    setAmount(value);
    setError(null); // Clear error on change
  };

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString());
    setError(null);
  };

  // --- Submit Handler - MODIFIED ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive amount');
      return;
    }
    // --- Use defined constants ---
    if (numAmount < MIN_DEPOSIT) {
      setError(`Minimum deposit amount is ₦${MIN_DEPOSIT.toLocaleString()}`); // Use constant
      return;
    }
    if (numAmount > MAX_DEPOSIT) {
      setError(`Maximum deposit amount is ₦${MAX_DEPOSIT.toLocaleString()}`); // Use constant
      return;
    }
    // --- End use defined constants ---

    // Keep existing try/catch/finally block for API call...
    try {
      setIsProcessing(true);
      const response = await fetch('/api/wallet/deposit/initiate', { /* ... */
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: numAmount }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Failed to initiate deposit (Status: ${response.status})`);

      setDepositInitiatedData({ /* ... set data ... */
        message: data.message,
        referenceCode: data.referenceCode,
        transactionId: data.transactionId,
        depositAccountDetails: data.depositAccountDetails,
        amountDeposited: numAmount
      });
      toast.success("Deposit Initiated!", { description: "Please follow the instructions below." });
      setAmount('');
    } catch (error: any) {
      // ... error handling ...
      console.error('Error initiating deposit:', error);
      const errorMessage = error.message || 'Failed to process your deposit request. Please try again.';
      setError(errorMessage);
      toast.error('Deposit Initiation Failed', { description: errorMessage });
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Copy Helper ---
  const handleCopy = (value: string, fieldName: string) => {
    navigator.clipboard.writeText(value)
      .then(() => {
        setCopiedValue(fieldName);
        toast.success(`${fieldName} copied to clipboard!`);
        setTimeout(() => setCopiedValue(null), 1500); // Reset icon after 1.5s
      })
      .catch(err => {
        console.error('Failed to copy:', err);
        toast.error('Failed to copy to clipboard');
      });
  };


  // --- Loading State ---
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <Loading className="text-indigo-400 h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="container mx-auto py-12 px-4 max-w-md">
        {/* Back Button */}
        <motion.div /* ... animation ... */ className="mb-8">
          <Link href="/wallet"> <Button variant="ghost" className="pl-0 text-gray-400 hover:text-indigo-400 hover:bg-transparent"> <ChevronLeft className="mr-1 h-4 w-4" /> Back to Wallet </Button> </Link>
        </motion.div>

        {/* Page Title */}
        <motion.h1 /* ... animation ... */ className="text-3xl font-bold mb-8 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          {depositInitiatedData ? "Complete Your Deposit" : "Add Funds"}
        </motion.h1>

        <motion.div /* ... animation ... */ >
          {/* Conditionally render Form or Instructions */}
          {!depositInitiatedData ? (
            // --- Deposit Form ---
            <Card className="bg-gray-900 border border-gray-800 overflow-hidden backdrop-blur-sm relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-xl pointer-events-none"></div>
              <CardHeader className="relative z-10 border-b border-gray-800">
                <CardTitle className="text-gray-100 flex items-center"> <Wallet className="h-5 w-5 mr-2 text-indigo-400" /> Deposit to your wallet </CardTitle>
                <CardDescription className="text-gray-400"> Enter amount and follow instructions </CardDescription>
              </CardHeader>

              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6 pt-6 relative z-10">
                  {/* Amount Input */}
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-gray-300">Amount (NGN)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400 font-medium">₦</span>
                      <Input id="amount" type="text" inputMode="decimal" // Use decimal input mode
                        placeholder="500.00" value={amount} onChange={handleAmountChange}
                        className="pl-8 bg-gray-800/50 border-gray-700 text-gray-200 focus:border-indigo-600 focus:ring-indigo-600/20 text-lg" // Made input larger
                      />
                    </div>
                    {error && (<motion.p /* ... animation ... */ className="text-sm text-red-400 pt-1"> {error} </motion.p>)}
                  </div>
                  {/* Quick Select */}
                  <div>
                    <Label className="mb-2 block text-gray-300 text-sm">Quick select</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {quickAmounts.map((quickAmount) => (
                        <motion.div key={quickAmount} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button type="button" variant="outline" size="sm" // Smaller buttons
                            onClick={() => handleQuickAmount(quickAmount)}
                            className="w-full border-gray-700 bg-gray-800/50 text-gray-300 hover:bg-gray-700/80 hover:text-indigo-300 text-xs" // Adjusted styling
                          > ₦{quickAmount.toLocaleString()}
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  {/* Removed Demo Payment Method Section */}
                </CardContent>

                <CardFooter className="relative z-10 pt-4 pb-6 border-t border-gray-800">
                  <motion.div /* ... animation ... */ className="w-full">
                    <Button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-0 shadow-lg h-11 text-base" // Made button larger
                      disabled={isProcessing || !amount || parseFloat(amount) < MIN_DEPOSIT} >
                      {isProcessing ? (
                        <> <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Processing... </>
                      ) : (
                        <> <Sparkles className="h-4 w-4 mr-2" /> Initiate Deposit {amount ? `₦${parseFloat(amount).toLocaleString()}` : ''} </>
                      )}
                    </Button>
                  </motion.div>
                </CardFooter>
              </form>
            </Card>
          ) : (
            // --- Deposit Instructions View ---
            <Card className="bg-gray-900 border border-green-800/50 overflow-hidden backdrop-blur-sm relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-900/10 to-teal-900/10 rounded-xl pointer-events-none"></div>
              <CardHeader className="relative z-10 border-b border-gray-800">
                <CardTitle className="text-green-400 flex items-center">
                  <Check className="h-5 w-5 mr-2" /> Deposit Initiated!
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Complete your deposit by making a bank transfer.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6 relative z-10">
                <Alert className="bg-gray-800/50 border-gray-700">
                  <AlertTriangle className="h-4 w-4 stroke-amber-400" />
                  <AlertTitle className="text-amber-400">Important Instructions</AlertTitle>
                  <AlertDescription className="text-gray-300">
                    Please transfer exactly **₦{depositInitiatedData.amountDeposited.toLocaleString()}** to the account below.
                    You **MUST** use the reference code **`{depositInitiatedData.referenceCode}`** in your transfer description/narration for us to identify and credit your payment.
                    Your wallet will be credited once the transfer is confirmed manually (this may take some time).
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-200">Transfer Details:</h3>
                  <div className="bg-gray-800/60 rounded-md p-3 border border-gray-700/50 space-y-2">
                    <p><span className="font-medium text-gray-400 w-28 inline-block">Bank:</span> <span className="text-gray-100">{depositInitiatedData.depositAccountDetails.bankName}</span></p>
                    <p><span className="font-medium text-gray-400 w-28 inline-block">Account No:</span>
                      <span className="text-gray-100 mr-2">{depositInitiatedData.depositAccountDetails.accountNumber}</span>
                      <Button variant="ghost" size="sm" className="h-6 px-1 py-0 text-indigo-400 hover:text-indigo-300" onClick={() => handleCopy(depositInitiatedData.depositAccountDetails.accountNumber, 'Account Number')}>
                        {copiedValue === 'Account Number' ? <Check className="h-3 w-3" /> : <ClipboardCopy className="h-3 w-3" />}
                      </Button>
                    </p>
                    <p><span className="font-medium text-gray-400 w-28 inline-block">Account Name:</span> <span className="text-gray-100">{depositInitiatedData.depositAccountDetails.accountName}</span></p>
                  </div>
                  <div className="bg-gray-800/60 rounded-md p-3 border border-gray-700/50 space-y-2">
                    <p><span className="font-medium text-gray-400 w-28 inline-block">Amount:</span> <span className="text-gray-100 font-semibold">₦{depositInitiatedData.amountDeposited.toLocaleString()}</span></p>
                    <p><span className="font-medium text-gray-400 w-28 inline-block">Reference:</span>
                      <span className="text-amber-400 font-mono mr-2">{depositInitiatedData.referenceCode}</span>
                      <Button variant="ghost" size="sm" className="h-6 px-1 py-0 text-indigo-400 hover:text-indigo-300" onClick={() => handleCopy(depositInitiatedData.referenceCode, 'Reference Code')}>
                        {copiedValue === 'Reference Code' ? <Check className="h-3 w-3" /> : <ClipboardCopy className="h-3 w-3" />}
                      </Button>
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 text-center pt-2">You can check your transaction history for the pending deposit.</p>

              </CardContent>
              <CardFooter className="relative z-10 pt-4 pb-6 border-t border-gray-800">
                <Link href="/wallet" className="w-full">
                  <Button variant="outline" className="w-full border-gray-700 text-gray-300 hover:bg-gray-800">
                    Back to Wallet
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}