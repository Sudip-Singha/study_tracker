import type { Database } from "./database.types";

export type Exam = Database["public"]["Tables"]["exams"]["Row"];
export type Subject = Database["public"]["Tables"]["subjects"]["Row"];
export type Chapter = Database["public"]["Tables"]["chapters"]["Row"];
export type Topic = Database["public"]["Tables"]["topics"]["Row"];
export type StudySession = Database["public"]["Tables"]["study_sessions"]["Row"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
