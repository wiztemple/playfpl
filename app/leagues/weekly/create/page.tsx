// /app/leagues/weekly/create/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Info, AlertTriangle, Sparkles, Trophy, DollarSign, Users, Calendar } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { motion } from "framer-motion";

export default function CreateLeaguePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<Record<string, string>>({});

  // Update form state
  const [formData, setFormData] = useState({
    name: "",
    gameweek: 30,
    entryFee: 10,
    maxParticipants: 100,
    startDate: "",
    leagueType: "tri" as "tri" | "duo" | "jackpot",
    prizeDistribution: [
      { position: 1, percentageShare: 50 },
      { position: 2, percentageShare: 30 },
      { position: 3, percentageShare: 20 },
    ],
  });

  // Add handler for league type change
  const handleLeagueTypeChange = (value: "tri" | "duo" | "jackpot") => {
    setFormData(prev => ({
      ...prev,
      leagueType: value,
      prizeDistribution: getDefaultPrizeDistribution(value)
    }));
  };

  // Helper function to get default prize distribution
  const getDefaultPrizeDistribution = (type: "tri" | "duo" | "jackpot") => {
    switch (type) {
      case "tri":
        return [
          { position: 1, percentageShare: 50 },
          { position: 2, percentageShare: 30 },
          { position: 3, percentageShare: 20 },
        ];
      case "duo":
        return [
          { position: 1, percentageShare: 60 },
          { position: 2, percentageShare: 40 },
        ];
      case "jackpot":
        return [
          { position: 1, percentageShare: 100 },
        ];
    }
  };

  // Set default dates when component mounts
  useEffect(() => {
    const now = new Date();
    setFormData((prev) => ({
      ...prev,
      startDate: now.toISOString().slice(0, 16), // Format: YYYY-MM-DDTHH:MM
    }));
  }, []);

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

  // Update the validateForm function
  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Basic validation
    if (!formData.name) errors.name = "League name is required";
    if (!formData.gameweek) errors.gameweek = "Gameweek is required";
    if (!formData.entryFee) errors.entryFee = "Entry fee is required";
    if (!formData.maxParticipants)
      errors.maxParticipants = "Max participants is required";
    if (!formData.startDate) errors.startDate = "Start date is required";

    // Prize distribution validation based on league type
    const expectedPositions = formData.leagueType === 'tri' ? 3
      : formData.leagueType === 'duo' ? 2
        : 1;

    if (formData.prizeDistribution.length !== expectedPositions) {
      errors.prizeDistribution = `Prize distribution must have ${expectedPositions} positions for ${formData.leagueType} league type`;
    }

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
      // Format the data for submission
      const formattedData = {
        name: formData.name,
        gameweek: formData.gameweek,
        entryFee: formData.entryFee,
        maxParticipants: formData.maxParticipants,
        startDate: new Date(formData.startDate).toISOString(),
        leagueType: formData.leagueType,
        prizeDistribution: formData.prizeDistribution,
      };

      console.log("Submitting data:", formattedData);

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
          const validationErrors: Record<string, string> = {};
          
          // Handle top-level errors
          if (errorData.details._errors?.length > 0) {
            validationErrors.form = errorData.details._errors[0];
          }
          
          // Handle field-specific errors
          Object.entries(errorData.details).forEach(([key, value]) => {
            if (key === "_errors") return;
            if (typeof value === 'object' && value !== null && '_errors' in value) {
              const errors = (value as { _errors: string[] })._errors;
              if (errors?.length > 0) {
                validationErrors[key] = errors[0];
              }
            }
          });
          
          setValidation(validationErrors);
          throw new Error(validationErrors.form || "Please fix the form errors and try again");
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
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="container mx-auto py-12 px-4 max-w-3xl">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <Link href="/leagues/weekly">
            <Button variant="ghost" className="pl-0 text-gray-400 hover:text-indigo-400 hover:bg-transparent">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to Leagues
            </Button>
          </Link>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-3xl font-bold mb-8 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
        >
          Create Weekly League
        </motion.h1>

        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          onSubmit={handleSubmit}
        >
          <Card className="bg-gray-900 border border-gray-800 overflow-hidden backdrop-blur-sm relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-xl pointer-events-none"></div>
            
            <CardHeader className="relative z-10 border-b border-gray-800">
              <CardTitle className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                League Details
              </CardTitle>
              <CardDescription className="text-gray-400">
                Set up your weekly cash league contest
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6 relative z-10 pt-6">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-900/30 border border-red-800/50 text-red-300 p-4 rounded-lg flex items-start"
                >
                  <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-red-400" />
                  <p>{error}</p>
                </motion.div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300">League Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Gameweek 30 Cash League"
                  className={`bg-gray-800/50 border-gray-700 text-gray-200 focus:border-indigo-600 focus:ring-indigo-600/20 ${validation.name ? "border-red-700 focus:border-red-700" : ""}`}
                />
                {validation.name && (
                  <p className="text-sm text-red-400">{validation.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="leagueType" className="text-gray-300">League Type</Label>
                <Select
                  value={formData.leagueType}
                  onValueChange={handleLeagueTypeChange}
                >
                  <SelectTrigger className="w-full bg-gray-800/50 border-gray-700 text-gray-200 focus:border-indigo-600 focus:ring-indigo-600/20">
                    <SelectValue placeholder="Select league type" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-gray-200">
                    <SelectItem value="tri" className="focus:bg-indigo-900/50 focus:text-white">
                      <div className="flex items-center">
                        <Trophy className="h-4 w-4 mr-2 text-yellow-500" />
                        <span>Top 3 Winners (50/30/20)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="duo" className="focus:bg-indigo-900/50 focus:text-white">
                      <div className="flex items-center">
                        <Trophy className="h-4 w-4 mr-2 text-indigo-400" />
                        <span>Top 2 Winners (60/40)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="jackpot" className="focus:bg-indigo-900/50 focus:text-white">
                      <div className="flex items-center">
                        <Trophy className="h-4 w-4 mr-2 text-purple-400" />
                        <span>Winner Takes All (100%)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {validation.leagueType && (
                  <p className="text-sm text-red-400">{validation.leagueType}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div 
                  className="space-y-6"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="gameweek" className="text-gray-300">Gameweek</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-indigo-400" />
                      <Input
                        id="gameweek"
                        name="gameweek"
                        type="number"
                        min="1"
                        max="38"
                        value={formData.gameweek}
                        onChange={handleInputChange}
                        className={`pl-10 bg-gray-800/50 border-gray-700 text-gray-200 focus:border-indigo-600 focus:ring-indigo-600/20 ${validation.gameweek ? "border-red-700 focus:border-red-700" : ""}`}
                      />
                    </div>
                    {validation.gameweek && (
                      <p className="text-sm text-red-400">{validation.gameweek}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="entryFee" className="text-gray-300">Entry Fee</Label>
                    <div className="relative">
                      <Input
                        id="entryFee"
                        name="entryFee"
                        type="number"
                        min="1"
                        max="20000"
                        step="0.01"
                        value={formData.entryFee}
                        onChange={handleInputChange}
                        className={`bg-gray-800/50 border-gray-700 text-gray-200 focus:border-indigo-600 focus:ring-indigo-600/20 ${validation.entryFee ? "border-red-700 focus:border-red-700" : ""}`}
                      />
                    </div>
                    {validation.entryFee && (
                      <p className="text-sm text-red-400">{validation.entryFee}</p>
                    )}
                  </div>
                </motion.div>

                <motion.div 
                  className="space-y-6"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="maxParticipants" className="text-gray-300">Maximum Participants</Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-400" />
                      <Input
                        id="maxParticipants"
                        name="maxParticipants"
                        type="number"
                        min="2"
                        max="10000"
                        value={formData.maxParticipants}
                        onChange={handleInputChange}
                        className={`pl-10 bg-gray-800/50 border-gray-700 text-gray-200 focus:border-indigo-600 focus:ring-indigo-600/20 ${validation.maxParticipants ? "border-red-700 focus:border-red-700" : ""}`}
                      />
                    </div>
                    {validation.maxParticipants && (
                      <p className="text-sm text-red-400">
                        {validation.maxParticipants}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="text-gray-300">Start Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-cyan-400" />
                      <Input
                        id="startDate"
                        name="startDate"
                        type="datetime-local"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        className={`pl-10 bg-gray-800/50 border-gray-700 text-gray-200 focus:border-indigo-600 focus:ring-indigo-600/20 ${validation.startDate ? "border-red-700 focus:border-red-700" : ""}`}
                      />
                    </div>
                    {validation.startDate && (
                      <p className="text-sm text-red-400">{validation.startDate}</p>
                    )}
                  </div>
                </motion.div>
              </div>

              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700 p-5 rounded-lg backdrop-blur-sm mt-8"
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <Sparkles className="h-4 w-4 mr-2 text-yellow-400" />
                    <Label className="text-gray-200 font-medium">Prize Distribution</Label>
                  </div>
                  <div className="text-sm bg-indigo-900/30 px-3 py-1.5 rounded-full flex items-center border border-indigo-800/50">
                    <Info className="h-4 w-4 mr-1 text-indigo-400" />
                    <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent font-medium">
                      Total: {totalPercentage}%
                    </span>
                  </div>
                </div>

                {validation.prizeDistribution && (
                  <p className="text-sm text-red-400 mb-4">
                    {validation.prizeDistribution}
                  </p>
                )}

                <div className="space-y-3">
                  {formData.prizeDistribution.map((prize, index) => (
                    <motion.div
                      key={prize.position}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 * index }}
                      className="flex items-center space-x-3 p-3 rounded-lg bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-800"
                    >
                      <div className="w-20 flex items-center">
                        <Trophy className={`h-4 w-4 mr-2 ${
                          prize.position === 1 ? "text-yellow-500" :
                          prize.position === 2 ? "text-gray-400" :
                          prize.position === 3 ? "text-amber-700" : "text-gray-500"
                        }`} />
                        <div className="text-sm font-medium text-gray-300">
                          {formData.leagueType === 'jackpot'
                            ? 'Winner'
                            : `${prize.position}${getPositionSuffix(prize.position)} Place`}
                        </div>
                      </div>
                      <div className="flex-1">
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          value={prize.percentageShare}
                          readOnly
                          className="w-full bg-gray-800/50 border-gray-700 text-gray-200"
                        />
                      </div>
                      <div className="w-8 text-center text-gray-400">%</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </CardContent>
            
            <CardFooter className="flex justify-between pt-6 pb-6 relative z-10 border-t border-gray-800">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/leagues/weekly")}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-indigo-400"
                >
                  Cancel
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-0"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Creating...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Create League
                    </div>
                  )}
                </Button>
              </motion.div>
            </CardFooter>
          </Card>
        </motion.form>
      </div>
    </div>
  );
}
