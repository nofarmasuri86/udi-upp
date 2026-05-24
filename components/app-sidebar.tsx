"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Briefcase,
  CalendarDays,
  FileText,
  ImageIcon,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  TrendingUp,
  Users,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const navItems = [
  { href: "/dashboard",          label: "ראשי",        icon: LayoutDashboard, exact: true },
  { href: "/dashboard/chat",     label: "עוזר AI",     icon: MessageSquare },
  { href: "/dashboard/clients",  label: "לקוחות",      icon: Users },
  { href: "/dashboard/projects", label: "פרויקטים",    icon: Briefcase },
  { href: "/dashboard/calendar", label: "יומן",        icon: CalendarDays },
  { href: "/dashboard/gallery",  label: "גלריה",       icon: ImageIcon },
  { href: "/dashboard/finance",  label: "כספים",       icon: TrendingUp },
  { href: "/dashboard/quotes",   label: "הצעות מחיר",  icon: FileText },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <Sidebar side="left" collapsible="icon">
      {/* Header */}
      <SidebarHeader className="p-0 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-8 h-8 bg-[#8B1A1A] flex items-center justify-center text-base shrink-0">
            🧩
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-black text-[#f3f3f3] truncate leading-tight">אודי הרכבות</span>
            <span className="text-[10px] text-[#8B1A1A] truncate leading-tight">ניהול עסק</span>
          </div>
        </div>
      </SidebarHeader>

      {/* Nav */}
      <SidebarContent className="px-2 py-3">
        <SidebarMenu>
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href)
            return (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton
                  render={<Link href={href} />}
                  isActive={isActive}
                  className={`h-10 font-semibold transition-all gap-3 rounded-none border-r-0 ${
                    isActive
                      ? "border-r-2 border-[#8B1A1A] bg-[#8B1A1A]/15 text-[#f3f3f3]"
                      : "text-[#999999] hover:bg-[#2a2a2a] hover:text-[#f3f3f3]"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-[#8B1A1A]" : ""}`} />
                  <span>{label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-2 border-t border-[#2a2a2a]">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="rounded-none h-10 font-semibold text-[#666666] hover:text-[#f3f3f3] hover:bg-[#2a2a2a] transition-all gap-3"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>יציאה</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
