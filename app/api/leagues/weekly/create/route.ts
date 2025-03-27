// /app/api/leagues/weekly/create/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { getGameweekInfo } from "@/lib/fpl-api";
import { z } from "zod";
import { authOptions } from "@/lib/auth-options";

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
    .max(20000, "Maximum entry fee is ₦20,000"),
  maxParticipants: z
    .number()
    .int()
    .positive("Must allow at least 1 participant")
    .max(10000, "Maximum 10,000 participants"),
  startDate: z.string().datetime("Invalid start date format"),
  leagueType: z.enum(['tri', 'duo', 'jackpot']),
  prizeDistribution: z.array(
    z.object({
      position: z.number().int().positive("Position must be a positive number"),
      percentageShare: z.number().positive("Percentage must be positive"),
    })
  )
}).superRefine((data, ctx) => {
  // Validate total percentage
  const total = data.prizeDistribution.reduce(
    (sum, prize) => sum + prize.percentageShare,
    0
  );
  if (Math.abs(total - 100) >= 0.01) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Prize distribution must total 100%",
      path: ["prizeDistribution"]
    });
  }

  // Validate number of positions
  const expectedPositions = data.leagueType === 'tri' ? 3 
    : data.leagueType === 'duo' ? 2 
    : 1;
  
  if (data.prizeDistribution.length !== expectedPositions) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Prize distribution must have ${expectedPositions} positions for ${data.leagueType} league type`,
      path: ["prizeDistribution"]
    });
  }
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
    console.log("Raw request body:", body);
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
    console.log("Validated league type:", data.leagueType); // Add this line to debug

    // Validate gameweek exists in FPL
    try {
      const gameweekInfo = await getGameweekInfo(data.gameweek);
      console.log("Gameweek info:", gameweekInfo);
      
      // Use the actual gameweek deadline and end date
      const gameweekDeadline = new Date(gameweekInfo.deadline_time);
      const gameweekEnd = new Date(gameweekInfo.gameweek_end);
      const startDate = new Date(data.startDate);
      
      // Set end date to 23:59:59.999 on the same day as the last fixture (April 3rd)
      const endDate = new Date(gameweekEnd);
      endDate.setHours(23, 59, 59, 999); // Use local time instead of UTC

      console.log("Date calculations:", {
        startDate,
        gameweekDeadline,
        gameweekEnd,
        endDate
      });

      if (startDate > gameweekDeadline) {
        return NextResponse.json(
          { error: "Start date must be before the gameweek deadline" },
          { status: 400 }
        );
      }

      // Create league data with calculated end date
      const leagueData = {
        name: data.name,
        gameweek: data.gameweek,
        entryFee: data.entryFee,
        maxParticipants: data.maxParticipants,
        startDate: new Date(data.startDate),
        endDate: endDate,
        status: "upcoming",
        platformFeePercentage: 10,
        minParticipantsRequired: 3,
        leagueType: data.leagueType, // Remove the type casting
        prizeDistribution: {
          create: data.prizeDistribution.map((prize) => ({
            position: prize.position,
            percentageShare: prize.percentageShare,
          })),
        },
      };
      console.log("League data to be created:", leagueData); // This log already exists

      // Create the league in the database
      const league = await prisma.weeklyLeague.create({
        data: leagueData,
        include: {
          prizeDistribution: true,
        },
      });

      return NextResponse.json(league);
    } catch (error: any) {
      console.error("Detailed error:", {
        message: error.message,
        code: error.code,
        meta: error.meta,
        stack: error.stack
      });
      return NextResponse.json(
        { error: "Failed to create league", details: error.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error validating gameweek:", error);
    return NextResponse.json(
      { error: "Invalid gameweek or error fetching gameweek data" },
      { status: 400 }
    );
  }
}
