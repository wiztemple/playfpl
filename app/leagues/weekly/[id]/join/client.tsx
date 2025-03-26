'use client';

// /app/leagues/weekly/[id]/join/client.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { FplTeamSearchResult } from '@/app/components/fpl/FplTeamSearch';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/app/hooks/useToast';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string);

interface LeagueJoinClientProps {
  leagueId: string;
}

export default function LeagueJoinClient({ leagueId }: LeagueJoinClientProps) {
  const [league, setLeague] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [step, setStep] = useState(1); // 1 = FPL Team, 2 = Payment
  const [fplTeamId, setFplTeamId] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchLeague = async () => {
      try {
        const response = await fetch(`/api/leagues/weekly/${leagueId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            router.push('/leagues/weekly');
            return;
          }
          throw new Error('Failed to fetch league');
        }
        
        const data = await response.json();
        setLeague(data);
      } catch (err) {
        setError('Failed to load league information. Please try again.');
        console.error('Error fetching league:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeague();
  }, [leagueId, router]);

  const handleFplTeamSelect = (team: any) => {
    setSelectedTeam(team);
    setFplTeamId(team.id.toString());
  };

  const handleContinueToPayment = async () => {
    if (!fplTeamId) {
      toast({
        title: 'FPL Team Required',
        description: 'Please enter or select your FPL Team ID',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/leagues/weekly/${leagueId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fplTeamId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join league');
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
      setStep(2);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to process request',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
          </div>
          <p className="text-center mt-4">Loading league information...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-red-500 text-center">
            <p>{error}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => router.push('/leagues/weekly')}
            >
              Back to Leagues
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!league) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p>League not found or no longer available.</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => router.push('/leagues/weekly')}
            >
              Back to Leagues
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{league.name}</CardTitle>
        <CardDescription>
          Entry Fee: {formatCurrency(league.entryFee)} - Gameweek {league.gameweek}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 1 ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="fplTeamId">Your FPL Team ID</Label>
              <div className="mt-1">
                <FplTeamSearchResult onSelect={handleFplTeamSelect} />
                {!selectedTeam && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Don't know your team ID? You can find it in the URL when you visit your FPL team page.
                    </p>
                  </div>
                )}
                {selectedTeam && (
                  <div className="mt-2 p-3 bg-green-50 rounded-md">
                    <p className="font-medium">Selected Team:</p>
                    <p className="text-sm">{selectedTeam.name} (ID: {selectedTeam.id})</p>
                    <p className="text-sm">Manager: {selectedTeam.player_name}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div>
            {clientSecret && (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <PaymentForm 
                  leagueId={leagueId} 
                  entryFee={league.entryFee} 
                  onSuccess={() => {
                    toast({
                      title: 'Success!',
                      description: 'You have successfully joined the league',
                    });
                    router.push('/leagues/my-leagues');
                  }}
                />
              </Elements>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {step === 1 ? (
          <>
            <Button 
              variant="outline" 
              onClick={() => router.push('/leagues/weekly')}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleContinueToPayment} 
              disabled={!fplTeamId || loading}
            >
              Continue to Payment
            </Button>
          </>
        ) : null}
      </CardFooter>
    </Card>
  );
}

interface PaymentFormProps {
  leagueId: string;
  entryFee: number;
  onSuccess: () => void;
}

function PaymentForm({ leagueId, entryFee, onSuccess }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setProcessing(true);
    setError(null);
    
    try {
      const { error: submitError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success?leagueId=${leagueId}`,
        },
        redirect: 'if_required',
      });
      
      if (submitError) {
        throw new Error(submitError.message || 'Payment failed');
      }
      
      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment successful without redirect
        toast({
          title: 'Payment Successful',
          description: `Your payment of ${formatCurrency(entryFee)} has been processed.`,
        });
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong with your payment');
      toast({
        title: 'Payment Error',
        description: err.message || 'Payment failed. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label>Payment Details</Label>
        <div className="mt-1">
          <PaymentElement />
        </div>
      </div>
      
      {error && (
        <div className="text-red-500 text-sm">
          {error}
        </div>
      )}
      
      <div className="pt-2">
        <Button 
          type="submit" 
          className="w-full" 
          disabled={!stripe || processing}
        >
          {processing ? (
            <span className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </span>
          ) : (
            `Pay ${formatCurrency(entryFee)}`
          )}
        </Button>
      </div>
    </form>
  );
}