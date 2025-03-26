import { Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import LeagueList from "@/app/components/leagues/LeagueList";
import { Button } from "@/app/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import Loading from "@/app/components/shared/Loading";

export const metadata = {
  title: "Weekly Mini-Leagues | FPL Stakes",
  description: "Join weekly Fantasy Premier League cash contests",
};

export default function WeeklyLeaguesPage() {
  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Weekly Mini-Leagues</h1>
        <Link href="/leagues/weekly/create">
          <Button className="flex items-center">
            <Plus className="mr-1 h-4 w-4" />
            Create League
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="available">
        <TabsList className="mb-6">
          <TabsTrigger value="available">Available Leagues</TabsTrigger>
          <TabsTrigger value="my-leagues">My Leagues</TabsTrigger>
        </TabsList>

        <TabsContent value="available">
          <Suspense fallback={<Loading />}>
            <LeagueList filter="available" />
          </Suspense>
        </TabsContent>

        <TabsContent value="my-leagues">
          <Suspense fallback={<Loading />}>
            <LeagueList filter="my-leagues" />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
