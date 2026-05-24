import { createClient } from "@/lib/supabase/server"
import { EXPENSE_CATEGORY_LABELS } from "@/lib/finance-constants"
import { AddExpenseDialog } from "./_components/add-expense-dialog"
import { Trash2, TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import { deleteExpenseAction } from "@/app/actions/finance"

const MONTH_NAMES = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"]

async function getFinanceData(year: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const from = `${year}-01-01`
  const to   = `${year}-12-31`

  const [paymentsRes, expensesRes, projectsRes] = await Promise.all([
    supabase.from("payments").select("amount, payment_date").eq("user_id", user.id).gte("payment_date", from).lte("payment_date", to),
    supabase.from("expenses").select("id, amount, expense_date, category, description, project_id, notes").eq("user_id", user.id).gte("expense_date", from).lte("expense_date", to).order("expense_date", { ascending: false }),
    supabase.from("projects").select("id, title").eq("user_id", user.id).order("created_at", { ascending: false }),
  ])

  const months = Array.from({ length: 12 }, (_, i) => ({ month: i, income: 0, expenses: 0 }))
  for (const p of (paymentsRes.data ?? [])) { const m = new Date(p.payment_date).getMonth(); months[m].income += p.amount ?? 0 }
  for (const e of (expensesRes.data ?? [])) { const m = new Date(e.expense_date).getMonth(); months[m].expenses += e.amount ?? 0 }

  const totalIncome   = months.reduce((s, m) => s + m.income,   0)
  const totalExpenses = months.reduce((s, m) => s + m.expenses, 0)
  const maxVal = Math.max(...months.map(m => Math.max(m.income, m.expenses)), 1)

  return { months, totalIncome, totalExpenses, profit: totalIncome - totalExpenses, maxVal, expenses: expensesRes.data ?? [], projects: (projectsRes.data ?? []) as { id: string; title: string }[] }
}

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>
}) {
  const { year: yearStr } = await searchParams
  const currentYear = new Date().getFullYear()
  const year = Number(yearStr) || currentYear
  const data = await getFinanceData(year)

  if (!data) return <p className="text-[#151515]/50 p-6">שגיאה בטעינת הנתונים.</p>
  const { months, totalIncome, totalExpenses, profit, maxVal, expenses, projects } = data

  const fmt = (n: number) => `₪${Math.round(n).toLocaleString("he-IL")}`
  const isCurrentYear = year === currentYear

  return (
    <div className="flex flex-col gap-6 pb-28 max-w-3xl" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#151515]">כספים 📊</h1>
          <p className="text-[#8B1A1A]/70 text-sm">הכנסות והוצאות {isCurrentYear ? "השנה" : year}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white border border-[#e5e5e5] rounded-none px-1 py-1">
            {[currentYear - 1, currentYear].map(y => (
              <a key={y} href={`/dashboard/finance?year=${y}`}
                className={`px-3 py-1.5 rounded-none text-sm font-bold transition-all ${y === year ? "bg-[#8B1A1A] text-[#f3f3f3] shadow-md" : "text-[#151515]/50 hover:text-[#151515]"}`}>
                {y}
              </a>
            ))}
          </div>
          <AddExpenseDialog projects={projects} />
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-none bg-green-500/10 border border-green-500/30 p-4 text-[#151515]">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="h-4 w-4 text-green-400" />
            <span className="text-xs font-semibold text-green-300">הכנסות</span>
          </div>
          <p className="text-xl font-black">{fmt(totalIncome)}</p>
        </div>
        <div className="rounded-none bg-red-500/10 border border-red-500/30 p-4 text-[#151515]">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingDown className="h-4 w-4 text-red-400" />
            <span className="text-xs font-semibold text-red-300">הוצאות</span>
          </div>
          <p className="text-xl font-black">{fmt(totalExpenses)}</p>
        </div>
        <div className={`rounded-none border p-4 text-[#151515] ${profit >= 0 ? "bg-blue-500/10 border-blue-500/30" : "bg-red-900/20 border-red-700/30"}`}>
          <div className="flex items-center gap-1.5 mb-2">
            <DollarSign className="h-4 w-4 text-[#8B1A1A]" />
            <span className="text-xs font-semibold text-[#8B1A1A]">רווח</span>
          </div>
          <p className={`text-xl font-black ${profit >= 0 ? "text-[#151515]" : "text-red-300"}`}>{fmt(profit)}</p>
        </div>
      </div>

      {/* Monthly chart */}
      <div>
        <h2 className="text-base font-black text-[#151515] mb-3">תצוגה חודשית</h2>
        <div className="rounded-none bg-white border border-[#e5e5e5] p-4 overflow-x-auto">
          <div className="flex gap-2 min-w-[560px]">
            {months.map((m) => {
              const incomePct  = maxVal > 0 ? (m.income   / maxVal) * 100 : 0
              const expensePct = maxVal > 0 ? (m.expenses / maxVal) * 100 : 0
              const mProfit    = m.income - m.expenses
              const hasData    = m.income > 0 || m.expenses > 0
              return (
                <div key={m.month} className={`flex-1 flex flex-col items-center gap-1 ${!hasData ? "opacity-30" : ""}`}>
                  {/* Bars */}
                  <div className="w-full flex gap-0.5 items-end h-24">
                    <div className="flex-1 bg-green-500/30 rounded-t-sm transition-all" style={{ height: `${incomePct}%`, minHeight: m.income > 0 ? "4px" : "0" }} title={`הכנסה: ${fmt(m.income)}`} />
                    <div className="flex-1 bg-red-500/30 rounded-t-sm transition-all"   style={{ height: `${expensePct}%`, minHeight: m.expenses > 0 ? "4px" : "0" }} title={`הוצאה: ${fmt(m.expenses)}`} />
                  </div>
                  {/* Month name */}
                  <span className="text-[10px] text-[#151515]/50 font-medium text-center">{MONTH_NAMES[m.month].slice(0,3)}</span>
                  {/* Profit indicator */}
                  {hasData && (
                    <span className={`text-[9px] font-bold px-1 rounded ${mProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {mProfit >= 0 ? "+" : ""}{Math.round(mProfit / 1000)}k
                    </span>
                  )}
                </div>
              )
            })}
          </div>
          {/* Legend */}
          <div className="flex gap-4 mt-3 justify-center">
            <div className="flex items-center gap-1.5 text-[11px] text-[#151515]/50"><span className="w-3 h-3 rounded-sm bg-green-500/40" />הכנסה</div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#151515]/50"><span className="w-3 h-3 rounded-sm bg-red-500/40" />הוצאה</div>
          </div>
        </div>
      </div>

      {/* Monthly detail table */}
      <div>
        <h2 className="text-base font-black text-[#151515] mb-3">פירוט חודשי</h2>
        <div className="rounded-none bg-white border border-[#e5e5e5] overflow-hidden">
          <div className="grid grid-cols-4 px-4 py-2 border-b border-[#e5e5e5] text-[11px] font-bold text-[#151515]/50">
            <span>חודש</span><span className="text-center">הכנסות</span><span className="text-center">הוצאות</span><span className="text-left">רווח</span>
          </div>
          {months.map((m) => {
            const mProfit = m.income - m.expenses
            const hasData = m.income > 0 || m.expenses > 0
            return (
              <div key={m.month} className={`grid grid-cols-4 px-4 py-3 border-b border-[#e5e5e5] last:border-b-0 ${!hasData ? "opacity-30" : ""}`}>
                <span className="text-[#151515] text-sm font-semibold">{MONTH_NAMES[m.month]}</span>
                <span className="text-green-400 text-sm font-bold text-center">{m.income > 0 ? fmt(m.income) : "—"}</span>
                <span className="text-red-400 text-sm font-bold text-center">{m.expenses > 0 ? fmt(m.expenses) : "—"}</span>
                <span className={`text-sm font-black text-left ${mProfit >= 0 ? "text-[#8B1A1A]" : "text-red-400"}`}>
                  {hasData ? fmt(mProfit) : "—"}
                </span>
              </div>
            )
          })}
          {/* Total row */}
          <div className="grid grid-cols-4 px-4 py-3 bg-white border-t border-[#e5e5e5]">
            <span className="text-[#151515] text-sm font-black">סה״כ {year}</span>
            <span className="text-green-400 text-sm font-black text-center">{fmt(totalIncome)}</span>
            <span className="text-red-400 text-sm font-black text-center">{fmt(totalExpenses)}</span>
            <span className={`text-sm font-black text-left ${profit >= 0 ? "text-[#8B1A1A]" : "text-red-400"}`}>{fmt(profit)}</span>
          </div>
        </div>
      </div>

      {/* Recent expenses list */}
      <div>
        <h2 className="text-base font-black text-[#151515] mb-3">הוצאות אחרונות</h2>
        {expenses.length === 0 ? (
          <div className="rounded-none border border-dashed border-[#e5e5e5] py-10 flex flex-col items-center gap-2">
            <span className="text-3xl">💸</span>
            <p className="text-[#151515]/40 text-sm">אין הוצאות רשומות</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {expenses.map((exp) => (
              <div key={exp.id} className="rounded-none bg-white border border-[#e5e5e5] px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-none bg-red-500/15 border border-red-500/20 flex items-center justify-center text-lg shrink-0">
                  💸
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#151515] text-sm font-bold truncate">{exp.description}</p>
                  <p className="text-[#151515]/50 text-xs mt-0.5">
                    {EXPENSE_CATEGORY_LABELS[exp.category as keyof typeof EXPENSE_CATEGORY_LABELS] ?? exp.category}
                    {" · "}
                    {new Date(exp.expense_date).toLocaleDateString("he-IL")}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-red-300 font-black text-base">₪{exp.amount.toLocaleString("he-IL")}</span>
                  <form action={deleteExpenseAction.bind(null, exp.id)}>
                    <button type="submit" className="w-7 h-7 rounded-none bg-white hover:bg-red-500/20 transition-colors flex items-center justify-center">
                      <Trash2 className="h-3.5 w-3.5 text-[#151515]/30 hover:text-red-500" />
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

