"use client";

import { useState, useEffect, useRef } from "react"; // Added useRef
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, Loader2 } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/app/components/ui/select"; // Adjust path if needed

export default function GameWeekSelector() {
    const [fetchedCurrentGameweek, setFetchedCurrentGameweek] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const searchParams = useSearchParams();
    const isInitialLoad = useRef(true); // Ref to track initial load

    // Get the gameweek currently selected in the URL
    const selectedGameweekParam = searchParams.get("gameweek");
    const urlSelectedGameweek = selectedGameweekParam ? parseInt(selectedGameweekParam) : null;

    // Fetch the effective current gameweek on mount
    useEffect(() => {
        const fetchCurrentGameweek = async () => {
            // Keep loading true until we potentially redirect
            setLoading(true);
            try {
                const response = await fetch("/api/gameweek/current"); // Uses heuristic now
                if (response.ok) {
                    const data = await response.json();
                    console.log('Fetched effective current gameweek data:', data);
                    if (data?.id && typeof data.id === 'number') {
                        const currentGwId = data.id;
                        setFetchedCurrentGameweek(currentGwId);

                        // --- Defaulting Logic ---
                        // Check if this is the initial load AND no gameweek is in the URL
                        if (isInitialLoad.current && !selectedGameweekParam) {
                            console.log(`No GW in URL, defaulting to current GW: ${currentGwId}`);
                            const params = new URLSearchParams(searchParams.toString()); // Use current params as base
                            params.set('gameweek', currentGwId.toString());
                            // Use replace to set the default without adding a new history entry
                            router.replace(`/leagues/weekly?${params.toString()}`, { scroll: false });
                            // No need to setLoading(false) here, the navigation will cause re-render
                        } else {
                            setLoading(false); // URL already has a GW or it's not initial load
                        }
                        // --- End Defaulting Logic ---

                    } else {
                        console.error("API returned invalid current gameweek ID:", data?.id);
                        setFetchedCurrentGameweek(null);
                        setLoading(false); // Stop loading if fetch failed logically
                    }
                } else {
                    console.error("Failed to fetch current gameweek:", response.status);
                    setFetchedCurrentGameweek(null);
                    setLoading(false); // Stop loading on fetch error
                }
            } catch (error) {
                console.error("Error fetching current gameweek:", error);
                setFetchedCurrentGameweek(null);
                setLoading(false); // Stop loading on exception
            } finally {
                 isInitialLoad.current = false; // Mark initial load as done
                 // setLoading(false); // Setting loading based on logic above now
            }
        };

        fetchCurrentGameweek();
     // Only run on mount essentially, searchParams read directly
    }, [router]); // Only depends on router for replace function

    // Handle selection change in the dropdown
    const handleGameweekChange = (value: string) => {
        // Value is the selected gameweek ID string
        const params = new URLSearchParams(searchParams.toString());
        params.set("gameweek", value); // Always set the parameter
        // Push to navigate and allow going back
        router.push(`/leagues/weekly?${params.toString()}`);
    };

    // Determine the value CURRENTLY displayed in the Select trigger
    // Prioritize the value from the URL search params, as that reflects the actual page state
    const displayValue = urlSelectedGameweek ? String(urlSelectedGameweek) : "";
    // Note: displayValue might be empty briefly if URL has no param AND current GW hasn't loaded yet

    // Generate options (NO "All Gameweeks")
    const gameweekOptions = Array.from({ length: 38 }, (_, i) => {
        const gw = i + 1;
        return {
            value: String(gw),
            label: `Gameweek ${gw}${fetchedCurrentGameweek === gw ? " (Current)" : ""}`
        };
    });

    // Determine if the component is still initializing (fetching current GW AND no GW in URL)
    const isInitializing = loading && !urlSelectedGameweek;

    return (
        <div className="min-w-[200px]"> {/* Or use dynamic width: min-w-[150px] */}
            <Select
                value={displayValue} // Controlled by URL param
                onValueChange={handleGameweekChange}
                disabled={isInitializing} // Disable during initial fetch before default is set
            >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100 focus:ring-indigo-500 focus:ring-offset-gray-900 focus:ring-offset-1">
                    {isInitializing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Calendar className="h-4 w-4 mr-2 text-indigo-400" />
                    )}
                    {/* SelectValue will display the label matching the current 'value' */}
                    <SelectValue placeholder={isInitializing ? "Loading..." : "Select GW"} />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-gray-100 max-h-[300px]">
                    {/* Removed "All Gameweeks" option */}
                    {gameweekOptions.map(option => (
                        <SelectItem
                            key={option.value}
                            value={option.value}
                            // Highlight the actual current GW in the list
                            className={option.value === String(fetchedCurrentGameweek) ? "text-indigo-300 font-medium focus:bg-indigo-900/50 focus:text-indigo-200" : "focus:bg-gray-700"}
                        >
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}