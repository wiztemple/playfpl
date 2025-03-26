'use client';

// /app/leagues/my-leagues/page.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import LeagueList from '@/app/components/leagues/LeagueList';
import Loading from '@/app/components/shared/Loading';

export default function MyLeaguesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);

  // Check URL for success parameter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('success') === 'true') {
        setShowSuccess(true);
        // Clear the success parameter after a delay
        setTimeout(() => {
          router.replace('/leagues/my-leagues');
        }, 5000);
      }
    }
  }, [router]);

  // Check if user is authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin?callbackUrl=/leagues/my-leagues');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <Loading />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      {showSuccess && (
        <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-md">
          <p className="font-medium">Success! You've joined the league.</p>
          <p>Your entry has been confirmed and you're ready to compete.</p>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Leagues</h1>
      </div>
      
      <Tabs defaultValue="active">
        <TabsList className="mb-6">
          <TabsTrigger value="active">Active Leagues</TabsTrigger>
          <TabsTrigger value="completed">Completed Leagues</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active">
          <LeagueList filter="my-leagues" />
        </TabsContent>
        
        <TabsContent value="completed">
          <LeagueList filter="my-leagues" />
        </TabsContent>
      </Tabs>
    </div>
  );
}