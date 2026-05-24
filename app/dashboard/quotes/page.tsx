import { createClient } from "@/lib/supabase/server"
import { QuoteBuilder } from "./_components/quote-builder"
import { QuoteList } from "./_components/quote-list"
import { CatalogManager } from "./_components/catalog-manager"
import { FileText, BookOpen } from "lucide-react"

async function getQuotesPageData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [catalogRes, quotesRes, projectsRes] = await Promise.all([
    supabase
      .from("price_catalog")
      .select("id, name, category, unit, unit_price, notes, updated_at")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("category")
      .order("name"),
    supabase
      .from("quotes")
      .select("id, title, client_name, total, status, created_at, valid_days, project_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("projects")
      .select("id, title")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100),
  ])

  const thirtyDaysAgo = Date.now() - 30 * 86400000
  const staleIds = new Set(
    (catalogRes.data ?? [])
      .filter(c => new Date(c.updated_at).getTime() < thirtyDaysAgo)
      .map(c => c.id)
  )

  return {
    catalog:  catalogRes.data  ?? [],
    quotes:   quotesRes.data   ?? [],
    projects: projectsRes.data ?? [],
    staleIds,
  }
}

export default async function QuotesPage() {
  const data = await getQuotesPageData()
  if (!data) return <p className="text-white/50 p-6">שגיאה בטעינת הנתונים.</p>

  const { catalog, quotes, projects, staleIds } = data

  return (
    <div className="flex flex-col gap-6 pb-28 max-w-3xl" dir="rtl">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white">הצעות מחיר 📋</h1>
        <p className="text-blue-300/70 text-sm">בניית הצעות מחיר וניהול קטלוג</p>
      </div>

      {/* Quote Builder */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-4 w-4 text-amber-400" />
          <h2 className="text-base font-black text-white">הצעה חדשה</h2>
        </div>
        <QuoteBuilder catalog={catalog} projects={projects} staleIds={staleIds} />
      </div>

      {/* Previous Quotes */}
      {quotes.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-blue-400" />
            <h2 className="text-base font-black text-white">הצעות קיימות</h2>
          </div>
          <QuoteList quotes={quotes} />
        </div>
      )}

      {/* Price Catalog Manager */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="h-4 w-4 text-purple-400" />
          <h2 className="text-base font-black text-white">קטלוג מחירים</h2>
        </div>
        <CatalogManager catalog={catalog} staleIds={staleIds} />
      </div>

    </div>
  )
}
