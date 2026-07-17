import { listTasks } from "@/services/tasks.service";
import { TaskList } from "@/components/tasks/task-list";

export default async function TasksPage() {
  const tasks = await listTasks();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Tasks</h1>
        <p className="text-sm text-muted-foreground">
          Simple to-dos — recurring tasks and reminder delivery are a v2 feature (see build spec).
        </p>
      </div>
      <TaskList tasks={tasks} />
    </div>
  );
}
