import { Badge } from "@/components/ui";

type TaskPriority = "low" | "medium" | "high";

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
  low: {
    label: "Low",
    variant: "default",
  },
  medium: {
    label: "Medium",
    variant: "warning",
  },
  high: {
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
