// app/api/gameweek/info/route.ts
import { NextResponse } from "next/server";

export async function GET() {
    try {
        // Fetch data from FPL API
        const response = await fetch("https://fantasy.premierleague.com/api/bootstrap-static/");

        if (!response.ok) {
            throw new Error("Failed to fetch FPL data");
        }

        const data = await response.json();

        // Get current gameweek
        const currentGameweek = data.events.find((event: any) => event.is_current);

        // Get next gameweek
        const nextGameweek = data.events.find((event: any) => event.is_next);

        // Get all gameweeks
        const allGameweeks = data.events.map((event: any) => ({
            id: event.id,
            name: event.name,
            deadline_time: event.deadline_time,
            is_current: event.is_current,
            is_next: event.is_next,
            finished: event.finished
        }));

        return NextResponse.json({
            current: currentGameweek,
            next: nextGameweek,
            all: allGameweeks
        });
    } catch (error) {
        console.error("Error fetching gameweek info:", error);
        return NextResponse.json(
            { error: "Failed to fetch gameweek info" },
            { status: 500 }
        );
    }
}