'use client';

// /app/wallet/deposit/page.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ChevronLeft, CreditCard, DollarSign } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import { formatCurrency } from '@/lib/utils';

export default function DepositPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick amount options
  const quickAmounts = [10, 25, 50, 100];

  // Check if user is authenticated
  if (status === 'unauthenticated') {
    router.push('/api/auth/signin?callbackUrl=/wallet/deposit');
    return null;
  }

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

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString());
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
      setError('Minimum deposit amount is $5');
      return;
    }
    
    if (numAmount > 1000) {
      setError('Maximum deposit amount is $1,000');
      return;
    }
    
    try {
      setIsProcessing(true);
      
      // This is a mock implementation
      // In a real app, you would call your payment API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Redirect to wallet with success message
      router.push('/wallet?success=deposit');
    } catch (error) {
      console.error('Error processing deposit:', error);
      setError('Failed to process your deposit. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

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
      
      <h1 className="text-2xl font-bold mb-6">Add Funds</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Deposit to your wallet</CardTitle>
          <CardDescription>
            Add funds to your wallet to join leagues and contests
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
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
            
            <div>
              <Label className="mb-2 block">Quick select</Label>
              <div className="grid grid-cols-4 gap-2">
                {quickAmounts.map((quickAmount) => (
                  <Button
                    key={quickAmount}
                    type="button"
                    variant="outline"
                    onClick={() => handleQuickAmount(quickAmount)}
                  >
                    ${quickAmount}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <div className="border rounded-md p-3 flex items-center justify-between bg-gray-50">
                <div className="flex items-center">
                  <CreditCard className="h-4 w-4 mr-2 text-gray-500" />
                  <span>Demo Credit Card</span>
                </div>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Demo Mode</span>
              </div>
              <p className="text-xs text-gray-500">
                This is a demo app. No actual payment will be processed.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isProcessing || !amount}
            >
              {isProcessing ? 'Processing...' : `Deposit ${amount ? formatCurrency(parseFloat(amount)) : '$0.00'}`}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}