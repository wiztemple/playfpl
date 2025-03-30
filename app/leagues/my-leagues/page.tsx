"use client";

import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Button } from "@/app/components/ui/button";
import { Trophy, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useMyLeagues } from "@/app/hooks/useMyLeagues";
import MyLeagueCard from "@/app/components/leagues/MyLeagueCard";

export default function MyLeaguesPage() {
  const { activeLeagues, completedLeagues, isLoading, error } = useMyLeagues();

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-12">
      <Trophy className="h-12 w-12 mx-auto text-gray-600 mb-4" />
      <h3 className="text-xl font-medium text-gray-400 mb-2">No leagues found</h3>
      <p className="text-gray-500">{message}</p>
      <Link href="/leagues/weekly">
        <Button className="mt-6 bg-indigo-600 hover:bg-indigo-700">
          Browse Leagues
        </Button>
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="container mx-auto py-12 px-4 max-w-5xl">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          My Leagues
        </h1>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative backdrop-blur-sm rounded-xl border border-gray-800 p-6 bg-gray-900/50 shadow-xl"
        >
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid grid-cols-2 mb-8 bg-gray-900 border border-gray-800">
              <TabsTrigger value="active" className="data-[state=active]:bg-indigo-900/50">
                Active Leagues
              </TabsTrigger>
              <TabsTrigger value="completed" className="data-[state=active]:bg-indigo-900/50">
                Completed Leagues
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                </div>
              ) : error ? (
                <div className="text-center py-12 text-red-400">
                  <p>{error.message}</p>
                  <Button onClick={() => window.location.reload()} className="mt-4">
                    Try Again
                  </Button>
                </div>
              ) : activeLeagues.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                  {activeLeagues.map((league) => (
                    <MyLeagueCard key={league.id} league={league} />
                  ))}
                </div>
              ) : (
                <EmptyState message="You haven't joined any active leagues yet." />
              )}
            </TabsContent>

            <TabsContent value="completed">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                </div>
              ) : error ? (
                <div className="text-center py-12 text-red-400">
                  <p>{error.message}</p>
                  <Button onClick={() => window.location.reload()} className="mt-4">
                    Try Again
                  </Button>
                </div>
              ) : completedLeagues.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {completedLeagues.map((league) => (
                    <MyLeagueCard key={league.id} league={league} />
                  ))}
                </div>
              ) : (
                <EmptyState message="You haven't participated in any completed leagues yet." />
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
