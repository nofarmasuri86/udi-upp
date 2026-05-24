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
          <div className="flex items-center">
            <Image
              src="/logo.png"
              alt="אודי הרכבות"
              width={210}
              height={44}
              className="h-10 w-auto object-contain"
              priority
            />
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
