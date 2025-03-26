import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingProps {
  className?: string;
}

export default function Loading({ className = "" }: LoadingProps) {
  return (
    <div className="flex justify-center items-center">
      <Loader2 className={`h-8 w-8 animate-spin ${className}`} />
    </div>
  );
}