"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { subjectSchema, type SubjectFormValues } from "@/lib/validations/subject";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { Subject } from "@/types/domain";

export function SubjectForm({
  examId,
  defaultValues,
  onSubmit,
  submitLabel = "Create subject",
}: {
  examId: string;
  defaultValues?: Partial<Subject>;
  onSubmit: (values: SubjectFormValues) => Promise<void>;
  submitLabel?: string;
}) {
  const form = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      exam_id: examId,
      name: defaultValues?.name ?? "",
      estimated_hours: defaultValues?.estimated_hours ?? undefined,
      priority: defaultValues?.priority ?? "medium",
      weightage: defaultValues?.weightage ?? 1,
    },
  });

  async function handleSubmit(values: SubjectFormValues) {
    await onSubmit(values);
    form.reset({ exam_id: examId, name: "", priority: "medium", weightage: 1 });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Mathematics" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="estimated_hours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Est. hours</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step={0.5}
                    placeholder="e.g. 40"
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

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving…" : submitLabel}
        </Button>
      </form>
    </Form>
  );
}
