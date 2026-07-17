import { z } from "zod";

export const prioritySchema = z.enum(["low", "medium", "high"]);
export const difficultySchema = z.enum(["easy", "medium", "hard"]);
