'use client';

// /app/leagues/my-leagues/page.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import LeagueList from '@/app/components/leagues/LeagueList';
import Loading from '@/app/components/shared/Loading';
import { motion } from 'framer-motion';
import { CheckCircle, Trophy, History } from 'lucide-react';

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
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <div className="container mx-auto py-12 px-4 max-w-4xl">
          <Loading />
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
              <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5" />
              <div>
                <p className="font-medium text-green-400">Success! You've joined the league.</p>
                <p className="text-green-300/80">Your entry has been confirmed and you're ready to compete.</p>
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
            My Leagues
          </h1>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden backdrop-blur-sm relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-xl pointer-events-none"></div>
            
            <div className="relative z-10 p-6">
              <Tabs defaultValue="active" className="w-full">
                <TabsList className="mb-6 bg-gray-800/50 border border-gray-700">
                  <TabsTrigger 
                    value="active" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=inactive]:text-gray-400 data-[state=inactive]:hover:text-gray-200"
                  >
                    <Trophy className="h-4 w-4 mr-2" />
                    Active Leagues
                  </TabsTrigger>
                  <TabsTrigger 
                    value="completed" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=inactive]:text-gray-400 data-[state=inactive]:hover:text-gray-200"
                  >
                    <History className="h-4 w-4 mr-2" />
                    Completed Leagues
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="active" className="mt-0">
                  <LeagueList filter="my-leagues" />
                </TabsContent>
                
                <TabsContent value="completed" className="mt-0">
                  <LeagueList filter="my-leagues" />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}