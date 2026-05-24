"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { sendChatMessage, loadChatHistory, clearChatHistory } from "@/app/actions/ai-chat"
import type { ChatMessage } from "@/app/actions/ai-chat"
import { AgentChat } from "@21st-sdk/nextjs"
import "@21st-sdk/react/styles.css"
import type { UIMessage, ChatStatus } from "ai"
import {
  AgentSidebarHe,
  SidebarSection,
  SidebarPromptButton,
} from "@/components/agent-sidebar-he"

const WELCOME: ChatMessage = {
  role: "assistant",
  content: `אהלן! 🛠️ אני מנהל העבודה שלך.

אפשר לכתוב או ללחוץ על 🎤 ולדבר בעברית:
• "פתח לקוח חדש — יוסי כהן, 050-1234567"
• "הוסף פרויקט — ארון למטבח, 3,500 שקל"
• "קיבלתי מאלון אלפיים מזומן על הסלון"
• "שנה סטטוס הסלון ל-נמסר"
• "מי חייב לי כסף?"

עם מה מתחילים?`,
}

let msgCounter = 0
function uid() { return `msg-${++msgCounter}` }

function toUIMessages(msgs: ChatMessage[]): UIMessage[] {
  return msgs.map((m) => ({
    id: uid(),
    role: m.role as "user" | "assistant",
    parts: [{ type: "text" as const, text: m.content }],
  }))
}

const QUICK_PROMPTS = [
  { emoji: "💰", text: "מי חייב לי כסף?" },
  { emoji: "📋", text: "תן לי סיכום של כל הפרויקטים הפעילים" },
  { emoji: "➕", text: "פתח פרויקט חדש" },
  { emoji: "👤", text: "פתח לקוח חדש" },
  { emoji: "💳", text: "רשום תשלום שהתקבל" },
  { emoji: "🔄", text: "שנה סטטוס פרויקט" },
  { emoji: "📅", text: "מה הפרויקטים שצריך לסיים השבוע?" },
  { emoji: "📊", text: "כמה הרווחתי השנה?" },
]

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME])
  const [uiMessages, setUiMessages] = useState<UIMessage[]>(() => toUIMessages([WELCOME]))
  const [status, setStatus] = useState<ChatStatus>("ready")
  const [loaded, setLoaded] = useState(false)
  const [recording, setRecording] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const recognitionRef = useRef<InstanceType<typeof SpeechRecognition> | null>(null)
  const accumulatedRef = useRef("")
  const pendingRef = useRef(false)

  useEffect(() => {
    const supported = !!(window.SpeechRecognition || (window as typeof window & { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition)
    setSpeechSupported(supported)
  }, [])

  useEffect(() => {
    loadChatHistory().then(history => {
      if (history.length > 0) {
        setMessages(history)
        setUiMessages(toUIMessages(history))
      }
      setLoaded(true)
    })
  }, [])

  useEffect(() => { pendingRef.current = status !== "ready" }, [status])

  function appendMsg(msg: ChatMessage) {
    setMessages(prev => [...prev, msg])
    setUiMessages(prev => [...prev, {
      id: uid(),
      role: msg.role as "user" | "assistant",
      parts: [{ type: "text" as const, text: msg.content }],
    }])
  }

  async function dispatch(text: string) {
    if (!text.trim() || pendingRef.current) return
    appendMsg({ role: "user", content: text })
    setStatus("streaming")
    try {
      const reply = await sendChatMessage([], text)
      appendMsg({ role: "assistant", content: reply })
    } catch {
      appendMsg({ role: "assistant", content: "סורי, משהו השתבש. נסה שוב." })
    } finally {
      setStatus("ready")
    }
  }

  function handleSend({ content }: { role: "user"; content: string }) {
    dispatch(content)
  }

  async function handleClear() {
    await clearChatHistory()
    setMessages([WELCOME])
    setUiMessages(toUIMessages([WELCOME]))
  }

  // ─── Voice recording ──────────────────────────────────────────
  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  const startRecording = useCallback(() => {
    const SR = window.SpeechRecognition || (window as typeof window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition
    if (!SR) return

    accumulatedRef.current = ""
    const recognition = new SR()
    recognition.lang = "he-IL"
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onstart = () => setRecording(true)

    recognition.onresult = (event: SpeechRecognitionEvent & { results: SpeechRecognitionResultList; resultIndex: number }) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) accumulatedRef.current += event.results[i][0].transcript + " "
      }
    }

    recognition.onend = () => {
      setRecording(false)
      const text = accumulatedRef.current.trim()
      accumulatedRef.current = ""
      if (text && !pendingRef.current) dispatch(text)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== "aborted") {
        accumulatedRef.current = ""
        setRecording(false)
      }
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [])

  if (!loaded) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-none bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-2xl animate-pulse">🤖</div>
          <p className="text-sm text-muted-foreground">טוען שיחה...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden -mx-4 md:-mx-6 -my-0">

      {/* Chat area */}
      <div className="flex-1 min-w-0 min-h-0 flex flex-col relative">
        {/* Voice indicator */}
        {recording && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-red-500 text-[#151515] text-xs font-bold px-4 py-2 rounded-full shadow-lg">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            מקליט... לחץ שוב לשליחה
          </div>
        )}

        <AgentChat
          messages={uiMessages}
          onSend={handleSend}
          status={status}
          onStop={() => setStatus("ready")}
          colorMode="auto"
          className="flex-1 min-h-0"
        />

        {/* Voice button overlay */}
        {speechSupported && (
          <button
            onClick={recording ? stopRecording : startRecording}
            disabled={status !== "ready"}
            className={`absolute bottom-[72px] left-3 z-10 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all ${
              recording
                ? "bg-red-500 text-[#151515] animate-pulse"
                : "bg-muted text-muted-foreground hover:bg-amber-100 hover:text-amber-600"
            }`}
            title={recording ? "עצור ושלח" : "הקלטה קולית"}
          >
            {recording ? "⏹" : "🎤"}
          </button>
        )}
      </div>

      {/* Sidebar */}
      <AgentSidebarHe onClear={handleClear}>
        <SidebarSection label="פקודות מהירות">
          {QUICK_PROMPTS.map(({ emoji, text }) => (
            <SidebarPromptButton key={text} onClick={() => dispatch(text)}>
              <span className="mr-1.5">{emoji}</span>{text}
            </SidebarPromptButton>
          ))}
        </SidebarSection>

        <SidebarSection label="יכולות">
          <ul className="space-y-1.5 px-2">
            {[
              "הוספת לקוחות ופרויקטים",
              "רישום תשלומים",
              "עדכון סטטוסים",
              "דוחות כספיים",
              "הפקת קבלות (Make.com)",
            ].map((cap) => (
              <li key={cap} className="flex items-start gap-2 text-xs text-black/40 dark:text-white/40">
                <span className="mt-0.5 text-[#8B1A1A]">✦</span>
                <span>{cap}</span>
              </li>
            ))}
          </ul>
        </SidebarSection>
      </AgentSidebarHe>
    </div>
  )
}

