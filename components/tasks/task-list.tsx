"use client";

import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { toggleTaskAction, deleteTaskAction } from "@/app/(dashboard)/tasks/actions";
import { CheckSquare } from "lucide-react";
import type { Task } from "@/types/domain";

export function TaskList({ tasks }: { tasks: Task[] }) {
  async function handleToggle(task: Task) {
    try {
      await toggleTaskAction(task.id, task.status === "done" ? "todo" : "done");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update task");
    }
  }

  async function handleDelete(taskId: string) {
    try {
      await deleteTaskAction(taskId);
      toast.success("Task deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete task");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <TaskDialog />
      </div>
      {tasks.length === 0 ? (
        <EmptyState icon={CheckSquare} title="No tasks yet" description="Add a task to keep track of what's next." />
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {tasks.map((task) => (
            <li key={task.id} className="flex items-center gap-3 p-4">
              <input
                type="checkbox"
                checked={task.status === "done"}
                onChange={() => handleToggle(task)}
                className="h-4 w-4 rounded border-input accent-primary"
                aria-label={`Mark "${task.title}" as ${task.status === "done" ? "not done" : "done"}`}
              />
              <div className="flex-1">
                <p className={task.status === "done" ? "text-muted-foreground line-through" : "font-medium"}>
                  {task.title}
                </p>
                {task.due_date && (
                  <p className="text-xs text-muted-foreground">Due {format(new Date(task.due_date), "d MMM yyyy")}</p>
                )}
              </div>
              <PriorityBadge priority={task.priority} />
              <Button variant="ghost" size="icon" onClick={() => handleDelete(task.id)} aria-label="Delete task">
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
