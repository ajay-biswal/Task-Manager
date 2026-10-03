import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

import type { TaskFormData } from "@/types/task";

const initialTaskForm: TaskFormData = {
  title: "",
  description: "",
  category: "",
  priority: "MEDIUM",
  startDate: "",
  dueDate: "",
  status: "PENDING",
};

type TaskFormDraftContextValue = {
  draft: TaskFormData;
  setDraft: (draft: TaskFormData) => void;
  clearDraft: () => void;
};

const TaskFormDraftContext = createContext<
  TaskFormDraftContextValue | undefined
>(undefined);

export function TaskFormDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraftState] = useState<TaskFormData>(initialTaskForm);

  const setDraft = useCallback((value: TaskFormData) => {
    setDraftState(value);
  }, []);

  const clearDraft = useCallback(() => {
    setDraftState(initialTaskForm);
  }, []);

  const value = useMemo(
    () => ({
      draft,
      setDraft,
      clearDraft,
    }),
    [draft, setDraft, clearDraft],
  );

  return (
    <TaskFormDraftContext.Provider value={value}>
      {children}
    </TaskFormDraftContext.Provider>
  );
}

export function useTaskFormDraft() {
  const context = useContext(TaskFormDraftContext);

  if (!context) {
    throw new Error(
      "useTaskFormDraft must be used inside TaskFormDraftProvider",
    );
  }

  return context;
}
