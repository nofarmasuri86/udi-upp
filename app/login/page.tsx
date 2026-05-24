'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Hammer } from 'lucide-react'

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
    <main className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <Card className="w-full max-w-sm shadow-lg border-border/60">
        <CardHeader className="text-center gap-3 pb-4">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Hammer className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <div>
            <CardTitle className="text-xl">ברוך הבא, אודי</CardTitle>
            <CardDescription className="mt-1">הכנס פרטים כדי להיכנס למערכת</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                dir="ltr"
                className="h-11"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">סיסמה</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                dir="ltr"
                className="h-11"
              />
            </div>
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
            <Button type="submit" disabled={loading} className="h-11 text-base mt-1">
              {loading ? 'נכנס...' : 'כניסה'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
