import { Badge } from "@/components/ui/badge";
import { STATUS_LABEL } from "@/lib/utils";
import type { TopicStatus } from "@/types/database.types";

const VARIANT: Record<TopicStatus, "secondary" | "accent" | "success" | "outline"> = {
  not_started: "secondary",
  in_progress: "accent",
  completed: "success",
  skipped: "outline",
};

export function StatusBadge({ status }: { status: TopicStatus }) {
  return <Badge variant={VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}
