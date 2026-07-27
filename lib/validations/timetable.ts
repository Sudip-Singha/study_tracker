import { z } from "zod";

export const timeBlockSchema = z.object({
  day_of_week: z.coerce.number().min(0).max(6),
  start_time: z.string().regex(/^(0[6-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, "Must be between 06:00 and 23:59"),
  end_time: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, "Must be HH:MM"),
  activity: z.string().min(1, "Activity is required"),
  color: z.string().optional(),
  repeat_mon_to_sat: z.boolean().optional(),
}).refine(data => data.start_time < data.end_time, {
  message: "End time must be after start time",
  path: ["end_time"],
});

export type TimeBlockFormValues = z.infer<typeof timeBlockSchema>;
