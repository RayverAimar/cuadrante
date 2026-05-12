import { useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase'

interface AuthState {
  loading: boolean
  session: Session | null
  user: User | null
  allowed: boolean | null
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setLoading(false)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) {
      setAllowed(null)
      return
    }
    const email = session.user.email?.toLowerCase()
    if (!email) {
      setAllowed(false)
      return
    }
    // Guard against late responses from a previous session overwriting `allowed`
    // after the user has signed out or switched accounts.
    let cancelled = false
    supabase
      .from('allowed_emails')
      .select('email')
      .eq('email', email)
      .maybeSingle()
      .then(({ data }) => { if (!cancelled) setAllowed(!!data) })
    return () => { cancelled = true }
  }, [session])

  return { loading, session, user: session?.user ?? null, allowed }
}

export async function signInWithGoogle() {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + window.location.pathname },
  })
}

export async function signOut() {
  await supabase.auth.signOut()
}
