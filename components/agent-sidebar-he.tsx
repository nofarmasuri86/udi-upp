"use client"

import { useState } from "react"
import type { ReactNode } from "react"

const MenuIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
)

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

interface AgentSidebarHeProps {
  children?: ReactNode
  onClear?: () => void
}

export function AgentSidebarHe({ children, onClear }: AgentSidebarHeProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const Header = ({ onClose }: { onClose?: () => void }) => (
    <div className="flex items-center gap-2 px-3 py-3 border-b border-black/[0.06] dark:border-white/[0.06] shrink-0">
      <div className="flex items-center gap-2 flex-1">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-base shadow">
          🤖
        </div>
        <div>
          <p className="text-sm font-black text-foreground leading-tight">מנהל העבודה</p>
          <p className="text-xs text-black/40 dark:text-white/40 leading-tight">עוזר AI</p>
        </div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-md text-black/40 dark:text-white/40 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] hover:text-black/80 dark:hover:text-white/80 transition-colors"
        >
          <XIcon />
        </button>
      )}
    </div>
  )

  const Footer = () => (
    <div className="border-t border-black/[0.06] dark:border-white/[0.06] px-2 py-2 shrink-0">
      {onClear && (
        <button
          onClick={onClear}
          className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-black/40 dark:text-white/40 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] hover:text-red-500 transition-colors"
        >
          <span>🗑️</span>
          <span>נקה שיחה</span>
        </button>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden sm:flex h-full w-[220px] shrink-0 flex-col border-l border-black/[0.06] dark:border-white/[0.06] bg-background" dir="rtl">
        <Header />
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {children}
        </div>
        <Footer />
      </aside>

      {/* Mobile topbar trigger */}
      <div className="flex sm:hidden absolute top-0 right-0 z-10 p-2">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-foreground/60 hover:text-foreground transition-colors"
        >
          <MenuIcon />
        </button>
      </div>

      {/* Mobile backdrop */}
      <div
        className={`sm:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile drawer */}
      <aside
        dir="rtl"
        className={`sm:hidden fixed right-0 top-0 bottom-0 w-[260px] z-50 flex flex-col border-l border-black/[0.06] dark:border-white/[0.06] bg-background transition-transform duration-300 ease-in-out ${mobileOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <Header onClose={() => setMobileOpen(false)} />
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {children}
        </div>
        <Footer />
      </aside>
    </>
  )
}

export function SidebarSection({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <section className="space-y-1" dir="rtl">
      {label && (
        <p className="px-2 text-[10px] font-bold uppercase tracking-widest text-black/25 dark:text-white/25 pb-0.5">
          {label}
        </p>
      )}
      {children}
    </section>
  )
}

export function SidebarPromptButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-right rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.03] dark:bg-white/[0.03] px-3 py-2.5 text-sm text-black/60 dark:text-white/60 transition-all duration-150 hover:border-amber-400/50 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-black/90 dark:hover:text-white/90 active:scale-[0.97]"
    >
      {children}
    </button>
  )
}
