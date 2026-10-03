import { isTaskOverdue } from "@/utils/taskUtils";
import type { Task } from "@/types/task";

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-1",
    title: "Test task",
    description: "",
    category: "Work",
    priority: "MEDIUM",
    startDate: "2026-10-01",
    dueDate: "2026-10-03",
    status: "PENDING",
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("task utilities", () => {
  it("marks a pending task with a past due date as overdue", () => {
    expect(isTaskOverdue(makeTask({ dueDate: "2020-01-01" }))).toBe(true);
  });

  it("does not mark a completed task as overdue", () => {
    expect(
      isTaskOverdue(
        makeTask({
          dueDate: "2020-01-01",
          status: "COMPLETED",
        }),
      ),
    ).toBe(false);
  });

  it("does not mark a future pending task as overdue", () => {
    expect(isTaskOverdue(makeTask({ dueDate: "2099-12-31" }))).toBe(false);
  });
});
