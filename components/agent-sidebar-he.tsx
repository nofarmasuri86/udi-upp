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
    <div className="flex items-center gap-2.5 px-3 py-3 border-b border-[#2a2a2a] shrink-0">
      <div className="w-8 h-8 bg-[#8B1A1A] flex items-center justify-center text-base shrink-0">
        🤖
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-[#f3f3f3] leading-tight">מנהל העבודה</p>
        <p className="text-[10px] text-[#8B1A1A] leading-tight font-semibold">עוזר AI</p>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center text-[#f3f3f3]/40 hover:text-[#f3f3f3] hover:bg-[#2a2a2a] transition-colors shrink-0"
        >
          <XIcon />
        </button>
      )}
    </div>
  )

  const Footer = () => (
    <div className="border-t border-[#2a2a2a] px-2 py-2 shrink-0">
      {onClear && (
        <button
          onClick={onClear}
          className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-[#f3f3f3]/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
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
      <aside
        className="hidden sm:flex h-full w-[220px] shrink-0 flex-col border-l border-[#2a2a2a] bg-[#151515]"
        dir="rtl"
      >
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
          className="flex h-9 w-9 items-center justify-center bg-[#151515] text-[#f3f3f3]/60 hover:text-[#f3f3f3] transition-colors border border-[#2a2a2a]"
        >
          <MenuIcon />
        </button>
      </div>

      {/* Mobile backdrop */}
      <div
        className={`sm:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile drawer */}
      <aside
        dir="rtl"
        className={`sm:hidden fixed right-0 top-0 bottom-0 w-[260px] z-50 flex flex-col border-l border-[#2a2a2a] bg-[#151515] transition-transform duration-300 ease-in-out ${mobileOpen ? "translate-x-0" : "translate-x-full"}`}
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
        <p className="px-1 text-[9px] font-black uppercase tracking-widest text-[#f3f3f3]/35 pb-1">
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
      className="w-full text-right border border-[#2a2a2a] bg-[#1e1e1e] px-3 py-2.5 text-xs text-[#f3f3f3]/65 transition-all duration-150 hover:border-[#8B1A1A]/50 hover:bg-[#8B1A1A]/10 hover:text-[#f3f3f3] active:scale-[0.97]"
    >
      {children}
    </button>
  )
}
