// /app/components/leagues/GameWeekSelector.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, ChevronDown, Loader2 } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/app/components/ui/select";

export default function GameWeekSelector() {
    const [currentGameweek, setCurrentGameweek] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const searchParams = useSearchParams();

    // Get the selected gameweek from the URL or default to current
    const selectedGameweek = searchParams.get("gameweek")
        ? parseInt(searchParams.get("gameweek")!)
        : null;

    // Fetch current gameweek on mount
    useEffect(() => {
        const fetchCurrentGameweek = async () => {
            try {
                setLoading(true);
                const response = await fetch("/api/gameweek/current");
                if (response.ok) {
                    const data = await response.json();
                    setCurrentGameweek(data.id);
                }
            } catch (error) {
                console.error("Error fetching current gameweek:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCurrentGameweek();
    }, []);

    // Handle gameweek selection
    const handleGameweekChange = (value: string) => {
        // Create the new URL with the selected gameweek
        const params = new URLSearchParams(searchParams);

        if (value === "all") {
            params.delete("gameweek");
        } else {
            params.set("gameweek", value);
        }

        router.push(`/leagues/weekly?${params.toString()}`);
    };

    // Generate gameweek options (1-38)
    const gameweekOptions = [
        { value: "all", label: "All Gameweeks" },
        ...Array.from({ length: 38 }, (_, i) => ({
            value: String(i + 1),
            label: `Gameweek ${i + 1}${currentGameweek === i + 1 ? " (Current)" : ""}`
        }))
    ];

    return (
        <div className="w-40">
            <Select
                value={selectedGameweek ? String(selectedGameweek) : "all"}
                onValueChange={handleGameweekChange}
                disabled={loading}
            >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                    {loading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Calendar className="h-4 w-4 mr-2 text-indigo-400" />
                    )}
                    <SelectValue placeholder="Gameweek" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-gray-100">
                    {gameweekOptions.map(option => (
                        <SelectItem
                            key={option.value}
                            value={option.value}
                            className={option.value === String(currentGameweek) ? "text-indigo-400 font-medium" : ""}
                        >
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}