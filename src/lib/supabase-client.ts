import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Type definitions for database tables
export interface Database {
  public: {
    Tables: {
      synthesis_jobs: {
        Row: {
          id: string
          user_id: string
          status: 'pending' | 'processing' | 'completed' | 'failed'
          input_data: Record<string, unknown>
          compressed_data: Buffer | null
          output_data: Record<string, unknown> | null
          token_usage: {
            input_tokens: number
            output_tokens: number
            estimated_cost: number
          } | null
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<
          Database['public']['Tables']['synthesis_jobs']['Row'],
          'id' | 'created_at' | 'updated_at'
        >
        Update: Partial<Database['public']['Tables']['synthesis_jobs']['Insert']>
      }
      investigation_files: {
        Row: {
          id: string
          user_id: string
          filename: string
          file_hash: string
          file_type: string
          file_size: number
          content_preview: string
          extracted_content: string
          mime_type: string
          upload_status: 'pending' | 'processing' | 'completed' | 'failed'
          error_message: string | null
          entities: Array<{
            value: string
            type: string
            confidence: number
          }> | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<
          Database['public']['Tables']['investigation_files']['Row'],
          'id' | 'created_at' | 'updated_at'
        >
        Update: Partial<Database['public']['Tables']['investigation_files']['Insert']>
      }
      risk_assessments: {
        Row: {
          id: string
          user_id: string
          investigation_id: string | null
          file_id: string | null
          risk_level: 'critical' | 'high' | 'medium' | 'low'
          risk_score: number
          indicators: Array<{
            type: string
            description: string
            severity: number
          }> | null
          recommendations: string[] | null
          assessment_date: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<
          Database['public']['Tables']['risk_assessments']['Row'],
          'id' | 'created_at' | 'updated_at'
        >
        Update: Partial<Database['public']['Tables']['risk_assessments']['Insert']>
      }
    }
  }
}

/**
 * Client for browser/client-side operations with anon key
 * Use for user-facing features with RLS
 */
let anonClient: SupabaseClient<Database> | null = null

/**
 * Client for server-side operations with service role key
 * Use only in API routes with proper authentication checks
 */
let serviceRoleClient: SupabaseClient<Database> | null = null

/**
 * Gets or creates the anon client (browser/client-side)
 */
export function getAnonClient(): SupabaseClient<Database> {
  if (anonClient) return anonClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  anonClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: typeof window !== 'undefined',
      autoRefreshToken: typeof window !== 'undefined',
    },
  })

  return anonClient
}

/**
 * Gets or creates the service role client (server-side only)
 * Only call from API routes - never expose the service role key to the client
 */
export function getServiceRoleClient(): SupabaseClient<Database> {
  if (serviceRoleClient) return serviceRoleClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  }

  serviceRoleClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  return serviceRoleClient
}

/**
 * Gets the appropriate client based on context
 * In server-side code, prefers service role; in browser, uses anon
 */
export function getClient(): SupabaseClient<Database> {
  if (typeof window === 'undefined') {
    // Server-side: use service role if available, otherwise anon
    try {
      return getServiceRoleClient()
    } catch {
      return getAnonClient()
    }
  }
  // Client-side: always use anon
  return getAnonClient()
}

/**
 * Helper to execute RLS-aware queries
 */
export async function executeWithAuth<T>(
  fn: (client: SupabaseClient<Database>) => Promise<T>
): Promise<T> {
  const client = getClient()
  return fn(client)
}

/**
 * Database helpers for common operations
 */
export const db = {
  /**
   * Create a synthesis job record
   */
  async createSynthesisJob(
    userId: string,
    inputData: Record<string, unknown>
  ) {
    const client = getClient()
    return client
      .from('synthesis_jobs')
      .insert({
        user_id: userId,
        status: 'pending',
        input_data: inputData,
      } as Database['public']['Tables']['synthesis_jobs']['Insert'])
      .select()
      .single()
  },

  /**
   * Update synthesis job with results
   */
  async updateSynthesisJob(
    jobId: string,
    updates: {
      status?: string
      output_data?: Record<string, unknown>
      token_usage?: {
        input_tokens: number
        output_tokens: number
        estimated_cost: number
      }
      error_message?: string
    }
  ) {
    const client = getClient()
    return client
      .from('synthesis_jobs')
      .update(updates as Database['public']['Tables']['synthesis_jobs']['Update'])
      .eq('id', jobId)
      .select()
      .single()
  },

  /**
   * Get synthesis job by ID
   */
  async getSynthesisJob(jobId: string) {
    const client = getClient()
    return client
      .from('synthesis_jobs')
      .select('*')
      .eq('id', jobId)
      .single()
  },

  /**
   * Create investigation file record
   */
  async createInvestigationFile(
    userId: string,
    fileData: {
      filename: string
      file_hash: string
      file_type: string
      file_size: number
      mime_type: string
    }
  ) {
    const client = getClient()
    return client
      .from('investigation_files')
      .insert({
        user_id: userId,
        ...fileData,
        upload_status: 'pending',
      } as Database['public']['Tables']['investigation_files']['Insert'])
      .select()
      .single()
  },

  /**
   * Update investigation file with extracted content
   */
  async updateInvestigationFile(
    fileId: string,
    updates: {
      extracted_content?: string
      entities?: Array<{
        value: string
        type: string
        confidence: number
      }>
      upload_status?: string
      error_message?: string | null
    }
  ) {
    const client = getClient()
    return client
      .from('investigation_files')
      .update(updates as Database['public']['Tables']['investigation_files']['Update'])
      .eq('id', fileId)
      .select()
      .single()
  },

  /**
   * Check for duplicate files
   */
  async findDuplicateFile(fileHash: string) {
    const client = getClient()
    return client
      .from('investigation_files')
      .select('id, filename')
      .eq('file_hash', fileHash)
      .limit(1)
      .single()
  },

  /**
   * Create risk assessment record
   */
  async createRiskAssessment(
    userId: string,
    assessment: {
      investigation_id?: string
      file_id?: string
      risk_level: 'critical' | 'high' | 'medium' | 'low'
      risk_score: number
      indicators?: Array<{
        type: string
        description: string
        severity: number
      }>
      recommendations?: string[]
    }
  ) {
    const client = getClient()
    return client
      .from('risk_assessments')
      .insert({
        user_id: userId,
        ...assessment,
      } as Database['public']['Tables']['risk_assessments']['Insert'])
      .select()
      .single()
  },

  /**
   * Get risk assessments for a file
   */
  async getRiskAssessmentsForFile(fileId: string) {
    const client = getClient()
    return client
      .from('risk_assessments')
      .select('*')
      .eq('file_id', fileId)
      .order('created_at', { ascending: false })
  },

  /**
   * Get user's recent files
   */
  async getUserFiles(userId: string, limit = 50) {
    const client = getClient()
    return client
      .from('investigation_files')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
  },

  /**
   * Get user's recent synthesis jobs
   */
  async getUserSynthesisJobs(userId: string, limit = 50) {
    const client = getClient()
    return client
      .from('synthesis_jobs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
  },
}

/**
 * Safely close clients (for cleanup)
 */
export async function closeClients() {
  if (anonClient) {
    await anonClient.removeAllChannels()
  }
  if (serviceRoleClient) {
    await serviceRoleClient.removeAllChannels()
  }
  anonClient = null
  serviceRoleClient = null
}
