import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { AgentFab } from "@/components/agent-fab"
import { BackButton } from "@/components/back-button"
import { cookies } from "next/headers"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false"

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <SidebarInset className="bg-[#07091a]">
        <header className="flex h-16 items-center justify-between border-b border-red-900/40 bg-gradient-to-r from-[#12060a] via-[#1e0a0a] to-[#12060a] px-4 sticky top-0 z-10 shadow-lg shadow-red-900/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center text-xl shadow-lg shadow-red-700/40">
              🧩
            </div>
            <div>
              <span className="text-sm font-black text-white">אודי הרכבות</span>
              <p className="text-red-400/70 text-xs leading-none mt-0.5">ניהול עסק</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <BackButton />
            <SidebarTrigger className="h-9 w-9 text-white/60 hover:bg-white/10 rounded-xl transition-colors" />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 min-h-screen bg-gradient-to-br from-[#0e0606] via-[#150a0a] to-[#0e0606]">
          {children}
          <AgentFab />
        </main>
      </SidebarInset>
      <AppSidebar />
    </SidebarProvider>
  )
}
