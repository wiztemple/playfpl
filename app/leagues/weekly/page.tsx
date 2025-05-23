"use client";

import { Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import LeagueList from "@/app/components/leagues/LeagueList";
import Loading from "@/app/components/shared/Loading";
import { motion } from "framer-motion";
// import CreateLeagueButton from "@/app/components/CreateLeagueButton";
import GameWeekSelector from "@/app/components/leagues/GameWeekSelector";
import { useSearchParams } from "next/navigation";

export default function WeeklyLeaguesPage() {
  const searchParams = useSearchParams();
  const gameweek = searchParams.get("gameweek") 
    ? parseInt(searchParams.get("gameweek")!) 
    : undefined;

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
          <div className="flex items-center gap-3">
            <GameWeekSelector />
            {/* <CreateLeagueButton /> */}
          </div>
        </motion.div>
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
              {/* <TabsTrigger
                value="my-leagues"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=inactive]:text-gray-400"
              >
                My Leagues
              </TabsTrigger> */}
            </TabsList>

            <TabsContent value="available">
              <Suspense fallback={
                <div className="flex justify-center py-12">
                  <Loading className="text-indigo-400" />
                </div>
              }>
                <LeagueList gameweek={gameweek} />
              </Suspense>
            </TabsContent>

            {/* <TabsContent value="my-leagues">
              <Suspense fallback={
                <div className="flex justify-center py-12">
                  <Loading className="text-indigo-400" />
                </div>
              }>
                <LeagueList filter="my-leagues" gameweek={gameweek} />
              </Suspense>
            </TabsContent> */}
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}