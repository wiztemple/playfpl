// /app/api/leagues/weekly/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth-options";

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const params = await context.params;
    const { id } = params;

    // Find the league by ID
    const league = await prisma.weeklyLeague.findUnique({
      where: { id },
      include: {
        prizeDistribution: {
          orderBy: {
            position: "asc",
          },
        },
        _count: {
          select: { entries: true },
        },
        entries: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!league) {
      return NextResponse.json({ error: "League not found" }, { status: 404 });
    }

    // Format the response
    const formattedLeague = {
      ...league,
      currentParticipants: league._count.entries,
      _count: undefined,
      entries: undefined,
    };

    return NextResponse.json(formattedLeague);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch league details" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const params = await context.params;
    const { id } = params;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to edit a league" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: "Only administrators can edit leagues" },
        { status: 403 }
      );
    }

    // Get the league to check if it can be edited
    const existingLeague = await prisma.weeklyLeague.findUnique({
      where: { id },
      include: {
        _count: {
          select: { entries: true },
        },
      },
    });

    if (!existingLeague) {
      return NextResponse.json(
        { error: "League not found" },
        { status: 404 }
      );
    }

    // Only allow editing if the league hasn't started yet
    if (existingLeague.status !== "upcoming") {
      return NextResponse.json(
        { error: "Only leagues that haven't started yet can be edited" },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate max participants
    if (body.maxParticipants && body.maxParticipants < existingLeague._count.entries) {
      return NextResponse.json(
        {
          error: "Maximum participants cannot be less than current participants",
          currentParticipants: existingLeague._count.entries,
        },
        { status: 400 }
      );
    }

    // Update the league
    const updateData = {
      name: body.name,
      entryFee: body.entryFee,
      maxParticipants: body.maxParticipants,
      startDate: new Date(body.startDate),
    };

    const updatedLeague = await prisma.weeklyLeague.update({
      where: { id },
      data: updateData,
    });

    // Update prize distribution if provided
    if (body.prizeDistribution && body.prizeDistribution.length > 0) {
      // Use prisma transaction to update prize distributions
      for (const prize of body.prizeDistribution) {
        await prisma.prizeDistribution.update({
          where: { id: prize.id },
          data: {
            percentageShare: prize.percentageShare,
          },
        });
      }
    }

    // Fetch the updated league with its prize distribution
    const finalLeague = await prisma.weeklyLeague.findUnique({
      where: { id },
      include: {
        prizeDistribution: {
          orderBy: { position: "asc" },
        },
      },
    });

    return NextResponse.json(finalLeague);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update league", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const params = await context.params;
    const { id } = params;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to delete a league" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: "Only administrators can delete leagues" },
        { status: 403 }
      );
    }

    // Get the league to check if it can be deleted
    const league = await prisma.weeklyLeague.findUnique({
      where: { id },
      include: {
        _count: {
          select: { entries: true },
        },
      },
    });

    if (!league) {
      return NextResponse.json(
        { error: "League not found" },
        { status: 404 }
      );
    }

    // Check if league has participants
    if (league._count.entries > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete a league that has participants",
          participants: league._count.entries,
          status: league.status,
        },
        { status: 400 }
      );
    }

    // Check if league has already started
    if (league.status !== "upcoming") {
      return NextResponse.json(
        {
          error: "Cannot delete a league that has already started",
          status: league.status,
        },
        { status: 400 }
      );
    }

    // Delete prize distribution first (handle foreign key constraints)
    await prisma.prizeDistribution.deleteMany({
      where: { leagueId: id },
    });

    // Delete the league
    await prisma.weeklyLeague.delete({
      where: { id },
    });

    return NextResponse.json(
      { success: true, message: "League deleted successfully" }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete league", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}