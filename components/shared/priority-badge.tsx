import { Badge } from "@/components/ui/badge";
import { PRIORITY_LABEL } from "@/lib/utils";
import type { Priority } from "@/types/database.types";

const VARIANT: Record<Priority, "secondary" | "accent" | "destructive"> = {
  low: "secondary",
  medium: "accent",
  high: "destructive",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge variant={VARIANT[priority]}>{PRIORITY_LABEL[priority]}</Badge>;
}
