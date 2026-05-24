"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
export type { ExpenseCategory } from "@/lib/finance-constants"

export async function addExpenseAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("לא מחובר")

  const { error } = await supabase.from("expenses").insert({
    user_id:      user.id,
    project_id:   (formData.get("project_id") as string) || null,
    category:     (formData.get("category") as string) || "general",
    description:  formData.get("description") as string,
    amount:       Number(formData.get("amount")),
    expense_date: (formData.get("expense_date") as string) || new Date().toISOString().split("T")[0],
    notes:        (formData.get("notes") as string) || null,
  })

  if (error) throw new Error(error.message)
  revalidatePath("/dashboard/finance")
}

export async function deleteExpenseAction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("לא מחובר")

  const { error } = await supabase.from("expenses").delete().eq("id", id).eq("user_id", user.id)
  if (error) throw new Error(error.message)
  revalidatePath("/dashboard/finance")
}

export async function getFinanceData(year: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const from = `${year}-01-01`
  const to   = `${year}-12-31`

  const [paymentsRes, expensesRes] = await Promise.all([
    supabase
      .from("payments")
      .select("amount, payment_date")
      .eq("user_id", user.id)
      .gte("payment_date", from)
      .lte("payment_date", to),
    supabase
      .from("expenses")
      .select("id, amount, expense_date, category, description, project_id, projects(title)")
      .eq("user_id", user.id)
      .gte("expense_date", from)
      .lte("expense_date", to)
      .order("expense_date", { ascending: false }),
  ])

  // Group by month
  const months = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    income: 0,
    expenses: 0,
  }))

  for (const p of (paymentsRes.data ?? [])) {
    const m = new Date(p.payment_date).getMonth()
    months[m].income += p.amount ?? 0
  }
  for (const e of (expensesRes.data ?? [])) {
    const m = new Date(e.expense_date).getMonth()
    months[m].expenses += e.amount ?? 0
  }

  const totalIncome   = months.reduce((s, m) => s + m.income, 0)
  const totalExpenses = months.reduce((s, m) => s + m.expenses, 0)

  return {
    months,
    totalIncome,
    totalExpenses,
    profit: totalIncome - totalExpenses,
    recentExpenses: (expensesRes.data ?? []).slice(0, 20),
  }
}
