import { z } from "zod";

export const planSchema = z.object({
  name: z.string().min(1, "Plan name is required"),
  buildingPrice: z.number().min(0, "Building price must be positive"),
  managerPrice: z.number().min(0, "Manager price must be positive"),
  features: z.object({
    maxBuildings: z
      .number()
      .min(1, "Must allow at least 1 building")
      .optional(),
    maxManagers: z.number().min(1, "Must allow at least 1 manager").optional(),
    maxUnits: z.number().min(1, "Must allow at least 1 unit").optional(),
  }),
});

export type PlanSchema = z.output<typeof planSchema>;
