"use client";

import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  ChevronRight,
  Trophy,
  BarChart3,
  DollarSign,
  Users,
} from "lucide-react";
import { useSession } from "next-auth/react";

export default function HomePage() {
  const { data: session } = useSession();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col items-center text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
          Fantasy Premier League Stakes
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl">
          Join cash contests based on your Fantasy Premier League team. Compete
          weekly, win real money.
        </p>

        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          {session ? (
            <Link href="/leagues/weekly">
              <Button size="lg" className="font-semibold">
                Browse Leagues
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Link href="/api/auth/signin">
              <Button size="lg" className="font-semibold">
                Get Started
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          )}

          <Link href="/about">
            <Button variant="outline" size="lg">
              How It Works
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        <Card>
          <CardHeader>
            <Trophy className="h-8 w-8 text-blue-500 mb-2" />
            <CardTitle>Weekly Contests</CardTitle>
            <CardDescription>
              Compete in gameweek challenges against other managers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Join weekly mini-leagues that run for a single gameweek. Entry
              fees start from just $5.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <DollarSign className="h-8 w-8 text-green-500 mb-2" />
            <CardTitle>Real Money Stakes</CardTitle>
            <CardDescription>
              Put your FPL knowledge to the test with cash prizes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Win real money based on your team's performance. No season-long
              commitment needed.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <BarChart3 className="h-8 w-8 text-purple-500 mb-2" />
            <CardTitle>Performance Tracking</CardTitle>
            <CardDescription>
              Track your results with detailed analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Get insights on your performance with detailed stats and history
              tracking.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Users className="h-8 w-8 text-orange-500 mb-2" />
            <CardTitle>Community</CardTitle>
            <CardDescription>
              Compete against friends and the FPL community
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Create private leagues for friends or join public contests with
              FPL managers worldwide.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-8 mb-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-6">How It Works</h2>

          <div className="space-y-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mr-4">
                1
              </div>
              <div>
                <h3 className="font-semibold text-lg">Connect Your FPL Team</h3>
                <p className="text-gray-600">
                  Link your official Fantasy Premier League team to our platform
                  using your team ID.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mr-4">
                2
              </div>
              <div>
                <h3 className="font-semibold text-lg">Join Weekly Leagues</h3>
                <p className="text-gray-600">
                  Browse available contests and join the ones you like. Entry
                  fees range from $5 to $100.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mr-4">
                3
              </div>
              <div>
                <h3 className="font-semibold text-lg">Compete & Win</h3>
                <p className="text-gray-600">
                  Your FPL team's gameweek performance determines your ranking.
                  Top performers win cash prizes.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mr-4">
                4
              </div>
              <div>
                <h3 className="font-semibold text-lg">Cash Out Anytime</h3>
                <p className="text-gray-600">
                  Withdraw your winnings to your bank account or use them to
                  join more contests.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link href="/leagues/weekly">
              <Button>
                Browse Available Leagues
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4">
          Ready to test your FPL skills?
        </h2>
        <p className="text-gray-600 mb-8">
          Join thousands of FPL managers competing for cash prizes every
          gameweek.
        </p>

        {session ? (
          <Link href="/leagues/weekly/create">
            <Button size="lg" className="font-semibold">
              Create Your First League
            </Button>
          </Link>
        ) : (
          <Link href="/api/auth/signin">
            <Button size="lg" className="font-semibold">
              Sign Up Now
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

