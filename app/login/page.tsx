'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('אימייל או סיסמה שגויים')
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f3f3f3] p-4" dir="rtl">
      <div className="w-full max-w-sm">

        {/* Logo block */}
        <div className="border border-[#151515] bg-white p-6 flex items-center justify-center mb-0">
          <Image
            src="/logo.png"
            alt="אודי הרכבות"
            width={280}
            height={58}
            className="h-14 w-auto object-contain"
            priority
          />
        </div>

        {/* Form block */}
        <div className="border border-[#151515] border-t-0 bg-white p-6">
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[#151515] uppercase tracking-wider">אימייל</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                dir="ltr"
                className="border border-[#151515] bg-[#f3f3f3] px-3 py-2.5 text-sm text-[#151515] outline-none focus:border-[#8B1A1A] focus:bg-white transition-colors placeholder:text-[#151515]/30"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[#151515] uppercase tracking-wider">סיסמה</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                dir="ltr"
                className="border border-[#151515] bg-[#f3f3f3] px-3 py-2.5 text-sm text-[#151515] outline-none focus:border-[#8B1A1A] focus:bg-white transition-colors"
              />
            </div>

            {error && (
              <div className="border border-[#8B1A1A] bg-[#8B1A1A]/5 px-3 py-2">
                <p className="text-sm text-[#8B1A1A] font-semibold">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-[#8B1A1A] text-[#f3f3f3] font-black py-3 text-sm uppercase tracking-widest hover:bg-[#6e1414] active:scale-[0.98] transition-all disabled:opacity-60 mt-1"
            >
              {loading ? 'נכנס...' : 'כניסה למערכת'}
            </button>
          </form>
        </div>

        {/* Bottom line accent */}
        <div className="h-1 bg-[#8B1A1A]" />
      </div>
    </main>
  )
}
