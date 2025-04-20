"use client";

import { useState, useEffect, useActionState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Info,
  AlertTriangle,
  Sparkles,
  Trophy,
  Users,
  Calendar,
  ShieldAlert,
  Loader2,
} from "lucide-react";
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
import { getPositionSuffix } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { motion } from "framer-motion";
import { useFormStatus } from "react-dom";
import {
  createLeagueAction,
  CreateLeagueActionState,
} from "@/app/actions/leagueActions";
import { toast } from "sonner";

interface GameweekData {
  id: number;
  name: string;
  deadline_time: string;
  is_current: boolean;
  is_next: boolean;
  finished: boolean;
}

interface GameweekInfo {
  current: GameweekData | null;
  next: GameweekData | null;
  loading: boolean;
  error: string | null;
}

function SubmitButton() {
  const { pending } = useFormStatus(); // Hook to get pending state from form action
  return (
    <Button
      type="submit" // Keep as submit for form action
      disabled={pending}
      aria-disabled={pending}
      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-0 w-[160px]" // Adjusted width
    >
      {pending ? (
        <div className="flex items-center justify-center">
          {" "}
          <Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating...{" "}
        </div>
      ) : (
        <div className="flex items-center justify-center">
          {" "}
          <Sparkles className="h-4 w-4 mr-2" /> Create League{" "}
        </div>
      )}
    </Button>
  );
}

