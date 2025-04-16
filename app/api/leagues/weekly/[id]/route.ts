// // /app/api/leagues/weekly/[id]/route.ts
// import { NextResponse } from "next/server";
// import { getServerSession } from "next-auth";
// import { prisma } from "@/lib/db";
// import { authOptions } from "@/lib/auth-options";

// export async function GET(
//   request: Request,
//   context: { params: { id: string } }
// ) {
//   try {
//     const params = await context.params;
//     const { id } = params;

//     // Find the league by ID
//     const league = await prisma.weeklyLeague.findUnique({
//       where: { id },
//       include: {
//         prizeDistribution: {
//           orderBy: {
//             position: "asc",
//           },
//         },
//         _count: {
//           select: { entries: true },
//         },
//         entries: {
//           select: {
//             userId: true,
//           },
//         },
//       },
//     });

//     if (!league) {
//       return NextResponse.json({ error: "League not found" }, { status: 404 });
//     }

//     // Format the response
//     const formattedLeague = {
//       ...league,
//       currentParticipants: league._count.entries,
//       _count: undefined,
//       entries: undefined,
//     };

//     return NextResponse.json(formattedLeague);
//   } catch (error) {
//     return NextResponse.json(
//       { error: "Failed to fetch league details" },
//       { status: 500 }
//     );
//   }
// }

// export async function PATCH(
//   request: Request,
//   context: { params: { id: string } }
// ) {
//   try {
//     const params = await context.params;
//     const { id } = params;

//     // Check authentication
//     const session = await getServerSession(authOptions);
//     if (!session?.user?.id) {
//       return NextResponse.json(
//         { error: "You must be signed in to edit a league" },
//         { status: 401 }
//       );
//     }

//     // Check if user is admin
//     const user = await prisma.user.findUnique({
//       where: { id: session.user.id },
//       select: { isAdmin: true },
//     });

//     if (!user?.isAdmin) {
//       return NextResponse.json(
//         { error: "Only administrators can edit leagues" },
//         { status: 403 }
//       );
//     }

//     // Get the league to check if it can be edited
//     const existingLeague = await prisma.weeklyLeague.findUnique({
//       where: { id },
//       include: {
//         _count: {
//           select: { entries: true },
//         },
//       },
//     });

//     if (!existingLeague) {
//       return NextResponse.json(
//         { error: "League not found" },
//         { status: 404 }
//       );
//     }

//     // Only allow editing if the league hasn't started yet
//     if (existingLeague.status !== "upcoming") {
//       return NextResponse.json(
//         { error: "Only leagues that haven't started yet can be edited" },
//         { status: 400 }
//       );
//     }

//     // Parse request body
//     const body = await request.json();

//     // Validate max participants
//     if (body.maxParticipants && body.maxParticipants < existingLeague._count.entries) {
//       return NextResponse.json(
//         {
//           error: "Maximum participants cannot be less than current participants",
//           currentParticipants: existingLeague._count.entries,
//         },
//         { status: 400 }
//       );
//     }

//     // Update the league
//     const updateData = {
//       name: body.name,
//       entryFee: body.entryFee,
//       maxParticipants: body.maxParticipants,
//       startDate: new Date(body.startDate),
//     };

//     const updatedLeague = await prisma.weeklyLeague.update({
//       where: { id },
//       data: updateData,
//     });

//     // Update prize distribution if provided
//     if (body.prizeDistribution && body.prizeDistribution.length > 0) {
//       // Use prisma transaction to update prize distributions
//       for (const prize of body.prizeDistribution) {
//         await prisma.prizeDistribution.update({
//           where: { id: prize.id },
//           data: {
//             percentageShare: prize.percentageShare,
//           },
//         });
//       }
//     }

//     // Fetch the updated league with its prize distribution
//     const finalLeague = await prisma.weeklyLeague.findUnique({
//       where: { id },
//       include: {
//         prizeDistribution: {
//           orderBy: { position: "asc" },
//         },
//       },
//     });

//     return NextResponse.json(finalLeague);
//   } catch (error) {
//     return NextResponse.json(
//       { error: "Failed to update league", details: error instanceof Error ? error.message : "Unknown error" },
//       { status: 500 }
//     );
//   }
// }

// export async function DELETE(
//   request: Request,
//   context: { params: { id: string } }
// ) {
//   try {
//     const params = await context.params;
//     const { id } = params;

