"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { topicSchema, type TopicFormValues } from "@/lib/validations/topic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import type { Topic } from "@/types/domain";

export function TopicForm({
  chapterId,
  defaultValues,
  onSubmit,
  submitLabel = "Create topic",
}: {
  chapterId: string;
  defaultValues?: Partial<Topic>;
  onSubmit: (values: TopicFormValues) => Promise<void>;
  submitLabel?: string;
}) {
  const form = useForm<TopicFormValues>({
    resolver: zodResolver(topicSchema),
    defaultValues: {
      chapter_id: chapterId,
      name: defaultValues?.name ?? "",
      status: defaultValues?.status ?? "not_started",
      priority: defaultValues?.priority ?? "medium",
      difficulty: defaultValues?.difficulty ?? "medium",
      estimated_time: defaultValues?.estimated_time ?? undefined,
      notes: defaultValues?.notes ?? "",
      is_bookmarked: defaultValues?.is_bookmarked ?? false,
      is_favorite: defaultValues?.is_favorite ?? false,
      revision_required: defaultValues?.revision_required ?? false,
      weightage: defaultValues?.weightage ?? 1,
    },
  });

  async function handleSubmit(values: TopicFormValues) {
    await onSubmit(values);
    form.reset({
      chapter_id: chapterId,
      name: "",
      status: "not_started",
      priority: "medium",
      difficulty: "medium",
      is_bookmarked: false,
      is_favorite: false,
      revision_required: false,
      weightage: 1,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Topic name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Quadratic Equations" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="not_started">Not started</SelectItem>
                    <SelectItem value="in_progress">In progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="skipped">Skipped</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
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
            name="estimated_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Est. hours</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step={0.5}
                    placeholder="e.g. 2"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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

        <div className="flex flex-wrap gap-6">
          <FormField
            control={form.control}
            name="is_bookmarked"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="cursor-pointer font-normal">Bookmarked</FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="revision_required"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="cursor-pointer font-normal">Needs revision</FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="is_favorite"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="cursor-pointer font-normal">Favorite</FormLabel>
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving…" : submitLabel}
        </Button>
      </form>
    </Form>
  );
}
