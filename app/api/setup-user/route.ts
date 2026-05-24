import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { secret, password } = await request.json()

  if (secret !== 'udi-setup-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = '47659e2c-80a5-4dde-abff-ade3921eaaad'

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${userId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
        'apikey': process.env.SUPABASE_SECRET_KEY!,
      },
      body: JSON.stringify({ password }),
    }
  )

  const data = await res.json()
  if (!res.ok) return NextResponse.json({ error: data }, { status: 400 })
  return NextResponse.json({ ok: true })
}