//     // Check authentication
//     const session = await getServerSession(authOptions);
//     if (!session?.user?.id) {
//       return NextResponse.json(
//         { error: "You must be signed in to delete a league" },
//         { status: 401 }
//       );
//     }

//     // Check if user is admin
//     const user = await prisma.user.findUnique({
//       where: { id: session.user.id },
//       select: { isAdmin: true },
//     });

//     if (!user?.isAdmin) {
//       return NextResponse.json(
//         { error: "Only administrators can delete leagues" },
//         { status: 403 }
//       );
//     }

//     // Get the league to check if it can be deleted
//     const league = await prisma.weeklyLeague.findUnique({
//       where: { id },
//       include: {
//         _count: {
//           select: { entries: true },
//         },
//       },
//     });

//     if (!league) {
//       return NextResponse.json(
//         { error: "League not found" },
//         { status: 404 }
//       );
//     }

//     // Check if league has participants
//     if (league._count.entries > 0) {
//       return NextResponse.json(
//         {
//           error: "Cannot delete a league that has participants",
//           participants: league._count.entries,
//           status: league.status,
//         },
//         { status: 400 }
//       );
//     }

//     // Check if league has already started
//     if (league.status !== "upcoming") {
//       return NextResponse.json(
//         {
//           error: "Cannot delete a league that has already started",
//           status: league.status,
//         },
//         { status: 400 }
//       );
//     }

//     // Delete prize distribution first (handle foreign key constraints)
//     await prisma.prizeDistribution.deleteMany({
//       where: { leagueId: id },
//     });

//     // Delete the league
//     await prisma.weeklyLeague.delete({
//       where: { id },
//     });

//     return NextResponse.json(
//       { success: true, message: "League deleted successfully" }
//     );
//   } catch (error) {
//     return NextResponse.json(
//       { error: "Failed to delete league", details: error instanceof Error ? error.message : "Unknown error" },
//       { status: 500 }
//     );
//   }
// }

// /app/api/leagues/weekly/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"; // Use NextRequest
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth-options";
import type { WeeklyLeague } from '@prisma/client'; // Import Prisma type directly

// Helper type for the structure returned by Prisma with includes/selects
type LeagueWithRelations = WeeklyLeague & {
  prizeDistribution: any[]; // Replace 'any' with actual PrizeDistribution type if available
  _count: { entries: number };
  // entries field is selected minimally, so not needed in the final type here
};

