import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ChevronLeft, CalendarDays, Banknote, Package, Phone } from "lucide-react"
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from "@/types"
import { StatusChanger } from "./_components/status-changer"
import { DeleteProjectButton } from "./_components/delete-project-button"
import { PaymentSection } from "./_components/payment-section"
import { GCalButton } from "@/components/gcal-button"
import type { Project, Client, Payment } from "@/types"

async function getProjectWithPayments(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: project }, { data: payments }] = await Promise.all([
    supabase
      .from("projects")
      .select("*, client:clients(id, name, phone)")
      .eq("id", id)
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("payments")
      .select("*")
      .eq("project_id", id)
      .eq("user_id", user.id)
      .order("payment_date", { ascending: false }),
  ])

  return {
    project: project as (Project & { client: Pick<Client, "id" | "name" | "phone"> | null }) | null,
    payments: (payments ?? []) as Payment[],
  }
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await getProjectWithPayments(id)
  if (!result?.project) notFound()
  const { project, payments } = result

  const totalPaid = payments.reduce((s, p) => s + p.amount, 0)
  const remaining = (project.price ?? 0) - totalPaid

  return (
    <div className="flex flex-col gap-4 max-w-2xl w-full" dir="rtl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/dashboard/projects" className="hover:text-foreground transition-colors">
          פרויקטים
        </Link>
        <ChevronLeft className="h-3.5 w-3.5 opacity-50" />
        <span className="text-foreground font-medium truncate">{project.title}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold leading-tight">{project.title}</h1>
            <DeleteProjectButton projectId={project.id} />
          </div>
          {project.client && (
            <Link
              href={`/dashboard/clients/${project.client.id}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              {project.client.name}
              {project.client.phone && (
                <span className="flex items-center gap-1 opacity-70" dir="ltr">
                  <Phone className="h-3 w-3" />
                  {project.client.phone}
                </span>
              )}
            </Link>
          )}
        </div>
        <Badge className={`${PROJECT_STATUS_COLORS[project.status]} shrink-0 text-xs`} variant="outline">
          {PROJECT_STATUS_LABELS[project.status]}
        </Badge>
      </div>

      {/* Status changer */}
      <Card>
        <CardContent className="flex flex-col gap-3 pt-4 pb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">שינוי סטטוס</p>
          <StatusChanger projectId={project.id} currentStatus={project.status} />
        </CardContent>
      </Card>

      {/* Details */}
      <Card>
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm font-semibold">פרטי העבודה</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pt-0">
          {project.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{project.description}</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {project.due_date && (
              <div className="flex flex-col gap-2 bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2.5 text-sm">
                  <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-muted-foreground text-xs">תאריך יעד</p>
                    <p className="font-medium">{new Date(project.due_date).toLocaleDateString("he-IL")}</p>
                  </div>
                </div>
                <GCalButton
                  title={project.title}
                  date={project.due_date}
                  clientName={project.client?.name ?? null}
                  description={project.description ?? null}
                />
              </div>
            )}
            {project.material && (
              <div className="flex items-center gap-2.5 text-sm bg-muted/50 rounded-lg p-3">
                <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-muted-foreground text-xs">חומר</p>
                  <p className="font-medium">{project.material}</p>
                </div>
              </div>
            )}
          </div>
          {project.notes && (
            <>
              <Separator />
              <p className="text-sm text-muted-foreground leading-relaxed">{project.notes}</p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Financials */}
      {project.price !== null && (
        <Card>
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Banknote className="h-4 w-4 text-muted-foreground" />
              תמחור
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-sm py-1">
                <span className="text-muted-foreground">מחיר כולל</span>
                <span className="font-semibold">₪{project.price.toLocaleString("he-IL")}</span>
              </div>
              <div className="flex justify-between items-center text-sm py-1">
                <span className="text-muted-foreground">התקבל עד כה</span>
                <span className="font-semibold text-green-600">₪{totalPaid.toLocaleString("he-IL")}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center text-sm font-bold py-1">
                <span>יתרה לתשלום</span>
                <span className={`text-base ${remaining > 0 ? "text-orange-600" : "text-green-600"}`}>
                  ₪{remaining.toLocaleString("he-IL")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payments */}
      <PaymentSection projectId={project.id} payments={payments} />
    </div>
  )
}
