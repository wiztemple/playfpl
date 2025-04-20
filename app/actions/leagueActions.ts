// app/actions/leagueActions.ts
"use server";

import { z } from "zod";
import { Prisma, WeeklyLeague, PrizeDistribution } from "@prisma/client"; // Import necessary Prisma types
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path if needed
import { prisma } from "@/lib/db"; // Adjust path if needed
import type { Session } from "next-auth";

// --- Type Definitions ---
interface SessionWithAdmin extends Omit<Session, "user"> {
  user?: { id?: string; isAdmin?: boolean };
}

// Type for individual prize distribution item parsed from FormData
interface PrizeDistributionInputItem {
  position: number;
  percentageShare: number;
}

// Zod schema for individual prize distribution item
const prizeDistributionSchemaItemAction = z.object({
  position: z.coerce.number().int().positive("Position must be positive"),
  percentageShare: z.coerce
    .number()
    .min(0)
    .max(100, "Percentage must be 0-100"), // Allow 0% share if needed
});

// Zod schema for the main form data, now including prizeDistribution array validation
const createLeagueActionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "League name must be at least 3 characters")
    .max(100, "League name too long"),
  gameweek: z.coerce.number().int().min(1).max(38, "Invalid Gameweek"),
  entryFee: z.coerce
    .number()
    .positive("Entry fee must be positive")
    .max(100000, "Entry fee too high"),
  maxParticipants: z.coerce
    .number()
    .int()
    .min(2, "Minimum participants is 2")
    .max(10000, "Max participants too high"),
  startDate: z.string().min(16, { message: "Start date/time required" }),
  leagueType: z.enum(["tri", "duo", "jackpot"]),
  description: z
    .string()
    .max(500, "Description too long")
    .optional()
    .nullable(),
  // Validate the structure of the parsed prizeDistribution array
  prizeDistribution: z
    .array(prizeDistributionSchemaItemAction)
    .min(1, "At least one prize position required")
    .refine(
      (data) => {
        const totalPercentage = data.reduce(
          (sum, p) => sum + p.percentageShare,
          0
        );
        // Use a small tolerance for floating point comparison
        return Math.abs(totalPercentage - 100) < 0.01;
      },
      { message: "Prize percentages must add up to 100%" }
    ),
});

// Type for the state/return value of the server action
export interface CreateLeagueActionState {
  success: boolean;
  message?: string | null;
  errors?: z.ZodIssue[] | null; // Raw Zod issues for more detailed feedback
  fieldErrors?: Record<string, string[] | undefined> | null; // Flattened field errors
  leagueId?: string | null;
}

// Helper Type: The result type from the successful transaction
type CreatedLeagueWithPrizes = WeeklyLeague & {
  prizeDistribution: PrizeDistribution[];
};

