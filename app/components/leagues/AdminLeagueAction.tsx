"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Edit,
    Trash2,
    AlertTriangle,
    Loader2
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/app/components/ui/dialog";
import { toast } from "@/app/hooks/useToast";
// --- Import the correct, consistent type ---
import type { LeagueWithUserStatus } from "@/app/types"; // Use the type passed down from LeagueHeader
// Remove the import for the manual WeeklyLeague interface:
// import { WeeklyLeague } from "@/app/types"; // REMOVE OR COMMENT OUT
// --- End Import Changes ---
import { useQueryClient } from "@tanstack/react-query";

interface AdminLeagueActionsProps {
    // --- CHANGE THE TYPE HERE ---
    league: LeagueWithUserStatus; // Expect the type passed down from LeagueHeader
    isAdmin: boolean;
}

export default function AdminLeagueActions({ league, isAdmin }: AdminLeagueActionsProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Check if league can be edited/deleted using fields available on LeagueWithUserStatus
    // Use nullish coalescing for safety in case currentParticipants is null/undefined
    const canEdit = league.status === "upcoming";
    const canDelete = league.status === "upcoming" && (league.currentParticipants ?? 0) === 0;

    // If not admin, don't render anything
    if (!isAdmin) {
        return null;
    }

    const handleEdit = () => {
        router.push(`/leagues/weekly/${league.id}/edit`);
    };

    const confirmDelete = async () => {
        if (!league?.id) {
            toast({ title: "Error", description: "League ID is missing.", variant: "destructive" });
            setIsDeleting(false); // Ensure loading state is reset
            setIsDeleteDialogOpen(false);
            return;
        }
        try {
            setIsDeleting(true);

            const response = await fetch(`/api/leagues/weekly/${league.id}`, {
                method: "DELETE",
                // credentials: "include" // Usually only needed for cross-origin cookies
            });

            // Attempt to parse JSON regardless of response.ok to get error details
            const responseData = await response.json().catch(() => ({ error: "Failed to parse server response" }));

            if (!response.ok) {
                // Use error message from API response if available
                throw new Error(responseData.error || `Failed to delete league (Status: ${response.status})`);
            }

            toast({
                title: "League Deleted",
                description: `League "${league.name || 'N/A'}" has been successfully deleted.`,
                variant: "default",
            });

            // Invalidate relevant queries *before* navigating
            await queryClient.invalidateQueries({ queryKey: ['leagues'] }); // Refreshes league lists
            await queryClient.invalidateQueries({ queryKey: ['league', league.id] }); // Removes specific league cache

            router.push("/leagues/weekly");
            router.refresh(); // Optional: force refresh server components if needed

        } catch (error: any) {
            console.error("Error deleting league:", error);
            toast({
                title: "Deletion Error",
                description: error.message || "An unexpected error occurred while deleting.",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
        }
    };

    return (
        <div className="flex items-center space-x-2">
            {/* Edit Button Logic (remains the same, uses league.status) */}
            <Button
                onClick={handleEdit}
                disabled={!canEdit}
                variant="outline"
                size="sm"
                className={`flex items-center ${canEdit
                    ? "text-amber-400 border-amber-600/30 hover:text-amber-300 hover:border-amber-500/50 hover:bg-amber-950/30"
                    : "text-gray-500 border-gray-700 cursor-not-allowed"
                    }`}
                title={canEdit ? "Edit league" : "Cannot edit a league that has already started"}
            >
                <Edit className="h-4 w-4 mr-1" />
                Edit
            </Button>

            {/* Delete Button Logic (uses league.status and currentParticipants) */}
            <Button
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={!canDelete}
                variant="outline"
                size="sm"
                className={`flex items-center ${canDelete
                    ? "text-red-400 border-red-600/30 hover:text-red-300 hover:border-red-500/50 hover:bg-red-950/30"
                    : "text-gray-500 border-gray-700 cursor-not-allowed"
                    }`}
                title={
                    (league.currentParticipants ?? 0) > 0
                        ? "Cannot delete a league with participants"
                        : league.status !== "upcoming"
                            ? "Cannot delete a league that has already started or finished"
                            : "Delete league"
                }
            >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
            </Button>

            {/* Delete Confirmation Dialog (remains the same, uses league.name/gameweek) */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="bg-gray-900 border border-gray-800 text-gray-100">
                    <DialogHeader>
                        <DialogTitle className="flex items-center text-red-400">
                            <AlertTriangle className="h-5 w-5 mr-2" />
                            Delete League
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Are you sure you want to delete league "{league.name || 'this league'}" (GW {league.gameweek})? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Removed redundant display inside dialog */}
                    {/* <div className="py-4"> ... </div> */}

                    <DialogFooter className="mt-4"> {/* Added margin top */}
                        <Button
                            onClick={() => setIsDeleteDialogOpen(false)}
                            variant="outline"
                            className="border-gray-700 text-gray-300 hover:bg-gray-800"
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmDelete}
                            variant="destructive"
                            className="bg-red-600 hover:bg-red-700 text-white"
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete League
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}