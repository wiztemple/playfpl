"use client";

// /components/leagues/LeagueCard.tsx
import React from "react";
import {
  Calendar,
  DollarSign,
  Users,
  Award,
  Clock,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  formatDate,
  calculateTimeRemaining,
  formatCurrency,
} from "@/lib/utils";
import { WeeklyLeague } from "@/app/types";

interface LeagueCardProps {
  league: WeeklyLeague;
  onJoin: () => void;
  onView: () => void;
  mode: "available" | "joined";
}

export default function LeagueCard({
  league,
  onJoin,
  onView,
  mode,
}: LeagueCardProps) {
  // Simple function to calculate prize pool without complex logic
  const calculatePrizePool = () => {
    const totalEntries = league.currentParticipants;
    const totalPool = totalEntries * league.entryFee;
    const platformFee = totalPool * (league.platformFeePercentage / 100);
    return totalPool - platformFee;
  };

  const prizePool = calculatePrizePool();
  const isJoinable =
    mode === "available" &&
    league.status === "upcoming" &&
    !league.hasJoined &&
    league.currentParticipants < league.maxParticipants;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-bold text-blue-800">
            {league.name}
          </CardTitle>
          <div
            className={`px-2 py-0.5 rounded text-xs font-medium ${
              league.status === "upcoming"
                ? "bg-green-100 text-green-800"
                : league.status === "active"
                ? "bg-blue-100 text-blue-800"
                : league.status === "completed"
                ? "bg-gray-100 text-gray-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {league.status.charAt(0).toUpperCase() + league.status.slice(1)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
            <span className="text-sm text-gray-600">
              Gameweek {league.gameweek}
            </span>
          </div>
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
            <span className="text-sm text-gray-600">
              Entry: {formatCurrency(league.entryFee)}
            </span>
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-2 text-gray-500" />
            <span className="text-sm text-gray-600">
              {league.currentParticipants}/{league.maxParticipants} Players
            </span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-gray-500" />
            <span className="text-sm text-gray-600">
              {league.status === "upcoming"
                ? `Starts: ${new Date(league.startDate).toLocaleDateString()}`
                : `Ends: ${new Date(league.endDate).toLocaleDateString()}`}
            </span>
          </div>
        </div>

        {league.prizeDistribution && (
          <div className="bg-gray-50 p-3 rounded-md mb-3">
            <h4 className="font-medium text-sm mb-2 text-gray-700">
              Prize Pool: {formatCurrency(prizePool)}
            </h4>
            <div className="flex flex-wrap gap-2">
              {league.prizeDistribution.map((prize) => (
                <span
                  key={prize.position}
                  className="flex items-center bg-blue-50 px-2 py-1 rounded text-xs"
                >
                  <Award className="h-3 w-3 mr-1 text-blue-500" />
                  {prize.position}
                  {prize.position === 1
                    ? "st"
                    : prize.position === 2
                    ? "nd"
                    : prize.position === 3
                    ? "rd"
                    : "th"}
                  : {formatCurrency(prizePool * (prize.percentageShare / 100))}
                </span>
              ))}
            </div>
          </div>
        )}

        {mode === "joined" &&
          league.myResults &&
          league.status === "completed" && (
            <div className="bg-gray-50 p-3 rounded-md mb-3">
              <h4 className="font-medium text-sm mb-2 text-gray-700">
                Your Results
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-sm">
                  <div className="text-gray-500">Position</div>
                  <div className="font-bold">
                    {league.myResults.rank}/{league.currentParticipants}
                  </div>
                </div>
                <div className="text-sm">
                  <div className="text-gray-500">Points</div>
                  <div className="font-bold">{league.myResults.points}</div>
                </div>
                <div className="text-sm">
                  <div className="text-gray-500">Weekly Points</div>
                  <div className="font-bold">
                    {league.myResults.weeklyPoints}
                  </div>
                </div>
                <div className="text-sm">
                  <div className="text-gray-500">Winnings</div>
                  <div className="font-bold text-green-600">
                    {formatCurrency(league.myResults.winnings)}
                  </div>
                </div>
              </div>
            </div>
          )}
      </CardContent>
      <CardFooter className="flex justify-between items-center pt-0">
        <div className="text-xs text-gray-500">
          {league.status === "upcoming"
            ? `Starts: ${formatDate(league.startDate)}`
            : `Ends: ${formatDate(league.endDate)}`}
        </div>
        {league.hasJoined ? (
          <div className="flex items-center text-green-600 font-medium">
            <CheckCircle className="h-4 w-4 mr-1" />
            Joined
          </div>
        ) : isJoinable ? (
          <Button onClick={onJoin} className="flex items-center">
            Join League
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={onView}
            variant={mode === "joined" ? "default" : "outline"}
            className="flex items-center"
          >
            View Details
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
