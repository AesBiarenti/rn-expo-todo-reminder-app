import type { CategoryId } from "../types/todo";

export const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: "work", label: "İş" },
  { id: "personal", label: "Kişisel" },
  { id: "shopping", label: "Alışveriş" },
  { id: "health", label: "Sağlık" },
  { id: "other", label: "Diğer" },
];

export function getCategoryLabel(id: CategoryId): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}
