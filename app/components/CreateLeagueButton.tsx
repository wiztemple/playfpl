"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/app/components/ui/button";
import { useRouter } from "next/navigation";
import { Plus, Sparkles } from "lucide-react";

export default function CreateLeagueButton() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkAdminStatus = async () => {
            try {
                const response = await fetch("/api/user/admin-status");
                const data = await response.json();
                setIsAdmin(data.isAdmin);
            } catch (error) {
                console.error("Error checking admin status:", error);
            } finally {
                setLoading(false);
            }
        };

        checkAdminStatus();
    }, []);

    if (loading) {
        return <Button disabled>Loading...</Button>;
    }

    if (!isAdmin) {
        return null;
    }

    return (
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button onClick={() => router.push("/leagues/weekly/create")} className="flex items-cente text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-0 shadow-lg">
                <Plus className="mr-1 h-4 w-4" />
                Create League
                <Sparkles className="ml-1 h-3 w-3 text-indigo-200" />
            </Button>
        </motion.div>
    );
}