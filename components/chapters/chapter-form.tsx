"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { chapterSchema, type ChapterFormValues } from "@/lib/validations/chapter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Chapter } from "@/types/domain";

export function ChapterForm({
  subjectId,
  defaultValues,
  onSubmit,
  submitLabel = "Create chapter",
}: {
  subjectId: string;
  defaultValues?: Partial<Chapter>;
  onSubmit: (values: ChapterFormValues) => Promise<void>;
  submitLabel?: string;
}) {
  const form = useForm<ChapterFormValues>({
    resolver: zodResolver(chapterSchema),
    defaultValues: {
      subject_id: subjectId,
      name: defaultValues?.name ?? "",
      estimated_time: defaultValues?.estimated_time ?? undefined,
      difficulty: defaultValues?.difficulty ?? "medium",
      weightage: defaultValues?.weightage ?? 1,
      notes: defaultValues?.notes ?? "",
    },
  });

  async function handleSubmit(values: ChapterFormValues) {
    await onSubmit(values);
    form.reset({ subject_id: subjectId, name: "", difficulty: "medium", weightage: 1, notes: "" });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Chapter name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Algebra" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="estimated_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Est. hours</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step={0.5}
                    placeholder="e.g. 5"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="weightage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weightage</FormLabel>
                <FormControl>
                  <Input type="number" min={0} step={0.1} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="difficulty"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Difficulty</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Optional notes…" rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving…" : submitLabel}
        </Button>
      </form>
    </Form>
  );
}
