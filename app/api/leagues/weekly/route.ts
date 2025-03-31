// /app/api/leagues/weekly/route.ts
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const filter = url.searchParams.get("filter") || "available";

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Get Supabase admin client for fetching leagues
    const supabaseAdmin = getSupabaseAdmin();

    // Skip authentication for GET requests - use admin client directly
    // This ensures the API works even without valid authentication
    // Initialize userId at the top level to avoid redeclaration
    const initialUserId = null;

    // Get all leagues first - this works without authentication
    const { data: leagues, error, count } = await supabaseAdmin
      .from("weekly_leagues")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching leagues:", error);
      return NextResponse.json(
        { error: "Failed to fetch leagues" },
        { status: 500 }
      );
    }

    // Try to get user session, but don't fail if it doesn't exist
    let userId = null;
    try {
      const cookieStore = await cookies();
      const supabaseClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll: () => {
              const allCookies = cookieStore.getAll();
              return allCookies.map(cookie => ({
                name: cookie.name,
                value: cookie.value,
              }));
            },
            setAll: () => { },
          },
        }
      );

      const { data } = await supabaseClient.auth.getSession();
      userId = data.session?.user?.id || null;
    } catch (error) {
      console.log("No authenticated session, continuing as guest");
      // Continue without a user ID
    }

    // If user is authenticated, check which leagues they've joined
    let userParticipations: any[] = [];
    if (userId) {
      const { data: participations, error: participationsError } = await supabaseAdmin
        .from("weekly_league_participants")
        .select("league_id")
        .eq("user_id", userId);

      if (!participationsError && participations) {
        userParticipations = participations;
      }
    }

    // Process the leagues to add hasJoined flag
    const processedLeagues = leagues.map((league) => {
      const hasJoined = userId
        ? userParticipations.some(p => p.league_id === league.id)
        : false;

      return {
        ...league,
        hasJoined
      };
    });

    // Filter leagues if needed
    let filteredLeagues = processedLeagues;
    if (filter === "my-leagues" && userId) {
      filteredLeagues = processedLeagues.filter(league => league.hasJoined);
    } else if (filter === "my-leagues" && !userId) {
      // If user is not authenticated but trying to access my-leagues, return empty array
      filteredLeagues = [];
    }

    return NextResponse.json({
      leagues: filteredLeagues,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: count ? Math.ceil(count / limit) : 0
      }
    });
  } catch (error: any) {
    console.error("Error in weekly leagues API:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Get Supabase client for authentication - Updated to use non-deprecated method
    const cookieStore = await cookies();
    const supabaseClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => {
            const allCookies = cookieStore.getAll();
            return allCookies.map(cookie => ({
              name: cookie.name,
              value: cookie.value,
            }));
          },
          setAll: () => { }, // Not needed for this route
        },
      }
    );

    // Check authentication
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get Supabase admin client for database operations
    const supabaseAdmin = getSupabaseAdmin();

    // Check if user is admin
    const { data: userData, error: userError } = await supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("id", session.user.id)
      .single();

    if (userError) {
      console.error("Error checking admin status:", userError);
      return NextResponse.json(
        { error: "Failed to verify permissions" },
        { status: 500 }
      );
    }

    if (!userData?.is_admin) {
      return NextResponse.json(
        { error: "Only administrators can create leagues" },
        { status: 403 }
      );
    }

    // Parse request data
    const data = await request.json();

    // Create the league
    const { data: league, error: leagueError } = await supabaseAdmin
      .from("weekly_leagues")
      .insert({
        name: data.name,
        description: data.description,
        gameweek: data.gameweek,
        entry_fee: data.entryFee,
        max_participants: data.maxParticipants,
        status: "upcoming",
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (leagueError) {
      console.error("Error creating league:", leagueError);
      return NextResponse.json(
        { error: "Failed to create league" },
        { status: 500 }
      );
    }

    // Create prize distribution
    if (data.prizeDistribution && data.prizeDistribution.length > 0) {
      const prizeData = data.prizeDistribution.map((prize: any) => ({
        league_id: league.id,
        position: prize.position,
        percentage_share: prize.percentage
      }));

      const { error: prizeError } = await supabaseAdmin
        .from("prize_distributions")
        .insert(prizeData);

      if (prizeError) {
        console.error("Error creating prize distribution:", prizeError);
        // Continue anyway, the league was created successfully
      }
    }

    return NextResponse.json(league);
  } catch (error: any) {
    console.error("Error creating league:", error);
    return NextResponse.json(
      { error: `Failed to create league: ${error.message}` },
      { status: 500 }
    );
  }
}
