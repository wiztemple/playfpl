// /app/api/leagues/weekly/create/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { getGameweekInfo } from "@/lib/fpl-api";
import { z } from "zod";
import { authOptions } from "@/lib/auth-options";

// Validation schema for league creation
const createLeagueSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name cannot exceed 100 characters"),
  gameweek: z
    .number()
    .int()
    .positive("Gameweek must be a positive number")
    .max(38, "Maximum gameweek is 38"),
  entryFee: z
    .number()
    .positive("Entry fee must be positive")
    .max(1000, "Maximum entry fee is $1,000"),
  maxParticipants: z
    .number()
    .int()
    .positive("Must allow at least 1 participant")
    .max(10000, "Maximum 10,000 participants"),
  startDate: z.string().datetime("Invalid start date format"),
  endDate: z.string().datetime("Invalid end date format"),
  prizeDistribution: z
    .array(
      z.object({
        position: z
          .number()
          .int()
          .positive("Position must be a positive number"),
        percentageShare: z.number().positive("Percentage must be positive"),
      })
    )
    .refine(
      (data) => {
        const total = data.reduce(
          (sum, prize) => sum + prize.percentageShare,
          0
        );
        return Math.abs(total - 100) < 0.01; // Allow for floating point imprecision
      },
      {
        message: "Prize distribution must total 100%",
      }
    ),
});

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    console.log("Session:", session); 

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to create a league" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    console.log("Raw request body:", body)
    const validationResult = createLeagueSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid league data",
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Validate gameweek exists in FPL
    try {
      const gameweekInfo = await getGameweekInfo(data.gameweek);

      if (!gameweekInfo) {
        return NextResponse.json(
          {
            error: `Gameweek ${data.gameweek} does not exist or is not available`,
          },
          { status: 400 }
        );
      }

      // Validate dates against gameweek deadlines
      const gameweekDeadline = new Date(gameweekInfo.deadline_time);
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);

      if (startDate > endDate) {
        return NextResponse.json(
          { error: "Start date must be before end date" },
          { status: 400 }
        );
      }

      if (endDate < gameweekDeadline) {
        return NextResponse.json(
          { error: "End date must be after the gameweek deadline" },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error("Error validating gameweek:", error);
      // Continue without gameweek validation if FPL API is unavailable
    }

    // Create the league in the database
    const league = await prisma.weeklyLeague.create({
      data: {
        name: data.name,
        gameweek: data.gameweek,
        entryFee: data.entryFee,
        maxParticipants: data.maxParticipants,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        status: "upcoming",
        platformFeePercentage: 10, // Default value
        minParticipantsRequired: 3, // Default value
        prizeDistribution: {
          create: data.prizeDistribution.map((prize) => ({
            position: prize.position,
            percentageShare: prize.percentageShare,
          })),
        },
      },
      include: {
        prizeDistribution: true,
      },
    });

    return NextResponse.json(league);
  } catch (error) {
    console.error("Error creating league:", error);
    return NextResponse.json(
      { error: "Failed to create league" },
      { status: 500 }
    );
  }
}
