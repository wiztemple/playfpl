"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Loader2 } from "lucide-react";

export default function MagicLinkPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || isLoading) return;

    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch('/api/auth/send-magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send magic link');
      }

      setMessage(data.message || 'Magic link sent! Please check your inbox and spam folder.');
      
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-gray-800 bg-gray-900 p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-white">Magic Link Test</h1>
        
        <form onSubmit={handleSendMagicLink} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-300">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
          
          <Button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center">
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Sending...
              </div>
            ) : (
              "Send Magic Link"
            )}
          </Button>
        </form>
        
        {message && (
          <div className="p-3 bg-green-900/30 border border-green-800/50 text-green-300 rounded-md text-sm">
            {message}
          </div>
        )}
        
        {error && (
          <div className="p-3 bg-red-900/30 border border-red-800/50 text-red-300 rounded-md text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}