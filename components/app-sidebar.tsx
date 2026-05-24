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
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center text-lg shadow-md shrink-0">
            🧩
          </div>
          <div className="flex flex-col gap-0 overflow-hidden">
            <span className="text-sm font-black text-sidebar-foreground truncate">אודי הרכבות</span>
            <span className="text-xs text-sidebar-foreground/50 truncate">ניהול עסק</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <SidebarMenu>
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href)
            return (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton
                  render={<Link href={href} />}
                  isActive={isActive}
                  className={`rounded-xl h-11 font-semibold transition-all gap-3 ${
                    isActive
                      ? "bg-gradient-to-r from-red-700 to-red-900 text-white shadow-md"
                      : "hover:bg-sidebar-accent"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="rounded-xl h-11 font-semibold text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10 transition-all gap-3"
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