export default function CreateLeaguePage() {
  const router = useRouter();
  const [validationErrors, setValidationErrors] = useState<Record<
    string,
    string[] | undefined
  > | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminChecking, setAdminChecking] = useState(true);

  const [gameweekInfo, setGameweekInfo] = useState<GameweekInfo>({
    current: null,
    next: null,
    loading: true,
    error: null,
  });

  const initialState: CreateLeagueActionState = {
    success: false,
    message: null,
    errors: null,
    leagueId: null,
  };

  const [formState, formAction] = useActionState(
    createLeagueAction,
    initialState
  );

  // Update form state
  const [formData, setFormData] = useState({
    name: "",
    gameweek: 1,
    entryFee: 200,
    maxParticipants: 100,
    startDate: "",
    leagueType: "tri" as "tri" | "duo" | "jackpot",
    prizeDistribution: [
      { position: 1, percentageShare: 50 },
      { position: 2, percentageShare: 30 },
      { position: 3, percentageShare: 20 },
    ],
  });

  // Fetch current gameweek when component mounts
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const defaultDateTimeLocal = `${year}-${month}-${day}T${hours}:${minutes}`;
    setFormData((prev) => ({ ...prev, startDate: defaultDateTimeLocal }));

    const fetchGameweekInfo = async () => {
      try {
        const res = await fetch("/api/gameweek/info");
        if (!res.ok) throw new Error();
        const data = await res.json();
        const gw = data.next?.id || data.current?.id || 1;
        setGameweekInfo({
          current: data.current,
          next: data.next,
          loading: false,
          error: null,
        });
        setFormData((prev) => ({ ...prev, gameweek: gw }));
      } catch (error) {
        console.error("Fetch GW error:", error);
        setGameweekInfo((prev) => ({
          ...prev,
          loading: false,
          error: "Failed",
        }));
      }
    };
    fetchGameweekInfo();
  }, []);

  useEffect(() => {
    async function checkAdminStatus() {
      /* ... fetch /api/user/admin-status logic ... */
      try {
        const res = await fetch("/api/user/admin-status");
        const data = await res.json();
        setIsAdmin(data.isAdmin);
        if (!data.isAdmin) router.push("/leagues/weekly");
      } catch (error) {
        router.push("/leagues/weekly");
      } finally {
        setAdminChecking(false);
      }
    }
    checkAdminStatus();
  }, [router]);

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
        return [{ position: 1, percentageShare: 100 }];
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

  // Handle Server Action Result (formState changes)
  useEffect(() => {
    console.log("Form State Changed:", formState);

    // Check if the formState indicates a completed action
    // (i.e., not the initial state where message/errors/fieldErrors are all null)
    const hasActionResult =
      formState &&
      (formState.success === true ||
        formState.message ||
        formState.errors ||
        formState.fieldErrors);

    if (hasActionResult) {
      if (formState.success && formState.leagueId) {
        // SUCCESS from action
        toast.success("League Created!", {
          description: formState.message || `League created successfully.`,
        });
        // Perform client-side redirect AFTER showing toast
        router.push(`/leagues/weekly/${formState.leagueId}`);
      } else if (!formState.success) {
        // FAILURE from action
        setValidationErrors(formState.fieldErrors ?? null); // Update validation errors state
        // Show specific message from action, or fallback for validation errors
        toast.error("League Creation Failed", {
          description:
            formState.message ||
            "Please check the form errors highlighted below.",
        });
      }
    } else {
      // This is the initial state or an empty reset state, clear client errors
      setValidationErrors(null);
      console.log("Ignoring initial/empty form state.");
    }
  }, [formState, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
    setValidationErrors((prev) => ({ ...prev, [name]: undefined })); // Clear validation on input change
  };

  const handleLeagueTypeChange = (value: "tri" | "duo" | "jackpot") => {
    setFormData((prev) => ({
      ...prev,
      leagueType: value,
      prizeDistribution: getDefaultPrizeDistribution(value),
    }));
    setValidationErrors((prev) => ({ ...prev, prizeDistribution: undefined })); // Clear prize validation
  };
  const handleGameweekSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, gameweek: parseInt(value) }));
    setValidationErrors((prev) => ({ ...prev, gameweek: undefined }));
  };
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, startDate: e.target.value }));
    setValidationErrors((prev) => ({ ...prev, startDate: undefined }));
  };

  const totalPercentage = formData.prizeDistribution
    .reduce((s, p) => s + p.percentageShare, 0)
    .toFixed(1);

  if (adminChecking) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl">Checking authorization...</p>
        </div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-900 border border-gray-800">
          <CardHeader>
            <div className="flex items-center text-red-400 mb-2">
              <ShieldAlert className="h-6 w-6 mr-2" />
              <CardTitle>Unauthorized Access</CardTitle>
            </div>
            <CardDescription className="text-gray-400">
              You don't have permission to create leagues.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              onClick={() => router.push("/leagues/weekly")}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              Return to Leagues
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

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
            <Button
              variant="ghost"
              className="pl-0 text-gray-400 hover:text-indigo-400 hover:bg-transparent"
            >
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
          action={formAction}
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
              <input
                type="hidden"
                name="gameweek"
                value={formData.gameweek || ""}
              />
              <input
                type="hidden"
                name="leagueType"
                value={formData.leagueType}
              />
              {formState?.success === false &&
                formState.message &&
                !formState.fieldErrors && (
                  <div className="bg-red-900/30 border border-red-800/50 text-red-300 p-3 rounded-lg text-sm flex items-start">
                    <AlertTriangle className="h-4 w-4 mr-2 mt-0.5" />
                    {formState.message}
                  </div>
                )}

              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300">
                  League Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Gameweek 30 Cash League"
                  className={`bg-gray-800/50 border-gray-700 text-gray-200 focus:border-indigo-600 focus:ring-indigo-600/20 ${
                    validationErrors?.name
                      ? "border-red-700 focus:border-red-700"
                      : ""
                  }`}
                />
                {validationErrors?.name && (
                  <p className="text-sm text-red-400">
                    {validationErrors?.name[0]}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="leagueType" className="text-gray-300">
                  League Type
                </Label>
                <Select
                  value={formData.leagueType}
                  onValueChange={handleLeagueTypeChange}
                >
                  <SelectTrigger className="w-full bg-gray-800/50 border-gray-700 text-gray-200 focus:border-indigo-600 focus:ring-indigo-600/20">
                    <SelectValue placeholder="Select league type" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-gray-200">
                    <SelectItem
                      value="tri"
                      className="focus:bg-indigo-900/50 focus:text-white"
                    >
                      <div className="flex items-center">
                        <Trophy className="h-4 w-4 mr-2 text-yellow-500" />
                        <span>Top 3 Winners (50/30/20)</span>
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="duo"
                      className="focus:bg-indigo-900/50 focus:text-white"
                    >
                      <div className="flex items-center">
                        <Trophy className="h-4 w-4 mr-2 text-indigo-400" />
                        <span>Top 2 Winners (60/40)</span>
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="jackpot"
                      className="focus:bg-indigo-900/50 focus:text-white"
                    >
                      <div className="flex items-center">
                        <Trophy className="h-4 w-4 mr-2 text-purple-400" />
                        <span>Winner Takes All (100%)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {validationErrors?.leagueType && (
                  <p className="text-sm text-red-400">
                    {validationErrors?.leagueType[0]}
                  </p>
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
                    <Label htmlFor="gameweek" className="text-gray-300">
                      Gameweek
                    </Label>
                    <div className="relative">
                      <Select
                        value={String(formData.gameweek)}
                        onValueChange={(value) => {
                          setFormData((prev) => ({
                            ...prev,
                            gameweek: parseInt(value),
                          }));
                          // Clear validation error for this field if any
                          if (validationErrors?.gameweek) {
                            setValidationErrors((prev) => {
                              const newValidation = { ...prev };
                              delete newValidation.gameweek;
                              return newValidation;
                            });
                          }
                        }}
                        disabled={gameweekInfo.loading}
                      >
                        <SelectTrigger
                          className={`w-full pl-10 bg-gray-800/50 border-gray-700 text-gray-200 focus:border-indigo-600 focus:ring-indigo-600/20 ${
                            validationErrors?.gameweek
                              ? "border-red-700 focus:border-red-700"
                              : ""
                          }`}
                        >
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-indigo-400" />
                          <SelectValue placeholder="Select gameweek" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700 text-gray-200">
                          {gameweekInfo.loading ? (
                            <SelectItem value="loading" disabled>
                              Loading gameweeks...
                            </SelectItem>
                          ) : (
                            // Only show current and future gameweeks
                            Array.from({ length: 38 }, (_, i) => i + 1)
                              .filter((gw) => {
                                // Filter out past gameweeks
                                const currentGw = gameweekInfo.current?.id || 1;
                                return gw >= currentGw;
                              })
                              .map((gw) => (
                                <SelectItem key={gw} value={String(gw)}>
                                  {`Gameweek ${gw}`}
                                  {gw === gameweekInfo.current?.id &&
                                    " (Current)"}
                                  {gw === gameweekInfo.next?.id && " (Next)"}
                                </SelectItem>
                              ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    {validationErrors?.gameweek && (
                      <p className="text-sm text-red-400">
                        {validationErrors.gameweek[0]}
                      </p>
                    )}

                    {/* Informational note */}
                    <div className="text-xs text-indigo-300 flex items-start mt-1">
                      <Info className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                      <span>
                        {gameweekInfo.next
                          ? `Next gameweek (${
                              gameweekInfo.next.id
                            }) starts ${new Date(
                              gameweekInfo.next.deadline_time
                            ).toLocaleDateString()}`
                          : gameweekInfo.current
                          ? `Current gameweek is ${gameweekInfo.current.id}`
                          : ""}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="entryFee" className="text-gray-300">
                      Entry Fee
                    </Label>
                    <div className="relative">
                      <Input
                        id="entryFee"
                        name="entryFee"
                        type="number"
                        min="1"
                        max="20000"
                        step="0.01"
                        value={formData.entryFee || ""}
                        onChange={handleInputChange}
                        className={`bg-gray-800/50 border-gray-700 text-gray-200 focus:border-indigo-600 focus:ring-indigo-600/20 ${
                          validationErrors?.entryFee
                            ? "border-red-700 focus:border-red-700"
                            : ""
                        }`}
                      />
                    </div>
                    {validationErrors?.entryFee && (
                      <p className="text-sm text-red-400">
                        {validationErrors.entryFee[0]}
                      </p>
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
                    <Label htmlFor="maxParticipants" className="text-gray-300">
                      Maximum Participants
                    </Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-400" />
                      <Input
                        id="maxParticipants"
                        name="maxParticipants"
                        type="number"
                        min="2"
                        max="10000"
                        value={formData.maxParticipants || ""}
                        onChange={handleInputChange}
                        className={`pl-10 bg-gray-800/50 border-gray-700 text-gray-200 focus:border-indigo-600 focus:ring-indigo-600/20 ${
                          validationErrors?.maxParticipants
                            ? "border-red-700 focus:border-red-700"
                            : ""
                        }`}
                      />
                    </div>
                    {validationErrors?.maxParticipants && (
                      <p className="text-sm text-red-400">
                        {validationErrors.maxParticipants[0]}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="text-gray-300">
                      Start Date
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-cyan-400" />
                      <Input
                        id="startDate"
                        name="startDate"
                        type="datetime-local"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        className={`pl-10 bg-gray-800/50 border-gray-700 text-gray-200 focus:border-indigo-600 focus:ring-indigo-600/20 ${
                          validationErrors?.startDate
                            ? "border-red-700 focus:border-red-700"
                            : ""
                        }`}
                      />
                    </div>
                    {validationErrors?.startDate && (
                      <p className="text-sm text-red-400">
                        {validationErrors.startDate}
                      </p>
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
                    <Label className="text-gray-200 font-medium">
                      Prize Distribution
                    </Label>
                  </div>
                  <div className="text-sm bg-indigo-900/30 px-3 py-1.5 rounded-full flex items-center border border-indigo-800/50">
                    <Info className="h-4 w-4 mr-1 text-indigo-400" />
                    <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent font-medium">
                      Total: {totalPercentage}%
                    </span>
                  </div>
                </div>
                {validationErrors?.prizeDistribution && (
                  <p className="text-sm text-red-400 mb-4">
                    {validationErrors.prizeDistribution[0]}
                  </p>
                )}

                <div className="space-y-3">
                  {formData.prizeDistribution.map((prize, index) => (
                    <motion.div key={index} /* ... */>
                      {/* Position Label */}
                      <Label className="w-20 flex items-center">
                        {" "}
                        <Trophy />{" "}
                        {formData.leagueType === "jackpot"
                          ? "Winner"
                          : `${prize.position}${getPositionSuffix(
                              prize.position
                            )} Place`}{" "}
                      </Label>
                      {/* Hidden inputs for Server Action */}
                      <input
                        type="hidden"
                        name={`prizeDistribution[${index}].position`}
                        value={prize.position}
                      />
                      <input
                        type="hidden"
                        name={`prizeDistribution[${index}].percentageShare`}
                        value={prize.percentageShare}
                      />
                      {/* Readonly display */}
                      <Input
                        type="number"
                        value={prize.percentageShare}
                        readOnly
                        className="..."
                      />
                      <div className="w-8 text-center">%</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </CardContent>

            <CardFooter className="flex justify-between pt-6 pb-6 relative z-10 border-t border-gray-800">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/admin/leagues")}
                  className="..."
                >
                  {" "}
                  Cancel{" "}
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <SubmitButton />
              </motion.div>
            </CardFooter>
          </Card>
        </motion.form>
      </div>
    </div>
  );
}
