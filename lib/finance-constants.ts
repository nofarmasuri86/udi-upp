export type ExpenseCategory = "materials" | "tools" | "transport" | "subcontractor" | "marketing" | "general" | "other"

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  materials:     "חומרים",
  tools:         "כלים וציוד",
  transport:     "הסעות ודלק",
  subcontractor: "קבלן משנה",
  marketing:     "שיווק",
  general:       "הוצאות כלליות",
  other:         "אחר",
}
