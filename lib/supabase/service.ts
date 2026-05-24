import { createClient } from "@supabase/supabase-js"

/**
 * Service client — bypasses RLS.
 * להשתמש אך ורק ב-API Routes של שרת שמאומתים בנפרד (כגון Make.com webhook).
 * לעולם אל תשתמש ב-client זה בקוד שנחשף לדפדפן.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY

  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY")
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  })
}
