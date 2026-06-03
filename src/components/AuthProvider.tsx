'use client'

import { ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}
