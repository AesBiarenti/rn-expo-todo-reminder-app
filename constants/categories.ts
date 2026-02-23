import i18n from "../i18n";
import type { CategoryId } from "../types/todo";

export const CATEGORIES: { id: CategoryId }[] = [
  { id: "work" },
  { id: "personal" },
  { id: "shopping" },
  { id: "health" },
  { id: "other" },
];

export function getCategoryLabel(id: CategoryId): string {
  return i18n.t(`categories.${id}`);
}
