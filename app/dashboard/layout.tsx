import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { AgentFab } from "@/components/agent-fab"
import { BackButton } from "@/components/back-button"
import { cookies } from "next/headers"
import Image from "next/image"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false"

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <SidebarInset className="bg-[#f3f3f3]">
        <header className="flex h-14 items-center justify-between border-b border-[#151515] bg-[#f3f3f3] px-4 sticky top-0 z-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-[#8B1A1A] flex items-center justify-center text-white font-black text-sm shrink-0">
                🧩
              </div>
              <div>
                <span className="text-sm font-black text-[#151515] leading-none block">אודי הרכבות</span>
                <span className="text-[10px] text-[#8B1A1A] font-semibold leading-none block mt-0.5">התקנות · הרכבות · פירוק</span>
              </div>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1">
            <BackButton />
            <SidebarTrigger className="h-8 w-8 text-[#151515] hover:bg-[#e5e5e5] transition-colors" />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 min-h-screen bg-[#f3f3f3]">
          {children}
          <AgentFab />
        </main>
      </SidebarInset>
      <AppSidebar />
    </SidebarProvider>
  )
}
