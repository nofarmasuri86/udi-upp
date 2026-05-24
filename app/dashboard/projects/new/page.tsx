import { createClient } from "@/lib/supabase/server"
import { ProjectForm } from "../_components/project-form"
import { createProjectAction } from "@/app/actions/projects"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ client_id?: string }>
}) {
  const { client_id } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name")
    .eq("user_id", user!.id)
    .order("name")

  return (
    <div className="flex flex-col gap-6 max-w-2xl" dir="rtl">
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/dashboard/projects" className="hover:text-foreground transition-colors">
          פרויקטים
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">פרויקט חדש</span>
      </div>

      <h1 className="text-2xl font-bold">פרויקט / עבודה חדשה</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">פרטי העבודה</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectForm
            clients={clients ?? []}
            defaultClientId={client_id}
            action={createProjectAction}
            submitLabel="יצירת פרויקט"
          />
        </CardContent>
      </Card>
    </div>
  )
}
