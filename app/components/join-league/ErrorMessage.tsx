// /app/components/join-league/ErrorMessage.tsx
import { AlertTriangle } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { useRouter } from "next/navigation";

interface ErrorMessageProps {
  error: string;
}

export default function ErrorMessage({ error }: ErrorMessageProps) {
  const router = useRouter();
  
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="container mx-auto py-12 px-4 max-w-md">
        <Card className="bg-gray-900 border border-gray-800 overflow-hidden backdrop-blur-sm relative">
          <div className="absolute inset-0 bg-gradient-to-br from-red-900/10 to-red-800/10 rounded-xl pointer-events-none"></div>
          <CardContent className="pt-6 relative z-10">
            <div className="text-red-400 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <p className="mb-4">{error}</p>
              <Button
                variant="outline"
                className="mt-4 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-indigo-400"
                onClick={() => router.push("/leagues/weekly")}
              >
                Back to Leagues
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}