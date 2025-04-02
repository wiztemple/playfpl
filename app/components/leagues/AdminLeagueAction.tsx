// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import {
//     Edit,
//     Trash2,
//     AlertTriangle,
//     ShieldAlert,
//     Lock,
//     UserCheck,
//     Loader2
// } from "lucide-react";
// import { Button } from "@/app/components/ui/button";
// import {
//     Dialog,
//     DialogContent,
//     DialogDescription,
//     DialogFooter,
//     DialogHeader,
//     DialogTitle,
// } from "@/app/components/ui/dialog";
// import { WeeklyLeague } from "@/app/types";
// import { toast } from "@/app/hooks/useToast";

// interface AdminLeagueActionsProps {
//     league: WeeklyLeague;
//     isAdmin: boolean;
// }

// export default function AdminLeagueActions({ league, isAdmin }: AdminLeagueActionsProps) {
//     const router = useRouter();
//     const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
//     const [isDeleting, setIsDeleting] = useState(false);

//     // Check if league can be edited/deleted
//     const canEdit = league.status === "upcoming";
//     const canDelete = league.status === "upcoming" && league.currentParticipants === 0;

//     // If not admin, don't render anything
//     if (!isAdmin) {
//         return null;
//     }

//     const handleEdit = () => {
//         router.push(`/leagues/weekly/${league.id}/edit`);
//     };

//     const confirmDelete = async () => {
//         try {
//             setIsDeleting(true);

//             const response = await fetch(`/api/leagues/weekly/${league.id}`, {
//                 method: "DELETE",
//             });

//             if (!response.ok) {
//                 const data = await response.json();
//                 throw new Error(data.error || "Failed to delete league");
//             }

//             toast({
//                 title: "League deleted",
//                 description: "The league has been successfully deleted",
//                 variant: "default",
//             });

//             // Redirect to leagues page
//             router.push("/leagues/weekly");
//             router.refresh();
//         } catch (error: any) {
//             toast({
//                 title: "Error",
//                 description: error.message || "Failed to delete league",
//                 variant: "destructive",
//             });
//         } finally {
//             setIsDeleting(false);
//             setIsDeleteDialogOpen(false);
//         }
//     };

//     return (
//         <div className="flex items-center space-x-2">
//             <Button
//                 onClick={handleEdit}
//                 disabled={!canEdit}
//                 variant="outline"
//                 size="sm"
//                 className={`flex items-center ${canEdit
//                         ? "text-amber-400 border-amber-600/30 hover:text-amber-300 hover:border-amber-500/50 hover:bg-amber-950/30"
//                         : "text-gray-500 border-gray-700 cursor-not-allowed"
//                     }`}
//                 title={canEdit ? "Edit league" : "Cannot edit a league that has already started"}
//             >
//                 <Edit className="h-4 w-4 mr-1" />
//                 Edit
//             </Button>

//             <Button
//                 onClick={() => setIsDeleteDialogOpen(true)}
//                 disabled={!canDelete}
//                 variant="outline"
//                 size="sm"
//                 className={`flex items-center ${canDelete
//                         ? "text-red-400 border-red-600/30 hover:text-red-300 hover:border-red-500/50 hover:bg-red-950/30"
//                         : "text-gray-500 border-gray-700 cursor-not-allowed"
//                     }`}
//                 title={
//                     league.currentParticipants > 0
//                         ? "Cannot delete a league with participants"
//                         : league.status !== "upcoming"
//                             ? "Cannot delete a league that has already started"
//                             : "Delete league"
//                 }
//             >
//                 <Trash2 className="h-4 w-4 mr-1" />
//                 Delete
//             </Button>

//             {/* Delete Confirmation Dialog */}
//             <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
//                 <DialogContent className="bg-gray-900 border border-gray-800 text-gray-100">
//                     <DialogHeader>
//                         <DialogTitle className="flex items-center text-red-400">
//                             <AlertTriangle className="h-5 w-5 mr-2" />
//                             Delete League
//                         </DialogTitle>
//                         <DialogDescription className="text-gray-400">
//                             Are you sure you want to delete this league? This action cannot be undone.
//                         </DialogDescription>
//                     </DialogHeader>

//                     <div className="py-4">
//                         <div className="p-4 bg-gray-800/50 rounded-lg border border-red-900/30">
//                             <h3 className="font-medium text-gray-200">{league.name}</h3>
//                             <p className="text-sm text-gray-400">Gameweek {league.gameweek}</p>
//                         </div>
//                     </div>

//                     <DialogFooter>
//                         <Button
//                             onClick={() => setIsDeleteDialogOpen(false)}
//                             variant="outline"
//                             className="border-gray-700 text-gray-300 hover:bg-gray-800"
//                         >
//                             Cancel
//                         </Button>
//                         <Button
//                             onClick={confirmDelete}
//                             variant="destructive"
//                             className="bg-red-600 hover:bg-red-700 text-white"
//                             disabled={isDeleting}
//                         >
//                             {isDeleting ? (
//                                 <>
//                                     <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                                     Deleting...
//                                 </>
//                             ) : (
//                                 <>
//                                     <Trash2 className="h-4 w-4 mr-2" />
//                                     Delete League
//                                 </>
//                             )}
//                         </Button>
//                     </DialogFooter>
//                 </DialogContent>
//             </Dialog>
//         </div>
//     );
// }

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
import { WeeklyLeague } from "@/app/types";
import { useQueryClient } from "@tanstack/react-query";

interface AdminLeagueActionsProps {
    league: WeeklyLeague;
    isAdmin: boolean;
}

export default function AdminLeagueActions({ league, isAdmin }: AdminLeagueActionsProps) {
    const router = useRouter();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const queryClient = useQueryClient();

    // Check if league can be edited/deleted
    const canEdit = league.status === "upcoming";
    const canDelete = league.status === "upcoming" && league.currentParticipants === 0;

    // If not admin, don't render anything
    if (!isAdmin) {
        return null;
    }

    const handleEdit = () => {
        router.push(`/leagues/weekly/${league.id}/edit`);
    };

    const confirmDelete = async () => {
        try {
            setIsDeleting(true);

            const response = await fetch(`/api/leagues/weekly/${league.id}`, {
                method: "DELETE",
                credentials: "include"
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to delete league");
            }

            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['leagues'] });

            toast({
                title: "League deleted",
                description: "The league has been successfully deleted",
                variant: "default",
            });

            // Redirect to leagues page
            router.push("/leagues/weekly");
            router.refresh();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to delete league",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
        }
    };

    return (
        <div className="flex items-center space-x-2">
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
                    league.currentParticipants > 0
                        ? "Cannot delete a league with participants"
                        : league.status !== "upcoming"
                            ? "Cannot delete a league that has already started"
                            : "Delete league"
                }
            >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
            </Button>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="bg-gray-900 border border-gray-800 text-gray-100">
                    <DialogHeader>
                        <DialogTitle className="flex items-center text-red-400">
                            <AlertTriangle className="h-5 w-5 mr-2" />
                            Delete League
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Are you sure you want to delete this league? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <div className="p-4 bg-gray-800/50 rounded-lg border border-red-900/30">
                            <h3 className="font-medium text-gray-200">{league.name}</h3>
                            <p className="text-sm text-gray-400">Gameweek {league.gameweek}</p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            onClick={() => setIsDeleteDialogOpen(false)}
                            variant="outline"
                            className="border-gray-700 text-gray-300 hover:bg-gray-800"
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