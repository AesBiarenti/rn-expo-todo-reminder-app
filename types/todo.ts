export type Priority = "low" | "medium" | "high";

export type CategoryId = "work" | "personal" | "shopping" | "health" | "other";

export interface TodoModel {
  id: string;
  text: string;
  completed: boolean;
  reminderAt?: string;
  priority?: Priority;
  categoryId?: CategoryId;
  createdAt: string;
}
