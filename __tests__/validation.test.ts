import { validateTask } from "@/utils/validation";

const baseTask = {
  title: "Finish assessment",
  description: "Complete TaskFlow",
  category: "Work",
  priority: "HIGH" as const,
  startDate: "2026-10-01",
  dueDate: "2026-10-05",
};

describe("validateTask", () => {
  it("accepts a valid task", () => {
    expect(validateTask(baseTask)).toEqual({});
  });

  it("requires title and category", () => {
    expect(validateTask({ ...baseTask, title: "   ", category: "" })).toEqual({
      title: "Title is required",
      category: "Category is required",
    });
  });

  it("requires priority, start date, and due date", () => {
    expect(
      validateTask({
        ...baseTask,
        priority: "" as never,
        startDate: "",
        dueDate: "",
      }),
    ).toEqual({
      priority: "Priority is required",
      startDate: "Start date is required",
      dueDate: "Due date is required",
    });
  });

  it("rejects a due date earlier than the start date", () => {
    expect(
      validateTask({
        ...baseTask,
        startDate: "2026-10-10",
        dueDate: "2026-10-09",
      }),
    ).toEqual({
      dueDate: "Due date cannot be earlier than start date",
    });
  });

  it("allows the due date to equal the start date", () => {
    expect(
      validateTask({
        ...baseTask,
        startDate: "2026-10-10",
        dueDate: "2026-10-10",
      }),
    ).toEqual({});
  });
});
