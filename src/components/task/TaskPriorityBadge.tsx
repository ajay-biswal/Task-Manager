import { Badge } from "@/components/ui";
import type { TaskPriority } from "@/types/task";

type TaskPriorityBadgeProps = {
  priority: TaskPriority;
};

const priorityConfig: Record<
  TaskPriority,
  {
    label: string;
    variant: "default" | "warning" | "danger";
  }
> = {
  LOW: {
    label: "Low",
    variant: "default",
  },
  MEDIUM: {
    label: "Medium",
    variant: "warning",
  },
  HIGH: {
    label: "High",
    variant: "danger",
  },
};

export default function TaskPriorityBadge({
  priority,
}: TaskPriorityBadgeProps) {
  const config = priorityConfig[priority];

  return <Badge label={config.label} variant={config.variant} />;
}
