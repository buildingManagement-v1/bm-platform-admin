import { z } from "zod";

export const planSchema = z.object({
  name: z.string().min(1, "Plan name is required"),
  price: z.number().min(0, "Price must be positive"),
  type: z.enum(["public", "custom"]),
  features: z.object({
    maxBuildings: z.number().min(1, "Must allow at least 1 building"),
    maxUnits: z.number().min(1, "Must allow at least 1 unit"),
    maxManagers: z.number().min(1, "Must allow at least 1 manager"),
    premiumFeatures: z.array(z.string()),
  }),
});

export type PlanSchema = z.output<typeof planSchema>;