// --- SERVER ACTION ---
export async function createLeagueAction(
  prevState: CreateLeagueActionState | null, // Required for useFormState
  formData: FormData // Standard FormData from form submission
): Promise<CreateLeagueActionState> {
  console.log("[SERVER_ACTION] createLeagueAction triggered.");

  // --- FIX: Declare newLeague variable outside the try block ---
  let newLeague: CreatedLeagueWithPrizes | null = null;
  // --- END FIX ---

  try {
    // 1. Authorization
    const session = (await getServerSession(
      authOptions as any
    )) as SessionWithAdmin;
    if (!session?.user?.id || !session?.user?.isAdmin) {
      return {
        success: false,
        message: "Forbidden: Admin privileges required.",
        errors: null,
        fieldErrors: null,
      };
    }
    console.log(`[SERVER_ACTION] Authorized Admin: ${session.user.id}`);

    // 2. Extract and Parse Data from FormData
    const rawData = Object.fromEntries(formData.entries());
    const prizeDistribution: PrizeDistributionInputItem[] = [];
    let i = 0;
    while (formData.has(`prizeDistribution[${i}].position`)) {
      const positionVal = Number(
        formData.get(`prizeDistribution[${i}].position`)
      );
      const shareVal = Number(
        formData.get(`prizeDistribution[${i}].percentageShare`)
      );
      if (!isNaN(positionVal) && !isNaN(shareVal)) {
        prizeDistribution.push({
          position: positionVal,
          percentageShare: shareVal,
        });
      } else {
        console.warn(`Skipping invalid prize data at index ${i}`);
      }
      i++;
    }
    // Combine raw scalar data with the manually parsed array
    const combinedData = {
      name: rawData.name,
      gameweek: rawData.gameweek,
      entryFee: rawData.entryFee,
      maxParticipants: rawData.maxParticipants,
      startDate: rawData.startDate,
      leagueType: rawData.leagueType,
      description: rawData.description,
      prizeDistribution: prizeDistribution,
    };

    // 3. Input Validation using Zod
    const validationResult = createLeagueActionSchema.safeParse(combinedData);
    if (!validationResult.success) {
      const formattedErrors = validationResult.error.flatten().fieldErrors;
      console.warn("[SERVER_ACTION] Validation failed:", formattedErrors);
      return {
        success: false,
        message: "Validation failed.",
        errors: validationResult.error.issues,
        fieldErrors: formattedErrors,
      };
    }
    const leagueData = validationResult.data;
    const startDateObj = new Date(leagueData.startDate); // Parse string from form
    if (isNaN(startDateObj.getTime())) {
      // Return a field-specific error if date parsing failed
      return {
        success: false,
        message: "Validation failed.",
        errors: null,
        fieldErrors: { startDate: ["Invalid date/time format provided."] },
      };
    }
    // --- FIX: Check for Duplicate League Name in the same Gameweek ---
    console.log(
      `[SERVER_ACTION] Checking for existing league: Name='${leagueData.name}', GW=${leagueData.gameweek}`
    );
    const existingLeague = await prisma.weeklyLeague.findFirst({
      where: {
        name: leagueData.name,
        gameweek: leagueData.gameweek,
      },
      select: { id: true }, // Only need to know if it exists
    });

    if (existingLeague) {
      console.warn(
        `[SERVER_ACTION] Duplicate league found: ID ${existingLeague.id}`
      );
      return {
        success: false,
        message: "Validation failed.",
        errors: null,
        fieldErrors: {
          name: ["A league with this name already exists for this gameweek."],
        },
      };
    }
    console.log("[SERVER_ACTION] No duplicate league found.");
    // --- END FIX ---

    // Calculate End Date (ensure helper is defined/imported)
    const endDateObj = await calculateEndDate(
      startDateObj,
      leagueData.gameweek
    );

    // 4. Database Creation within a Transaction
    console.log(
      `[SERVER_ACTION] Creating league '${leagueData.name}' (GW${leagueData.gameweek})...`
    );
    // --- Assign result to outer variable ---
    newLeague = await prisma.$transaction(
      async (tx) => {
        const createdLeague = await tx.weeklyLeague.create({
          data: {
            name: leagueData.name,
            gameweek: leagueData.gameweek,
            entryFee: new Prisma.Decimal(leagueData.entryFee.toFixed(2)),
            maxParticipants: leagueData.maxParticipants,
            startDate: startDateObj,
            endDate: endDateObj,
            leagueType: leagueData.leagueType,
            description: leagueData.description,
            platformFeePercentage: 10, // Use defaults from schema or pass from form if needed
            minParticipantsRequired: 2, // Use defaults from schema or pass from form if needed
            status: "upcoming",
          },
        });
        await tx.prizeDistribution.createMany({
          data: leagueData.prizeDistribution.map((p) => ({
            leagueId: createdLeague.id,
            position: p.position,
            percentageShare: new Prisma.Decimal(p.percentageShare.toFixed(2)),
          })),
        });
        // Fetch again to include relations for return value
        const leagueWithPrizes = await tx.weeklyLeague.findUniqueOrThrow({
          where: { id: createdLeague.id },
          include: { prizeDistribution: { orderBy: { position: "asc" } } },
        });
        return leagueWithPrizes;
      },
      { timeout: 15000 }
    ); // Adjusted timeout
    // --- End assignment ---

    console.log(
      `[SERVER_ACTION] League created successfully ID: ${newLeague?.id}`
    );
  } catch (error) {
    console.error("[SERVER_ACTION] Error creating league:", error);
    // Return error state - newLeague remains null
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return {
        success: false,
        message: `Database error: ${error.code}`,
        errors: null,
        fieldErrors: null,
      };
    }
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create league.",
      errors: null,
      fieldErrors: null,
    };
  }

  // --- Revalidate and Redirect only if league creation succeeded ---
  if (newLeague?.id) {
    console.log(
      `[SERVER_ACTION] Revalidating paths for league ${newLeague.id}...`
    );
    try {
      revalidatePath("/leagues/weekly");
      revalidatePath("/admin/leagues");
      // --- FIX: Return success state INSTEAD of redirecting ---
      return {
        success: true,
        message: `League "${newLeague.name}" created!`,
        leagueId: newLeague.id,
        errors: null,
        fieldErrors: null,
      };
      // redirect(`/leagues/weekly/${newLeague.id}`); // <<< REMOVED redirect()
      // --- END FIX ---
    } catch (revalidateError) {
      console.error(
        "[SERVER_ACTION] Error during revalidation:",
        revalidateError
      );
      // Still return success as league was created, but maybe add a note?
      return {
        success: true,
        message: "League created, but cache revalidation failed.",
        leagueId: newLeague.id,
        errors: null,
        fieldErrors: null,
      };
    }
  } else {
    // Should not happen if try block succeeded, but handle defensively
    console.error(
      "[SERVER_ACTION] League creation logic completed but newLeague object is null."
    );
    return {
      success: false,
      message: "Failed to create league (internal state error).",
      errors: null,
      fieldErrors: null,
    };
  }
}

