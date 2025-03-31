"use client";

import { Suspense, useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import LeagueList from "@/app/components/leagues/LeagueList";
import Loading from "@/app/components/shared/Loading";
import { motion } from "framer-motion";
import CreateLeagueButton from "@/app/components/CreateLeagueButton";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

export default function WeeklyLeaguesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Get the current user from Supabase
  useEffect(() => {
    const getUser = async () => {
      setLoading(true);
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth session error:", error);
          setAuthError(error.message);
          setUser(null);
        } else {
          setUser(session?.user || null);
          setAuthError(null);
        }
      } catch (err) {
        console.error("Failed to get session:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
      
      // Set up auth state change listener
      const { data: { subscription } } = await supabase.auth.onAuthStateChange(
        (event, session) => {
          console.log("Auth state changed:", event);
          setUser(session?.user || null);
          
          // Clear error on sign in
          if (event === 'SIGNED_IN') {
            setAuthError(null);
          }
        }
      );
      
      return () => {
        subscription.unsubscribe();
      };
    };
    
    getUser();
  }, []);

  // If still loading, show loading indicator
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <Loading className="text-indigo-400 h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="container mx-auto py-12 px-4 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4"
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Weekly Mini-Leagues
          </h1>
          {user && <CreateLeagueButton />}
        </motion.div>
        
        {authError && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300">
            <p>Authentication error: {authError}</p>
            <p className="text-sm mt-1">You can still browse available leagues as a guest.</p>
          </div>
        )}
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative backdrop-blur-sm rounded-xl border border-gray-800 p-6 bg-gray-900/50 shadow-xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-xl pointer-events-none"></div>

          <Tabs defaultValue="available" className="relative z-10">
            <TabsList className="mb-8 bg-gray-800/50 border border-gray-700">
              <TabsTrigger
                value="available"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=inactive]:text-gray-400"
              >
                Available Leagues
              </TabsTrigger>
              {user && (
                <TabsTrigger
                  value="my-leagues"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=inactive]:text-gray-400"
                >
                  My Leagues
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="available">
              <Suspense fallback={
                <div className="flex justify-center py-12">
                  <Loading className="text-indigo-400" />
                </div>
              }>
                <LeagueList filter="available" />
              </Suspense>
            </TabsContent>

            {user && (
              <TabsContent value="my-leagues">
                <Suspense fallback={
                  <div className="flex justify-center py-12">
                    <Loading className="text-indigo-400" />
                  </div>
                }>
                  <LeagueList filter="my-leagues" />
                </Suspense>
              </TabsContent>
            )}
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
