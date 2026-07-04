import { z } from "zod";

export const appVersionSchema = z.object({
  androidMinimumVersion: z.string().min(1, "Required"),
  androidLatestVersion: z.string().min(1, "Required"),
  iosMinimumVersion: z.string().min(1, "Required"),
  iosLatestVersion: z.string().min(1, "Required"),
  versionDescription: z.string(),
  lastForceUpdateVersion: z.string().min(1, "Required"),
  isOptional: z.boolean(),
});

export type AppVersionSchema = z.output<typeof appVersionSchema>;
