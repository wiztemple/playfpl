import { z } from "zod";

export const createLeagueSchema = z.object({
  name: z.string().min(3).max(100),
  gameweek: z.number().int().positive(),
  entryFee: z.number().positive().max(1000),
  maxParticipants: z.number().int().positive().max(10000),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  prizeDistribution: z
    .array(
      z.object({
        position: z.number().int().positive(),
        percentageShare: z.number().positive(),
      })
    )
    .refine(
      (data) => {
        const total = data.reduce(
          (sum, prize) => sum + prize.percentageShare,
          0
        );
        return Math.abs(total - 100) < 0.01; // Allow for floating point imprecision
      },
      {
        message: "Prize distribution must total 100%",
      }
    ),
});
