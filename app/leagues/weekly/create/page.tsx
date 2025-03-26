// /app/leagues/weekly/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Plus, Minus, Info, AlertTriangle } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { formatCurrency, getPositionSuffix } from "@/lib/utils";

export default function CreateLeaguePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    gameweek: 30, // Default to current/next gameweek
    entryFee: 10,
    maxParticipants: 100,
    startDate: "", // This will be set with the current datetime
    endDate: "", // This will be set to gameweek deadline
    prizeDistribution: [
      { position: 1, percentageShare: 50 },
      { position: 2, percentageShare: 30 },
      { position: 3, percentageShare: 20 },
    ],
  });

  // Set default dates when component mounts
  useState(() => {
    const now = new Date();
    const weekLater = new Date();
    weekLater.setDate(now.getDate() + 7);

    setFormData((prev) => ({
      ...prev,
      startDate: now.toISOString().slice(0, 16), // Format: YYYY-MM-DDTHH:MM
      endDate: weekLater.toISOString().slice(0, 16),
    }));
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));

    // Clear validation error for this field
    if (validation[name]) {
      setValidation((prev) => {
        const newValidation = { ...prev };
        delete newValidation[name];
        return newValidation;
      });
    }
  };

  const handlePrizeDistributionChange = (index: number, value: number) => {
    const newPrizeDistribution = [...formData.prizeDistribution];
    newPrizeDistribution[index].percentageShare = value;

    setFormData((prev) => ({
      ...prev,
      prizeDistribution: newPrizeDistribution,
    }));

    // Clear validation error
    if (validation["prizeDistribution"]) {
      setValidation((prev) => {
        const newValidation = { ...prev };
        delete newValidation["prizeDistribution"];
        return newValidation;
      });
    }
  };

  const addPrizePosition = () => {
    // Don't add more than 10 prize positions
    if (formData.prizeDistribution.length >= 10) return;

    const newPosition = formData.prizeDistribution.length + 1;

    setFormData((prev) => ({
      ...prev,
      prizeDistribution: [
        ...prev.prizeDistribution,
        { position: newPosition, percentageShare: 5 },
      ],
    }));

    // Redistribute percentages
    adjustPrizePercentages();
  };

  const removePrizePosition = () => {
    // Don't remove if only 1 prize position
    if (formData.prizeDistribution.length <= 1) return;

    const newPrizeDistribution = formData.prizeDistribution.slice(0, -1);

    setFormData((prev) => ({
      ...prev,
      prizeDistribution: newPrizeDistribution,
    }));

    // Redistribute percentages
    adjustPrizePercentages();
  };

  const adjustPrizePercentages = () => {
    // Ensure percentages add up to 100%
    setTimeout(() => {
      const total = formData.prizeDistribution.reduce(
        (sum, prize) => sum + prize.percentageShare,
        0
      );

      if (Math.abs(total - 100) > 0.01) {
        // Adjust the first prize to make total 100%
        const newPrizeDistribution = [...formData.prizeDistribution];
        newPrizeDistribution[0].percentageShare += 100 - total;

        setFormData((prev) => ({
          ...prev,
          prizeDistribution: newPrizeDistribution,
        }));
      }
    }, 100);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Basic validation
    if (!formData.name) errors.name = "League name is required";
    if (!formData.gameweek) errors.gameweek = "Gameweek is required";
    if (!formData.entryFee) errors.entryFee = "Entry fee is required";
    if (!formData.maxParticipants)
      errors.maxParticipants = "Max participants is required";
    if (!formData.startDate) errors.startDate = "Start date is required";
    if (!formData.endDate) errors.endDate = "End date is required";

    // Prize distribution validation
    const total = formData.prizeDistribution.reduce(
      (sum, prize) => sum + prize.percentageShare,
      0
    );

    if (Math.abs(total - 100) > 0.01) {
      errors.prizeDistribution = "Prize percentages must add up to 100%";
    }

    // Return true if no errors
    setValidation(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!validateForm()) {
      return;
    }
  
    setLoading(true);
    setError(null);
  
    try {
      // Set the end date to be at least 2 weeks after the start date to ensure it's after gameweek deadline
      const startDateObj = new Date(formData.startDate);
      const endDateObj = new Date(startDateObj);
      endDateObj.setDate(startDateObj.getDate() + 14); // Add 14 days to ensure it's after the gameweek
  
      // Create a copy of formData with properly formatted dates and adjusted end date
      const formattedData = {
        ...formData,
        startDate: startDateObj.toISOString(),
        endDate: endDateObj.toISOString(),
      };
  
      console.log("Submitting data with formatted dates:", formattedData);
  
      const response = await fetch("/api/leagues/weekly/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formattedData),
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Server validation errors:", errorData);
        
        if (errorData?.details) {
          // Handle structured validation errors
          const validationErrors: Record<string, string> = {};
          Object.entries(errorData.details).forEach(([key, value]) => {
            if (key === "_errors") return; // Skip top-level errors array
            if (typeof value === 'object' && value !== null && '_errors' in value) {
              const errors = (value as { _errors: string[] })._errors;
              validationErrors[key] = errors[0] || "Invalid value";
            }
          });
          setValidation(validationErrors);
          throw new Error("Please fix the form errors and try again");
        } else {
          throw new Error(errorData?.error || `Server error: ${response.status}`);
        }
      }
  
      const league = await response.json();
  
      // Redirect to the new league page
      router.push(`/leagues/weekly/${league.id}`);
    } catch (err: any) {
      console.error("Error creating league:", err);
      setError(err.message || "Failed to create league. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const totalPercentage = formData.prizeDistribution
    .reduce((sum, prize) => sum + prize.percentageShare, 0)
    .toFixed(1);

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <div className="mb-6">
        <Link href="/leagues/weekly">
          <Button variant="ghost" className="pl-0">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Leagues
          </Button>
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">Create Weekly League</h1>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>League Details</CardTitle>
            <CardDescription>
              Set up your weekly cash league contest
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md flex items-start">
                <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">League Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Gameweek 30 Cash League"
                className={validation.name ? "border-red-300" : ""}
              />
              {validation.name && (
                <p className="text-sm text-red-500">{validation.name}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gameweek">Gameweek</Label>
                <Input
                  id="gameweek"
                  name="gameweek"
                  type="number"
                  min="1"
                  max="38"
                  value={formData.gameweek}
                  onChange={handleInputChange}
                  className={validation.gameweek ? "border-red-300" : ""}
                />
                {validation.gameweek && (
                  <p className="text-sm text-red-500">{validation.gameweek}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="entryFee">Entry Fee</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    $
                  </span>
                  <Input
                    id="entryFee"
                    name="entryFee"
                    type="number"
                    min="1"
                    max="1000"
                    step="0.01"
                    value={formData.entryFee}
                    onChange={handleInputChange}
                    className={`pl-7 ${
                      validation.entryFee ? "border-red-300" : ""
                    }`}
                  />
                </div>
                {validation.entryFee && (
                  <p className="text-sm text-red-500">{validation.entryFee}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxParticipants">Maximum Participants</Label>
              <Input
                id="maxParticipants"
                name="maxParticipants"
                type="number"
                min="2"
                max="10000"
                value={formData.maxParticipants}
                onChange={handleInputChange}
                className={validation.maxParticipants ? "border-red-300" : ""}
              />
              {validation.maxParticipants && (
                <p className="text-sm text-red-500">
                  {validation.maxParticipants}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className={validation.startDate ? "border-red-300" : ""}
                />
                {validation.startDate && (
                  <p className="text-sm text-red-500">{validation.startDate}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className={validation.endDate ? "border-red-300" : ""}
                />
                {validation.endDate && (
                  <p className="text-sm text-red-500">{validation.endDate}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Prize Distribution</Label>
                <div className="text-sm bg-blue-50 px-2 py-1 rounded-md flex items-center">
                  <Info className="h-4 w-4 mr-1 text-blue-500" />
                  Total: {totalPercentage}%
                  {Math.abs(parseFloat(totalPercentage) - 100) > 0.01 && (
                    <span className="text-red-500 ml-1">(Must be 100%)</span>
                  )}
                </div>
              </div>

              {validation.prizeDistribution && (
                <p className="text-sm text-red-500">
                  {validation.prizeDistribution}
                </p>
              )}

              <div className="space-y-3">
                {formData.prizeDistribution.map((prize, index) => (
                  <div
                    key={prize.position}
                    className="flex items-center space-x-3"
                  >
                    <div className="w-20">
                      <div className="text-sm font-medium">
                        {prize.position}
                        {getPositionSuffix(prize.position)} Place
                      </div>
                    </div>
                    <div className="flex-1">
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={prize.percentageShare}
                        onChange={(e) =>
                          handlePrizeDistributionChange(
                            index,
                            Number(e.target.value)
                          )
                        }
                        className="w-full"
                      />
                    </div>
                    <div className="w-8 text-center">%</div>
                  </div>
                ))}
              </div>

              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPrizePosition}
                  disabled={formData.prizeDistribution.length >= 10}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Position
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={removePrizePosition}
                  disabled={formData.prizeDistribution.length <= 1}
                >
                  <Minus className="h-4 w-4 mr-1" /> Remove Position
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/leagues/weekly")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create League"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
