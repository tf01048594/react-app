import { z } from "zod";

export const createSettingSchema = z.object({
  name: z.string().min(1),
  key: z.string().min(1),
  value: z.string().optional(),
  description: z.string().optional()
});