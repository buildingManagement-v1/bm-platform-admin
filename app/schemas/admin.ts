import { z } from "zod";

const adminRoleEnum = z.enum([
  "super_admin",
  "user_manager",
  "analytics_viewer",
  "system_manager",
  "billing_manager",
]);

export const createAdminSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  roles: z.array(adminRoleEnum).min(1, "At least one role is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const updateAdminSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email address").optional(),
  roles: z
    .array(adminRoleEnum)
    .min(1, "At least one role is required")
    .optional(),
});

export type CreateAdminInput = z.infer<typeof createAdminSchema>;
export type UpdateAdminInput = z.infer<typeof updateAdminSchema>;