// --- HELPER FUNCTIONS (Include or Import from lib) ---

// FPL Bootstrap Data Fetcher (required by calculateEndDate)
async function getFplBootstrapData(): Promise<any | null> {
  const url =
    process.env.FPL_API_STATIC_BASE_URL ||
    `https://fantasy.premierleague.com/api/bootstrap-static/`;
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "YourAppName/1.0" },
      next: { revalidate: 60 },
    });
    if (!response.ok) {
      console.error(`[FPL_HELPER] Failed Bootstrap: ${response.status}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error(`[FPL_HELPER] Error fetching Bootstrap:`, error);
    return null;
  }
}

// End Date Calculation (required by action)
async function calculateEndDate(
  startDate: Date,
  gameweek: number
): Promise<Date> {
  console.log(`[UTILS] Calculating End Date for GW ${gameweek}`);
  try {
    const bootstrapData = await getFplBootstrapData();
    const eventData = bootstrapData?.events?.find(
      (event: any) => event.id === gameweek
    );
    if (eventData?.deadline_time) {
      const deadlineDate = new Date(eventData.deadline_time);
      const endDate = new Date(
        Date.UTC(
          deadlineDate.getUTCFullYear(),
          deadlineDate.getUTCMonth(),
          deadlineDate.getUTCDate() + 3,
          23,
          59,
          59,
          999
        )
      );
      if (endDate > startDate) {
        console.log(`[UTILS] Calculated End Date: ${endDate.toISOString()}`);
        return endDate;
      }
      console.warn(
        `[UTILS] Calculated end date <= start date. Using fallback.`
      );
    } else {
      console.warn(
        `[UTILS] Could not get deadline for GW${gameweek}. Using fallback.`
      );
    }
  } catch (e) {
    console.error("[UTILS] Error in end date calculation:", e);
  }
  console.warn(`[UTILS] Using fallback End Date: Start Date + 6 days.`);
  const fallbackEndDate = new Date(startDate);
  fallbackEndDate.setDate(fallbackEndDate.getDate() + 6);
  fallbackEndDate.setHours(23, 59, 59, 999);
  return fallbackEndDate;
}
// --- END HELPER FUNCTIONS ---
