import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronRight, Plus, Phone, Mail, MapPin, FileText } from "lucide-react"
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from "@/types"
import { EditClientButton } from "./_components/edit-client-button"
import { DeleteClientButton } from "./_components/delete-client-button"
import type { Client, Project } from "@/types"

async function getClientWithProjects(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [clientRes, projectsRes] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).eq("user_id", user.id).single(),
    supabase.from("projects").select("*").eq("client_id", id).order("created_at", { ascending: false }),
  ])

  if (!clientRes.data) return null
  return {
    client: clientRes.data as Client,
    projects: (projectsRes.data ?? []) as Project[],
  }
}

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await getClientWithProjects(id)
  if (!result) notFound()

  const { client, projects } = result
  const totalRevenue = projects
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + (p.price ?? 0), 0)

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/dashboard/clients" className="hover:text-foreground transition-colors">
          לקוחות
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">{client.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-bold">{client.name}</h1>
        <div className="flex gap-2">
          <EditClientButton client={client} />
          <DeleteClientButton clientId={client.id} clientName={client.name} />
        </div>
      </div>

      {/* Client info */}
      <Card>
        <CardContent className="grid grid-cols-1 gap-3 pt-6 sm:grid-cols-2">
          {client.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span dir="ltr">{client.phone}</span>
            </div>
          )}
          {client.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span dir="ltr">{client.email}</span>
            </div>
          )}
          {client.address && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{client.address}</span>
            </div>
          )}
          {client.notes && (
            <div className="flex items-start gap-2 text-sm sm:col-span-2">
              <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <span className="text-muted-foreground">{client.notes}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">פרויקטים</p>
            <p className="text-2xl font-bold">{projects.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">הכנסות (שולם)</p>
            <p className="text-2xl font-bold">₪{totalRevenue.toLocaleString("he-IL")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Projects list */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">פרויקטים</CardTitle>
          <Link href={`/dashboard/projects/new?client_id=${client.id}`}>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4" />
              פרויקט חדש
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {projects.length === 0 ? (
            <p className="px-6 pb-4 text-sm text-muted-foreground">אין פרויקטים ללקוח זה.</p>
          ) : (
            <ul className="divide-y">
              {projects.map((project) => (
                <li key={project.id}>
                  <Link
                    href={`/dashboard/projects/${project.id}`}
                    className="flex items-center justify-between px-6 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">{project.title}</span>
                      {project.due_date && (
                        <span className="text-xs text-muted-foreground">
                          מועד: {new Date(project.due_date).toLocaleDateString("he-IL")}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {project.price && (
                        <span className="text-sm font-medium">₪{project.price.toLocaleString("he-IL")}</span>
                      )}
                      <Badge className={PROJECT_STATUS_COLORS[project.status]} variant="outline">
                        {PROJECT_STATUS_LABELS[project.status]}
                      </Badge>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
