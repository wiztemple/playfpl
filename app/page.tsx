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
  Users,
} from "lucide-react";
import { Banknote } from "lucide-react";
import { useSession } from "next-auth/react";

export default function HomePage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-purple-900/20 to-gray-950"></div>
      <div className="absolute top-0 -left-40 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 -right-40 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-24">
          <div className="inline-block mb-6 px-6 py-2 border border-indigo-500/30 rounded-full backdrop-blur-sm bg-indigo-950/30">
            <span className="text-sm font-medium text-indigo-300">Fantasy Premier League with Real Stakes</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Elevate Your FPL Experience
          </h1>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Join cash contests based on your Fantasy Premier League team. Compete weekly, win real money.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            {session ? (
              <Link href="/leagues/weekly">
                <Button size="lg" className="font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-lg shadow-indigo-600/20">
                  Browse Leagues
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link href="/api/auth/signin">
                <Button size="lg" className="font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-lg shadow-indigo-600/20">
                  Get Started
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}

            <Link href="/about">
              <Button variant="outline" size="lg" className="border-indigo-500/50 text-indigo-400 hover:bg-indigo-950/50 backdrop-blur-sm">
                How It Works
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-24 max-w-5xl mx-auto">
          <div className="backdrop-blur-md bg-gray-900/40 border border-gray-800 rounded-xl p-6 text-center">
            <p className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">₦100K+</p>
            <p className="text-gray-400 text-sm">Weekly Prizes</p>
          </div>
          
          <div className="backdrop-blur-md bg-gray-900/40 border border-gray-800 rounded-xl p-6 text-center">
            <p className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">5K+</p>
            <p className="text-gray-400 text-sm">Active Players</p>
          </div>
          
          <div className="backdrop-blur-md bg-gray-900/40 border border-gray-800 rounded-xl p-6 text-center">
            <p className="text-4xl font-bold bg-gradient-to-r from-pink-400 to-red-400 bg-clip-text text-transparent mb-2">₦5</p>
            <p className="text-gray-400 text-sm">Min Entry Fee</p>
          </div>
          
          <div className="backdrop-blur-md bg-gray-900/40 border border-gray-800 rounded-xl p-6 text-center">
            <p className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">24h</p>
            <p className="text-gray-400 text-sm">Payout Time</p>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
          <Card className="backdrop-blur-md bg-gray-900/60 border border-gray-800 shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-500/50 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-indigo-900/5 rounded-xl pointer-events-none"></div>
            <div className="absolute -right-20 -top-20 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl group-hover:bg-indigo-600/20 transition-all duration-500"></div>
            
            <CardHeader>
              <div className="bg-indigo-900/30 p-3 rounded-xl w-fit mb-3">
                <Trophy className="h-6 w-6 text-indigo-400" />
              </div>
              <CardTitle className="text-gray-100">Weekly Contests</CardTitle>
              <CardDescription className="text-gray-400">
                Compete in gameweek challenges against other managers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">
                Join weekly mini-leagues that run for a single gameweek. Entry
                fees start from just ₦5.
              </p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-gray-900/60 border border-gray-800 shadow-xl hover:shadow-purple-500/10 hover:border-purple-500/50 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 to-purple-900/5 rounded-xl pointer-events-none"></div>
            <div className="absolute -right-20 -top-20 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl group-hover:bg-purple-600/20 transition-all duration-500"></div>
            
            <CardHeader>
              <div className="bg-purple-900/30 p-3 rounded-xl w-fit mb-3">
                <Banknote className="h-6 w-6 text-purple-400" />
              </div>
              <CardTitle className="text-gray-100">Real Money Stakes</CardTitle>
              <CardDescription className="text-gray-400">
                Put your FPL knowledge to the test with cash prizes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">
                Win real money based on your team's performance. No season-long
                commitment needed.
              </p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-gray-900/60 border border-gray-800 shadow-xl hover:shadow-pink-500/10 hover:border-pink-500/50 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-900/10 to-pink-900/5 rounded-xl pointer-events-none"></div>
            <div className="absolute -right-20 -top-20 w-40 h-40 bg-pink-600/10 rounded-full blur-3xl group-hover:bg-pink-600/20 transition-all duration-500"></div>
            
            <CardHeader>
              <div className="bg-pink-900/30 p-3 rounded-xl w-fit mb-3">
                <BarChart3 className="h-6 w-6 text-pink-400" />
              </div>
              <CardTitle className="text-gray-100">Performance Tracking</CardTitle>
              <CardDescription className="text-gray-400">
                Track your results with detailed analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">
                Get insights on your performance with detailed stats and history
                tracking.
              </p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-gray-900/60 border border-gray-800 shadow-xl hover:shadow-cyan-500/10 hover:border-cyan-500/50 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/10 to-cyan-900/5 rounded-xl pointer-events-none"></div>
            <div className="absolute -right-20 -top-20 w-40 h-40 bg-cyan-600/10 rounded-full blur-3xl group-hover:bg-cyan-600/20 transition-all duration-500"></div>
            
            <CardHeader>
              <div className="bg-cyan-900/30 p-3 rounded-xl w-fit mb-3">
                <Users className="h-6 w-6 text-cyan-400" />
              </div>
              <CardTitle className="text-gray-100">Community</CardTitle>
              <CardDescription className="text-gray-400">
                Compete against friends and the FPL community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">
                Create private leagues for friends or join public contests with
                FPL managers worldwide.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How It Works Section */}
        <div className="backdrop-blur-md bg-gray-900/60 border border-gray-800 rounded-xl p-12 mb-24 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-xl pointer-events-none"></div>
          <div className="absolute top-0 -left-40 w-80 h-80 bg-indigo-600/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 -right-40 w-80 h-80 bg-purple-600/5 rounded-full blur-3xl"></div>
          
          <div className="max-w-4xl mx-auto relative z-10">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                How It Works
              </h2>
              <p className="text-gray-400 mt-2">Simple steps to get started</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="relative">
                <div className="absolute top-0 right-0 -mr-4 h-px w-full bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent hidden lg:block"></div>
                <div className="flex flex-col items-center text-center">
                  <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold mb-4 shadow-lg shadow-indigo-600/20">
                    1
                  </div>
                  <h3 className="font-semibold text-lg text-gray-100 mb-2">Connect FPL Team</h3>
                  <p className="text-gray-400 text-sm">
                    Link your official Fantasy Premier League team using your team ID
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute top-0 right-0 -mr-4 h-px w-full bg-gradient-to-r from-transparent via-purple-500/50 to-transparent hidden lg:block"></div>
                <div className="flex flex-col items-center text-center">
                  <div className="bg-gradient-to-br from-purple-600 to-purple-800 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold mb-4 shadow-lg shadow-purple-600/20">
                    2
                  </div>
                  <h3 className="font-semibold text-lg text-gray-100 mb-2">Join Leagues</h3>
                  <p className="text-gray-400 text-sm">
                    Browse available contests with entry fees from ₦5 to ₦100
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute top-0 right-0 -mr-4 h-px w-full bg-gradient-to-r from-transparent via-pink-500/50 to-transparent hidden lg:block"></div>
                <div className="flex flex-col items-center text-center">
                  <div className="bg-gradient-to-br from-pink-600 to-pink-800 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold mb-4 shadow-lg shadow-pink-600/20">
                    3
                  </div>
                  <h3 className="font-semibold text-lg text-gray-100 mb-2">Compete & Win</h3>
                  <p className="text-gray-400 text-sm">
                    Your FPL performance determines your ranking and winnings
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-gradient-to-br from-cyan-600 to-cyan-800 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold mb-4 shadow-lg shadow-cyan-600/20">
                    4
                  </div>
                  <h3 className="font-semibold text-lg text-gray-100 mb-2">Cash Out</h3>
                  <p className="text-gray-400 text-sm">
                    Withdraw your winnings or use them to join more contests
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12 text-center">
              <Link href="/leagues/weekly">
                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-lg shadow-indigo-600/20">
                  Browse Available Leagues
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              What Our Users Say
            </h2>
            <p className="text-gray-400 mt-2">Hear from our community of FPL managers</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="backdrop-blur-md bg-gray-900/60 border border-gray-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-indigo-900/5 rounded-xl pointer-events-none"></div>
              <div className="relative z-10">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-white font-bold">
                    A
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-200">Alex M.</p>
                    <p className="text-xs text-gray-400">FPL Manager since 2018</p>
                  </div>
                </div>
                <p className="text-gray-300 mb-4">
                  "I've won more on FPL Stakes in two months than I did in my office league all last season. The weekly format keeps it exciting!"
                </p>
                <div className="flex text-yellow-400">
                  <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                </div>
              </div>
            </div>
            
            <div className="backdrop-blur-md bg-gray-900/60 border border-gray-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 to-purple-900/5 rounded-xl pointer-events-none"></div>
              <div className="relative z-10">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center text-white font-bold">
                    S
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-200">Sarah K.</p>
                    <p className="text-xs text-gray-400">Top 10k FPL Manager</p>
                  </div>
                </div>
                <p className="text-gray-300 mb-4">
                  "The platform is so easy to use and payouts are quick. I love being able to compete in multiple leagues each gameweek."
                </p>
                <div className="flex text-yellow-400">
                  <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                </div>
              </div>
            </div>
            
            <div className="backdrop-blur-md bg-gray-900/60 border border-gray-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-900/10 to-pink-900/5 rounded-xl pointer-events-none"></div>
              <div className="relative z-10">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-600 to-pink-800 flex items-center justify-center text-white font-bold">
                    J
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-200">James T.</p>
                    <p className="text-xs text-gray-400">Casual FPL Player</p>
                  </div>
                </div>
                <p className="text-gray-300 mb-4">
                  "I was hesitant at first, but the low entry fees let me test the waters. Now I'm hooked! It adds a whole new dimension to FPL."
                </p>
                <div className="flex text-yellow-400">
                  <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="relative backdrop-blur-md bg-gray-900/60 border border-gray-800 rounded-xl p-12 mb-16 shadow-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-xl pointer-events-none"></div>
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl"></div>
          
          <div className="max-w-3xl mx-auto text-center relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Ready to test your FPL skills?
            </h2>
            <p className="text-gray-300 mb-8 text-lg">
              Join thousands of FPL managers competing for cash prizes every gameweek.
            </p>

            {session ? (
              <Link href="/leagues/weekly/create">
                <Button size="lg" className="font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-lg shadow-indigo-600/20">
                  Create Your First League
                </Button>
              </Link>
            ) : (
              <Link href="/api/auth/signin">
                <Button size="lg" className="font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-lg shadow-indigo-600/20">
                  Sign Up Now
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

