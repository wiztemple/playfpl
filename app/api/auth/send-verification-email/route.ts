import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
    try {
        const { email, redirectTo } = await request.json();

        if (!email) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        const baseRedirectUrl = redirectTo || `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email`;

        console.log("Sending magic link to:", email, "with redirect to:", baseRedirectUrl);

        // Get the supabaseAdmin client for server-side operations
        const supabaseAdmin = getSupabaseAdmin();

        // Send a magic link instead of a verification email
        const { data, error } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: email,
            options: {
                redirectTo: baseRedirectUrl,
            }
        });

        if (error) {
            console.error("Error generating magic link:", error);
            return NextResponse.json(
                { error: `Failed to generate magic link: ${error.message}` },
                { status: 500 }
            );
        }

        console.log("Magic link generated successfully");

        // For debugging, log some info about the generated link
        if (data && data.properties) {
            console.log("Email action link properties:", {
                hasActionLink: !!data.properties.action_link,
                linkLength: data.properties.action_link?.length || 0,
                // Include part of the link for debugging (first 20 chars)
                linkPreview: data.properties.action_link ? 
                    `${data.properties.action_link.substring(0, 20)}...` : 'none',
            });
        }

        return NextResponse.json({
            success: true,
            message: "Magic link sent successfully. Please check your inbox and spam folder."
        });
    } catch (error: any) {
        console.error("Error sending magic link:", error);
        return NextResponse.json(
            { error: `An unexpected error occurred: ${error.message}` },
            { status: 500 }
        );
    }
}