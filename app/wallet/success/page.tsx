'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, ChevronLeft, Loader2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';
import { motion } from 'framer-motion';

export default function SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');
  const type = searchParams.get('type') || 'deposit';
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reference) {
      router.push('/wallet');
      return;
    }

    const verifyPayment = async () => {
      try {
        setIsVerifying(true);
        const response = await fetch(`/api/wallet/verify-${type}?reference=${reference}`);
        const data = await response.json();

        if (response.ok) {
          setIsSuccess(true);
        } else {
          setError(data.error || 'Verification failed');
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        setError('An error occurred while verifying your payment');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [reference, router, type]);

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
                {isVerifying ? 'Processing Payment' : isSuccess ? 'Payment Successful' : 'Payment Failed'}
              </CardTitle>
              <CardDescription className="text-gray-400">
                {isVerifying ? 'Please wait while we verify your payment' : isSuccess ? 'Your payment has been processed successfully' : 'There was an issue with your payment'}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6 relative z-10 flex flex-col items-center justify-center py-8">
              {isVerifying ? (
                <div className="text-center">
                  <Loader2 className="h-16 w-16 text-indigo-500 animate-spin mx-auto mb-4" />
                  <p className="text-gray-300">Verifying your payment...</p>
                </div>
              ) : isSuccess ? (
                <div className="text-center">
                  <div className="bg-green-900/30 p-6 rounded-full mb-4 inline-block">
                    <CheckCircle className="h-16 w-16 text-green-400" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-100 mb-2">Thank You!</h3>
                  <p className="text-gray-300 mb-4">
                    Your {type === 'deposit' ? 'deposit' : 'payment'} has been processed successfully.
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="bg-red-900/30 p-6 rounded-full mb-4 inline-block">
                    <svg className="h-16 w-16 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-medium text-gray-100 mb-2">Payment Failed</h3>
                  <p className="text-gray-300 mb-4">
                    {error || 'There was an issue processing your payment.'}
                  </p>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="relative z-10">
              <Link href="/wallet" className="w-full">
                <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0">
                  Return to Wallet
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}