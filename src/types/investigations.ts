export type InvestigationStatus = 'pending' | 'analyzing' | 'complete' | 'failed'
export type RiskLevel = 'low' | 'medium' | 'high'

export interface Finding {
  filename: string
  content: string
  keyFindings: string[]
  riskScore: number
  riskLevel: RiskLevel
  entities: string[]
  sentiment: 'positive' | 'neutral' | 'negative'
  summary: string
}

export interface InvestigationJob {
  id: string
  name: string
  status: InvestigationStatus
  totalFiles: number
  processedFiles: number
  createdAt: Date
  completedAt?: Date
  findings?: Finding[]
  commonThemes?: string[]
  topRisks?: string[]
  errorMessage?: string
}

export interface InvestigationRequest {
  name: string
  files: File[]
  emailThreads?: string[]
}

export interface ExportOptions {
  format: 'pdf' | 'json' | 'csv'
  jobId: string
}
