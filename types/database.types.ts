/**
 * Hand-authored to match supabase/migrations/0001_init.sql exactly.
 * Once the project is linked to a real Supabase instance, regenerate with:
 *   npx supabase gen types typescript --linked > types/database.types.ts
 */

export type Priority = "low" | "medium" | "high";
export type Difficulty = "easy" | "medium" | "hard";
export type ExamStatus = "planned" | "active" | "completed" | "archived";
export type TopicStatus = "not_started" | "in_progress" | "completed" | "skipped";
export type TaskStatus = "todo" | "done";

export interface TopicResources {
  video_links: string[];
  pdf_links: string[];
  question_links: string[];
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      exams: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          target_date: string | null;
          priority: Priority;
          status: ExamStatus;
          expected_marks: number | null;
          weightage: number;
          completion_pct: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["exams"]["Row"]> & {
          user_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["exams"]["Row"]>;
      };
      subjects: {
        Row: {
          id: string;
          exam_id: string;
          user_id: string;
          name: string;
          estimated_hours: number | null;
          actual_hours: number;
          priority: Priority;
          weightage: number;
          completion_pct: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["subjects"]["Row"]> & {
          exam_id: string;
          user_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["subjects"]["Row"]>;
      };
      chapters: {
        Row: {
          id: string;
          subject_id: string;
          user_id: string;
          name: string;
          estimated_time: number | null;
          actual_time: number;
          weightage: number;
          difficulty: Difficulty;
          notes: string | null;
          completion_pct: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["chapters"]["Row"]> & {
          subject_id: string;
          user_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["chapters"]["Row"]>;
      };
      topics: {
        Row: {
          id: string;
          chapter_id: string;
          user_id: string;
          name: string;
          status: TopicStatus;
          priority: Priority;
          difficulty: Difficulty;
          estimated_time: number | null;
          actual_time: number;
          notes: string | null;
          is_bookmarked: boolean;
          is_favorite: boolean;
          revision_required: boolean;
          resources: TopicResources;
          weightage: number;
          completion_pct: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["topics"]["Row"]> & {
          chapter_id: string;
          user_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["topics"]["Row"]>;
      };
      study_sessions: {
        Row: {
          id: string;
          user_id: string;
          topic_id: string | null;
          started_at: string;
          ended_at: string;
          duration_seconds: number;
          is_pomodoro: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["study_sessions"]["Row"]> & {
          user_id: string;
          started_at: string;
          ended_at: string;
          duration_seconds: number;
        };
        Update: Partial<Database["public"]["Tables"]["study_sessions"]["Row"]>;
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          due_date: string | null;
          priority: Priority;
          status: TaskStatus;
          related_exam_id: string | null;
          related_subject_id: string | null;
          related_topic_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["tasks"]["Row"]> & {
          user_id: string;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["tasks"]["Row"]>;
      };
    };
    Functions: {
      get_study_streak: {
        Args: { p_user_id: string };
        Returns: number;
      };
    };
  };
}
