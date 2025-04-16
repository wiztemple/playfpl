import { Trophy } from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";

export const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-12">
        <Trophy className="h-12 w-12 mx-auto text-gray-600 mb-4" />
        <h3 className="text-xl font-medium text-gray-400 mb-2">No leagues found</h3>
        <p className="text-gray-500">{message}</p>
        <Link href="/leagues/weekly">
            <Button className="mt-6 bg-indigo-600 hover:bg-indigo-700">
                Browse Leagues
            </Button>
        </Link>
    </div>
);