export async function GET(
  request: NextRequest, // Use NextRequest
  context: { params: { id: string } }
) {
  try {
    const params = await context.params;
    const leagueId = params.id; // Access id directly
    // Removed redundant 'params' variable

    if (!leagueId) {
      return NextResponse.json({ error: "League ID required" }, { status: 400 });
    }
    console.log(`[API GET /league/${leagueId}] Fetching league details.`);

    // Find the league by ID using explicit select
    const league = await prisma.weeklyLeague.findUnique({
      where: { id: leagueId },
      // --- Explicitly select ALL fields from WeeklyLeague model AND needed relations ---
      select: {
        // All scalar fields from your schema
        id: true,
        name: true,
        gameweek: true,
        entryFee: true,
        maxParticipants: true,
        currentParticipants: true, // Keep this if it's directly on the model, otherwise remove
        status: true,
        startDate: true,
        endDate: true,
        platformFeePercentage: true,
        minParticipantsRequired: true,
        tiebreaker: true,
        createdAt: true,
        updatedAt: true,
        leagueType: true,
        description: true,             // <<< Explicitly selected
        currentHighestGwPoints: true, // <<< Explicitly selected

        // Included relations/counts
        prizeDistribution: {
          orderBy: {
            position: "asc",
          },
          // Select specific fields if needed, otherwise true selects all from relation
          select: { id: true, position: true, percentageShare: true, leagueId: true } // Example select
        },
        _count: {
          select: { entries: true },
        },
        // We don't need the userIds from 'entries' here if we only use the count
      },
    });

    if (!league) {
      console.warn(`[API GET /league/${leagueId}] League not found.`);
      return NextResponse.json({ error: "League not found" }, { status: 404 });
    }

    // Format the response - Adjust based on actual selected fields
    // Note: Prisma returns _count directly, no need to remove entries if not selected
    const formattedLeague = {
      ...league,
      // Use the count returned by Prisma directly
      currentParticipants: league._count.entries,
      // Remove _count if you don't want it in the final response
      _count: undefined,
    };

    console.log(`[API GET /league/${leagueId}] Returning league details.`);
    // Return the object containing all selected fields
    return NextResponse.json(formattedLeague);

  } catch (error) {
    console.error(`[API GET /league/${context.params.id}] Error fetching league:`, error);
    return NextResponse.json(
      { error: "Failed to fetch league details", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// --- PATCH Handler (No changes needed based on the error) ---
export async function PATCH(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const leagueId = context.params.id; // Use leagueId consistently
    console.log(`[API PATCH /league/${leagueId}] Attempting update.`);

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.warn(`[API PATCH /league/${leagueId}] Unauthorized: No session.`);
      return NextResponse.json({ error: "You must be signed in to edit a league" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      console.warn(`[API PATCH /league/${leagueId}] Forbidden: User ${session.user.id} is not admin.`);
      return NextResponse.json({ error: "Only administrators can edit leagues" }, { status: 403 });
    }

    // Get the league to check if it can be edited
    const existingLeague = await prisma.weeklyLeague.findUnique({
      where: { id: leagueId },
      include: { // Include count needed for validation
        _count: { select: { entries: true } },
      },
    });

    if (!existingLeague) {
      console.warn(`[API PATCH /league/${leagueId}] League not found.`);
      return NextResponse.json({ error: "League not found" }, { status: 404 });
    }

    if (existingLeague.status !== "upcoming") {
      console.warn(`[API PATCH /league/${leagueId}] Edit forbidden: League status is '${existingLeague.status}'.`);
      return NextResponse.json({ error: "Only leagues that haven't started yet can be edited" }, { status: 400 });
    }

    const body = await request.json();

    // Validate max participants
    if (body.maxParticipants != null && body.maxParticipants < existingLeague._count.entries) {
      console.warn(`[API PATCH /league/${leagueId}] Validation failed: maxParticipants (${body.maxParticipants}) < current (${existingLeague._count.entries}).`);
      return NextResponse.json(
        { error: "Maximum participants cannot be less than current participants", currentParticipants: existingLeague._count.entries },
        { status: 400 }
      );
    }

    // Prepare update data carefully - only update fields provided in body
    const updateData: Partial<WeeklyLeague> = {}; // Use Partial<>
    if (body.name !== undefined) updateData.name = body.name;
    if (body.entryFee !== undefined) updateData.entryFee = body.entryFee;
    if (body.maxParticipants !== undefined) updateData.maxParticipants = body.maxParticipants;
    if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate); // Ensure date conversion
    // Add other editable fields here if necessary (description, etc.)
    if (body.description !== undefined) updateData.description = body.description;
    if (body.platformFeePercentage !== undefined) updateData.platformFeePercentage = body.platformFeePercentage;
    // ... etc.

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0 && (!body.prizeDistribution || body.prizeDistribution.length === 0)) {
      console.log(`[API PATCH /league/${leagueId}] No update data provided.`);
      // Return existing league data if nothing changed? Or a specific message?
      const currentLeagueData = await prisma.weeklyLeague.findUnique({
        where: { id: leagueId }, include: { prizeDistribution: { orderBy: { position: "asc" } } }
      });
      return NextResponse.json(currentLeagueData);
    }


    // Update the league scalar fields if any data provided
    let updatedLeaguePartial: WeeklyLeague | null = null;
    if (Object.keys(updateData).length > 0) {
      updatedLeaguePartial = await prisma.weeklyLeague.update({
        where: { id: leagueId },
        data: updateData,
      });
      console.log(`[API PATCH /league/${leagueId}] Updated league fields: ${Object.keys(updateData).join(', ')}.`);
    }


    // Update prize distribution if provided using transaction
    if (body.prizeDistribution && Array.isArray(body.prizeDistribution) && body.prizeDistribution.length > 0) {
      console.log(`[API PATCH /league/${leagueId}] Updating prize distribution.`);
      const prizeUpdates = body.prizeDistribution.map((prize: any) => {
        // Basic validation
        if (prize.id && typeof prize.percentageShare === 'number') {
          return prisma.prizeDistribution.update({
            where: { id: prize.id, leagueId: leagueId }, // Ensure prize belongs to league
            data: { percentageShare: prize.percentageShare },
          });
        }
        return null; // Skip invalid entries
      }).filter(Boolean); // Remove nulls

      if (prizeUpdates.length > 0) {
        try {
          await prisma.$transaction(prizeUpdates as any); // Execute valid updates
          console.log(`[API PATCH /league/${leagueId}] Updated ${prizeUpdates.length} prize distribution entries.`);
        } catch (prizeError) {
          console.error(`[API PATCH /league/${leagueId}] Error updating prize distribution:`, prizeError);
          // Decide how to handle partial failure - maybe return error?
          // For now, log and continue to return potentially partially updated league
        }
      }
    }

    // Fetch the final state of the league with its prize distribution
    const finalLeague = await prisma.weeklyLeague.findUnique({
      where: { id: leagueId },
      include: {
        prizeDistribution: { orderBy: { position: "asc" } },
        // Include _count if needed for response, otherwise omit
        _count: { select: { entries: true } },
      },
    });

    // Format response similar to GET
    const formattedFinalLeague = finalLeague ? {
      ...finalLeague,
      currentParticipants: finalLeague._count.entries,
      _count: undefined,
    } : null;

    console.log(`[API PATCH /league/${leagueId}] Update process completed.`);
    return NextResponse.json(formattedFinalLeague);

  } catch (error) {
    console.error(`[API PATCH /league/${context.params.id}] Error updating league:`, error);
    return NextResponse.json(
      { error: "Failed to update league", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}


// --- DELETE Handler (No changes needed based on the error) ---
export async function DELETE(
  request: Request, // Or NextRequest if using specific features
  context: { params: { id: string } }
) {
  try {
    // Use the correct variable name established earlier
    const leagueId = context.params.id;
    console.log(`[API DELETE /league/${leagueId}] Attempting delete.`);

    // --- Authentication/Authorization Checks (remain the same) ---
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.warn(`[API DELETE /league/${leagueId}] Unauthorized: No session.`);
      return NextResponse.json({ error: "You must be signed in to delete a league" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { isAdmin: true } });
    if (!user?.isAdmin) {
      console.warn(`[API DELETE /league/${leagueId}] Forbidden: User ${session.user.id} is not admin.`);
      return NextResponse.json({ error: "Only administrators can delete leagues" }, { status: 403 });
    }

    // --- Fetch league with entry count for validation (remain the same) ---
    const league = await prisma.weeklyLeague.findUnique({
      where: { id: leagueId }, // Use leagueId here too
      include: { _count: { select: { entries: true } } },
    });

    if (!league) {
      console.warn(`[API DELETE /league/${leagueId}] League not found.`);
      return NextResponse.json({ error: "League not found" }, { status: 404 });
    }

    // --- Validation Checks (remain the same) ---
    if (league._count.entries > 0) {
      console.warn(`[API DELETE /league/${leagueId}] Delete forbidden: League has participants (${league._count.entries}).`);
      return NextResponse.json({ error: "Cannot delete a league that has participants" }, { status: 400 });
    }
    if (league.status !== "upcoming") {
      console.warn(`[API DELETE /league/${leagueId}] Delete forbidden: League status is '${league.status}'.`);
      return NextResponse.json({ error: "Cannot delete a league that has already started or finished" }, { status: 400 });
    }

    // --- Perform Deletion (Transaction recommended) ---
    console.log(`[API DELETE /league/${leagueId}] Proceeding with deletion.`);
    await prisma.$transaction(async (tx) => {
      // Delete related prize distribution first
      // --- FIX: Use leagueId instead of id ---
      await tx.prizeDistribution.deleteMany({ where: { leagueId: leagueId } }); // Corrected
      console.log(`[API DELETE /league/${leagueId}] Deleted related prize distribution entries.`);

      // Delete the league itself
      // --- FIX: Use leagueId instead of id ---
      await tx.weeklyLeague.delete({ where: { id: leagueId } }); // Corrected
      console.log(`[API DELETE /league/${leagueId}] Deleted league entry.`);
    });

    console.log(`[API DELETE /league/${leagueId}] League deleted successfully.`);
    return NextResponse.json({ success: true, message: "League deleted successfully" });

  } catch (error) {
    console.error(`[API DELETE /league/${context.params.id}] Error deleting league:`, error);
    return NextResponse.json(
      { error: "Failed to delete league", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}