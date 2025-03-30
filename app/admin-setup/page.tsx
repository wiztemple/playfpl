"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/app/components/ui/card";

export default function AdminSetupPage() {
  const [email, setEmail] = useState("wiztemple7@gmail.com");
  const [secretToken, setSecretToken] = useState("b815ab0b0a28497a7b14c86bb07d5ed9651c0c8e3b301527e15cd905c5cde274");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [adminStatus, setAdminStatus] = useState<boolean | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // Check current admin status
  const checkAdminStatus = async () => {
    setStatusLoading(true);
    try {
      const response = await fetch("/api/user/admin-status");
      const data = await response.json();
      setAdminStatus(data.isAdmin);
    } catch (error) {
      console.error("Error checking admin status:", error);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch("/api/admin/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          secretToken,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult(`Success! User ${email} is now an admin.`);
        // Refresh admin status after successful update
        checkAdminStatus();
      } else {
        setResult(`Error: ${data.error || "Unknown error"}`);
      }
    } catch (error: any) {
      setResult(`Error: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900 border border-gray-800">
        <CardHeader>
          <CardTitle>Admin Setup</CardTitle>
          <div className="text-sm text-gray-400">
            Current admin status: {statusLoading ? "Checking..." : adminStatus === null ? "Unknown" : adminStatus ? "Admin ✅" : "Not admin ❌"}
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm text-gray-400">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-800 border-gray-700"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="secretToken" className="text-sm text-gray-400">
                Secret Token
              </label>
              <Input
                id="secretToken"
                type="text"
                value={secretToken}
                onChange={(e) => setSecretToken(e.target.value)}
                className="bg-gray-800 border-gray-700"
              />
            </div>
            
            {result && (
              <div className={`p-3 rounded ${result.includes("Success") ? "bg-green-900/50 text-green-300" : "bg-red-900/50 text-red-300"}`}>
                {result}
              </div>
            )}
          </form>
        </CardContent>
        
        <CardFooter className="flex flex-col gap-4">
          <Button 
            onClick={handleSubmit} 
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            {loading ? "Processing..." : "Make Admin"}
          </Button>
          
          <Button
            onClick={checkAdminStatus}
            variant="outline"
            disabled={statusLoading}
            className="w-full"
          >
            Refresh Admin Status
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}