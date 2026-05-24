import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { AddClientButton } from "./_components/add-client-button"
import { ImportContactsButton } from "@/components/import-contacts-button"
import { Phone, ChevronLeft, Mail, MapPin, Briefcase } from "lucide-react"

async function getClients() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from("clients")
    .select("id, name, phone, email, address, projects(id)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return data ?? []
}

type ClientWithCount = {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  projects: { id: string }[]
}

function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
}

const AVATAR_GRADIENTS = [
  "from-blue-400 to-indigo-600",
  "from-amber-400 to-orange-600",
  "from-emerald-400 to-teal-600",
  "from-purple-400 to-violet-600",
  "from-rose-400 to-pink-600",
  "from-cyan-400 to-blue-600",
]

const AVATAR_GLOWS = [
  "shadow-blue-500/30",
  "shadow-amber-500/30",
  "shadow-emerald-500/30",
  "shadow-purple-500/30",
  "shadow-rose-500/30",
  "shadow-cyan-500/30",
]

export default async function ClientsPage() {
  const clients = (await getClients()) as unknown as ClientWithCount[]

  return (
    <div className="flex flex-col gap-5 pb-24" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">לקוחות</h1>
          <p className="text-sm text-blue-300/70 font-medium">{clients.length} לקוחות בסה״כ</p>
        </div>
        <AddClientButton />
      </div>

      {/* Import from phone */}
      <div className="flex items-center gap-3 rounded-2xl bg-white/[0.03] border border-white/[0.07] px-4 py-3">
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-bold">ייבא אנשי קשר מהטלפון</p>
          <p className="text-blue-300/60 text-xs mt-0.5">הוסף לקוחות ישירות מאנשי הקשר שלך</p>
        </div>
        <ImportContactsButton />
      </div>

      {/* Empty state */}
      {clients.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-white/10 flex flex-col items-center gap-4 py-16 text-center mt-4">
          <div className="text-6xl">👤</div>
          <div>
            <p className="font-bold text-lg text-white">אין לקוחות עדיין</p>
            <p className="text-sm text-white/40 mt-1">לחץ על ״לקוח חדש״ כדי להתחיל</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {clients.map((client, i) => {
            const gradient = AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length]
            const glow = AVATAR_GLOWS[i % AVATAR_GLOWS.length]
            const projectCount = client.projects?.length ?? 0

            return (
              <Link key={client.id} href={`/dashboard/clients/${client.id}`}>
                <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] shadow-lg hover:border-white/[0.16] hover:bg-white/[0.06] transition-all active:scale-[0.98] cursor-pointer overflow-hidden">
                  <div className="flex items-center gap-4 px-4 py-4">

                    {/* Avatar */}
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-black text-lg shadow-lg ${glow} shrink-0`}>
                      {getInitials(client.name)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-base leading-tight text-white">{client.name}</p>
                      <div className="flex flex-col gap-0.5 mt-1.5">
                        {client.phone && (
                          <span className="flex items-center gap-1.5 text-xs text-blue-300/70" dir="ltr">
                            <Phone className="h-3 w-3 shrink-0" />
                            {client.phone}
                          </span>
                        )}
                        {client.email && (
                          <span className="flex items-center gap-1.5 text-xs text-blue-300/70 truncate">
                            <Mail className="h-3 w-3 shrink-0" />
                            {client.email}
                          </span>
                        )}
                        {client.address && (
                          <span className="flex items-center gap-1.5 text-xs text-blue-300/70 truncate">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {client.address}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex flex-col items-center bg-white/[0.07] border border-white/10 rounded-xl px-3 py-2">
                        <span className="text-lg font-black leading-none text-white">{projectCount}</span>
                        <span className="text-xs text-blue-300/60 mt-0.5 flex items-center gap-0.5">
                          <Briefcase className="h-2.5 w-2.5" />
                          פרויקטים
                        </span>
                      </div>
                      <ChevronLeft className="h-5 w-5 text-white/20" />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
