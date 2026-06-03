import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export interface User {
  id: string
  email?: string
  role?: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()

        if (authUser) {
          setUser({
            id: authUser.id,
            email: authUser.email,
            role: authUser.user_metadata?.role,
          })
        }
      } catch (error) {
        console.error('Failed to get user:', error)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          role: session.user.user_metadata?.role,
        })
      } else {
        setUser(null)
      }
    })

    return () => subscription?.unsubscribe()
  }, [])

  const getIdToken = async (): Promise<string> => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      return session?.access_token || ''
    } catch {
      return ''
    }
  }

  return {
    user: {
      ...user,
      getIdToken,
    },
    loading,
  }
}
