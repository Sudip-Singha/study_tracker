"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { timeBlockSchema, type TimeBlockFormValues } from "@/lib/validations/timetable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { createTimeBlockAction, createMultipleTimeBlocksAction, updateTimeBlockAction, deleteTimeBlockAction } from "@/app/(dashboard)/timetable/actions";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

const COLORS = [
  { label: "Blue", value: "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 border-blue-200 dark:border-blue-800" },
  { label: "Green", value: "bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100 border-green-200 dark:border-green-800" },
  { label: "Purple", value: "bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100 border-purple-200 dark:border-purple-800" },
  { label: "Orange", value: "bg-orange-100 dark:bg-orange-900/30 text-orange-900 dark:text-orange-100 border-orange-200 dark:border-orange-800" },
  { label: "Pink", value: "bg-pink-100 dark:bg-pink-900/30 text-pink-900 dark:text-pink-100 border-pink-200 dark:border-pink-800" },
  { label: "Red", value: "bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-100 border-red-200 dark:border-red-800" },
  { label: "Yellow", value: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-100 border-yellow-200 dark:border-yellow-800" },
  { label: "Teal", value: "bg-teal-100 dark:bg-teal-900/30 text-teal-900 dark:text-teal-100 border-teal-200 dark:border-teal-800" },
  { label: "Indigo", value: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-100 border-indigo-200 dark:border-indigo-800" },
  { label: "Gray", value: "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700" },
];

export function TimeBlockDialog({
  initialData,
  open,
  onOpenChange,
  trigger
}: {
  initialData?: any;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isControlled = open !== undefined;
  const dialogOpen = isControlled ? open : isOpen;
  const setDialogOpen = isControlled ? onOpenChange! : setIsOpen;

  const form = useForm<TimeBlockFormValues>({
    resolver: zodResolver(timeBlockSchema),
    defaultValues: {
      activity: initialData?.activity || "",
      day_of_week: initialData?.day_of_week ?? 0, // Default Monday
      start_time: initialData?.start_time ? initialData.start_time.slice(0, 5) : "09:00",
      end_time: initialData?.end_time ? initialData.end_time.slice(0, 5) : "10:00",
      color: initialData?.color || COLORS[0].value,
      repeat_mon_to_sat: false,
    },
  });

  // Reset form when initialData changes or dialog opens
  useEffect(() => {
    if (dialogOpen) {
      form.reset({
        activity: initialData?.activity || "",
        day_of_week: initialData?.day_of_week ?? 0,
        start_time: initialData?.start_time ? initialData.start_time.slice(0, 5) : "09:00",
        end_time: initialData?.end_time ? initialData.end_time.slice(0, 5) : "10:00",
        color: initialData?.color || COLORS[0].value,
        repeat_mon_to_sat: false,
      });
    }
  }, [dialogOpen, initialData, form]);

  async function handleSubmit(values: TimeBlockFormValues) {
    try {
      if (initialData?.id) {
        await updateTimeBlockAction(initialData.id, {
          activity: values.activity,
          day_of_week: values.day_of_week,
          start_time: values.start_time,
          end_time: values.end_time,
          color: values.color,
        });

        // If repeating during edit, create blocks for the other Mon-Sat days
        if (values.repeat_mon_to_sat) {
          const blocks = [];
          for (let i = 0; i < 6; i++) {
            if (i === values.day_of_week) continue; // Skip the one we just updated
            blocks.push({
              activity: values.activity,
              day_of_week: i,
              start_time: values.start_time,
              end_time: values.end_time,
              color: values.color,
            });
          }
          if (blocks.length > 0) {
            await createMultipleTimeBlocksAction(blocks);
          }
          toast.success("Time block updated & copied to Mon-Sat");
        } else {
          toast.success("Time block updated");
        }
      } else {
        if (values.repeat_mon_to_sat) {
          const blocks = [];
          for (let i = 0; i < 6; i++) { // 0 to 5 (Mon to Sat)
            blocks.push({
              activity: values.activity,
              day_of_week: i,
              start_time: values.start_time,
              end_time: values.end_time,
              color: values.color,
            });
          }
          await createMultipleTimeBlocksAction(blocks);
          toast.success("Time blocks added for Mon-Sat");
        } else {
          await createTimeBlockAction({
            activity: values.activity,
            day_of_week: values.day_of_week,
            start_time: values.start_time,
            end_time: values.end_time,
            color: values.color,
          });
          toast.success("Time block added");
        }
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save time block");
    }
  }

  async function handleDelete() {
    if (!initialData?.id) return;
    try {
      await deleteTimeBlockAction(initialData.id);
      toast.success("Time block deleted");
      setDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete time block");
    }
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4" /> Add Block
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Time Block" : "Add Time Block"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="activity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activity</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Math Study" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="day_of_week"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Day of the week</FormLabel>
                  <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DAYS.map((day, index) => (
                        <SelectItem key={index} value={index.toString()}>{day}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {COLORS.map((c) => (
                        <SelectItem key={c.label} value={c.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full border ${c.value}`} />
                            {c.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="repeat_mon_to_sat"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Repeat Monday to Saturday
                    </FormLabel>
                    <FormDescription>
                      Create this block for every day from Monday to Saturday.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <div className="flex justify-between mt-4">
              {initialData?.id && (
                <Button type="button" variant="destructive" onClick={handleDelete} disabled={form.formState.isSubmitting}>
                  Delete
                </Button>
              )}
              <div className="flex-1" />
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
