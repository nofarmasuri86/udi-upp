"use client"

import { useState, useTransition, useRef } from "react"
import { Plus, Check, Trash2, X, Zap } from "lucide-react"
import {
  addTaskAction, toggleTaskAction, deleteTaskAction, clearDoneTasksAction,
  type Task, type TaskType,
} from "@/app/actions/tasks"

export type SmartSuggestion = { icon: string; title: string; type: TaskType }

const TAB_LABELS: Record<TaskType, string> = {
  daily: "יומי",
  weekly: "שבועי",
  general: "כללי",
}

export function TasksWidget({
  tasks,
  suggestions,
}: {
  tasks: Task[]
  suggestions: SmartSuggestion[]
}) {
  const [activeTab, setActiveTab] = useState<TaskType>("general")
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  const tabTasks = tasks.filter(t => t.type === activeTab)
  const pending = tabTasks.filter(t => !t.is_done)
  const done = tabTasks.filter(t => t.is_done)
  const tabSuggestions = suggestions.filter(s => s.type === activeTab)

  function openAdd() {
    setShowAdd(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function handleAddTask(e: React.FormEvent) {
    e.preventDefault()
    const title = newTitle.trim()
    if (!title) return
    const fd = new FormData()
    fd.set("title", title)
    fd.set("type", activeTab)
    setNewTitle("")
    setShowAdd(false)
    startTransition(() => addTaskAction(fd))
  }

  function handleToggle(id: string, isDone: boolean) {
    startTransition(() => toggleTaskAction(id, !isDone))
  }

  function handleDelete(id: string) {
    startTransition(() => deleteTaskAction(id))
  }

  function handleClearDone() {
    startTransition(() => clearDoneTasksAction(activeTab))
  }

  function handleAddSuggestion(s: SmartSuggestion) {
    const fd = new FormData()
    fd.set("title", s.title)
    fd.set("type", s.type)
    startTransition(() => addTaskAction(fd))
  }

  return (
    <div className="border border-[#151515] bg-white" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#151515] bg-[#151515]">
        <div className="flex items-center gap-2">
          <span className="text-lg">📋</span>
          <span className="text-[#f3f3f3] text-sm font-black uppercase tracking-widest">משימות ותזכורות</span>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 text-xs font-bold text-[#f3f3f3] border border-[#f3f3f3]/30 px-2.5 py-1.5 hover:bg-[#f3f3f3]/10 transition-colors"
        >
          <Plus className="h-3 w-3" /> הוסף
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#e5e5e5]">
        {(["daily", "weekly", "general"] as TaskType[]).map(tab => {
          const count = tasks.filter(t => t.type === tab && !t.is_done).length
          const isActive = activeTab === tab
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-xs font-bold transition-all border-b-2 ${
                isActive
                  ? "text-[#8B1A1A] bg-white border-[#8B1A1A]"
                  : "text-[#151515]/50 bg-[#f3f3f3] border-transparent hover:text-[#151515]"
              }`}
            >
              {TAB_LABELS[tab]}
              {count > 0 && (
                <span className={`mr-1 inline-block text-[10px] px-1 font-black ${
                  isActive ? "bg-[#8B1A1A] text-[#f3f3f3]" : "bg-[#151515]/10 text-[#151515]/60"
                }`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Inline add form */}
      {showAdd && (
        <form
          onSubmit={handleAddTask}
          className="flex gap-2 p-3 border-b border-[#e5e5e5] bg-[#f3f3f3]"
        >
          <input
            ref={inputRef}
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder={`הוסף משימה ${TAB_LABELS[activeTab]}ית...`}
            className="flex-1 text-sm bg-white border border-[#151515] px-3 py-2 outline-none focus:border-[#8B1A1A] text-[#151515] placeholder:text-[#151515]/30"
            dir="rtl"
          />
          <button type="submit" disabled={isPending || !newTitle.trim()}
            className="bg-[#8B1A1A] text-[#f3f3f3] text-xs font-bold px-3 py-2 hover:bg-[#6e1414] disabled:opacity-50 transition-colors">
            <Check className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => { setShowAdd(false); setNewTitle("") }}
            className="bg-white border border-[#e5e5e5] text-[#151515]/50 px-2 py-2 hover:bg-[#f3f3f3] transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </form>
      )}

      {/* Content */}
      <div className="p-3 flex flex-col gap-1.5 min-h-[90px]">

        {/* Smart suggestions from app */}
        {tabSuggestions.length > 0 && (
          <div className="flex flex-col gap-1.5 mb-2">
            <p className="flex items-center gap-1 text-[9px] font-black text-[#151515]/40 uppercase tracking-widest">
              <Zap className="h-2.5 w-2.5 text-[#8B1A1A]" /> הצעות מהמערכת
            </p>
            {tabSuggestions.map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-[#8B1A1A]/5 border border-[#8B1A1A]/15 px-3 py-2"
              >
                <span className="text-base shrink-0">{s.icon}</span>
                <span className="flex-1 text-xs text-[#151515]/70 truncate">{s.title}</span>
                <button
                  onClick={() => handleAddSuggestion(s)}
                  disabled={isPending}
                  className="text-[10px] font-bold text-[#8B1A1A] border border-[#8B1A1A]/30 px-2 py-0.5 hover:bg-[#8B1A1A] hover:text-[#f3f3f3] transition-colors shrink-0"
                >
                  + הוסף
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {pending.length === 0 && tabSuggestions.length === 0 && done.length === 0 && (
          <div className="py-5 flex flex-col items-center gap-1.5 text-center">
            <span className="text-2xl">✅</span>
            <p className="text-[#151515]/40 text-xs">אין משימות {TAB_LABELS[activeTab]}יות</p>
            <button
              onClick={openAdd}
              className="text-xs text-[#8B1A1A] border border-[#8B1A1A]/30 px-3 py-1.5 hover:bg-[#8B1A1A]/5 transition-colors mt-1"
            >
              + הוסף משימה
            </button>
          </div>
        )}

        {/* Pending tasks */}
        {pending.map(task => (
          <div key={task.id} className="flex items-center gap-2 group py-0.5">
            <button
              onClick={() => handleToggle(task.id, task.is_done)}
              disabled={isPending}
              className="w-5 h-5 shrink-0 border-2 border-[#151515]/30 flex items-center justify-center hover:border-[#8B1A1A] transition-colors"
            >
              {/* empty = unchecked */}
            </button>
            <span className="flex-1 text-sm text-[#151515] leading-snug">{task.title}</span>
            {task.source === "agent" && (
              <span className="text-[9px] font-bold text-[#8B1A1A]/60 border border-[#8B1A1A]/20 px-1.5 py-0.5 shrink-0">AI</span>
            )}
            <button
              onClick={() => handleDelete(task.id)}
              disabled={isPending}
              className="w-6 h-6 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[#151515]/30 hover:text-red-600 transition-all shrink-0"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}

        {/* Done section */}
        {done.length > 0 && (
          <div className="mt-2 pt-2 border-t border-[#e5e5e5]">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] font-bold text-[#151515]/30 uppercase tracking-widest">
                הושלמו ({done.length})
              </p>
              <button
                onClick={handleClearDone}
                disabled={isPending}
                className="text-[10px] text-[#151515]/30 hover:text-red-600 transition-colors font-semibold"
              >
                נקה
              </button>
            </div>
            {done.map(task => (
              <div key={task.id} className="flex items-center gap-2 group py-0.5">
                <button
                  onClick={() => handleToggle(task.id, task.is_done)}
                  disabled={isPending}
                  className="w-5 h-5 shrink-0 border-2 border-green-500/40 bg-green-500/10 flex items-center justify-center"
                >
                  <Check className="h-3 w-3 text-green-600" />
                </button>
                <span className="flex-1 text-xs text-[#151515]/30 line-through">{task.title}</span>
                <button
                  onClick={() => handleDelete(task.id)}
                  disabled={isPending}
                  className="w-6 h-6 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[#151515]/20 hover:text-red-600 transition-all"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
